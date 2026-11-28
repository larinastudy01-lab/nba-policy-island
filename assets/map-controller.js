/* Shared navigation contract: renderer-independent IDs, roads and arrival events. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./explorer-core.js'):root.NBAExplorer,typeof module==='object'&&module.exports?require('./archipelago-core.js'):root.NBAArchipelago);if(typeof module==='object'&&module.exports)module.exports=api;else root.NBAMapController=api;})(globalThis,function(E,A){
  'use strict';
  function create(options={}){
    const walker=E.createWalker(),camera=E.createCamera(),listeners=new Set();let theme='day',pausedAt=null;
    const notify=type=>{for(const callback of listeners)callback(type);};
    function view(){options.onView?.(camera);notify('view');}
    function position(){return {...walker.position,locationId:walker.locationId,targetId:walker.targetId,direction:walker.direction,frame:walker.frame,moving:walker.moving};}
    function changed(){options.onPosition?.({...walker.position},walker);notify('position');}
    const controller={walker,camera,subscribe(callback){listeners.add(callback);return()=>listeners.delete(callback);},position,
      visit(id,now=Date.now(),reduced=false){E.focusVenue(camera,id);E.walk(walker,id,now,reduced);view();changed();return walker.token;},
      inspect(id){E.focusVenue(camera,id);view();},focusOnly(id){if(camera.level==='island')return;E.focusVenue(camera,id);view();},
      districtView(id){E.focusDistrict(camera,id);view();},fullIsland(){E.fullIsland(camera);view();},
      backToDistrict(){E.focusDistrict(camera,camera.islandId||A.owner(options.getSelection().id).id);view();},
      back(){E.back(camera);view();},hasArrived:id=>E.hasArrived(walker,id),
      tick(now=Date.now()){const moving=walker.moving,arrived=E.tick(walker,now);if(moving||arrived)changed();return arrived;},
      pause(paused,now=Date.now()){if(paused&&pausedAt===null)pausedAt=now;else if(!paused&&pausedAt!==null){if(walker.moving)walker.startedAt+=now-pausedAt;pausedAt=null;}},
      setTheme(next){theme=next==='night'?'night':'day';notify('theme');},getTheme:()=>theme,
      refreshScene(){notify('state');},refreshLabels(){notify('state');},refreshEncounter(){notify('encounter');},
      destroy(){listeners.clear();}
    };return controller;
  }
  return {create};
});
