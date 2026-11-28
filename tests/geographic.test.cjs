'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const A=require('../assets/archipelago-core.js'),G=require('../assets/geography/layout.js');G.apply(A);
const C=require('../assets/island-core.js'),E=require('../assets/explorer-core.js'),V=require('../assets/vehicle-core.js'),Traffic=require('../assets/traffic-core.js');
test('30 Natural Earth city coordinates project into a non-overlapping geographic cartogram',()=>{
  assert.equal(C.TEAMS.length,30);assert.equal(Object.keys(G.positions).length,30);assert.equal(new Set(A.ISLANDS.map(i=>i.teamId)).size,30);
  for(const p of A.ISLANDS){assert(p.x>0&&p.x<A.MAP.width&&p.y>0&&p.y<A.MAP.height);assert(p.geography.lon&&p.geography.lat);}
  for(let i=0;i<30;i++)for(let j=i+1;j<30;j++){const a=A.ISLANDS[i],b=A.ISLANDS[j];assert(Math.hypot((a.x-b.x)/360,(a.y-b.y)/250)>1,`${a.teamId}/${b.teamId}`);}
  const p=G.positions;assert(p.blazers.y<p.kings.y&&p.kings.y<p.warriors.y&&p.warriors.y<p.lakers.y);assert(p.jazz.x<p.nuggets.x&&p.nuggets.x<p.thunder.x);assert(p.spurs.y>p.mavericks.y);assert(p.raptors.y<p.cavaliers.y);assert(p.celtics.y<p.knicks.y&&p.knicks.y<p.sixers.y&&p.sixers.y<p.wizards.y);assert(p.heat.y>p.magic.y&&p.heat.x>p.magic.x);assert(Math.hypot(p.nets.x-p.knicks.x,p.nets.y-p.knicks.y)<600);
  assert(G.outlines.some(o=>o.name==='Canada'));assert.equal(new Set(G.outlines.filter(o=>o.kind==='lakes').map(o=>o.name)).size,5);
});
test('every original facility ID has a finite entrance and connected new pedestrian route',()=>{
  const rows=[...C.TEAMS,...C.COURTS,...C.ENCOUNTERS,...require('../assets/memory-core.js').ENTRANCES,...require('../assets/shop-core.js').SHOPS,...require('../assets/sights-core.js').SIGHTS.filter(s=>s.photo)];
  for(const p of rows){assert(Number.isFinite(p.x)&&Number.isFinite(p.y),p.id);const route=E.roadPath(E.entrance('warriors'),p.id);assert(route.length>0,p.id);assert(Math.hypot(route.at(-1).x-E.entrance(p.id).x,route.at(-1).y-E.entrance(p.id).y)<1e-7,p.id);}
  const walker=E.createWalker();E.walk(walker,'nets',0,true);assert(E.hasArrived(walker,'nets'));E.walk(walker,'rockets',10,true);assert(E.hasArrived(walker,'rockets'));const before={...walker.position},camera=E.createCamera();E.focusVenue(camera,'rockets');E.fullIsland(camera);assert.deepEqual(walker.position,before);
});
test('geographic cameras, repeated destination cancellation and collision solids share new coordinates',()=>{
  for(const team of C.TEAMS){const c=E.createCamera();E.focusVenue(c,team.id);const v=E.worldToViewport(team.entrance,c.view);assert(v.x>=0&&v.x<=1&&v.y>=0&&v.y<=1,team.id);assert.deepEqual(E.viewportToWorld(v,c.view),team.entrance);}
  const w=E.createWalker();E.walk(w,'lakers',0);E.tick(w,100);E.walk(w,'harbor-01',100);E.tick(w,10000);assert(E.hasArrived(w,'harbor-01'));assert(!E.hasArrived(w,'lakers'));assert(A.bayClear(E.entrance('warriors')));
});
test('real 3D vehicle catalogue has seven distinct sports cars and two city vehicles',()=>{
  assert.equal(V.MODELS.filter(v=>v.type==='sport').length,7);assert.equal(V.MODELS.filter(v=>v.type==='city').length,2);const manifest=require('../assets/models/manifest.json');for(const v of V.MODELS){const row=manifest.find(r=>r.id===v.id);assert(row&&fs.existsSync(row.path));assert(row.after.triangles>0);}
  const lengths=Object.fromEntries([...Traffic.tracks].map(([id,t])=>[id,t.length])),fleet=V.createFleet(lengths);const rows=V.advance(fleet,100,{tracks:Traffic.tracks,sample:Traffic.sample,active:()=>true});assert(rows.some(v=>v.distance!==fleet.find(f=>f.id===v.id).distance));assert(rows.some(v=>v.wheelAngle>0));
  const still=V.advance(rows,50,{tracks:Traffic.tracks,sample:Traffic.sample,active:()=>true,reduced:true});assert(still.every(v=>v.paused));assert.deepEqual(still.map(v=>v.distance),rows.map(v=>v.distance));
  const close=fleet.map(v=>({...v}));close[1].distance=20;const blocked=V.advance(close,80,{tracks:Traffic.tracks,sample:Traffic.sample,active:()=>true});assert.equal(blocked[0].speed,0);assert(Math.abs(V.headingDelta(Math.PI-.1,-Math.PI+.1)-.2)<1e-9);
});
test('vehicle lanes stay separate from bridge walk and pause without hidden-time jumps',()=>{
  const a=A.ROAD_NODES['bridge-west-walk'],b=A.ROAD_NODES['bridge-east-walk'],p=A.CAR_ROUTES[0].points[0],d=Math.abs((b.x-a.x)*(a.y-p.y)-(a.x-p.x)*(b.y-a.y))/Math.hypot(b.x-a.x,b.y-a.y);assert(d>=30);
  const f=V.createFleet(Object.fromEntries([...Traffic.tracks].map(([id,t])=>[id,t.length])));const paused=V.advance(f,80000,{tracks:Traffic.tracks,sample:Traffic.sample,active:()=>false});assert.deepEqual(paused.map(p=>p.distance),f.map(p=>p.distance));const resumed=V.advance(paused,16,{tracks:Traffic.tracks,sample:Traffic.sample,active:()=>true});assert(resumed.every((v,i)=>Math.abs(v.distance-paused[i].distance)<1));
});
test('v2 photo snapshots coexist with all historical artwork versions and saved outfits',()=>{
  const F=require('../assets/fan-core.js'),values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},session=F.createFanSession(storage);
  const old=F.createPhoto('lakers',F.DEFAULT_AVATAR),photo={...F.createPhoto('warriors',{...F.DEFAULT_AVATAR,nickname:'Geo Fan'}),artVersion:'geographic-stylized-v2'};session.collect(old);session.collect(photo);session.edit({nickname:'Later',jersey:'bulls'});session.save();const next=F.createFanSession(storage).getState();assert.equal(next.collected,2);assert.equal(next.album.warriors.artVersion,'geographic-stylized-v2');assert.equal(next.album.warriors.avatar.nickname,'Geo Fan');assert.equal(next.album.lakers.artVersion,old.artVersion);assert.equal(next.saved.nickname,'Later');assert.equal(F.STATIONS.length,16);
});
