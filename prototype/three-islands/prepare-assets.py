"""Create small prototype logos; originals are never modified. Requires Pillow.
Run from the repository root: py -3.14 prototype/three-islands/prepare-assets.py
"""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / 'assets' / 'team'
OUT.mkdir(parents=True, exist_ok=True)
source = json.loads((ROOT / 'assets/team/logo-manifest.json').read_text(encoding='utf-8'))
rows = []
for row in source['logos']:
    path = ROOT / row['path'].removeprefix('./')
    with Image.open(path) as original:
        image = original.convert('RGBA')
        image.thumbnail((64, 64), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (64, 64))
        canvas.alpha_composite(image, ((64-image.width)//2, (64-image.height)//2))
        target = OUT / (row['abbr'] + '.png')
        canvas.save(target, optimize=True)
    rows.append({'teamId': row['teamId'], 'source': row['path'],
                 'path': './assets/team/' + target.name, 'bytes': target.stat().st_size,
                 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
(OUT / 'manifest.json').write_text(json.dumps(rows, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
print(f'{len(rows)} alpha logos, {sum(r["bytes"] for r in rows)} bytes; originals unchanged')
