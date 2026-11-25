/* W08/W12：一個 world 容器承載地形、路網、建築、點擊區及角色。 */
(function(root){
  "use strict";
  function initialize({getSelection,getGameState,getEncounter,getBayFixture=()=>"away",onPosition,onAnnounce,onView}){
    const A=root.NBAArchipelago,E=root.NBAExplorer,C=root.NBAIsland,P=root.NBAPixel,$=id=>document.getElementById(id);
    const camera=E.createCamera(),walker=E.createWalker();
    const motion=window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const B=root.NBABay,crowd=B.createCrowd(),npcNodes=new Map();
    const S=root.NBASights,T=root.NBATraffic,traffic=T.createTraffic(),carNodes=new Map();
    const places=[...C.TEAMS,...C.COURTS,...C.ENCOUNTERS,...S.SIGHTS,...root.NBAMemory.ENTRANCES,...root.NBAShop.SHOPS];
    for(const car of T.CARS){const node=document.createElement("span");node.id=car.id;node.className="island-car";node.dataset.model=car.id;node.dataset.parked=String(car.parked);node.setAttribute("title",`${car.name}｜${car.feature}`);
      const beam=document.createElement("span");beam.className="car-headlight";const image=document.createElement("img");image.alt="";image.width=130;image.height=100;node.append(beam,image);$("traffic-layer").append(node);carNodes.set(car.id,{node,image,beam});}
    let timer=null,theme="day",actorKey=null,arrivalFocus=null,pageHidden=false,mapVisible=true,visibilityObserver=null,lastFrame=Date.now();
    for(const person of B.PEOPLE){const node=document.createElement("span");node.id=`npc-${person.id}`;node.className="sim-pedestrian";node.dataset.look=person.look;node.dataset.pixelModel=person.pixelModel;
      const body=document.createElement("span");body.className="npc-body";body.innerHTML=B.npcSVG(person,root.NBAFan);node.append(body);$("npc-layer").append(node);npcNodes.set(person.id,{node,body});}
    const actorFigure=document.createElement("span");actorFigure.className="actor-silhouette";actorFigure.setAttribute("aria-hidden","true");$("island-encounter-actor").append(actorFigure);
    const svgNS="http://www.w3.org/2000/svg";
    const districtButtons=new Map();
    const regionButtons=new Map();
    const paths=document.createElementNS(svgNS,"svg");paths.setAttribute("viewBox",`0 0 ${C.MAP.width} ${C.MAP.height}`);paths.setAttribute("aria-hidden","true");paths.classList.add("island-roads");
    paths.innerHTML=['pixel-day','pixel-night'].map((kind,i)=>'<image class="'+kind+'" href="./assets/pixel/roads'+(i?'-night':'')+'.png" width="'+C.MAP.width+'" height="'+C.MAP.height+'"/>').join('');
    $("road-layer").append(paths);
    // 用 DOM 建立路線節點，避免依賴解析 innerHTML 的全域 ID 副作用。
    const route=document.createElementNS(svgNS,"polyline");route.setAttribute("fill","none");route.setAttribute("stroke","#f6d57f");route.setAttribute("stroke-width","3");route.setAttribute("stroke-dasharray","8 9");paths.append(route);
    for(const district of A.ISLANDS){
      const team=C.TEAMS.find(t=>t.id===district.teamId);district.name=team.shortName+"島";district.label={x:district.x,y:district.y-128};
      const button=document.createElement("button");button.type="button";button.id=`district-${district.id}`;button.className="district-label";
      button.style.left=`${district.label.x/C.MAP.width*100}%`;button.style.top=`${district.label.y/C.MAP.height*100}%`;
      button.textContent=district.name;button.dataset.team=team.id;button.setAttribute("aria-label",`探索${district.name}街區`);button.setAttribute("aria-controls","island-map");
      button.addEventListener("click",()=>districtView(district.id));$("district-layer").append(button);districtButtons.set(district.id,button);
      const option=document.createElement("option");option.value=district.id;option.textContent=team.name+"島";$("district-select").append(option);
    }
    for(const d of E.DISTRICTS){const option=document.createElement("option");option.value=d.id;option.textContent="區域｜"+d.name;$("district-select").append(option);
      const button=document.createElement("button");button.id=`region-${d.id}`;button.type="button";button.className="region-label";button.style.left=d.label.x/C.MAP.width*100+"%";button.style.top=d.label.y/C.MAP.height*100+"%";button.setAttribute("title",d.name);button.setAttribute("aria-controls","island-map");button.addEventListener("click",()=>districtView(d.id));$("region-layer").append(button);regionButtons.set(d.id,button);
    }
    function stop(){if(timer!==null){clearInterval(timer);timer=null;}}
    function renderCamera(){
      const {view,level}=camera,scale=C.MAP.width/view.width;
      $("island-world").style.transform=`translate(${-view.x/view.width*100}%, ${-view.y/view.height*100}%) scale(${scale})`;
      $("island-world").style.setProperty("--camera-scale",String(scale));
      $("island-map").dataset.view=level;$("island-map").dataset.district=camera.districtId||"";
      $("island-map").dataset.selected=camera.selectedId;$("island-map").dataset.teamIsland=camera.islandId||"";
      $("district-select").value=level==="island"?"":camera.islandId||camera.districtId;
      const district=A.getIsland(camera.islandId)||E.DISTRICTS.find(d=>d.id===camera.districtId);
      const item=places.find(p=>p.id===camera.selectedId);
      $("camera-location").textContent=level==="island"?"全島總覽":level==="district"?district.name:`${district.name} / ${item?.name||"場館入口"}`;
      $("camera-back").disabled=level==="island";$("camera-back").textContent=level==="venue"?"← 回球隊島":"← 回全島";
      $("camera-overview").setAttribute("aria-pressed",String(level==="island"));
      for(const [id,button] of districtButtons){button.hidden=!(level==="district"&&!camera.islandId&&A.getIsland(id).district===camera.districtId);button.setAttribute("aria-pressed",String(camera.islandId===id));}
      for(const button of regionButtons.values())button.hidden=level!=="island";
      refreshLabels();
      refreshEncounter();renderCrowd();renderTraffic();syncLoop();onView?.(camera);
    }
    function refreshLabels(){
      const glowingIds=C.TEAMS.filter(item=>C.gameForTeam(item.id,getGameState(),getBayFixture()).glowing).map(item=>item.id);
      for(const d of E.DISTRICTS){const teams=C.TEAMS.filter(t=>A.owner(t.id).district===d.id),live=teams.filter(t=>glowingIds.includes(t.id)).length;const b=regionButtons.get(d.id);b.textContent=`${d.label.short} ${teams.length}`;b.dataset.live=String(live>0);b.setAttribute("aria-label",`${d.name}，${teams.length} 座球隊島，點擊顯示隊名${live?"，模擬 LIVE "+live+" 場":""}`);}
      const visible=new Set(E.visibleLabels(camera,glowingIds,walker.position));
      for(const [id,button] of districtButtons){const team=C.TEAMS.find(t=>t.islandId===id);const live=glowingIds.includes(team.id);button.textContent=team.shortName+"島"+(live?" · LIVE":"");button.dataset.live=String(live);button.setAttribute("aria-label",team.name+"島，探索主場"+(live?"，模擬 LIVE":""));}
      for(const [kind,items] of [["nba",C.TEAMS],["court",C.COURTS],["encounter",C.ENCOUNTERS],["sight",S.SIGHTS]])for(const item of items){
        const node=$(`landmark-${item.id}`);if(!node)continue;
        node.dataset.label=String(visible.has(item.id));node.dataset.interactive=String(E.interactiveVisible(camera,item.id,walker.position));
        if(kind==="nba"){
          const sign=$("arena-logo-"+item.id),show=camera.level!=="island"&&camera.islandId===item.islandId;
          sign.hidden=!show;node.dataset.showLogo=String(show);
          if(show&&!sign.children.length)sign.append(root.NBATeamLogo.create(item,{variant:"sign",eager:true}));
        }
        // 全部場地仍可用清單與鍵盤進入；Tab 聚焦時把該地標帶進鏡頭。
      }
    }
    function refreshEncounter(){
      const daily=getEncounter(),selected=getSelection();
      const local=camera.level!=="island"&&(camera.islandId?camera.islandId===A.owner(daily.locationId).id:camera.districtId===E.districtFor(daily.locationId)?.id);
      $("district-clue").hidden=!local;
      $("district-clue").textContent=local?({"meet-pier":"今日線索：海邊觀景平台，有位熟悉的籃球好手正在吹風。","meet-plaza":"今日線索：廣場步道附近，好像有人正抱著球散步。","meet-garden":"今日線索：湖岸樹蔭下，似乎有位熟悉的身影在休息。"}[daily.locationId]):"";
      const visible=selected.kind==="encounter"&&selected.id===daily.locationId&&E.hasArrived(walker,daily.locationId);
      const actor=$("island-encounter-actor");actor.hidden=!visible;
      if(visible){const p=E.entrance(daily.locationId);actor.style.left=`${(p.x-44)/C.MAP.width*100}%`;actor.style.top=`${(p.y-22)/C.MAP.height*100}%`;
        const key=`${daily.date}:${daily.starId}:${daily.locationId}`;
        if(key!==actorKey){actorFigure.innerHTML=root.NBAFan.starSVG(daily.teamId);actorKey=key;}
        const revealed=$("encounter-character").dataset.revealed==="true";actor.dataset.revealed=String(revealed);
        $("island-actor-label").textContent=revealed?root.NBAFan.getStar(daily.starId).starName:"附近有熟悉的身影";
        actor.setAttribute("aria-label",revealed?"已揭曉代表球星，開啟合影資訊":"附近有熟悉的身影，點擊揭曉球星");
      }
    }
    function renderWalker(){
      $("fan-map-marker").dataset.moving=String(walker.moving);
      const status=walker.moving?`沿道路前往${places.find(p=>p.id===walker.targetId)?.name||"目的地"}…`:`已抵達 ${places.find(p=>p.id===walker.locationId)?.name||"島上"}`;
      if($("movement-status").textContent!==status)$("movement-status").textContent=status;
      route.setAttribute("points",walker.moving?walker.route.map(p=>`${p.x},${p.y}`).join(" "):"");
      onPosition?.({...walker.position},walker);refreshLabels();refreshEncounter();
    }
    function nearBay(){return camera.level!=="island"&&(camera.islandId?camera.islandId==="island-warriors":camera.districtId==="west");}
    function crowdActive(){return nearBay()&&mapVisible&&!motion?.matches&&!document.hidden&&!pageHidden;}
    function renderCrowd(delta=0){
      const active=crowdActive(),people=B.advanceCrowd(crowd,delta,C.gameForTeam("warriors",getGameState(),getBayFixture()),{active,reducedMotion:Boolean(motion?.matches),overview:!nearBay()});
      $("island-map").dataset.crowdActive=String(active);$("island-map").dataset.crowdMode=crowd.mode;
      const message=`模擬路人・非真人玩家｜${{ambient:"灣區散步（勇士客場不觸發進散場）",enter:"勇士主場進場動線",live:"主場進行中・少量廣場路人",exit:"勇士主場散場動線"}[crowd.mode]}`;
      if($("crowd-status").textContent!==message)$("crowd-status").textContent=message;
      for(const p of people){const {node,body}=npcNodes.get(p.id);const person=B.PEOPLE.find(item=>item.id===p.id),key=`${p.direction}:${p.frame}:${p.walking}`;if(body.dataset.frameKey!==key){body.dataset.frameKey=key;body.innerHTML=B.npcSVG(person,root.NBAFan,{direction:p.direction,frame:p.frame,walking:p.walking});}node.dataset.direction=p.direction;node.dataset.frame=String(p.frame);node.hidden=!p.visible;node.style.left=`${Math.round(p.x/2)*2/C.MAP.width*100}%`;node.style.top=`${Math.round(p.y/2)*2/C.MAP.height*100}%`;node.style.zIndex=String(Math.round(p.y));node.dataset.walking=String(p.walking);node.dataset.x=String(p.x);node.dataset.y=String(p.y);body.style.transform=`translateY(${p.bob}px) scaleX(${p.facing})`;node.style.setProperty("--ball-bob",`${p.dribble*5}px`);}
    }
    function trafficActive(){return camera.level!=="island"&&T.ROUTES.some(r=>r.district===camera.districtId)&&mapVisible&&!motion?.matches&&!document.hidden&&!pageHidden;}
    function renderTraffic(delta=0){
      const active=trafficActive(),cars=T.advance(traffic,delta,{active,reducedMotion:Boolean(motion?.matches),district:camera.districtId});
      $("island-map").dataset.trafficActive=String(active);
      for(const car of cars){const {node,image,beam}=carNodes.get(car.id);const local=camera.level!=="island"&&car.district===camera.districtId;
        node.hidden=!local&&car.id!=="car-720s"&&car.id!=="car-aventador";node.dataset.overview=String(!local);node.dataset.view=car.view;node.dataset.x=String(car.x);node.dataset.y=String(car.y);node.dataset.heading=String(car.heading);
        node.style.left=`${Math.round(car.x/2)*2/C.MAP.width*100}%`;node.style.top=`${Math.round(car.y/2)*2/C.MAP.height*100}%`;node.style.zIndex=String(Math.round(car.y)+1);
        const src=`./assets/pixel/cars/${car.id}-${car.view}.svg`;if(image.getAttribute("src")!==src){image.setAttribute("src",src);image.src=src;}image.style.transform=`scaleX(${car.flip?-1:1})`;
        const lit=T.headlights(car,theme==="night")&&local;beam.hidden=!lit;node.dataset.headlights=String(lit);beam.style.transform=`translateY(-50%) rotate(${car.heading}rad)`;
      }
      $("traffic-status").textContent=`原創跑車插畫・四台停放、兩台巡遊｜${motion?.matches?"減少動態・靜態車輛":active?"近景車流・轉彎減速":camera.level==="island"?"全島靜態車影":"車流暫停"}${theme==="night"?"・近景巡遊車頭燈開啟":""}`;
    }
    function syncLoop(){if(!document.hidden&&!pageHidden&&(walker.moving||crowdActive()||trafficActive())){if(timer===null){lastFrame=Date.now();timer=setInterval(tick,16);}}else stop();}
    function tick(){const now=Date.now(),delta=Math.max(0,Math.min(100,now-lastFrame));lastFrame=now;const wasMoving=walker.moving,arrived=E.tick(walker,now);if(wasMoving||arrived)renderWalker();renderCrowd(delta);renderTraffic(delta);if(arrived){if(arrivalFocus===walker.token){E.focusVenue(camera,walker.targetId);renderCamera();}onAnnounce?.($("movement-status").textContent);}syncLoop();}
    function visit(id){
      stop();E.focusVenue(camera,id);E.walk(walker,id,Date.now(),Boolean(motion?.matches));arrivalFocus=walker.token;
      if(walker.moving)camera.view=E.journeyFrame(walker.route);
      renderCamera();renderWalker();
      syncLoop();
    }
    function districtView(id){arrivalFocus=null;E.focusDistrict(camera,id);renderCamera();onAnnounce?.(`鏡頭已移至${(A.getIsland(id)||E.DISTRICTS.find(d=>d.id===id)).name}；玩家位置未變。`);}
    $("district-select").addEventListener("change",()=>{if($("district-select").value)districtView($("district-select").value);else{arrivalFocus=null;E.fullIsland(camera);renderCamera();}});
    $("camera-back").addEventListener("click",()=>{arrivalFocus=null;E.back(camera);renderCamera();onAnnounce?.("已返回上一層視角，保留選取與玩家位置。");});
    $("camera-overview").addEventListener("click",()=>{arrivalFocus=null;E.fullIsland(camera);renderCamera();onAnnounce?.(walker.moving?"已回全島，角色繼續原行程。":"已回全島，玩家停留原地。");});
    function setTheme(next){theme=next;$("island-map").dataset.theme=theme;$("map-day").setAttribute("aria-pressed",String(theme==="day"));$("map-night").setAttribute("aria-pressed",String(theme==="night"));$("map-light-status").textContent=theme==="night"?"夜晚・道路與場地照明開啟":"白天・沿路探索島嶼";
      for(const team of C.TEAMS.filter(t=>t.expansion)){const image=$("city-"+team.id);if(image)image.src=`./assets/pixel/cities/${team.id}${theme==="night"?"-night":""}.svg`;}
      for(const item of S.SIGHTS){const node=$(`scenic-art-${item.id}`);if(node)node.src=theme==="night"?item.pixelNightAsset:item.pixelAsset;}const selected=getSelection();if(selected.kind==="sight")$("sight-image").src=theme==="night"?S.get(selected.id).pixelNightAsset:S.get(selected.id).pixelAsset;renderTraffic();}
    $("map-day").addEventListener("click",()=>setTheme("day"));$("map-night").addEventListener("click",()=>setTheme("night"));
    $("island-encounter-actor").addEventListener("click",()=>{const daily=getEncounter();if(!E.hasArrived(walker,daily.locationId)||getSelection().id!==daily.locationId)return;
      $("encounter-character").click();refreshEncounter();$("encounter-star-name").focus();});
    motion?.addEventListener?.("change",()=>{if(motion.matches&&walker.moving){const focus=arrivalFocus===walker.token;stop();E.walk(walker,walker.targetId,Date.now(),true);renderWalker();if(focus){E.focusVenue(camera,walker.targetId);renderCamera();}}renderCrowd();renderTraffic();syncLoop();});
    window.addEventListener("pagehide",()=>{pageHidden=true;stop();visibilityObserver?.disconnect();});
    window.addEventListener("pageshow",event=>{if(event.persisted){pageHidden=false;lastFrame=Date.now();visibilityObserver?.observe($("island-map"));tick();}});
    document.addEventListener?.("visibilitychange",()=>{lastFrame=Date.now();if(document.hidden)stop();else tick();});
    if(typeof window.IntersectionObserver==="function"){visibilityObserver=new window.IntersectionObserver(entries=>{mapVisible=entries.some(entry=>entry.isIntersecting);lastFrame=Date.now();renderCrowd();renderTraffic();syncLoop();},{threshold:.05});visibilityObserver.observe($("island-map"));}
    renderCamera();setTheme("day");renderWalker();
    $("encounter-star-name").setAttribute("tabindex","-1");
    return {visit,districtView,inspect:id=>{arrivalFocus=null;E.focusVenue(camera,id);renderCamera();},refreshLabels,refreshEncounter,refreshScene:()=>{refreshLabels();renderCrowd();renderTraffic();syncLoop();},backToDistrict:()=>districtView(camera.islandId||A.owner(getSelection().id).id),focusOnly:id=>{arrivalFocus=null;E.focusVenue(camera,id);renderCamera();},
      position:()=>({...walker.position,locationId:walker.locationId,targetId:walker.targetId,direction:walker.direction,frame:walker.frame,moving:walker.moving}),hasArrived:id=>E.hasArrived(walker,id)};
  }
  root.NBAExplorerUI={initialize};
})(globalThis);
