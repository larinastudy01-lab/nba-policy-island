"""Use the author's anonymous, zero-price itch.io download flow. No paid/source package or login."""
import urllib.request,urllib.parse,http.cookiejar,re,json,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];C=R/'node_modules/model-downloads/v2';log=[]
for slug in ['universal-base-characters','downtown-city-megakit']:
 try:
  archive=C/(slug+'.zip')
  if not archive.exists() or not zipfile.is_zipfile(archive):
   op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()));u='https://quaternius.itch.io/'+slug;h={'User-Agent':'Mozilla/5.0'}
   s=op.open(urllib.request.Request(u,headers=h),timeout=30).read().decode();token=re.search(r'name="csrf_token" value="([^"]+)',s)[1]
   j=json.load(op.open(urllib.request.Request(u+'/download_url',data=urllib.parse.urlencode({'csrf_token':token}).encode(),headers={**h,'Referer':u}),timeout=30))
   page=op.open(urllib.request.Request(j['url'],headers=h),timeout=30).read().decode();upload=re.search(r'data-upload_id="([^"]+)',page)[1];token=re.search(r'name="csrf_token" value="([^"]+)',page)[1]
   link=json.load(op.open(urllib.request.Request(u+'/file/'+upload,data=urllib.parse.urlencode({'csrf_token':token}).encode(),headers={**h,'Referer':j['url']}),timeout=30))
   if not link.get('url'):raise ValueError('No anonymous free download URL')
   print('DOWNLOADING',slug,flush=True)
   # Some CDN connections stop early. Resume only when the server confirms a
   # matching Content-Range, never concatenate a fresh HTTP 200 response.
   for attempt in range(24):
    offset=archive.stat().st_size if archive.exists() else 0
    with op.open(urllib.request.Request(link['url'],headers={**h,'Range':f'bytes={offset}-{offset+8*1024*1024-1}'}),timeout=45) as resp:
     if resp.status==206:
      header=resp.headers.get('Content-Range','');start=int(re.search(r'bytes (\d+)-',header)[1])
      if start!=offset:raise ValueError('CDN range mismatch')
      mode='ab'
     elif offset:raise ValueError('CDN did not support resuming incomplete archive')
     else:mode='wb'
     with archive.open(mode) as out:
      while b:=resp.read(1024*1024):out.write(b)
    if zipfile.is_zipfile(archive):break
    print('RESUME',slug,archive.stat().st_size,flush=True)
  destination=C/slug
  with zipfile.ZipFile(archive) as z:
   for f in z.infolist():
    if not (destination/f.filename).resolve().is_relative_to(destination.resolve()):raise ValueError('Unsafe archive path')
   # Runtime sources only: .gltf / .glb and their .bin / PNG. Do not extract engine projects.
   for f in z.infolist():
    if Path(f.filename).suffix.lower() in ['.gltf','.glb','.bin','.png','.txt']:z.extract(f,destination)
  models=[str(p.relative_to(R)).replace('\\','/') for p in destination.rglob('*') if p.suffix in ['.gltf','.glb']];log.append(dict(source=u,status='acquired-free-standard',archiveBytes=archive.stat().st_size,models=models,license='CC0-1.0'));print('ACQUIRED',slug,len(models),'models',flush=True)
 except Exception as e:log.append(dict(source='https://quaternius.itch.io/'+slug,status='unavailable',reason=str(e)));print('CONTINUE',slug,str(e),flush=True)
(R/'assets/models/quaternius-v2.json').write_text(json.dumps(log,indent=2)+'\n','utf8')
