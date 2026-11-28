(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.NBAVehicles=api;})(globalThis,function(){
  'use strict';
  const MODELS=[['poly-f40','Ferrari F40','sport'],['poly-gtr','Nissan GT-R','sport'],['poly-lambo','Lamborghini 風格','sport'],['poly-sport-yellow','GT 黃色跑車','sport'],['poly-sport-coupe','流線雙門跑車','sport'],['poly-sport-roadster','經典雙門跑車','sport'],['poly-endurance','耐力賽跑車','sport'],['poly-city-suv','城市 SUV','city'],['poly-city-taxi','城市計程車','city']].map(([id,name,type])=>({id,name,type}));
  const headingDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  function createFleet(lengths){return [{id:'bay-gt',model:'poly-gtr',route:'bay-cruise',distance:0},{id:'bay-taxi',model:'poly-city-taxi',route:'bay-cruise',distance:lengths['bay-cruise']*.48},{id:'vegas-lambo',model:'poly-lambo',route:'vegas-cruise',distance:0},{id:'vegas-suv',model:'poly-city-suv',route:'vegas-cruise',distance:lengths['vegas-cruise']*.5}].map(v=>({...v,speed:0,wheelAngle:0,heading:0,paused:false}));}
  function advance(fleet,dt,{tracks,sample,active,reduced=false}){
    const next=fleet.map(v=>({...v}));
    for(let i=0;i<next.length;i++){const v=next[i],track=tracks.get(v.route),before=sample(v.route,v.distance),ahead=sample(v.route,v.distance+22),turn=Math.abs(headingDelta(before.heading,ahead.heading));
      const gap=Math.min(...fleet.filter(o=>o.route===v.route&&o.id!==v.id).map(o=>(o.distance-v.distance+track.length)%track.length),Infinity);
      v.speed=!active(v)||reduced?0:Math.min(before.speed*(turn>.22?.4:1),Math.max(0,(gap-48)*1.2));
      v.distance=(v.distance+v.speed*Math.min(dt,80)/1000)%track.length;v.wheelAngle+=v.speed*Math.min(dt,80)/1000/3;const target=sample(v.route,v.distance).heading;v.heading=reduced?target:v.heading+headingDelta(v.heading,target)*(1-Math.exp(-Math.min(dt,80)/120));v.paused=!v.speed;
    }return next;
  }
  return {MODELS,headingDelta,createFleet,advance};
});
