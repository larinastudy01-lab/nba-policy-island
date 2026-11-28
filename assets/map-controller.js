/* Shared navigation contract: renderer-independent IDs, roads and arrival events. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./explorer-core.js'):root.NBAExplorer,typeof module==='object'&&module.exports?require('./archipelago-core.js'):root.NBAArchipelago);if(typeof module==='object'&&module.exports)module.exports=api;else root.NBAMapController=api;})(globalThis,function(E,A){
  'use strict';
  function create(options={}){
    const walker=E.createWalker(),camera=E.createCamera(),listeners=new Set();let theme='day',pausedAt=null,manual=false;
    const notify=type=>{for(const callback of listeners)callback(type);};
    function view(){options.onView?.(camera);notify('view');}
    function position(){return {...walker.position,locationId:walker.locationId,targetId:walker.targetId,direction:walker.direction,frame:walker.frame,moving:walker.moving};}
    function changed(){options.onPosition?.({...walker.position},walker);notify('position');}
    const controller={walker,camera,subscribe(callback){listeners.add(callback);return()=>listeners.delete(callback);},position,
      visit(id,now=Date.now(),reduced=false){manual=false;E.focusVenue(camera,id);E.walk(walker,id,now,reduced);view();changed();return walker.token;},
      inspect(id){E.focusVenue(camera,id);view();},focusOnly(id){if(camera.level==='island')return;E.focusVenue(camera,id);view();},
      districtView(id){E.focusDistrict(camera,id);view();},fullIsland(){E.fullIsland(camera);view();},
      backToDistrict(){E.focusDistrict(camera,camera.islandId||A.owner(options.getSelection().id).id);view();},
      back(){E.back(camera);view();},hasArrived:id=>E.hasArrived(walker,id),
      tick(now=Date.now()){const moving=walker.moving,arrived=E.tick(walker,now);if(moving||arrived)changed();return arrived;},
      pause(paused,now=Date.now()){if(paused&&pausedAt===null)pausedAt=now;else if(!paused&&pausedAt!==null){if(walker.moving)walker.startedAt+=now-pausedAt;pausedAt=null;}},
      setTheme(next){theme=['day','dusk','night'].includes(next)?next:'day';notify('theme');},getTheme:()=>theme,
      exploreStep(dx,dy,now=Date.now()){
        if(walker.moving||Math.hypot(dx,dy)<.2)return false;
        const start=walker.position,nearest=Object.keys(A.ROAD_NODES).sort((a,b)=>Math.hypot(A.ROAD_NODES[a].x-start.x,A.ROAD_NODES[a].y-start.y)-Math.hypot(A.ROAD_NODES[b].x-start.x,A.ROAD_NODES[b].y-start.y))[0];
        const candidates=A.ROAD_EDGES.filter(e=>(e.from===nearest||e.to===nearest)&&E.edgeClear(e)).map(e=>e.from===nearest?e.to:e.from).map(id=>{const p=A.ROAD_NODES[id],vx=p.x-start.x,vy=p.y-start.y;return {id,dot:(vx*dx+vy*dy)/Math.max(1,Math.hypot(vx,vy)*Math.hypot(dx,dy))};}).filter(p=>p.dot>.1).sort((a,b)=>b.dot-a.dot);
        if(!candidates.length)return false;manual=true;E.walk(walker,candidates[0].id,now,false);walker.duration=Math.max(180,Math.min(1800,walker.route.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-walker.route[i].x,p.y-walker.route[i].y),0)*7));changed();notify('movement');return true;
      },
      stopExplore(now=Date.now()){if(!manual)return;E.tick(walker,now);walker.moving=false;walker.frame=0;walker.token++;manual=false;changed();},
      refreshScene(){notify('state');},refreshLabels(){notify('state');},refreshEncounter(){notify('encounter');},
      destroy(){listeners.clear();}
    };return controller;
  }
  return {create};
});
