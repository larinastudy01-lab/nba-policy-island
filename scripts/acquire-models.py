"""Acquire public, licensed sources. Cached originals are tooling inputs, never runtime URLs.
Run: python scripts/acquire-models.py ; node scripts/optimize-models.mjs
Failures are recorded and do not stop unrelated downloads. No login/captcha bypass.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
import hashlib, json, re, struct, urllib.request, zipfile

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'node_modules/model-downloads'
OUT = ROOT / 'assets/models'
for p in (CACHE, OUT / 'licenses'):
    p.mkdir(parents=True, exist_ok=True)
ACQUIRED = datetime.now(timezone(timedelta(hours=8))).date().isoformat()
HEADERS = {'User-Agent': 'Mozilla/5.0'}
attempts = []
previous = {r['id']: r for r in json.loads((OUT / 'sources.json').read_text(encoding='utf8'))} if (OUT / 'sources.json').exists() else {}

def fetch(url, target):
    if target.exists():
        return target.read_bytes()
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=35) as r:
        data = r.read()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return data

def glb(data):
    if data[:4] != b'glTF' or struct.unpack_from('<I', data, 8)[0] != len(data):
        raise ValueError('Not a complete GLB (HTML/error pages are rejected)')

def safe_extract(archive, destination):
    with zipfile.ZipFile(archive) as z:
        for item in z.infolist():
            if not (destination / item.filename).resolve().is_relative_to(destination.resolve()):
                raise ValueError('Unsafe ZIP path')
        z.extractall(destination)

rows = []
def add(id, name, category, author, license, source, download, local, **extra):
    data = local.read_bytes()
    if local.suffix == '.glb':
        glb(data)
    digest = hashlib.sha256(data).hexdigest()
    acquired = previous[id]['acquired'] if previous.get(id, {}).get('sourceSha256') == digest else ACQUIRED
    rows.append(dict(id=id, name=name, category=category, author=author, license=license,
                     source=source, download=download, acquired=acquired, raw=str(local.relative_to(ROOT)).replace('\\','/'),
                     sourceBytes=len(data), sourceSha256=digest, **extra))

def task(name, fn):
    try:
        fn()
        attempts.append(dict(name=name, status='acquired'))
        print('OK', name, flush=True)
    except Exception as e:
        attempts.append(dict(name=name, status='unavailable', reason=str(e)))
        print('CONTINUE', name, str(e), flush=True)

def basketball():
    url = 'https://vinish-models.pages.dev/basketball/basketball.zip'
    fetch(url, CACHE / 'vinish-basketball.zip')
    safe_extract(CACHE / 'vinish-basketball.zip', CACHE / 'basketball')
    folder = CACHE / 'basketball/basketball'
    for name in ['LICENSE.txt','CREDITS.txt','README.txt']:
        (OUT / 'licenses' / ('vinish-basketball-' + name)).write_bytes((folder / name).read_bytes())
    for model in sorted(folder.glob('*.glb')):
        add('vinish-'+model.stem, model.stem.replace('-',' ').title(), 'basketball', 'vinish.dev', 'CC-BY-4.0',
            'https://vinish.dev/free-3d-models/basketball',url,model,archiveMember='basketball/'+model.name)

def arena():
    url='https://www.innerscene.com/api/library/arena-2eda82fe/download'
    file=CACHE/'innerscene-arena.glb';fetch(url,file)
    add('innerscene-arena','Arena','arenas','Innerscene Corp','CC0-1.0',
        'https://www.innerscene.com/tools/library/3d-parts/arena-2eda82fe',url,file)

POLY = [
    ('a648BwpXx-A','golden-gate','Golden Gate bridge','landmarks','Steren Giannini','CC-BY-3.0'),
    ('ef9Yd09Doxh','liberty','Lady Liberty','landmarks','Anna M','CC-BY-3.0'),
    ('7egp-6G6S57','empire-state','Empire State Building','landmarks','Courday Farnam','CC-BY-3.0'),
    ('UA4axT3nIQ','street-straight','Street Straight','roads','Quaternius','CC0-1.0'),
    ('JgGLJH2iXj','large-building','Large Building','city','Kenney','CC0-1.0'),
    ('DsrrAYmucG','palm-tree','Palm Tree','nature','Quaternius','CC0-1.0'),
    ('c3Ibh9I3udk','animated-human','Animated Human','characters','Quaternius','CC0-1.0'),
]
def poly(row):
    pid,id,name,category,author,license=row;source='https://poly.pizza/m/'+pid
    html=fetch(source,CACHE/('poly-'+pid+'.html')).decode('utf8')
    expected='https://creativecommons.org/'+('publicdomain/zero/1.0/' if license=='CC0-1.0' else 'licenses/by/3.0/')
    # The structured model license is present in the downloaded public page.
    if expected not in html and (license!='CC0-1.0' or 'CC0' not in html):
        raise ValueError('Expected license missing from public source page')
    download=re.search(r'https://static.poly.pizza/[\w-]+\.glb.br',html)[0]
    file=CACHE/('poly-'+pid+'.glb');fetch(download,file)
    add('poly-'+id,name,category,author,license,source,download,file)

def vinish(slug,model,category):
    source='https://vinish.dev/free-3d-models/'+slug
    html=fetch(source,CACHE/('vinish-'+('workers' if slug=='workers-and-jobs' else slug)+'.html')).decode('utf8')
    if 'https://creativecommons.org/licenses/by/4.0/' not in html:
        raise ValueError('Expected CC BY 4.0 not found')
    url='https://vinish-models.pages.dev/'+slug+'/'+model+'.glb';file=CACHE/('vinish-'+model+'.glb');fetch(url,file)
    add('vinish-'+model,model.replace('-',' ').title(),category,'vinish.dev','CC-BY-4.0',source,url,file)

def bench():
    source='https://polyhaven.com/a/painted_wooden_bench'
    files=json.loads(fetch('https://api.polyhaven.com/files/painted_wooden_bench',CACHE/'polyhaven-bench-files.json'))['gltf']['1k']['gltf']
    data=fetch(files['url'],CACHE/'polyhaven-bench.gltf')
    fetch(files['include']['painted_wooden_bench.bin']['url'],CACHE/'painted_wooden_bench.bin')
    add('polyhaven-bench','Painted Wooden Bench','street','Kirill Sannikov','CC0-1.0',source,files['url'],CACHE/'polyhaven-bench.gltf',
        licenseSource='https://polyhaven.com/license',parts=[files['include']['painted_wooden_bench.bin']],
        note='Geometry and buffer acquired; photographic textures deliberately omitted for stylized palette.')

task('Vinish Basketball ZIP',basketball)
task('Innerscene Arena',arena)
with ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(lambda row:task('Poly Pizza '+row[2],lambda:poly(row)),POLY))
for slug,model,cat in [('workers-and-jobs','security-guard','characters'),('palms','coconut-palm','nature'),('supercars','wedge-supercar','vehicles')]:
    task('Vinish '+model,lambda s=slug,m=model,c=cat:vinish(s,m,c))
task('Poly Haven Bench',bench)
# Original author's public download action. A 403 is logged, not bypassed.
for name in ['city-kit-roads','city-kit-commercial','racing-kit']:
    def kenney(slug=name):
        url='https://kenney.nl/download-link/'+('assets/'+slug).encode().hex()
        with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=20) as r:
            result=json.load(r)
        raise ValueError('Download endpoint response requires inspection; no unverified archive imported: '+str(result)[:100])
    task('Kenney '+name,kenney)
rows.sort(key=lambda r:r['id'])
(OUT/'sources.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(OUT/'acquisition-log.json').write_text(json.dumps(dict(acquired=ACQUIRED,attempts=attempts),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Acquired',len(rows),'models; unavailable packs recorded, no runtime CDN.',flush=True)
