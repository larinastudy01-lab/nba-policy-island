"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../assets/sights-core.js'),T=require('../assets/traffic-core.js'),E=require('../assets/explorer-core.js'),C=require('../assets/island-core.js'),F=require('../assets/fan-core.js');
const root=path.join(__dirname,'..'),points=S.SIGHTS.filter(s=>s.photo);
const record=(id,background='day')=>F.normalizePhoto({version:3,kind:'sight',locationId:id,avatar:{...F.DEFAULT_AVATAR,nickname:'<Traveler>&'},pose:'ball',background,capturedAt:'2026-11-24T06:00:00Z'});
test('20 unique independent sights, four reachable photo entrances; original relative day/night art exists',()=>{
  assert.equal(S.SIGHTS.length,20);assert.equal(new Set(S.SIGHTS.map(s=>s.id)).size,20);assert.equal(points.length,4);
  assert.deepEqual(points.map(s=>s.key),['golden-gate','santa-monica','cloud-gate','liberty']);
  const ids=new Set([...C.TEAMS,...C.COURTS,...C.ENCOUNTERS].map(p=>p.id));
  for(const s of S.SIGHTS){assert.ok(!ids.has(s.id));assert.equal(C.getLandmark('sight',s.id),s);assert.equal(E.districtFor(s.id).id,s.district);for(const asset of [s.asset,s.nightAsset]){assert.ok(fs.existsSync(path.join(root,asset)));assert.ok(new URL(asset,'https://example.github.io/nba-policy-island/').pathname.startsWith('/nba-policy-island/'));}if(!s.photo)assert.throws(()=>E.roadPath(E.entrance('warriors'),s.id),/Unknown/);}
  assert.equal(C.TEAMS.length,16);assert.equal(C.COURTS.length,15);assert.equal(F.STATIONS.length,16);
});
test('all four scenic destinations share the pedestrian graph and camera; route cancellation honors final scenic destination',()=>{
  const w=E.createWalker(),camera=E.createCamera();
  for(const sight of points){E.walk(w,sight.id,0,true);assert.ok(E.hasArrived(w,sight.id));assert.deepEqual(w.position,sight.entrance);E.focusVenue(camera,sight.id);const screen=E.worldToViewport(w.position,camera.view);assert.ok(screen.x>=0&&screen.x<=1&&screen.y>=0&&screen.y<=1);E.back(camera);assert.equal(camera.districtId,sight.district);}
  E.walk(w,points[0].id,0);const token=w.token;E.tick(w,100);E.walk(w,points[1].id,100);E.tick(w,10000,token);assert.equal(E.hasArrived(w,points[1].id),false);E.tick(w,10000);assert.ok(E.hasArrived(w,points[1].id));
});
test('Warriors to bridge viewpoint traverses bridge-side walkway, then reaches bay pier without a vehicle lane',()=>{
  const p=E.roadPath(E.entrance('warriors'),'sight-golden-gate');assert.ok(p.some(n=>n.x===353&&n.y===192));assert.deepEqual(p.at(-1),{x:128,y:293});
  const lane=T.ROUTES[0].points,walkA=E.ROAD_NODES['bridge-east-walk'],walkB=E.entrance('sight-golden-gate');
  const separation=q=>Math.abs((lane[1].x-lane[0].x)*(lane[0].y-q.y)-(lane[0].x-q.x)*(lane[1].y-lane[0].y))/Math.hypot(lane[1].x-lane[0].x,lane[1].y-lane[0].y);
  assert.ok(separation(walkA)>18);assert.ok(separation(walkB)>18);assert.ok(E.ROAD_EDGES.some(e=>e.bridge&&[e.from,e.to].includes('sight-golden-gate')));
  const toPier=E.roadPath(walkB,'meet-pier');assert.ok(toPier.some(p=>p.x===299&&p.y===573));assert.deepEqual(toPier.at(-1),E.entrance('meet-pier'));
});
test('six distinct car silhouettes each have three original views, four parked and two closed cruise lanes',()=>{
  assert.equal(T.CARS.length,6);assert.equal(T.CARS.filter(c=>c.parked).length,4);assert.equal(T.ROUTES.length,2);assert.equal(new Set(T.CARS.map(c=>c.id)).size,6);
  assert.equal(new Set(T.CARS.map(c=>T.svg(c.id,'side'))).size,6);
  for(const car of T.CARS){const views=['front','side','rear'].map(v=>T.svg(car.id,v));assert.equal(new Set(views).size,3);for(const v of ['front','side','rear'])assert.ok(fs.existsSync(path.join(root,'assets/cars',`${car.id}-${v}.svg`)));}
  for(const r of T.ROUTES){const track=T.tracks.get(r.id);assert.ok(track.length>300);const first=T.sample(r.id,0),last=T.sample(r.id,track.length-.0001);assert.ok(Math.hypot(first.x-last.x,first.y-last.y)<.001);}
});
test('direction selects front, side and rear with mirroring; curves slow down without position jumps',()=>{
  assert.deepEqual(T.direction(0),{view:'side',flip:false});assert.equal(T.direction(Math.PI).flip,true);assert.equal(T.direction(Math.PI/2).view,'front');assert.equal(T.direction(-Math.PI/2).view,'rear');
  for(const r of T.ROUTES){const length=T.tracks.get(r.id).length,views=new Set();let previous=T.sample(r.id,0),slow=0,fast=0;for(let d=1;d<length;d++){const p=T.sample(r.id,d);assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y)<=1.001);views.add(p.view);if(p.corner){slow++;assert.ok(p.speed<r.speed);}else{fast++;assert.equal(p.speed,r.speed);}previous=p;}assert.ok(slow&&fast);assert.equal(views.size,3);}
});
test('only the nearby district animates; pause/reduced motion preserve exact position; night beams are independent of LIVE',()=>{
  const t=T.createTraffic(),before={...t.distance};T.advance(t,100,{active:false});assert.deepEqual(t.distance,before);T.advance(t,100,{active:true,reducedMotion:true,district:'west'});assert.deepEqual(t.distance,before);T.advance(t,100,{active:true,district:'west'});assert.ok(t.distance['car-720s']>0);assert.equal(t.distance['car-aventador'],0);
  const after={...t.distance};T.advance(t,100,{active:true,district:'east'});assert.deepEqual(t.distance,after);
  for(const car of T.CARS){assert.equal(T.headlights(car,false),false);assert.equal(T.headlights(car,true),!car.parked);}assert.equal(C.gameForTeam('lakers','final').glowing,false);assert.ok(T.headlights(T.CARS.find(c=>c.id==='car-720s'),true));
});
test('four scenic photos inline the saved avatar, landmark background and escaped text; snapshots survive changing clothes',()=>{
  const session=F.createFanSession(null);session.collect(F.createPhoto('warriors',F.DEFAULT_AVATAR));const original=session.getState();
  for(const s of points){const p=record(s.id),markup=F.photoSVG(p);assert.match(markup,/&lt;Traveler&gt;&amp;/);assert.ok(markup.includes(s.name));assert.equal((markup.match(/data-layer="face"/g)||[]).length,1);assert.doesNotMatch(markup,/<image|href=|foreignObject/);session.edit({jersey:'bulls'});session.save();assert.equal(F.photoSVG(p),markup);assert.throws(()=>session.collect(p),/download-only/);assert.notEqual(F.photoSVG(record(s.id,'night')),markup);}
  assert.equal(session.getState().collected,original.collected);assert.equal(session.getState().encounterCollected,0);assert.equal(F.normalizePhoto({...record(points[0].id),locationId:'sight-alcatraz'}),null);
});
test('scenic PNG export uses existing self-contained SVG to Canvas contract without remote resources',async()=>{
  let source,type;class ImageStub{set src(v){source=v;this.onload();}}const blob={type:'image/png'},canvas={getContext:()=>({drawImage(){}}),toBlob:(cb,t)=>{type=t;cb(blob);}};
  assert.equal(await F.exportPNG(record(points[0].id),{Image:ImageStub,createCanvas:()=>canvas}),blob);assert.equal(type,'image/png');assert.equal(canvas.width,960);assert.equal(canvas.height,640);assert.ok(decodeURIComponent(source).includes(points[0].name));
});
test('district frames include the full 20 scenic silhouettes; scenery and traffic share the original world bounds',()=>{
  for(const sight of S.SIGHTS){const camera=E.createCamera();E.focusDistrict(camera,sight.district);const v=camera.view;assert.ok(sight.x-sight.width/2>=v.x&&sight.x+sight.width/2<=v.x+v.width,sight.id);assert.ok(sight.y-sight.height>=v.y&&sight.y<=v.y+v.height,sight.id);}
  for(const r of T.ROUTES)for(let d=0;d<T.tracks.get(r.id).length;d+=5){const p=T.sample(r.id,d);assert.ok(p.x>=0&&p.x<=1600&&p.y>=0&&p.y<=1000);}
});
test('a bridge visitor uses the same side-walk coordinates and never walks on the vehicle lane',()=>{
  const B=require('../assets/bay-scene.js'),visitor=B.PEOPLE.find(p=>p.id==='pier-bag');assert.ok(visitor.route.some(([x,y])=>x===353&&y===192));assert.ok(visitor.route.some(([x,y])=>x===128&&y===293));assert.ok(visitor.route.some(([x,y])=>x===299&&y===573));assert.equal(B.PEOPLE.length,10);
});