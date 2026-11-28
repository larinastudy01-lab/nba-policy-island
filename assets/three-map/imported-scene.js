import * as T from 'three';
import {LEVEL} from './models.js';

// Placements use the existing world coordinates and entrances. A failed asset leaves the procedural fallback.
export async function installIslandAssets(library,entry,team,courts,kit,isCancelled){
  const parent=entry.dynamic,placed=[],mixers=[];entry.imported=placed;entry.mixers=mixers;
  async function place(id,size,x,z,options={}){
    try{const object=await library.normalized(id,size,options);if(isCancelled())return null;object.position.set(x,LEVEL+(options.y||0),z);object.rotation.y=options.rotation||0;parent.add(object);placed.push(id);if(options.animation){const mixer=library.play(object,options.animation);if(mixer)mixers.push(mixer);}return object;}
    catch(e){entry.assetErrors??=[];entry.assetErrors.push({id,message:e.message});return null;}
  }
  for(const c of courts){
    const x=c.x*.1,z=c.y*.1;
    const floor=await place('vinish-half-court',7.1,x,z,{y:.18});
    const hoop=await place(team.id==='warriors'?'vinish-street-hoop':'vinish-arena-hoop',3.5,x,z-2.1,{axis:'height',y:.25});
    if(floor&&hoop)entry.courtFallbacks?.get(c.id)?.visible&&(entry.courtFallbacks.get(c.id).visible=false);
    await place('vinish-led-scoreboard',2.5,x-3.7,z-3.3);
    await place('vinish-bleachers',3,x+5.3,z,{rotation:-Math.PI/2});
    await place('vinish-two-tone-basketball',.48,x+1.3,z+.5,{y:.28});
    if(team.id==='warriors'){await place('vinish-portable-shot-clock',2,x-4.7,z+1.4);await place('vinish-ball-rack',1.8,x+5.1,z+3.8);}
    if(team.id==='lakers'){await place('vinish-team-bench',3.1,x+4,z+4);await place('vinish-scorers-table',2.8,x-3.5,z-5);await place('vinish-flip-scoreboard',.7,x-3.5,z-5,{y:.91});await place('vinish-youth-hoop',2.3,x-5.5,z-1,{axis:'height'});}
  }
  const A=globalThis.NBAArchipelago,island=A.getIsland(team.id),x=island.x*.1,z=island.y*.1;
  if(team.id==='warriors'){
    const arena=await place('innerscene-arena',14,team.x*.1,team.y*.1,{rotation:Math.PI});
    if(arena){entry.arenaFallback.visible=false;const ex=team.entrance.x*.1,ez=team.entrance.y*.1;kit.box(entry.group,ex,LEVEL+.04,ez+1,7,.1,4,'#dedecb',.4);kit.box(entry.group,ex,LEVEL+1,ez-1.2,2,2,.3,'#44697e',.12);kit.logo(entry.group,team,ex,LEVEL+2.65,ez-1,2);kit.sign(entry.group,'GSW ARENA',team.x*.1,LEVEL+4,team.y*.1+5.5,team.color,3.8);}
    const bridge=await place('poly-golden-gate',20,48,39.3);
    if(bridge){const a=new T.Vector3(39,LEVEL+.2,43.8),b=new T.Vector3(57,LEVEL+.2,34.8);bridge.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(bridge),s=bounds.getSize(new T.Vector3());bridge.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x)+(s.z>s.x?Math.PI/2:0);entry.bridgeFallback.visible=false;}
    await place('polyhaven-bench',1.9,21.5,60.8,{rotation:Math.PI/2});
    await place('vinish-wedge-supercar',3.4,31.4,60.3,{rotation:-Math.PI/4});
    if(entry.parkedCar)entry.parkedCar.visible=false;
    await place('vinish-security-guard',3.2,27.9,50.2,{axis:'height',animation:/Idle/});
  }
  if(team.id==='lakers'){
    await place('poly-large-building',6.5,x-14,z-7);
    const palm=await place('poly-palm-tree',5.4,x-11,z+3);
    const coconut=await place('vinish-coconut-palm',5.8,x+10,z-7);
    if(palm&&coconut&&entry.palmFallback)entry.palmFallback.visible=false;
    await place('poly-animated-human',3,x+3,z+7,{axis:'height',animation:/Idle/});
    const e=A.ROAD_EDGES.find(e=>e.islandId===team.islandId&&!e.bridge&&e.from!==team.id&&e.to!==team.id);
    if(e){const a=A.ROAD_NODES[e.from],b=A.ROAD_NODES[e.to],road=await place('poly-street-straight',4,(a.x+b.x)*.05,(a.y+b.y)*.05,{y:.12});if(road){road.updateMatrixWorld(true);const s=new T.Box3().setFromObject(road).getSize(new T.Vector3());road.scale.set(Math.hypot(b.x-a.x,b.y-a.y)*.1/Math.max(s.x,.01),1,2.1/Math.max(s.z,.01));road.rotation.y=-Math.atan2(b.y-a.y,b.x-a.x);}}
  }
  if(team.id==='bulls'){await place('poly-large-building',5.5,x-9,z-5);await place('polyhaven-bench',2,x-3,z+8);}
  if(team.id==='knicks'){
    const liberty=globalThis.NBASights.get('sight-liberty');const statue=await place('poly-liberty',6,liberty.x*.1,liberty.y*.1,{axis:'height'});if(statue)entry.hideSights.push(liberty.id);
    await place('poly-empire-state',9,x-8,z-6,{axis:'height'});
    await place('poly-large-building',6,x+9,z-8);
  }
  return placed;
}
