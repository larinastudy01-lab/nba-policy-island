'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../assets/archipelago-core.js'),C=require('../assets/island-core.js'),E=require('../assets/explorer-core.js'),S=require('../assets/sights-core.js'),T=require('../assets/traffic-core.js'),P=require('../assets/pixel-core.js'),Art=require('../assets/archipelago-art.cjs');
const all=[...C.TEAMS,...C.COURTS,...C.ENCOUNTERS,...S.SIGHTS.filter(s=>s.photo)];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function onSegment(p,a,b){const l=dist(a,b);return Math.abs(dist(a,p)+dist(p,b)-l)<1e-6;}
test('30 independent coast polygons each contain exactly one preserved NBA arena',()=>{
  assert.equal(A.ISLANDS.length,30);assert.equal(new Set(A.ISLANDS.map(i=>i.id)).size,30);
  for(const i of A.ISLANDS){const teams=C.TEAMS.filter(t=>t.islandId===i.id);assert.equal(teams.length,1);assert.equal(teams[0].id,i.teamId);assert.ok(A.contains(i,teams[0]));
    for(const p of A.coast(i)){assert.ok(p.x>=0&&p.y>=0&&p.x<=C.MAP.width&&p.y<=C.MAP.height);for(const other of A.ISLANDS)if(other!==i)assert.equal(A.contains(other,p),false,i.id+' shares a coast with '+other.id);}
  }
  assert.notEqual(C.getLandmark('nba','lakers').islandId,C.getLandmark('nba','clippers').islandId);
});
test('15 court games, 20 sights, four photo entrances and three encounters retain independent IDs and island owners',()=>{
  assert.equal(C.COURTS.length,15);assert.equal(new Set(C.COURTS.map(c=>c.gameId)).size,15);assert.equal(S.SIGHTS.length,20);assert.equal(S.SIGHTS.filter(s=>s.photo).length,4);assert.equal(C.ENCOUNTERS.length,3);
  assert.equal(new Set([...C.TEAMS,...C.COURTS,...C.ENCOUNTERS,...S.SIGHTS].map(p=>p.id)).size,68);
  for(const p of all){assert.ok(A.owner(p.id));assert.equal(p.islandId,A.owner(p.id).id);assert.deepEqual(E.entrance(p.id),p.entrance);assert.ok(A.contains(A.owner(p.id),p.entrance)||p.id==='sight-golden-gate',p.id+' entrance outside land or its bridge');}
});
test('Warriors to Lakers takes the visible sea spine and short island bridges, not a water shortcut',()=>{
  const route=E.roadPath(E.entrance('warriors'),'lakers');assert.deepEqual(route[0],E.entrance('warriors'));assert.deepEqual(route.at(-1),E.entrance('lakers'));
  for(const name of ['gate-warriors','sea-west-560','sea-west-665','sea-west-910','gate-lakers'])assert.ok(route.some(p=>dist(p,E.ROAD_NODES[name])<.01),name);
  for(let n=1;n<route.length;n++){const a=route[n-1],b=route[n];assert.ok(E.ROAD_EDGES.some(e=>onSegment(a,E.ROAD_NODES[e.from],E.ROAD_NODES[e.to])&&onSegment(b,E.ROAD_NODES[e.from],E.ROAD_NODES[e.to])));}
  const short=E.roadPath(E.entrance('lakers'),'clippers');assert.ok(short.some(p=>dist(p,E.ROAD_NODES['sea-west-910'])<.01));
});
test('all islands and activities are connected; ordinary street segments stay on their owning island',()=>{
  for(const p of all)assert.deepEqual(E.roadPath(E.entrance('warriors'),p.id).at(-1),p.entrance);
  for(const edge of E.ROAD_EDGES.filter(e=>!e.bridge)){const a=E.ROAD_NODES[edge.from],b=E.ROAD_NODES[edge.to],island=A.getIsland(edge.islandId);assert.ok(island,edge.from);for(let j=0;j<=10;j++)assert.ok(A.contains(island,{x:a.x+(b.x-a.x)*j/10,y:a.y+(b.y-a.y)*j/10}),edge.from+' leaves '+island.id);}
});
test('island camera contains the arena, land gate and coast, and returning to overview retains exact player position',()=>{
  const w=E.createWalker(),camera=E.createCamera();for(const i of A.ISLANDS){E.focusIsland(camera,i.id);assert.equal(camera.islandId,i.id);for(const p of [...A.coast(i),C.getLandmark('nba',i.teamId)]){const v=E.worldToViewport(p,camera.view);assert.ok(v.x>=0&&v.x<=1&&v.y>=0&&v.y<=1,i.id);}}
  E.walk(w,'lakers',0);E.tick(w,w.duration);E.focusVenue(camera,'lakers');const before=JSON.stringify(w);E.back(camera);assert.equal(camera.islandId,'island-lakers');E.fullIsland(camera);assert.equal(JSON.stringify(w),before);assert.ok(E.hasArrived(w,'lakers'));
});
test('near view exposes only this island; secondary points expand on approach or explicit keyboard focus',()=>{
  const camera=E.createCamera();E.focusIsland(camera,'warriors');assert.equal(E.interactiveVisible(camera,'lakers',E.entrance('warriors')),false);assert.equal(E.interactiveVisible(camera,'harbor-01'),true);assert.equal(E.interactiveVisible(camera,'sight-lombard'),false);assert.equal(E.interactiveVisible(camera,'sight-lombard',{x:S.get('sight-lombard').x,y:S.get('sight-lombard').y}),true);
  E.focusVenue(camera,'sight-lombard');assert.equal(E.interactiveVisible(camera,'sight-lombard'),true);assert.deepEqual(E.visibleLabels(camera),[]);
});
test('terrain contains sea between coasts, while day/night roads and LIVE are independent',()=>{
  const drawings=Art.art();assert.equal(drawings['island-map'].width,C.MAP.width/2);assert.equal(drawings['island-map'].height,C.MAP.height/2);
  assert.notEqual(Art.roads(false).markup(),Art.roads(true).markup());
  for(const theme of ['day','night']){assert.equal(C.gameForTeam('warriors','live').glowing,false,theme);assert.equal(C.gameForTeam('lakers','live').glowing,true);assert.equal(C.gameForTeam('lakers','final').glowing,false);assert.equal(C.gameForTeam('lakers','final').homeScore,101);}
  const p=E.ROAD_NODES['sea-west-665'];assert.ok(A.ISLANDS.every(i=>!A.contains(i,p)));assert.ok(E.ROAD_EDGES.some(e=>e.trunk&&e.bridge));
});
test('neutral upper-body sprite remains a separate aligned layer after moving to the new world',()=>{
  assert.deepEqual(P.SPEC.directions,['e','se','s','sw','w','nw','n','ne']);assert.equal(P.SPEC.frameMs,150);
  const a=P.actor({},{walking:true,frame:2,direction:'sw'});assert.ok(a.body.markup());assert.ok(a.top.markup());assert.notEqual(a.body.markup(),a.top.markup());
  for(const r of T.ROUTES)for(let d=0;d<T.tracks.get(r.id).length;d+=10){const p=T.sample(r.id,d);assert.ok(p.x>=0&&p.x<=C.MAP.width&&p.y>=0&&p.y<=C.MAP.height);}
});
