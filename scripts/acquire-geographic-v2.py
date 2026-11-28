"""Public downloads only; fail independently, merge verified model sources, never overwrite originals."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
import urllib.request, json, re, hashlib, struct, html
R=Path(__file__).resolve().parents[1]; C=R/'node_modules/model-downloads/v2'; C.mkdir(parents=True,exist_ok=True)
rows=json.loads((R/'assets/models/sources.json').read_text('utf8')); attempts=[]
def get(url,name):
    p=C/name
    if not p.exists():
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=30) as r: p.write_bytes(r.read())
    return p
def poly(args):
    pid,slug,category=args; source='https://poly.pizza/m/'+pid
    try:
        page=get(source,pid+'.html').read_text('utf8')
        title=html.unescape(re.search(r'<title[^>]*>(.*?)</title>',page)[1]);name,author=title.split(' - Free 3D Model By ');author=author.replace(' - Poly Pizza','')
        license='CC0-1.0' if 'https://creativecommons.org/publicdomain/zero/1.0/' in page else 'CC-BY-3.0' if 'https://creativecommons.org/licenses/by/3.0/' in page else None
        if not license: raise ValueError('No verified free license')
        download=re.search(r'https://static.poly.pizza/[\w-]+\.glb.br',page)[0];file=get(download,slug+'.glb');b=file.read_bytes()
        if b[:4]!=b'glTF' or struct.unpack_from('<I',b,8)[0]!=len(b):raise ValueError('Incomplete GLB')
        if len(b)>15_000_000:raise ValueError('Model exceeds 15 MB source budget')
        row=dict(id='poly-'+slug,name=name,category=category,author=author,license=license,source=source,download=download,acquired=datetime.now(timezone(timedelta(hours=8))).date().isoformat(),raw=str(file.relative_to(R)).replace('\\','/'),sourceBytes=len(b),sourceSha256=hashlib.sha256(b).hexdigest())
        rows.append(row);attempts.append(dict(source=source,status='acquired',id=row['id'],bytes=len(b)));print('OK',slug,len(b),flush=True)
    except Exception as e:attempts.append(dict(source=source,status='unavailable',reason=str(e)));print('CONTINUE',slug,str(e),flush=True)
models=[('RTwim9bhNd','f40','vehicles'),('a_HKCtYAv2W','gtr','vehicles'),('5zUWP5UsLg-','lambo','vehicles'),('Gzj704DXdr','sport-yellow','vehicles'),('1mkmFkAz5v','sport-coupe','vehicles'),('OyqKvX9xNh','sport-roadster','vehicles'),('O2ctIKoLrr','endurance','vehicles'),('OgrROxABGT','city-food-van','vehicles'),('xsMtZhBkxL','city-suv','vehicles'),('x43lOScTpN','city-taxi','vehicles'),('85FpUr2fHkH','full-court','basketball'),('i3LLacyQP4','animated-hoop','basketball')]
# Find two actual city vehicles through the original author's public catalogue, not guessed CDN addresses.
try:
    page=get('https://poly.pizza/explore/Transport','transport.html').read_text('utf8')
    for title,slug in [('SUV','city-suv'),('Taxi','city-taxi')]:
        links=re.findall(r'<a[^>]+href="(/m/[^"?#]+)"[^>]*>(.*?)</a>',page,re.S)
        found=next((u for u,t in links if re.search(r'>'+title+r'<',t) and 'Quaternius' in t),None)
        if found:models.append((found.rsplit('/',1)[1],slug,'vehicles'))
except Exception as e:attempts.append(dict(source='https://poly.pizza/explore/Transport',status='unavailable',reason=str(e)))
with ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(poly,models))
# Record the requested pack endpoints and stop at any real download/login restriction.
packs=['https://quaternius.com/packs/universalbasecharacters.html','https://quaternius.com/packs/downtowncitymegakit.html','https://quaternius.com/packs/cars.html','https://kenney.nl/assets/city-kit-commercial','https://kenney.nl/assets/city-kit-suburban','https://kenney.nl/assets/city-kit-roads','https://kenney.nl/assets/racing-kit','https://kenney.nl/assets/car-kit','https://sketchfab.com/3d-models/mclaren-765lt-with-windows-v2-cc1876d0179b42aeb31e004c01a857da']
def pack(source):
    try:
        page=get(source,source.rstrip('/').rsplit('/',1)[-1]+'.html').read_text('utf8')
        if 'kenney.nl' in source:
            slug=source.split('/assets/')[1];get('https://kenney.nl/download-link/'+('assets/'+slug).encode().hex(),slug+'-endpoint.json')
        attempts.append(dict(source=source,status='manual-candidate',reason='Public page accessible; full archive not acquired. Existing verified alternatives are used.'))
    except Exception as e:attempts.append(dict(source=source,status='unavailable',reason=str(e)))
with ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(pack,packs))
unique={r['id']:r for r in rows};(R/'assets/models/sources.json').write_text(json.dumps(sorted(unique.values(),key=lambda r:r['id']),ensure_ascii=False,indent=2)+'\n','utf8')
(R/'assets/models/acquisition-v2.json').write_text(json.dumps(attempts,ensure_ascii=False,indent=2)+'\n','utf8')
# Natural Earth public-domain primary dataset. Country geometry is clipped for this game, never fetched at runtime.
G=R/'assets/geography';G.mkdir(exist_ok=True)
def clip(poly,axis,value,keep):
    out=[]
    for a,b in zip(poly[-1:]+poly[:-1],poly):
        ai=keep(a[axis],value);bi=keep(b[axis],value)
        if ai!=bi:
            t=(value-a[axis])/(b[axis]-a[axis]);out.append([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])
        if bi:out.append(b)
    return out
features=[]
for kind,url in [('countries','https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'),('lakes','https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_lakes.geojson')]:
    p=get(url,'ne-'+kind+'.geojson');data=json.loads(p.read_text('utf8'))
    for f in data['features']:
        name=f['properties'].get('ADMIN') or f['properties'].get('name')
        if kind=='countries' and name not in ['United States of America','Canada']:continue
        if kind=='lakes' and name not in ['Superior','Michigan','Huron','Erie','Ontario','Lake Superior','Lake Michigan','Lake Huron','Lake Erie','Lake Ontario']:continue
        polygons=f['geometry']['coordinates'] if f['geometry']['type']=='MultiPolygon' else [f['geometry']['coordinates']]
        for polygon in polygons:
            ring=polygon[0][:-1]
            for axis,value,fn in [(0,-126,lambda a,b:a>=b),(0,-66,lambda a,b:a<=b),(1,24,lambda a,b:a>=b),(1,52 if name=='Canada' else 50,lambda a,b:a<=b)]:
                if ring:ring=clip(ring,axis,value,fn)
            if len(ring)>3:features.append(dict(type='Feature',properties=dict(name=name,kind=kind),geometry=dict(type='Polygon',coordinates=[[[round(x,4),round(y,4)] for x,y in ring+[ring[0]]]])))
(G/'north-america.geojson').write_text(json.dumps(dict(type='FeatureCollection',features=features),separators=(',',':'))+'\n','utf8')
(G/'sources.json').write_text(json.dumps(dict(author='Natural Earth contributors',license='Public Domain',source='https://www.naturalearthdata.com/downloads/',licenseURL='https://www.naturalearthdata.com/about/terms-of-use/',acquired=datetime.now(timezone(timedelta(hours=8))).date().isoformat(),modifications='50m countries: CONUS and southern Canada clipped to -126..-66, 24..52; five Great Lakes retained; coordinates rounded to 4 decimals.',datasetFiles=['ne_50m_admin_0_countries.geojson','ne_50m_lakes.geojson']),indent=2)+'\n','utf8')
print('GEOGRAPHY',len(features),'features; MODELS',len(unique),flush=True)
