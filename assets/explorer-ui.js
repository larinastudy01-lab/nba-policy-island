/* W08/W12：一個 world 容器承載地形、路網、建築、點擊區及角色。 */
(function(root){
  "use strict";
  function initialize({getSelection,getGameState,getEncounter,onPosition,onAnnounce}){
    const E=root.NBAExplorer,C=root.NBAIsland,$=id=>document.getElementById(id);
    const camera=E.createCamera(),walker=E.createWalker();
    const motion=window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let timer=null,theme="day",actorKey=null,arrivalFocus=null;
    const actorFigure=document.createElement("span");actorFigure.className="actor-silhouette";actorFigure.setAttribute("aria-hidden","true");$("island-encounter-actor").append(actorFigure);
    const svgNS="http://www.w3.org/2000/svg";
    const districtButtons=new Map();
    const lighting=[];
    const roads=E.ROAD_EDGES.map((edge,index)=>{
      const a=E.ROAD_NODES[edge.from],b=E.ROAD_NODES[edge.to];
      const path=`M${a.x} ${a.y}L${b.x} ${b.y}`;
      const x=(a.x+b.x)/2,y=(a.y+b.y)/2;
      const length=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/length*10,ny=(b.x-a.x)/length*10;
      const rails=edge.bridge?[-1,1].map(sign=>`<path class="bridge-rail" d="M${a.x+sign*nx} ${a.y+sign*ny}L${b.x+sign*nx} ${b.y+sign*ny}" stroke-width="2"/>`).join(""):"";
      lighting.push(`<g class="street-lamp"><ellipse class="light-pool" cx="${x+3}" cy="${y+5}" rx="23" ry="10"/><path d="M${x} ${y}v-23h7" stroke="#829998" stroke-width="2" fill="none"/><circle class="lamp-bulb" cx="${x+7}" cy="${y-23}" r="3"/></g>`);
      return `<g data-road="${index}"><path d="${path}" transform="translate(0 ${edge.bridge?10:3})" stroke="${edge.bridge?"#1c3549":"#274344"}" stroke-width="${edge.bridge?24:17}"/><path d="${path}" stroke="${edge.bridge?"#b6ad8b":"#829990"}" stroke-width="${edge.bridge?20:12}"/><path d="${path}" stroke="#d5d3af" stroke-width="1" stroke-dasharray="5 9"/><path class="road-night-edge" d="${path}" stroke-width="1.3"/>${rails}</g>`;
    }).join("");
    const paths=document.createElementNS(svgNS,"svg");paths.setAttribute("viewBox","0 0 1600 1000");paths.setAttribute("aria-hidden","true");paths.classList.add("island-roads");
    paths.innerHTML=`<g fill="none" stroke-linecap="round" stroke-linejoin="round">${roads}</g><g>${lighting.join("")}</g>`;
    $("road-layer").append(paths);
    // 用 DOM 建立路線節點，避免依賴解析 innerHTML 的全域 ID 副作用。
    const route=document.createElementNS(svgNS,"polyline");route.setAttribute("fill","none");route.setAttribute("stroke","#f6d57f");route.setAttribute("stroke-width","3");route.setAttribute("stroke-dasharray","8 9");paths.append(route);
    for(const district of E.DISTRICTS){
      const button=document.createElement("button");button.type="button";button.id=`district-${district.id}`;button.className="district-label";
      button.style.left=`${district.label.x/C.MAP.width*100}%`;button.style.top=`${district.label.y/C.MAP.height*100}%`;
      button.textContent=district.name;button.setAttribute("aria-label",`探索${district.name}街區`);button.setAttribute("aria-controls","island-map");
      button.addEventListener("click",()=>districtView(district.id));$("district-layer").append(button);districtButtons.set(district.id,button);
      const option=document.createElement("option");option.value=district.id;option.textContent=district.name;$("district-select").append(option);
    }
    function stop(){if(timer!==null){clearInterval(timer);timer=null;}}
    function renderCamera(){
      const {view,level}=camera,scale=C.MAP.width/view.width;
      $("island-world").style.transform=`translate(${-view.x/view.width*100}%, ${-view.y/view.height*100}%) scale(${scale})`;
      $("island-world").style.setProperty("--camera-scale",String(scale));
      $("island-map").dataset.view=level;$("island-map").dataset.district=camera.districtId||"";
      $("island-map").dataset.selected=camera.selectedId;
      $("district-select").value=level==="island"?"":camera.districtId;
      const district=E.DISTRICTS.find(d=>d.id===camera.districtId);
      const item=[...C.TEAMS,...C.COURTS,...C.ENCOUNTERS].find(p=>p.id===camera.selectedId);
      $("camera-location").textContent=level==="island"?"全島總覽":level==="district"?district.name:`${district.name} / ${item?.name||"場館入口"}`;
      $("camera-back").disabled=level==="island";$("camera-back").textContent=level==="venue"?"← 回街區":"← 回全島";
      $("camera-overview").setAttribute("aria-pressed",String(level==="island"));
      for(const [id,button] of districtButtons){button.hidden=level!=="island";button.setAttribute("aria-pressed",String(camera.districtId===id));}
      refreshLabels();
    }
    function refreshLabels(){
      const glowingIds=C.TEAMS.filter(item=>C.gameForTeam(item.id,getGameState()).glowing).map(item=>item.id);
      const visible=new Set(E.visibleLabels(camera,glowingIds));
      for(const [kind,items] of [["nba",C.TEAMS],["court",C.COURTS],["encounter",C.ENCOUNTERS]])for(const item of items){
        const node=$(`landmark-${item.id}`);if(!node)continue;
        node.dataset.label=String(visible.has(item.id));
        // 全部場地仍可用清單與鍵盤進入；Tab 聚焦時把該地標帶進鏡頭。
      }
    }
    function refreshEncounter(){
      const daily=getEncounter(),selected=getSelection();
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
      const status=walker.moving?`沿道路前往${C.getLandmark(getSelection().kind,walker.targetId)?.name||"目的地"}…`:`已抵達 ${[...C.TEAMS,...C.COURTS,...C.ENCOUNTERS].find(p=>p.id===walker.locationId)?.name||"島上"}`;
      if($("movement-status").textContent!==status)$("movement-status").textContent=status;
      route.setAttribute("points",walker.moving?walker.route.map(p=>`${p.x},${p.y}`).join(" "):"");
      onPosition?.({...walker.position},walker);refreshEncounter();
    }
    function tick(){const arrived=E.tick(walker,Date.now());renderWalker();if(!walker.moving)stop();if(arrived){if(arrivalFocus===walker.token){E.focusVenue(camera,walker.targetId);renderCamera();}onAnnounce?.($("movement-status").textContent);}}
    function visit(id){
      stop();E.focusVenue(camera,id);E.walk(walker,id,Date.now(),Boolean(motion?.matches));arrivalFocus=walker.token;
      if(walker.moving)camera.view=E.journeyFrame(walker.route);
      renderCamera();renderWalker();
      if(walker.moving)timer=setInterval(tick,16);
    }
    function districtView(id){arrivalFocus=null;E.focusDistrict(camera,id);renderCamera();onAnnounce?.(`鏡頭已移至${E.DISTRICTS.find(d=>d.id===id).name}；玩家位置未變。`);}
    $("district-select").addEventListener("change",()=>{if($("district-select").value)districtView($("district-select").value);else{arrivalFocus=null;E.fullIsland(camera);renderCamera();}});
    $("camera-back").addEventListener("click",()=>{arrivalFocus=null;E.back(camera);renderCamera();onAnnounce?.("已返回上一層視角，保留選取與玩家位置。");});
    $("camera-overview").addEventListener("click",()=>{arrivalFocus=null;E.fullIsland(camera);renderCamera();onAnnounce?.(walker.moving?"已回全島，角色繼續原行程。":"已回全島，玩家停留原地。");});
    function setTheme(next){theme=next;$("island-map").dataset.theme=theme;$("map-day").setAttribute("aria-pressed",String(theme==="day"));$("map-night").setAttribute("aria-pressed",String(theme==="night"));$("map-light-status").textContent=theme==="night"?"夜晚・道路與場地照明開啟":"白天・沿路探索島嶼";}
    $("map-day").addEventListener("click",()=>setTheme("day"));$("map-night").addEventListener("click",()=>setTheme("night"));
    $("island-encounter-actor").addEventListener("click",()=>{const daily=getEncounter();if(!E.hasArrived(walker,daily.locationId)||getSelection().id!==daily.locationId)return;
      $("encounter-character").click();refreshEncounter();$("encounter-star-name").focus();});
    motion?.addEventListener?.("change",()=>{if(motion.matches&&walker.moving){const focus=arrivalFocus===walker.token;stop();E.walk(walker,walker.targetId,Date.now(),true);renderWalker();if(focus){E.focusVenue(camera,walker.targetId);renderCamera();}}});
    window.addEventListener("pagehide",stop);
    window.addEventListener("pageshow",event=>{if(event.persisted){tick();if(walker.moving&&timer===null)timer=setInterval(tick,16);}});
    renderCamera();setTheme("day");renderWalker();
    $("encounter-star-name").setAttribute("tabindex","-1");
    return {visit,districtView,refreshLabels,refreshEncounter,focusOnly:id=>{arrivalFocus=null;E.focusVenue(camera,id);renderCamera();},
      position:()=>({...walker.position,locationId:walker.locationId,targetId:walker.targetId,moving:walker.moving}),hasArrived:id=>E.hasArrived(walker,id)};
  }
  root.NBAExplorerUI={initialize};
})(globalThis);
