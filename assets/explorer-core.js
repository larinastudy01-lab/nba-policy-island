/* W09/W11：純資料的鏡頭、路網與行走模型；不依賴 DOM 或網路。 */
(function(root,factory){
  const api=factory(typeof module==="object"&&module.exports?require("./island-core.js"):root.NBAIsland);
  if(typeof module==="object"&&module.exports)module.exports=api;else root.NBAExplorer=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Island){
  "use strict";
  const {MAP,TEAMS,COURTS,ENCOUNTERS}=Island;
  const Pixel=typeof module==="object"&&module.exports?require("./pixel-core.js"):globalThis.NBAPixel;
  const DISTRICTS=[
    {id:"west",name:"西岸海灣・洛城",label:{x:250,y:605},center:{x:420,y:460},width:1100,ids:["warriors","lakers","clippers","harbor-01","meet-pier"]},
    {id:"desert",name:"西南沙漠",label:{x:480,y:606},center:{x:500,y:745},width:720,ids:["suns","harbor-02","harbor-03"]},
    {id:"highland",name:"西部高地",label:{x:530,y:290},center:{x:560,y:330},width:720,ids:["nuggets","park-01","park-03"]},
    {id:"south",name:"內陸・南部街區",label:{x:745,y:590},center:{x:805,y:660},width:1040,ids:["thunder","mavericks","spurs","park-04","harbor-04","meet-plaza"]},
    {id:"north",name:"北部林地",label:{x:805,y:135},center:{x:820,y:250},width:720,ids:["timberwolves","park-02","roof-01","roof-05"]},
    {id:"lakes",name:"五大湖岸",label:{x:1150,y:442},center:{x:1110,y:408},width:930,ids:["bucks","bulls","raptors","park-05","roof-02","meet-garden"]},
    {id:"east",name:"東岸街廓",label:{x:1385,y:405},center:{x:1335,y:475},width:1000,ids:["celtics","knicks","sixers","roof-03"]},
    {id:"coast",name:"南端海濱",label:{x:1275,y:790},center:{x:1245,y:800},width:720,ids:["heat","harbor-05","roof-04"]}
  ];
  const Sights=typeof module==="object"&&module.exports?require("./sights-core.js"):globalThis.NBASights;
  const landmarks=[...TEAMS,...COURTS,...ENCOUNTERS,...Sights.SIGHTS];
  const districtFor=id=>DISTRICTS.find(d=>d.ids.includes(id)||Sights.get(id)?.district===d.id)||null;
  const entrance=id=>{const item=landmarks.find(p=>p.id===id);if(!item||Sights.get(id)&&!item.photo)throw new Error("Unknown destination");if(item.entrance)return {...item.entrance};return {x:item.x+48,y:item.y+26};};
  // 入口就是路網節點；跨水道的三段道路另標示為橋。ID 不影響既有邀請網址。
  const ROAD_NODES=Object.fromEntries(landmarks.filter(item=>!Sights.get(item.id)||item.photo).map(item=>[item.id,entrance(item.id)]));
  Object.assign(ROAD_NODES,{"bay-junction":{x:323,y:432},"bay-shore":{x:299,y:573},"pier-approach":{x:280,y:645},"bridge-west-walk":{x:145,y:330},"bridge-east-walk":{x:353,y:192},"bay-north-walk":{x:379,y:256}});
  const chains=[
    ["warriors","bay-junction","lakers","harbor-01","harbor-02","spurs","harbor-04","heat","harbor-05","roof-03","knicks","celtics","raptors","roof-01","timberwolves","park-02","nuggets","warriors"],
    ["lakers","clippers","suns","mavericks","thunder","nuggets"],
    ["mavericks","spurs"],["mavericks","meet-plaza","bulls","bucks","raptors"],
    ["meet-plaza","park-05","roof-04","heat"],["bulls","roof-02","knicks"],
    ["park-05","meet-garden","sixers","harbor-05"],
    ["bay-junction","bay-shore","pier-approach","meet-pier","harbor-01"],["harbor-02","harbor-03"],["nuggets","park-01"],
    ["park-02","park-03","park-04","meet-plaza"],["timberwolves","roof-05","bulls"],
    ["meet-plaza","thunder"],
    ["warriors","bay-north-walk","bridge-east-walk","sight-golden-gate","bridge-west-walk","bay-shore"],
    ["meet-pier","sight-santa-monica","lakers"],["bulls","sight-cloud-gate","meet-garden"],["roof-03","sight-liberty","knicks"]
  ];
  const bridgePairs=["meet-plaza|park-05","bulls|roof-02","harbor-04|heat","harbor-01|meet-pier","sight-golden-gate|bridge-east-walk"];
  const ROAD_EDGES=chains.flatMap(chain=>chain.slice(1).map((id,i)=>({from:chain[i],to:id,bridge:bridgePairs.includes(chain[i]+"|"+id)||bridgePairs.includes(id+"|"+chain[i]),surface:["meet-pier","pier-approach"].includes(chain[i])||id==="meet-pier"?"wood":"stone"})));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function roadPath(start,targetId){
    if(!ROAD_NODES[targetId])throw new Error("Unknown destination");
    // 轉向時先走回目前道路的最近端點，避免穿越街區或水面抄近路。
    let first=null,projection=null,best=Infinity;
    for(const edge of ROAD_EDGES){
      const a=ROAD_NODES[edge.from],b=ROAD_NODES[edge.to],dx=b.x-a.x,dy=b.y-a.y;
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
        if(!next||!pending.has(next))continue;
        const cost=costs[id]+distance(ROAD_NODES[id],ROAD_NODES[next]);
        if(cost<costs[next]){costs[next]=cost;previous[next]=id;}
      }
    }
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
  function createCamera(){return {level:"island",districtId:null,selectedId:"warriors",view:frame({x:800,y:500},1600)};}
  function focusDistrict(camera,id){const district=DISTRICTS.find(d=>d.id===id);if(!district)throw new Error("Unknown district");camera.level="district";camera.districtId=id;camera.view=frame(district.center,district.width);return camera;}
  function focusVenue(camera,id){const district=districtFor(id);if(!district)throw new Error("Unknown venue");camera.level="venue";camera.districtId=district.id;camera.selectedId=id;camera.view=frame(Sights.get(id)&&!Sights.get(id).photo?Sights.get(id):entrance(id),520);return camera;}
  function fullIsland(camera){camera.level="island";camera.view=frame({x:800,y:500},1600);return camera;}
  function back(camera){return camera.level==="venue"?focusDistrict(camera,camera.districtId):fullIsland(camera);}
  function worldToViewport(point,view){return {x:(point.x-view.x)/view.width,y:(point.y-view.y)/view.height};}
  function viewportToWorld(point,view){return {x:view.x+point.x*view.width,y:view.y+point.y*view.height};}
  function labelVisible(camera,id,glowing=false){
    if(id===camera.selectedId)return true;
    if(camera.level==="island")return glowing&&["lakers","bucks","celtics"].includes(id)||["sight-golden-gate","sight-liberty"].includes(id);
    if(camera.level==="venue")return false;
    return districtFor(id)?.id===camera.districtId;
  }
  function visibleLabels(camera,glowingIds=[]){
    const candidates=landmarks.filter(p=>labelVisible(camera,p.id,glowingIds.includes(p.id)));
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
  return {DISTRICTS,ROAD_NODES,ROAD_EDGES,districtFor,entrance,roadPath,journeyFrame,createCamera,focusDistrict,focusVenue,fullIsland,back,worldToViewport,viewportToWorld,labelVisible,visibleLabels,createWalker,walk,tick,hasArrived};
});
