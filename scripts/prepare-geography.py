from pathlib import Path
import json,urllib.request
R=Path(__file__).resolve().parents[1];p=R/'node_modules/model-downloads/v2/ne-cities.json'
source='https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson'
if not p.exists():
    with urllib.request.urlopen(urllib.request.Request(source,headers={'User-Agent':'Mozilla/5.0'})) as r:p.write_bytes(r.read())
features=json.loads(p.read_text('utf8'))['features']
names={'warriors':'San Francisco','lakers':'Los Angeles','clippers':'Los Angeles','kings':'Sacramento','blazers':'Portland','suns':'Phoenix','jazz':'Salt Lake City','nuggets':'Denver','thunder':'Oklahoma City','mavericks':'Dallas','spurs':'San Antonio','rockets':'Houston','timberwolves':'Minneapolis','bucks':'Milwaukee','bulls':'Chicago','raptors':'Toronto','pistons':'Detroit','cavaliers':'Cleveland','pacers':'Indianapolis','grizzlies':'Memphis','pelicans':'New Orleans','hawks':'Atlanta','hornets':'Charlotte','magic':'Orlando','heat':'Miami','celtics':'Boston','knicks':'New York','nets':'New York','sixers':'Philadelphia','wizards':'Washington, D.C.'}
cities={}
for id,name in names.items():
    candidates=[f for f in features if ' '.join(f['properties']['name'].split())==name and f['properties'].get('adm0name') in ['United States of America','Canada']]
    if not candidates:raise ValueError((id,name))
    f=max(candidates,key=lambda f:f['properties'].get('pop_max',0));lon,lat=f['geometry']['coordinates'];cities[id]=dict(city='Brooklyn' if id=='nets' else name,lon=lon,lat=lat)
data=dict(cities=cities,features=json.loads((R/'assets/geography/north-america.geojson').read_text())['features'],source=source)
(R/'assets/geography/data.js').write_text('/* Natural Earth public-domain coordinates; generated offline by scripts/prepare-geography.py. */\n(function(r){const data='+json.dumps(data,separators=(',',':'))+';if(typeof module==="object"&&module.exports)module.exports=data;else r.NBAGeoData=data;})(globalThis);\n','utf8')
(R/'assets/geography/cities.json').write_text(json.dumps(dict(source=source,license='Public Domain',cities=cities),indent=2)+'\n','utf8')
print('30 Natural Earth city coordinates, CONUS, southern Canada and five Great Lakes prepared')
