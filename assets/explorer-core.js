/* W09/W11：純資料的鏡頭、路網與行走模型；不依賴 DOM 或網路。 */
(function(root,factory){
  const api=factory(typeof module==="object"&&module.exports?require("./island-core.js"):root.NBAIsland);
  if(typeof module==="object"&&module.exports)module.exports=api;else root.NBAExplorer=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Island){
  "use strict";
  const {MAP,TEAMS,COURTS,ENCOUNTERS}=Island;
  const A=typeof module==="object"&&module.exports?require("./archipelago-core.js"):globalThis.NBAArchipelago;
  const Pixel=typeof module==="object"&&module.exports?require("./pixel-core.js"):globalThis.NBAPixel;
  const DISTRICTS=[
  {
    "id": "west",
    "name": "西岸海灣・洛城"
  },
  {
    "id": "desert",
    "name": "西南沙漠"
  },
  {
    "id": "highland",
    "name": "西部高地"
  },
  {
    "id": "south",
    "name": "內陸・南部街區"
  },
  {
    "id": "north",
    "name": "北部林地"
  },
  {
    "id": "lakes",
    "name": "五大湖岸"
  },
  {
    "id": "east",
    "name": "東岸街廓"
  },
  {
    "id": "coast",
    "name": "南端海濱"
  }
];
  const Sights=typeof module==="object"&&module.exports?require("./sights-core.js"):globalThis.NBASights;
  const Memory=typeof module==='object'&&module.exports?require('./memory-core.js'):globalThis.NBAMemory;
  const Shop=typeof module==='object'&&module.exports?require('./shop-core.js'):globalThis.NBAShop;
  const landmarks=[...TEAMS,...COURTS,...ENCOUNTERS,...Sights.SIGHTS,...Memory.ENTRANCES,...Shop.SHOPS];
  // 空水面標籤，避開屋頂徽章與跨海路網；不是球隊島中心或移動目的地。
  const regionLabels={west:[100,1325,'西岸'],desert:[700,1400,'西南'],highland:[1450,-50,'山區'],south:[1300,1950,'中南'],north:[2275,75,'北境'],lakes:[2050,1075,'湖區'],east:[3075,300,'東岸'],coast:[3275,1950,'東南']};
  for(const district of DISTRICTS){
    const [x,y,short]=regionLabels[district.id];district.label={x,y,short};
    district.ids=[...TEAMS,...COURTS,...ENCOUNTERS].filter(p=>A.owner(p.id).district===district.id).map(p=>p.id);
    const members=landmarks.filter(p=>A.owner(p.id)?.district===district.id);
    const xs=members.flatMap(p=>[p.x-(p.width||160)/2,p.x+(p.width||160)/2]),ys=members.flatMap(p=>[p.y-(p.height||136),p.y+70]);
    district.center={x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2};
    district.width=Math.min(MAP.width,Math.max(720,Math.max(...xs)-Math.min(...xs)+140,(Math.max(...ys)-Math.min(...ys)+140)*MAP.width/MAP.height));
  }
  const districtFor=id=>DISTRICTS.find(d=>d.id===A.owner(id)?.district)||null;
  const islandFor=id=>A.owner(id);
  const entrance=id=>{const item=landmarks.find(p=>p.id===id);if(!item||Sights.get(id)&&!item.photo)throw new Error('Unknown destination');return {...item.entrance};};
  const ROAD_NODES=A.ROAD_NODES,ROAD_EDGES=A.ROAD_EDGES;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function edgeClear(edge){
    if(edge.islandId!=='island-warriors')return true;
    const a=ROAD_NODES[edge.from],b=ROAD_NODES[edge.to],steps=Math.ceil(distance(a,b)/3);
    for(let n=0;n<=steps;n++){const t=steps?n/steps:0;if(!A.bayClear({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}))return false;}return true;
  }
  function roadPath(start,targetId){
    if(!ROAD_NODES[targetId])throw new Error("Unknown destination");
    // 轉向時先走回目前道路的最近端點，避免穿越街區或水面抄近路。
    let first=null,projection=null,best=Infinity;
    for(const edge of ROAD_EDGES){
      if(!edgeClear(edge))continue;
      const a=ROAD_NODES[edge.from],b=ROAD_NODES[edge.to],dx=b.x-a.x,dy=b.y-a.y;
      if(!dx&&!dy)continue;
      const t=Math.max(0,Math.min(1,((start.x-a.x)*dx+(start.y-a.y)*dy)/(dx*dx+dy*dy)));
      const p={x:a.x+t*dx,y:a.y+t*dy},cost=distance(start,p);
      if(cost<best){best=cost;projection=p;first=edge;}
    }
    const costs={},previous={},pending=new Set(Object.keys(ROAD_NODES));
    for(const id of pending)costs[id]=Infinity;
    costs[first.from]=distance(start,projection)+distance(projection,ROAD_NODES[first.from]);
    costs[first.to]=distance(start,projection)+distance(projection,ROAD_NODES[first.to]);
    while(pending.size){
      const id=[...pending].sort((a,b)=>costs[a]-costs[b])[0];pending.delete(id);
      if(id===targetId)break;
      for(const edge of ROAD_EDGES){const next=edge.from===id?edge.to:edge.to===id?edge.from:null;
        if(!next||!pending.has(next)||!edgeClear(edge))continue;
        const cost=costs[id]+distance(ROAD_NODES[id],ROAD_NODES[next]);
        if(cost<costs[next]){costs[next]=cost;previous[next]=id;}
      }
    }
    if(!Number.isFinite(costs[targetId]))throw new Error('No clear pedestrian route');
    const ids=[targetId];while(previous[ids[0]])ids.unshift(previous[ids[0]]);
    const points=[{...start},projection,...ids.map(id=>({...ROAD_NODES[id]}))];
    return points.filter((p,i)=>!i||distance(p,points[i-1])>.01);
  }
  function frame(center,width){
    const height=width*MAP.height/MAP.width;
    return {x:Math.max(0,Math.min(MAP.width-width,center.x-width/2)),y:Math.max(0,Math.min(MAP.height-height,center.y-height/2)),width,height};
  }
  function journeyFrame(route){
    const xs=route.map(p=>p.x),ys=route.map(p=>p.y);
    const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
    return frame({x:(left+right)/2,y:(top+bottom)/2},Math.min(MAP.width,Math.max(720,right-left+220,(bottom-top+150)*MAP.width/MAP.height)));
  }
  // 總覽保留額外海面，讓北側屋頂上方的 20–22px 隊徽在手機也不會被裁掉。
  const OVERVIEW_VIEW=Object.freeze({x:-150,y:-187.5,width:3900,height:2437.5});
  function arenaLogoAnchor(team){const [x,y]=Pixel.arenaBranding(team).roof;return {x:team.x+x*2-80,y:team.y+y*2-68};}
  function overviewLogoOffset(team,viewportWidth,size=22){return team.id==='pistons'?Math.max(0,(A.ROAD_NODES['bridge-raptors'].x-arenaLogoAnchor(team).x)*viewportWidth/OVERVIEW_VIEW.width+size/2+2):0;}
  function overviewLogoRect(team,viewportWidth,size=22){const anchor=worldToViewport(arenaLogoAnchor(team),OVERVIEW_VIEW),scale=viewportWidth/OVERVIEW_VIEW.width;return {x:anchor.x*viewportWidth-size/2+overviewLogoOffset(team,viewportWidth,size),y:(arenaLogoAnchor(team).y-OVERVIEW_VIEW.y)*scale-size,width:size,height:size};}
  function createCamera(){return {level:"island",districtId:null,islandId:null,selectedId:"warriors",view:{...OVERVIEW_VIEW}};}
  function focusIsland(camera,id){const island=A.getIsland(id);if(!island)throw new Error('Unknown island');camera.level='district';camera.islandId=island.id;camera.districtId=island.district;camera.view=island.teamId==='warriors'?{...A.BAY.camera}:frame({x:island.x+10,y:island.y+5},660);return camera;}
  function focusDistrict(camera,id){if(A.getIsland(id))return focusIsland(camera,id);const district=DISTRICTS.find(d=>d.id===id);if(!district)throw new Error('Unknown district');camera.level='district';camera.islandId=null;camera.districtId=id;camera.view=frame(district.center,district.width);return camera;}
  function focusVenue(camera,id){const district=districtFor(id);if(!district)throw new Error('Unknown venue');camera.level='venue';camera.districtId=district.id;camera.islandId=A.owner(id).id;camera.selectedId=id;camera.view=camera.islandId==='island-warriors'?{...A.BAY.camera}:frame({x:A.owner(id).x+10,y:A.owner(id).y+12},560);return camera;}
  function fullIsland(camera){camera.level='island';camera.view={...OVERVIEW_VIEW};return camera;}
  function back(camera){return camera.level==='venue'?focusIsland(camera,camera.islandId):fullIsland(camera);}
  function worldToViewport(point,view){return {x:(point.x-view.x)/view.width,y:(point.y-view.y)/view.height};}
  function viewportToWorld(point,view){return {x:view.x+point.x*view.width,y:view.y+point.y*view.height};}
  function interactiveVisible(camera,id,position=null){
    const item=landmarks.find(p=>p.id===id);if(!item)return false;
    if(Shop.getShop(id))return camera.level!=='island'&&camera.islandId===item.islandId;
    if(Memory.get(id))return Memory.hintVisible(camera,item,position);
    if(camera.level==='island')return TEAMS.includes(item);
    if(camera.islandId?A.owner(id).id!==camera.islandId:districtFor(id)?.id!==camera.districtId)return false;
    if(camera.islandId==='island-warriors'&&id==='meet-pier')return true;
    if(TEAMS.includes(item)||COURTS.includes(item)||id===camera.selectedId)return true;
    const p=item.entrance||item;return Boolean(position&&distance(position,p)<90);
  }
  function labelVisible(camera,id,glowing=false,position=null){
    if(camera.islandId==='island-warriors')return false;
    if(camera.level==='island')return false;
    if(camera.level==='district'&&!camera.islandId&&TEAMS.some(t=>t.id===id))return false;
    if(!interactiveVisible(camera,id,position))return false;
    if(id===camera.selectedId)return true;
    return camera.level==='district'&&(TEAMS.some(p=>p.id===id)||COURTS.some(p=>p.id===id)||Boolean(position&&distance(position,landmarks.find(p=>p.id===id).entrance||landmarks.find(p=>p.id===id))<90));
  }
  function visibleLabels(camera,glowingIds=[],position=null){
    const candidates=landmarks.filter(p=>!Memory.get(p.id)&&!Shop.getShop(p.id)&&labelVisible(camera,p.id,glowingIds.includes(p.id),position));
    candidates.sort((a,b)=>Number(b.id===camera.selectedId)-Number(a.id===camera.selectedId)||Number(glowingIds.includes(b.id))-Number(glowingIds.includes(a.id)));
    const boxes=[],ids=[];
    for(const item of candidates){
      const court=COURTS.some(c=>c.id===item.id),width=Math.min(170,Math.max(105,item.name.length*11));
      const point=Sights.get(item.id)?.entrance||item;
      const box={x:point.x-width/2,y:point.y+(Sights.get(item.id)?-28:court?35:38),w:width,h:court?37:24};
      if(boxes.some(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y))continue;
      boxes.push(box);ids.push(item.id);
    }
    return ids;
  }
  function createWalker(id="warriors"){return {position:entrance(id),locationId:id,targetId:id,direction:"se",frame:0,moving:false,route:[],startedAt:0,duration:0,token:0};}
  function walk(walker,id,now,reducedMotion=false){
    // 先採樣舊路線，再以最新位置重新規劃，舊 token 不得完成新的行程。
    tick(walker,now);walker.token++;walker.targetId=id;walker.route=roadPath(walker.position,id);
    const length=walker.route.slice(1).reduce((n,p,i)=>n+distance(walker.route[i],p),0);
    walker.frame=0;const last=walker.route.at(-1),before=walker.route.at(-2);if(before)walker.direction=Pixel.direction(last.x-before.x,last.y-before.y,walker.direction);
    walker.startedAt=now;walker.duration=Math.max(350,Math.min(4200,length*3));walker.moving=length>.01;
    if(reducedMotion||!walker.moving){walker.position=entrance(id);walker.locationId=id;walker.moving=false;}
    return walker.token;
  }
  function tick(walker,now,token=walker.token){
    if(token!==walker.token||!walker.moving)return false;
    const fraction=Math.max(0,Math.min(1,(now-walker.startedAt)/walker.duration));
    const lengths=walker.route.slice(1).map((p,i)=>distance(walker.route[i],p));
    let remaining=lengths.reduce((a,b)=>a+b,0)*fraction;
    for(let i=0;i<lengths.length;i++){
      if(remaining<=lengths[i]){const a=walker.route[i],b=walker.route[i+1],t=lengths[i]?remaining/lengths[i]:0;walker.direction=Pixel.direction(b.x-a.x,b.y-a.y,walker.direction);walker.frame=Math.floor((now-walker.startedAt)/Pixel.SPEC.frameMs)%4;walker.position={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};break;}
      remaining-=lengths[i];
    }
    if(fraction===1){walker.position=entrance(walker.targetId);walker.locationId=walker.targetId;walker.moving=false;walker.frame=0;return true;}
    return false;
  }
  const hasArrived=(walker,id)=>!walker.moving&&walker.locationId===id&&distance(walker.position,entrance(id))<.01;
  function nearestBayInteraction(camera,walker){
    if(camera.level==='island'||camera.islandId!=='island-warriors'||walker.moving)return null;
    const eligible=A.BAY.entrances.map(id=>({id,distance:distance(walker.position,entrance(id)),name:A.BAY.prompts[id]})).filter(p=>p.distance<=A.BAY.radii[p.id]);
    return eligible.sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id))[0]||null;
  }
  return {edgeClear,nearestBayInteraction,OVERVIEW_VIEW,arenaLogoAnchor,overviewLogoOffset,overviewLogoRect,ISLANDS:A.ISLANDS,islandFor,focusIsland,interactiveVisible,DISTRICTS,ROAD_NODES,ROAD_EDGES,districtFor,entrance,roadPath,journeyFrame,createCamera,focusDistrict,focusVenue,fullIsland,back,worldToViewport,viewportToWorld,labelVisible,visibleLabels,createWalker,walk,tick,hasArrived};
});
