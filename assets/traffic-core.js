/* 六款獨立原創車身；車道不加入玩家路網。封閉曲線連續行駛，共用地圖動畫時鐘。 */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.NBATraffic=api;})(globalThis,function(){
  "use strict";
  const CARS=[
    {id:"car-f40",name:"Ferrari F40",color:"#d8493d",district:"west",x:320,y:265,view:"rear",parked:true,feature:"方正車尾、大尾翼、楔形車頭"},
    {id:"car-488",name:"Ferrari 488 Spider",color:"#e75040",district:"west",x:185,y:575,view:"front",parked:true,feature:"開放式座艙、側進氣口"},
    {id:"car-720s",name:"McLaren 720S",color:"#f49836",district:"west",routeId:"bay-cruise",parked:false,feature:"流線座艙、眼窩式頭燈"},
    {id:"car-p1",name:"McLaren P1",color:"#b8c7cc",district:"west",x:208,y:630,view:"rear",parked:true,feature:"水滴座艙、弧形車尾燈"},
    {id:"car-aventador",name:"Lamborghini Aventador",color:"#e1c846",district:"desert",routeId:"vegas-cruise",parked:false,feature:"銳利折線、Y 字頭燈"},
    {id:"car-911",name:"Porsche 911 GT3 RS",color:"#e1e7df",district:"highland",x:710,y:365,view:"side",parked:true,feature:"圓燈、弧形車尾、高尾翼"}
  ];
  // 金門橋車道 (118,274) → (343,173)，行人另走往南偏移的橋側步道。
  const ROUTES=[
    {id:"bay-cruise",district:"west",speed:29,points:[{x:118,y:274},{x:343,y:173},{x:405,y:150},{x:478,y:195},{x:463,y:300},{x:463,y:410},{x:356,y:455},{x:175,y:429},{x:115,y:345}]},
    {id:"vegas-cruise",district:"desert",speed:25,points:[{x:555,y:730},{x:677,y:692},{x:710,y:753},{x:679,y:829},{x:563,y:852},{x:531,y:794}]}
  ];
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  function roundedRoute(points){const out=[];for(let i=0;i<points.length;i++){const p=points[i],before=points[(i+points.length-1)%points.length],after=points[(i+1)%points.length],radius=Math.min(14,distance(p,before)/5,distance(p,after)/5),a=lerp(p,before,radius/distance(p,before)),b=lerp(p,after,radius/distance(p,after));for(let j=0;j<=8;j++){const t=j/8;out.push({...lerp(lerp(a,p,t),lerp(p,b,t),t),corner:true});}out.push({...b,corner:false});}return out;}
  const tracks=new Map(ROUTES.map(route=>{const points=roundedRoute(route.points),segments=points.map((a,i)=>{const b=points[(i+1)%points.length];return {a,b,length:distance(a,b),corner:a.corner&&b.corner};}).filter(s=>s.length>.001);return [route.id,{...route,segments,length:segments.reduce((n,s)=>n+s.length,0)}];}));
  function sample(routeId,travel){const track=tracks.get(routeId);if(!track)throw new RangeError("Unknown traffic route");let d=((travel%track.length)+track.length)%track.length;for(const segment of track.segments){if(d<=segment.length){const p=lerp(segment.a,segment.b,d/segment.length),heading=Math.atan2(segment.b.y-segment.a.y,segment.b.x-segment.a.x);return {...p,heading,view:direction(heading).view,flip:direction(heading).flip,corner:segment.corner,speed:track.speed*(segment.corner?.48:1)};}d-=segment.length;}throw new Error("Invalid route sample");}
  function direction(angle){const dx=Math.cos(angle),dy=Math.sin(angle);return {view:Math.abs(dy)<.28?"side":dy>0?"front":"rear",flip:dx<0};}
  function createTraffic(){return {distance:Object.fromEntries(CARS.filter(c=>!c.parked).map(c=>[c.id,0]))};}
  function advance(traffic,delta,{active=false,reducedMotion=false,district=null}={}){if(active&&!reducedMotion){const seconds=Math.max(0,Math.min(100,delta))/1000;for(const car of CARS.filter(c=>!c.parked&&(!district||c.district===district))){const current=sample(car.routeId,traffic.distance[car.id]);traffic.distance[car.id]=(traffic.distance[car.id]+current.speed*seconds)%tracks.get(car.routeId).length;}}return CARS.map(car=>car.parked?{...car,heading:.2,flip:false}:{...car,...sample(car.routeId,traffic.distance[car.id])});}
  function headlights(car,night){return Boolean(night&&!car.parked);}
  function svg(id,view="side"){
    const car=CARS.find(c=>c.id===id);if(!car||!["front","side","rear"].includes(view))throw new RangeError("Unknown car or direction");
    const c=car.color,glass="#213e4d",trim="#29343d";
    const common='<ellipse cx="64" cy="69" rx="54" ry="15" fill="#062335" opacity=".3"/><g fill="#1d2a33" stroke="#566470" stroke-width="2"><ellipse cx="29" cy="61" rx="10" ry="13"/><ellipse cx="98" cy="53" rx="10" ry="13"/></g>';
    // 每個車款的側視輪廓獨立設計，方向版本額外改變車頭／車尾的可見面。
    const bodies={
      "car-f40":`<path d="m9 51 16-16 24-6 25-17 29 4 15 23-6 18-83 17Z" fill="${c}" stroke="#982d2a"/><path d="m53 31 22-15 19 4 5 17Z" fill="${glass}"/><path d="M85 18V5l31 6v8M85 5l-13 6 31 7 13-7" fill="${trim}"/><path d="m43 45 35-9m-51 23 8 4m60-20 15 4" stroke="#f9b599" stroke-width="3"/><path d="m79 45 12-3v10l-12 3Z" fill="${trim}"/>`,
      "car-488":`<path d="m7 54 21-17 31-7 15-12 23 1 20 18 2 18-25 11-66 8Z" fill="${c}" stroke="#a53632"/><path d="m54 31 18-11 17 2 9 13-26 10Z" fill="#172d37"/><path d="m62 31 6-8 9 1 2 12m4-4 3-8 7 2 3 10" stroke="#936d58" stroke-width="5" fill="none"/><path d="m42 36 18-14 8 2-9 13" fill="#96c6cf"/><path d="m82 49 14-8-2 15-13 5Z" fill="${trim}"/><path d="m15 52 16-4m67-12 10 2" stroke="#efddc8" stroke-width="3"/>`,
      "car-720s":`<path d="M8 53Q17 34 47 34l22-20q17-7 34 9l16 21-4 16-21 9-65 4Z" fill="${c}" stroke="#ad642b"/><path d="M48 35 70 17q18-5 29 11l4 10-29 12Z" fill="${glass}"/><path d="M12 51q5-15 22-9l-1 10-15 6Zm87-12q8-13 16 3l-8 7Z" fill="#172b34"/><path d="m82 50 15-7-3 14-17 5" fill="#3e4b48"/><path d="m18 48 9-3m78-4 6 1" stroke="#d8eff0" stroke-width="2"/>`,
      "car-p1":`<path d="M8 55q2-18 25-21l25-3q18-30 39-10l20 20-2 18q-6 10-28 12l-57 2Z" fill="${c}" stroke="#627b89"/><path d="M55 35q22-30 40-10l9 16-25 12Z" fill="${glass}"/><path d="M51 39 32 52l4 15 44 1 14-9-13-7Z" fill="#34464e"/><path d="M91 23V13l25 9v8m-27-17 9-5 25 10-7 4" fill="#34414a"/><path d="M13 52q9-13 23-6m62-2 14 4" stroke="#eff5e8" stroke-width="3"/>`,
      "car-aventador":`<path d="m6 54 22-18 28-5 21-21 26 11 18 23-7 16-24 12-63 1Z" fill="${c}" stroke="#92852f"/><path d="m55 34 23-20 19 9 7 17-31 12Z" fill="${glass}"/><path d="m7 54 31-6 15 5 24-1 25-12 18 4m-69 9-13 17" fill="none" stroke="#a19b40" stroke-width="2"/><path d="m14 51 10-5 4 6 9-2m67-12 5 7 7-2" fill="none" stroke="#f3f5d4" stroke-width="2"/><path d="m80 51 17-8-7 17-13 3Z" fill="${trim}"/>`,
      "car-911":`<path d="M9 54q2-17 25-20l19-2q14-26 36-17l17 19 14 14-5 13-23 11-64 1Z" fill="${c}" stroke="#899b9f"/><path d="M53 35q15-24 34-16l13 18-26 12Z" fill="${glass}"/><ellipse cx="24" cy="47" rx="8" ry="6" fill="#eff0c9" stroke="#788d98"/><ellipse cx="106" cy="38" rx="6" ry="5" fill="#eff0c9"/><path d="M87 20V4l31 10v8m-31-18L77 9l31 11 10-6" fill="#374651"/><path d="M45 57h31m15-9 18 6" stroke="#607d89" stroke-width="2"/>`
    };
    let directionArt="";
    if(view==="front")directionArt=`<path d="m9 55 21 16 64-6-2 13-57 9-26-17Z" fill="${c}" stroke="#657681"/><path d="m15 63 16 7m39-1 15-3" stroke="#fff0b9" stroke-width="4"/><path d="m39 76 23-3" stroke="${trim}" stroke-width="5"/>`;
    if(view==="rear")directionArt=`<path d="m90 39 29 6-2 17-27 12Z" fill="${trim}"/><path d="${id==="car-p1"?"M94 49q13 12 20 0":"M94 49l20 3"}" fill="none" stroke="#f16d60" stroke-width="3"/><path d="M96 65h9" stroke="#aebfbe" stroke-width="3"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -5 130 100" role="img"><title>${car.name}・原創${{front:"車頭斜視",side:"側面",rear:"車尾斜視"}[view]}插畫</title>${common}${bodies[id]}${directionArt}</svg>`;
  }
  function roadSVG(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><g fill="none" stroke-linejoin="round">${ROUTES.map(r=>{const t=tracks.get(r.id),p=t.segments.map(s=>`${s.a.x},${s.a.y}`).join(" ");return `<polyline points="${p} ${t.segments[0].a.x},${t.segments[0].a.y}" stroke="#294b57" stroke-width="21"/><polyline points="${p} ${t.segments[0].a.x},${t.segments[0].a.y}" stroke="#d0be82" stroke-width="1.2" stroke-dasharray="6 9"/>`;}).join("")}</g></svg>`;}
  return {CARS,ROUTES,tracks,direction,sample,createTraffic,advance,headlights,svg,roadSVG};
});
