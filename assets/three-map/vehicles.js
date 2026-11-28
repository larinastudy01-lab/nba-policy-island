import * as T from 'three';
import {LEVEL} from './models.js';
export function createVehicles(parent,kit,assets,onChange=()=>{}){
  const A=globalThis.NBAArchipelago,V=globalThis.NBAVehicles,traffic=globalThis.NBATraffic,groups=new Map(),loading=new Set(),errors=[];let night=false,closed=false,ride=false,throttle=0,fleet=V.createFleet(Object.fromEntries([...traffic.tracks].map(([id,t])=>[id,t.length])));
  const park=new T.Group();parent.add(park);const w=A.getIsland('warriors'),sx=A.getIsland('suns');
  // Exhibition is a paved parking pocket, separate from pedestrian graph / facility hit boxes.
  kit.box(park,w.x*.1+19,LEVEL-.03,w.y*.1+6.2,11.3,.35,8.1,'#a6b4b4',.5);
  kit.line(park,new T.Vector3(w.x*.1+10,LEVEL+.02,w.y*.1+6),new T.Vector3(w.x*.1+15,LEVEL+.02,w.y*.1+6),2,'#ded8c5',.2);
  for(const dx of [15,23])kit.cylinder(park,w.x*.1+dx,.5,w.y*.1+9,.18,3,'#8a9b99');
  for(let i=0;i<6;i++){const x=w.x*.1+15.5+(i%3)*3.6,z=w.y*.1+4.5+Math.floor(i/3)*3.7;kit.line(park,new T.Vector3(x-1.5,LEVEL+.17,z-1.6),new T.Vector3(x-1.5,LEVEL+.17,z+1.6),.05,'#ede5cd');}
  const parked=V.MODELS.filter(m=>m.type==='sport').slice(0,6).map((m,i)=>({...m,key:'park-'+m.id,teamId:'warriors',x:w.x+155+(i%3)*36,y:w.y+45+Math.floor(i/3)*37}));
  parked.push({...V.MODELS.find(v=>v.id==='poly-endurance'),key:'park-endurance',teamId:'nuggets',x:A.getIsland('nuggets').x+90,y:A.getIsland('nuggets').y+75});
  async function model(key,id){if(groups.has(key)||loading.has(key)||closed)return;loading.add(key);try{const object=await assets.normalized(id,3.1);if(closed)return;object.updateMatrixWorld(true);const box=new T.Box3().setFromObject(object),size=box.getSize(new T.Vector3());if(size.x>size.z)object.rotation.y=Math.PI/2;
      const car=new T.Group();car.add(object);car.userData={model:id,wheels:[],beam:[],parked:key.startsWith('park-')};
      // Four thin spoke discs are aligned to the original tyre axles, not block replacement wheels.
      for(const side of [-1,1])for(const z of [-.95,.98]){const pivot=new T.Group();pivot.position.set(side*.69,.31,z);const rim=new T.Mesh(kit.geometry('car-rim',()=>new T.CylinderGeometry(.16,.16,.012,16)),kit.material('#a9b7b8'));rim.rotation.z=Math.PI/2;pivot.add(rim);for(let i=0;i<5;i++){const spoke=kit.box(pivot,0,0,0,.02,.22,.018,'#e1dcce',.005);spoke.rotation.x=i*Math.PI/5;}kit.merge(pivot);car.add(pivot);car.userData.wheels.push(pivot);}
      for(const side of [-1,1]){const beam=new T.Mesh(kit.geometry('headlight-beam',()=>new T.ConeGeometry(.65,4,16,1,true)),new T.MeshBasicMaterial({color:'#fff0c0',transparent:true,opacity:.1,depthWrite:false,side:T.DoubleSide}));beam.rotation.x=-Math.PI/2;beam.position.set(side*.5,.3,3.1);beam.scale.z=.12;car.add(beam);car.userData.beam.push(beam);const spot=new T.Mesh(kit.geometry('road-light',()=>new T.CircleGeometry(.8,24)),new T.MeshBasicMaterial({color:'#fff2c1',transparent:true,opacity:.12,depthWrite:false}));spot.rotation.x=-Math.PI/2;spot.position.set(side*.45,.03,3);spot.scale.y=2.4;car.add(spot);car.userData.beam.push(spot);}
      car.userData.beam.forEach(b=>b.visible=night&&!car.userData.parked);car.visible=false;parent.add(car);groups.set(key,car);
    }catch(e){errors.push({id,message:e.message});}finally{loading.delete(key);if(!closed)onChange();}}
  function update(delta,time,{teamId,overview,reduced,low=false}){
    park.visible=!overview&&teamId==='warriors';for(const [index,p]of parked.entries()){const active=!overview&&p.teamId===teamId&&(!low||index<3||p.teamId!=='warriors');if(active)model(p.key,p.id);const g=groups.get(p.key);if(g){g.visible=active;g.position.set(p.x*.1,LEVEL+.12,p.y*.1);g.rotation.y=Math.PI;g.userData.wheels.forEach(w=>w.visible=!low);}}
    fleet=V.advance(fleet,delta,{tracks:traffic.tracks,sample:traffic.sample,active:v=>!(ride&&v.id==='bay-gt')&&!overview&&(v.route==='bay-cruise'?teamId==='warriors':teamId==='suns'),reduced});
    if(ride){const v=fleet.find(v=>v.id==='bay-gt'),track=traffic.tracks.get(v.route),p=traffic.sample(v.route,v.distance),gap=Math.min(...fleet.filter(o=>o.route===v.route&&o.id!==v.id).map(o=>(o.distance-v.distance+track.length)%track.length),Infinity);v.speed=Math.max(0,Math.min(p.speed*throttle,(gap-48)*1.2));v.distance=(v.distance+v.speed*Math.min(delta,80)/1000)%track.length;v.wheelAngle+=v.speed*Math.min(delta,80)/3000;v.heading=traffic.sample(v.route,v.distance).heading;v.paused=!v.speed;}
    for(const v of fleet){const active=!overview&&(v.route==='bay-cruise'?teamId==='warriors':teamId==='suns');if(active)model(v.id,v.model);const g=groups.get(v.id);if(!g)continue;g.visible=active;const p=traffic.sample(v.route,v.distance);g.position.set(p.x*.1,LEVEL+.14,p.y*.1);g.rotation.y=-v.heading+Math.PI/2;g.userData.wheels.forEach((w,i)=>{w.rotation.x=v.wheelAngle;w.visible=!low||i%2===0;});}
  }
  function setNight(value){night=value;for(const g of groups.values())g.userData.beam.forEach(b=>b.visible=night&&!g.userData.parked);}
  function snapshot(){return [...groups].map(([id,g])=>({id,model:g.userData.model,visible:g.visible,lights:night&&!g.userData.parked&&g.visible,position:g.position.toArray(),heading:g.rotation.y,...fleet.find(v=>v.id===id)}));}
  function dispose(){closed=true;for(const g of groups.values()){g.userData.beam.forEach(b=>b.material.dispose());g.removeFromParent();}groups.clear();}
  function control(action,value=0){if(action==='start'){ride=true;throttle=0;}if(action==='stop'){ride=false;throttle=0;}if(action==='throttle')throttle=T.MathUtils.clamp(Number(value)||0,0,1);return rideState();}
  function rideState(){const v=fleet.find(v=>v.id==='bay-gt');return {active:ride,throttle,...traffic.sample(v.route,v.distance),speed:v.speed,distance:v.distance};}
  return {control,rideState,update,setNight,snapshot,dispose,errors};
}
