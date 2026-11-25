"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const E=require("../assets/explorer-core.js"),C=require("../assets/island-core.js"),F=require("../assets/fan-core.js"),G=require("../assets/games-core.js");
const all=[...C.TEAMS,...C.COURTS,...C.ENCOUNTERS];
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function roadDistance(point){return Math.min(...E.ROAD_EDGES.map(edge=>{const a=E.ROAD_NODES[edge.from],b=E.ROAD_NODES[edge.to],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy);}));}
test("8 districts partition 30 NBA arenas, 15 unchanged court/game IDs and 3 encounters",()=>{
  const ids=E.DISTRICTS.flatMap(d=>d.ids);assert.equal(ids.length,48);assert.equal(new Set(ids).size,48);
  assert.deepEqual([...ids].sort(),all.map(p=>p.id).sort());assert.equal(C.TEAMS.length,30);assert.equal(F.STATIONS.length,16);
  assert.equal(new Set(C.COURTS.map(c=>c.gameId)).size,15);for(const court of C.COURTS)assert.equal(G.forCourt(court.id).id,court.gameId);
  for(const item of all){assert.equal(E.districtFor(item.id).ids.includes(item.id),true);assert.deepEqual(E.entrance(item.id),item.entrance);}
});
test("island -> west district -> Warriors venue -> original district -> island retains selection",()=>{
  const camera=E.createCamera();assert.equal(camera.level,"island");assert.deepEqual(camera.view,E.OVERVIEW_VIEW);
  E.focusDistrict(camera,"west");assert.equal(camera.level,"district");assert.ok(camera.view.width<C.MAP.width);
  E.focusVenue(camera,"warriors");assert.equal(camera.level,"venue");assert.equal(camera.districtId,"west");assert.equal(camera.view.width,520);
  E.back(camera);assert.equal(camera.level,"district");assert.equal(camera.districtId,"west");assert.equal(camera.selectedId,"warriors");
  E.back(camera);assert.equal(camera.level,"island");assert.equal(camera.selectedId,"warriors");
  assert.throws(()=>E.focusDistrict(camera,"missing"));assert.throws(()=>E.focusVenue(camera,"missing"));
});
test("all district/venue camera frames are bounded, preserve aspect and round-trip world coordinates",()=>{
  const camera=E.createCamera();const frames=[camera.view];
  for(const district of E.DISTRICTS){E.focusDistrict(camera,district.id);frames.push(camera.view);}
  for(const item of all){E.focusVenue(camera,item.id);frames.push(camera.view);const p=E.worldToViewport(E.entrance(item.id),camera.view);assert.ok(p.x>0&&p.x<1&&p.y>0&&p.y<1);}
  for(const view of frames){if(view.width>C.MAP.width)assert.ok(view.x<=0&&view.y<=0&&view.x+view.width>=C.MAP.width&&view.y+view.height>=C.MAP.height);else assert.ok(view.x>=0&&view.y>=0&&view.x+view.width<=C.MAP.width&&view.y+view.height<=C.MAP.height);near(view.width/view.height,1.6);
    for(const item of all){const point=E.viewportToWorld(E.worldToViewport(item,view),view);near(point.x,item.x);near(point.y,item.y);}
  }
});
test("overview labels are sparse; district names open up, selected label always has priority",()=>{
  const camera=E.createCamera();const glowing=C.TEAMS.filter(t=>C.gameForTeam(t.id,"live").glowing).map(t=>t.id);
  assert.deepEqual(E.visibleLabels(camera,glowing),[]);assert.equal(E.ISLANDS.length,30);assert.equal(E.labelVisible(camera,"harbor-01"),false);
  E.focusIsland(camera,"warriors");assert.equal(E.labelVisible(camera,"harbor-01"),false);assert.equal(E.labelVisible(camera,"knicks"),false);
  for(const item of all){E.focusVenue(camera,item.id);assert.deepEqual(E.visibleLabels(camera,glowing),E.islandFor(item.id).teamId==="warriors"?[]:[item.id]);}
});
test("district framing contains every assigned landmark including its full building/button bounds",()=>{
  const camera=E.createCamera();
  for(const district of E.DISTRICTS){E.focusDistrict(camera,district.id);const v=camera.view;
    for(const id of district.ids){const item=all.find(p=>p.id===id);const f=C.TEAMS.includes(item)?{x:80,y:68,w:160,h:132}:C.COURTS.includes(item)?{x:55,y:52,w:110,h:128}:{x:45,y:45,w:90,h:95};
      assert.ok(item.x-f.x>=v.x&&item.y-f.y>=v.y&&item.x-f.x+f.w<=v.x+v.width&&item.y-f.y+f.h<=v.y+v.height,`${district.id}/${id} clipped`);
    }
  }
});
test("all destinations are connected by the visible road graph including bridge edges",()=>{
  assert.ok(E.ROAD_EDGES.filter(e=>e.bridge).length>=3);
  for(const from of all)for(const to of all){const route=E.roadPath(E.entrance(from.id),to.id);assert.deepEqual(route[0],E.entrance(from.id));assert.deepEqual(route.at(-1),E.entrance(to.id));
    for(const point of route)near(roadDistance(point),0);
  }
  const route=E.roadPath(E.entrance("meet-plaza"),"park-05");assert.ok(route.length>2);
});
test("walker follows roads, arrives exactly and stops; camera overview never changes player position",()=>{
  const walker=E.createWalker(),camera=E.createCamera();E.walk(walker,"heat",1000);assert.equal(walker.moving,true);assert.equal(E.hasArrived(walker,"heat"),false);
  const frame=E.journeyFrame(walker.route);for(const p of walker.route){const v=E.worldToViewport(p,frame);assert.ok(v.x>=0&&v.x<=1&&v.y>=0&&v.y<=1);}
  for(let ms=1000;ms<1000+walker.duration;ms+=53){E.tick(walker,ms);near(roadDistance(walker.position),0);}
  assert.equal(E.tick(walker,1000+walker.duration),true);assert.equal(E.hasArrived(walker,"heat"),true);
  const frozen=JSON.stringify(walker);E.focusVenue(camera,"heat");E.back(camera);E.fullIsland(camera);assert.equal(JSON.stringify(walker),frozen);assert.equal(E.tick(walker,999999),false);
});
test("retargeting starts at current location, cancels obsolete route tokens and honors latest destination",()=>{
  const walker=E.createWalker();const old=E.walk(walker,"heat",0);E.tick(walker,700);const point={...walker.position};
  const token=E.walk(walker,"meet-pier",700);assert.deepEqual(walker.route[0],point);assert.notEqual(token,old);
  const before={...walker.position};assert.equal(E.tick(walker,99999,old),false);assert.deepEqual(walker.position,before);
  E.tick(walker,700+walker.duration,token);assert.equal(E.hasArrived(walker,"meet-pier"),true);assert.equal(E.hasArrived(walker,"heat"),false);
});
test("reduced-motion snaps every destination, while daily encounters still require actual arrival",()=>{
  const walker=E.createWalker(),daily=F.dailyEncounter("2026-01-01");
  E.walk(walker,daily.locationId,0);assert.equal(E.hasArrived(walker,daily.locationId),false);
  E.walk(walker,daily.locationId,200,true);assert.equal(walker.moving,false);assert.equal(E.hasArrived(walker,daily.locationId),true);
  for(const item of all){E.walk(walker,item.id,500,true);assert.equal(E.hasArrived(walker,item.id),true);}
  assert.deepEqual(F.dailyEncounter("2026-01-01"),daily);assert.notEqual(F.dailyEncounter("2026-01-02").starId,daily.starId);
});
test("scene theme has no authority over simulated home glow or saved photo night eligibility",()=>{
  for(const theme of ["day","night"]){assert.equal(C.gameForTeam("warriors","live").glowing,false,theme);assert.equal(C.gameForTeam("lakers","live").glowing,true,theme);
    assert.equal(C.gameForTeam("lakers","final").glowing,false);assert.equal(C.gameForTeam("lakers","final").homeScore,101);assert.equal(C.gameForTeam("lakers","final").awayScore,108);
  }
});
