/* Presentation only. Never changes a match seed, game clock or historical result. */
(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.NBAJourneyCore=api;})(globalThis,function(){
  'use strict';
  const VERSION='through-ages-v1',KEY='nba-policy-island:journey:v1',INTRO_KEY='nba-policy-island:opening:v1';
  const ERAS=[
    {id:'origins',label:'1940–1960｜NBA 起源',accent:'#c2a475',ambient:'#e4d4bb',sun:'#ffdfad',roughness:.9,sound:'bounce',material:'暖木、奶油色與皮革',layout:'老球館與簡潔廣場'},
    {id:'culture',label:'1970｜街頭籃球文化',accent:'#dc986b',ambient:'#dbdfc5',sun:'#ffe5bc',roughness:.85,sound:'bounce',material:'暖磚、木板與戶外鋪面',layout:'街頭球場與公園'},
    {id:'showtime',label:'1980｜Showtime 時代',accent:'#c0a4d6',ambient:'#e1d9f4',sun:'#ffe4b0',roughness:.65,sound:'bounce',material:'紫金招牌與玻璃',layout:'棕櫚大道與燈光入口'},
    {id:'dynasty',label:'1990｜Jordan 王朝',accent:'#da8d89',ambient:'#e0dde0',sun:'#ffe8db',roughness:.8,sound:'bounce',material:'紅磚、深色金屬與看台',layout:'都市街廓與球館前場'},
    {id:'mamba',label:'2000｜Kobe 時代',accent:'#c1a1db',ambient:'#dbdbea',sun:'#ffe8bb',roughness:.72,sound:'bounce',material:'紫金、磨砂金屬與木地板',layout:'球館通道與城市廣場'},
    {id:'revolution',label:'2010｜三分球革命',accent:'#8dbce0',ambient:'#d8edfa',sun:'#fff1d6',roughness:.65,sound:'bounce',material:'藍金、玻璃與清晰場線',layout:'海灣步道與開放球場'},
    {id:'new-generation',label:'2020｜新世代 NBA',accent:'#91c9be',ambient:'#def0f0',sun:'#fff3df',roughness:.7,sound:'bounce',material:'自然石材、草地與玻璃',layout:'多用途廣場與湖岸公園'}
  ];
  const QUALITY={low:{dpr:1,shadow:0,fps:30,details:1},medium:{dpr:1.5,shadow:1024,fps:60,details:2},high:{dpr:2,shadow:2048,fps:60,details:2}};
  const PHASES=['day','dusk','night'];
  function normalize(v={}){return {era:ERAS.some(e=>e.id===v?.era)?v.era:'new-generation',phase:PHASES.includes(v?.phase)?v.phase:'day',quality:['auto',...Object.keys(QUALITY)].includes(v?.quality)?v.quality:'auto'};}
  function environment(era,phase){const e=ERAS.find(e=>e.id===era)||ERAS.at(-1),p=PHASES.includes(phase)?phase:'day';return {...e,sun:p==='dusk'?'#ffd1a3':e.sun,ambient:p==='dusk'?'#e7c0ba':e.ambient,phase:p,sky:p==='night'?'#16283f':p==='dusk'?'#b58883':'#a4ced5',hemi:p==='night'?.78:p==='dusk'?1.55:2.2,sunIntensity:p==='night'?.6:p==='dusk'?1.8:3.2,exposure:p==='night'?1.05:p==='dusk'?1.14:1.15,lamps:p!=='day',water:p==='night'?1:p==='dusk'?.48:0};}
  function quality(mode,{width=1200,dpr=1,cores=8}={}){const id=mode==='standard'?'medium':QUALITY[mode]?mode:width<760||cores<4?'low':'medium';return {id,...QUALITY[id],dpr:Math.min(dpr,QUALITY[id].dpr)};}
  function intro(elapsed,reduced=false){const t=Math.max(0,Math.min(10000,elapsed));return {elapsed:t,stage:reduced?5:Math.min(5,Math.floor(t/1800)),complete:reduced||t>=10000};}
  function frameDue(clock,now,fps){const interval=1000/fps;if(Number.isFinite(clock.nextRenderAt)&&now<clock.nextRenderAt-.5)return false;if(!Number.isFinite(clock.nextRenderAt)||now-clock.nextRenderAt>interval*3)clock.nextRenderAt=now;clock.nextRenderAt+=interval;return true;}
  function point(client,rect,world={width:600,height:320}){return {x:(client.x-rect.left)/rect.width*world.width,y:(client.y-rect.top)/rect.height*world.height};}
  return {VERSION,KEY,INTRO_KEY,ERAS,PHASES,QUALITY,normalize,environment,quality,intro,point,frameDue};
});
