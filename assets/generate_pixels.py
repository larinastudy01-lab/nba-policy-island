"""Rebuild project pixel assets and offline comparison images, without packages."""
from pathlib import Path
import json
import math
import subprocess
from pixel_raster import Raster, rasterize

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/pixel'
OUT.mkdir(exist_ok=True)
source=json.loads(subprocess.check_output(['node','assets/generate_pixel_assets.cjs'],cwd=ROOT).decode('utf-8'))
drawings={}
tiles={'sights':{},'encounters':{}}
for item in source['items']+source['sources']:
    svg=item.get('svg') or (ROOT/item['path']).read_text(encoding='utf-8-sig')
    image=rasterize(svg,item['width'],item['height']);drawings[item['name']]=image
    target=OUT/item['name'];target.parent.mkdir(parents=True,exist_ok=True)
    target.with_suffix('.png').write_bytes(image.png());target.with_suffix('.svg').write_text(image.svg(item['name']+' · original pixel art'),encoding='utf-8')
    if item.get('photo'):
        tiles['sights'][item['photoId']+(':night' if item.get('night') else '')]={'width':image.width,'height':image.height,'markup':image.markup()}
    if item.get('encounterId'):tiles['encounters'][item['encounterId']]={'width':image.width,'height':image.height,'markup':image.markup()}
(ROOT/'assets/pixel-tiles.js').write_text('(function(r,d){if(typeof module==="object"&&module.exports)module.exports=d;else r.NBAPixelTiles=d;})(globalThis,'+json.dumps(tiles,ensure_ascii=False,separators=(',',':'))+');\n',encoding='utf-8')
manifest={'version':source['spec']['version'],'spec':source['spec'],'arenaModels':source['arenaModels'],'people':source['people'],'props':source['props'],'files':[{'name':n,'width':i.width,'height':i.height} for n,i in drawings.items()]}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')

# Compose the same integer world layers; this is an offline artwork proof, not a browser screenshot.
preview=ROOT/'docs/pixel-preview';preview.mkdir(exist_ok=True)
for night in [False,True]:
    world=Raster(800,500)
    for name in ['island-map','bay-ground','scenery-ground']:
        layer=drawings[name]
        if night:
            dark=Raster(layer.width,layer.height);dark.data=bytearray(layer.data)
            for i in range(0,len(dark.data),4):
                for j,factor in enumerate([.52,.65,.77]):dark.data[i+j]=round(dark.data[i+j]*factor)
            layer=dark
        world.paste(layer,0,0)
    for name in ['roads-night' if night else 'roads','traffic-roads','props-world']:world.paste(drawings[name],0,0)
    if night:world.paste(drawings['bay-lights'],0,0)
    objects=[]
    for t in source['teams']:objects.append((t['y'],drawings['arenas/'+t['id']+('-night' if night else '')],round(t['x']/2-40),round(t['y']/2-34)))
    for c in source['courts']:objects.append((c['y']-35 if c['id']=='harbor-01' else c['y'],drawings['courts/'+c['type']+('-night' if night else '')],round(c['x']/2-27.5),round(c['y']/2-26)))
    for s in source['sights']:objects.append((3 if s['key']=='golden-gate' else s['y']-2,drawings['sights/'+s['key']+('-night' if night else '')],round((s['x']-s['width']/2)/2),round((s['y']-s['height'])/2)))
    for car in source['cars']:objects.append((367 if car['id']=='car-f40' else car['y']+1,drawings[f"cars/{car['id']}-{car['view']}"],round(car['x']/2-13),round(car['y']/2-14)))
    player=drawings['player/body-sheet'].crop(16,24,16,24);player.paste(drawings['player/top-neutral-sheet'].crop(16,24,16,24),0,0)
    objects.append((376,player,round(303/2)-8,round(376/2)-22))
    for person in source['crowd']:
        x,y=person['route'][0];objects.append((y,drawings['people/'+person['pixelModel']].crop(0,24,16,24),round(x/2)-8,round(y/2)-22))
    for y,layer,x,top in sorted(objects,key=lambda o:o[0]):world.paste(layer,x,top)
    if night:
        for car in source['cars']:
            if not car['parked']:
                beam=drawings['headlight'];co,si=math.cos(car['heading']),math.sin(car['heading'])
                for y in range(beam.height):
                    for x in range(beam.width):
                        color=tuple(beam.data[(y*beam.width+x)*4:(y*beam.width+x+1)*4])
                        if color[3]:world.dot(round(car['x']/2+co*x-si*(y-8)),round(car['y']/2+si*x+co*(y-8)),color)
    world.paste(drawings['bay-foreground-arena'],0,0);world.paste(drawings['bay-foreground-pier'],0,0);world.paste(drawings['bay-foreground-court'],0,0)
    (preview/('island-night.png' if night else 'island-day.png')).write_bytes(world.crop(0,0,800,500,2).png())
    (preview/('bay-night.png' if night else 'bay-day.png')).write_bytes(world.crop(28,56,250,350,3).png())
sheet=Raster(80,192);sheet.paste(drawings['player/body-sheet'],0,0);sheet.paste(drawings['player/top-neutral-sheet'],0,0)
(preview/'fan-sheet.png').write_bytes(sheet.crop(0,0,80,192,3).png())
gallery=Raster(500,230);gallery.polygon([(0,0),(500,0),(500,230),(0,230)],(21,44,61,255))
for i,model in enumerate(dict.fromkeys(source['arenaModels'].values())):
    team=next(t for t in source['teams'] if source['arenaModels'][t['id']]==model);gallery.paste(drawings['arenas/'+team['id']],5+i*82,5)
for i,car in enumerate(source['cars']):gallery.paste(drawings[f"cars/{car['id']}-side"],15+i*82,91,2)
for i,model in enumerate(source['people']):gallery.paste(drawings['people/'+model].crop(0,24,16,24),8+i*62,155,2)
(preview/'models.png').write_bytes(gallery.crop(0,0,500,230,2).png())
print(f"Generated {len(drawings)} pixel drawings (PNG + rect-only SVG), 8-direction sheets and four offline comparison PNGs.")
