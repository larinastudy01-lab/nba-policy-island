'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const A=require('../assets/archipelago-core.js'),E=require('../assets/explorer-core.js'),C=require('../assets/island-core.js'),P=require('../assets/pixel-core.js'),B=require('../assets/bay-scene.js'),T=require('../assets/traffic-core.js');
test('four preserved facilities occupy distinct upper-left, lower-right, bridgehead and lower-left plots',()=>{
  const arena=A.place('nba','warriors'),court=A.place('court','harbor-01'),shop=A.place('shop','shop-warriors'),pier=A.place('encounter','meet-pier');
  assert(arena.x<shop.x&&arena.y< court.y);assert(court.x>arena.x&&pier.x<court.x);assert(shop.y< court.y&&pier.y>arena.y);
  assert.equal(A.BAY.pathWidth,2*A.BAY.playerWidth);for(const p of [arena,court,shop,pier])assert(A.bayClear(p.entrance));
  assert.equal(P.arenaBranding(C.TEAMS[0]).sign[0],41);assert.notEqual(P.court('harbor').markup(),P.court('harbor',false,'harbor-01').markup());
});
test('every Bay pavement edge clears building/hoop/bench solids with the actual player foot radius',()=>{
  for(const edge of A.ROAD_EDGES.filter(e=>e.islandId==='island-warriors'))assert(E.edgeClear(edge),edge.from+' -> '+edge.to);
  for(const id of A.BAY.entrances){const route=E.roadPath(A.ROAD_NODES['bridge-west-walk'],id);assert.deepEqual(route.at(-1),E.entrance(id));
    assert(route.some(p=>p.x===A.ROAD_NODES['bay-entry'].x&&p.y===A.ROAD_NODES['bay-entry'].y));
    for(let n=1;n<route.length;n++)for(let k=0;k<=100;k++){const a=route[n-1],b=route[n];assert(A.bayClear({x:a.x+(b.x-a.x)*k/100,y:a.y+(b.y-a.y)*k/100}),id);}
  }
  assert.equal(A.bayClear({x:216,y:450}),false);assert.equal(A.bayClear({x:324,y:420}),false);
});
test('live camera contains all four complete facilities and bridge landing; overview never moves the player',()=>{
  const camera=E.createCamera(),walker=E.createWalker();E.focusIsland(camera,'warriors');assert.deepEqual(camera.view,A.BAY.camera);
  for(const p of [A.place('nba','warriors'),A.place('court','harbor-01'),A.place('shop','shop-warriors'),A.place('encounter','meet-pier'),A.ROAD_NODES['bridge-west-walk']]){const v=E.worldToViewport(p,camera.view);assert(v.x>0&&v.x<1&&v.y>0&&v.y<1);}
  E.walk(walker,'shop-warriors',0);E.tick(walker,10000);const saved=JSON.stringify(walker);E.fullIsland(camera);assert.equal(JSON.stringify(walker),saved);
});
test('proximity exposes exactly the nearest available target, retracts on leaving, travel or overview',()=>{
  const camera=E.createCamera(),walker=E.createWalker();E.focusIsland(camera,'warriors');
  assert.equal(E.interactiveVisible(camera,'meet-pier',E.entrance('shop-warriors')),true,'primary pier must remain clickable from the shop before approaching');
  for(const id of A.BAY.entrances){walker.position=E.entrance(id);walker.locationId=id;assert.equal(E.nearestBayInteraction(camera,walker).id,id);assert.deepEqual(E.visibleLabels(camera,[],walker.position),[]);}
  const radius=A.BAY.radii['shop-warriors'];A.BAY.radii['shop-warriors']=120;
  try{walker.position=E.entrance('warriors');assert.equal(E.nearestBayInteraction(camera,walker).id,'warriors');}finally{A.BAY.radii['shop-warriors']=radius;}
  walker.position={x:410,y:470};assert.equal(E.nearestBayInteraction(camera,walker),null);walker.position=E.entrance('warriors');walker.moving=true;assert.equal(E.nearestBayInteraction(camera,walker),null);walker.moving=false;E.fullIsland(camera);assert.equal(E.nearestBayInteraction(camera,walker),null);
});
test('latest-click cancellation arrives at the new facility, with no obsolete route completion',()=>{
  const walker=E.createWalker();const old=E.walk(walker,'meet-pier',0);E.tick(walker,150);E.walk(walker,'shop-warriors',150);assert.equal(E.tick(walker,10000,old),false);E.tick(walker,10000);assert(E.hasArrived(walker,'shop-warriors'));
});
test('NPCs yield to the player, never teleport across a loop, and freeze for reduced motion/background',()=>{
  const crowd=B.createCrowd(),match=C.gameForTeam('warriors','scheduled','home');let before=B.advanceCrowd(crowd,0,match);
  for(let i=0;i<1000;i++){const next=B.advanceCrowd(crowd,80,match,{player:E.entrance('warriors')});for(let j=0;j<next.length;j++)assert(Math.hypot(next[j].x-before[j].x,next[j].y-before[j].y)<=2.1);before=next;}
  for(const options of [{active:false},{reducedMotion:true}]){const positions=crowd.people.map(p=>({...p.position}));B.advanceCrowd(crowd,10000,match,options);assert.deepEqual(crowd.people.map(p=>p.position),positions);}
});
test('parked P1 and decorative foreground leave the pier entrance and boat silhouette separate',()=>{
  const car=T.CARS.find(c=>c.id==='car-p1'),p=E.entrance('meet-pier');assert(Math.hypot(car.x-p.x,car.y-p.y)>65);
  assert(!B.PEOPLE.filter(p=>p.speed===0).some(p=>Math.hypot(p.route[0][0]-252,p.route[0][1]-566)<20));
  const css=fs.readFileSync('assets/team-logo.css','utf8');assert.match(css,/grid-template:minmax\(0,1fr\)\/minmax\(0,1fr\)/);assert.match(css,/\.arena-logo-sign>\.team-logo\{position:absolute;inset:0/);
});
test('arena and shop have separate visible pixel silhouettes and non-overlapping polygon hit regions',()=>{
  const S=require('../assets/shop-core.js'),Art=require('../assets/shop-art.cjs'),arena=C.TEAMS[0],shop=S.SHOPS[0],at=P.arena(arena),st=Art.storefront(shop);
  function pixel(t,wx,wy,x,y){const u=Math.floor((wx-x)/2),v=Math.floor((wy-y)/2);return u>=0&&v>=0&&u<t.width&&v<t.height&&Boolean(t.pixels[v*t.width+u]);}
  const shapes=[['warriors',arena.x-80,arena.y-68],['shop-warriors',shop.x-shop.width/2,shop.y-shop.height]].map(([id,x,y])=>A.BAY.hitShapes[id].points.map(([u,v])=>({x:x+u*2,y:y+v*2})));
  function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
  for(let y=360;y<520;y++)for(let x=130;x<380;x++){assert(!(inside({x,y},shapes[0])&&inside({x,y},shapes[1])),'overlapping hot polygons');assert(!(pixel(at,x,y,arena.x-80,arena.y-68)&&pixel(st,x,y,shop.x-shop.width/2,shop.y-shop.height)),'overlapping opaque pixels');}
});
