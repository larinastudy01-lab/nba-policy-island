/* 原創灣區的共同視角／材質與純資料路人模型。所有座標均為島圖世界座標。 */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.NBABay=api;})(globalThis,function(){
  "use strict";
  const STYLE={lightDirection:"upper-left",personWidth:25,playerWidth:29,shadow:{x:8,y:5},waterLevel:0,pierLevel:8,plazaLevel:18};
  const BAY_IDS=["warriors","meet-pier","harbor-01"];
  const svg=(title,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" role="img"><title>${title}</title>${body}</svg>`;
  function groundSVG(){return svg("西岸灣區：球館廣場、石板步道、木棧道與潮汐球場",`
    <defs><pattern id="paving" width="28" height="14" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .38 -1 .38 0 0)"><rect width="28" height="14" fill="#9caeaa"/><path d="M28 0H0V14" stroke="#687f80" stroke-width="1"/></pattern><pattern id="boards" width="10" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(-27)"><rect width="10" height="36" fill="#a58b62"/><path d="M1 0V36M7 5v12" stroke="#735f48" stroke-width="1"/></pattern></defs>
    <g fill="#0a2230" opacity=".25"><ellipse cx="289" cy="387" rx="105" ry="32"/><path d="m212 636 110 23 88 90-88 38-150-86Z"/></g>
    <path d="m176 365 85-45 103 55-82 47-106-55Z" fill="#506b73"/>
    <path d="m176 347 85-45 103 55-82 47-106-55Z" fill="url(#paving)" stroke="#c3c6ad" stroke-width="2"/>
    <path d="m283 383 57 26-11 6-57-26Zm-4 5 57 26-11 6-57-26Zm-4 5 57 26-11 6-57-26Z" fill="#c9c4a5" stroke="#748783"/>
    <path d="M303 388 323 438 299 579 273 686 398 736" fill="none" stroke="#354e55" stroke-width="26"/>
    <path d="M303 382 323 432 299 573 273 680 398 730" fill="none" stroke="url(#paving)" stroke-width="19"/>
    <path d="m176 636 89-38 63 64-42 65-101-24Z" fill="#314a53"/>
    <path d="m176 628 89-38 63 64-42 65-101-24Z" fill="url(#boards)" stroke="#d4bd8b" stroke-width="2"/>
    <path d="m248 669 25 10 125 50-4 14-128-51-25-10Z" fill="#3f5559"/>
    <path d="m248 662 25 10 125 50-4 14-128-51-25-10Z" fill="url(#boards)" stroke="#dac596" stroke-width="2"/>
    <g stroke="#665341" stroke-width="8"><path d="M188 684v28m25-16v28m62-6v26m35-63v25m-30-6v30m43-13v29m43-12v28"/></g>
    <g fill="#405454" stroke="#cbbd8d" stroke-width="2"><ellipse cx="182" cy="651" rx="4" ry="3"/><ellipse cx="201" cy="692" rx="4" ry="3"/><ellipse cx="278" cy="710" rx="4" ry="3"/></g>
    <path d="m154 696 38-7-9 20-17 5Z" fill="#e2c994" stroke="#2d4e63" stroke-width="3"/><path d="m170 698 14-4-5 9-8 2Z" fill="#447c94"/>
    <path d="m171 714 18-6m-24 13 28-8" stroke="#81b7bd" fill="none" opacity=".5"/>
    <path d="m300 697 52-28 55 30v42l-55 28-52-28Z" fill="#385762"/><path d="m300 689 52-28 55 30v42l-55 28-52-28Z" fill="#6b8c82" stroke="#a8bba6" stroke-width="2"/>
    <g fill="#aebeb0" stroke="#4b6c69"><path d="m335 728 65-33 38 20-65 34v9l-38-20Z"/><path d="m326 738 65-32 8 5-65 33Z"/><path d="m322 745 65-32 8 5-65 33Z"/></g>
    <g fill="#a58c64" stroke="#d4bd91"><path d="m207 638 26-12 9 5-26 12Z"/><path d="m207 643 26-12 9 5-26 12Z"/></g>
    <g fill="#162f3c" opacity=".3"><ellipse cx="197" cy="610" rx="16" ry="6"/><ellipse cx="338" cy="449" rx="17" ry="7"/></g>
    <g stroke="#5c6851" stroke-width="3"><path d="M190 607v-22m142 58v-25"/></g><g fill="#3d785e"><path d="m174 596 16-31 18 31Z"/><path d="m315 635 17-33 19 33Z"/></g>
  `);}
  function lightsSVG(){return svg("灣區夜間照明：暖白階梯、暖黃棧道與冷白球場",`
    <g fill="#ffe9c3" opacity=".35"><ellipse cx="303" cy="386" rx="40" ry="15"/><ellipse cx="282" cy="373" rx="25" ry="10"/></g>
    <g fill="#ffd47e" opacity=".26"><ellipse cx="229" cy="650" rx="28" ry="12"/><ellipse cx="283" cy="687" rx="28" ry="12"/></g>
    <g fill="#b9e7ff" opacity=".22"><ellipse cx="363" cy="714" rx="48" ry="25"/></g>
    <g stroke="#ffd78a" stroke-linecap="round" opacity=".6"><path d="m154 674 28-7m-31 13 35-8m-21 16 21-6m28 32 28-5m-23 10 30-6"/></g>
    <g stroke="#fff0ce" stroke-width="2"><path d="m277 389 53 25m-56-19 50 23"/></g>
    <g fill="#ffde90"><circle cx="221" cy="625" r="3"/><circle cx="280" cy="658" r="3"/><circle cx="317" cy="677" r="3"/></g>
  `);}
  function foregroundSVG(part){
    if(part==="pier")return svg("碼頭前緣欄杆與接地長椅",`<g stroke="#c1b394" fill="none" stroke-width="2"><path d="m181 680 100 37m-100-46 100 37m-100-37v13m25-4v13m25-4v13m25-4v13m25-4v13"/></g><g fill="#a78c62" stroke="#d2bd91"><path d="m212 687 30 11-5 4-30-11Zm-5 7 30 11-5 4-30-11Z"/></g><path d="M210 697v7m22 1v8" stroke="#334956" stroke-width="2"/><g stroke="#7e8a81" stroke-width="2" fill="#ead192"><path d="M221 649v-24m59 57v-24m37 43v-24"/><circle cx="221" cy="625" r="3"/><circle cx="280" cy="658" r="3"/><circle cx="317" cy="677" r="3"/></g>`);
    if(part==="court")return svg("潮汐一號的低圍網與入口缺口",`<g fill="none" stroke="#8eabb0" stroke-width="1.5"><path d="M307 724v17l44 23 27-13m17-9 10-5v-18M307 724l44 23 27-13m17-9 10-5"/><path d="m313 728 0 16m8-12v16m8-12v16m8-12v16m8-12v16m11-13v15m8-19v15m8-19v15m26-29v16"/></g><path d="m378 744 15-8" stroke="#f0ca71" stroke-width="3"/>`);
    return svg("球館廣場前景花台",`<ellipse cx="337" cy="406" rx="20" ry="8" fill="#0b2530" opacity=".25"/><path d="m323 394 18-9 18 10-18 9v11l-18-10Z" fill="#576e70"/><path d="m323 391 18-9 18 10-18 9Z" fill="#47775e"/><path d="M341 389v-28" stroke="#786e51" stroke-width="3"/><path d="m326 377 15-30 17 30Z" fill="#4b8564"/>`);
  }
  function arenaGraphic(){return `<ellipse class="arena-halo" cy="-7" rx="76" ry="45"/><ellipse cx="8" cy="29" rx="72" ry="24" fill="#102f40" opacity=".3"/>
    <ellipse cy="-4" rx="64" ry="29" fill="#173e64"/><path d="M-64-19V-4a64 29 0 0 0 128 0v-15" fill="#275b87" stroke="#8ba9ac"/>
    <ellipse class="arena-rim" cy="-19" rx="65" ry="30" fill="#204c79" stroke="#e7c36d" stroke-width="3"/>
    <ellipse cy="-26" rx="59" ry="27" fill="#3776af"/><ellipse cy="-29" rx="51" ry="22" fill="#508ab6" stroke="#92afbd"/>
    <path d="M-40-37Q0-54 40-37M-47-29Q0-48 47-29M-45-19Q0-38 45-19" stroke="#a6c3ca" opacity=".4" fill="none"/>
    <path class="arena-windows" d="M-46-5v13m10-8v13m11-9v12m42-10v15m11-18v15m12-20v13" stroke="#bce5eb" stroke-width="5"/>
    <path d="m26 7 30-12v20L26 28Z" fill="#92c9d1" fill-opacity=".65" stroke="#d5e5cf"/><path d="M39 3v18m8-22v18" stroke="#204f69" stroke-width="2"/>
    <path d="m27 29 29-13 10 5-29 14Zm4 5 29-13 10 5-29 14Z" fill="#c9c4a5" stroke="#7d9690"/>
    <path d="m-42 5 18 7v9l-18-7Z" fill="#c8c0a2"/><path d="m-38 9 11 4v4l-11-4Z" fill="#1a465c"/>
    <text class="roof-text" y="-20">GSW</text><text class="arena-live-tag" y="8">模擬 LIVE</text><text class="landmark-label" y="56">勇士主場</text><ellipse class="selection-ring" cy="-2" rx="77" ry="58"/><rect class="hit-area" x="-78" y="-61" width="156" height="124"/>`;}
  function courtGraphic(){return `<ellipse cx="7" cy="25" rx="49" ry="19" fill="#112f3d" opacity=".28"/><path d="m-44-18 43-22 44 24-44 23Z" fill="#345e68" stroke="#becab1" stroke-width="2"/>
    <g transform="matrix(1 .5 -1 .5 0 -18)"><rect x="-27" y="-17" width="54" height="34" fill="#417b8c"/><path d="M0-17v34M-27-8h12V8h-12M27-8H15V8h12" fill="none" stroke="#e0dbc1"/><circle r="6" fill="none" stroke="#e0dbc1"/></g>
    <path d="M-27-31v-16m53 43v-21" stroke="#cfdbd6" stroke-width="2"/><path d="m-34-46h14m0 3h-14m53 14h14m0 3H19" stroke="#f7ead1" stroke-width="2"/><ellipse cx="-27" cy="-39" rx="5" ry="2" fill="none" stroke="#f1b75f"/><ellipse cx="26" cy="-21" rx="5" ry="2" fill="none" stroke="#f1b75f"/>
    <path class="court-floodlight" d="M-46-19v-40h12m78 63v-40H31" fill="none" stroke="#b7e5f4" stroke-width="2"/>
    <path d="m-47 0 26 13v8l-26-13Zm2 7 26 13v5l-26-13Z" fill="#9bab9f" stroke="#d7d1ae"/>
    <text class="landmark-label court-label" y="46">潮汐一號</text><ellipse class="selection-ring" cy="-8" rx="51" ry="42"/><rect class="hit-area" x="-52" y="-50" width="104" height="117"/>`;}
  const PEOPLE=[
    {id:"fan-ticket",area:"arena",look:"jersey",jersey:"warriors",route:[[350,425],[320,398],[285,375],[264,367],[285,375],[320,398]],speed:12,wait:1300,delay:0},
    {id:"fan-cap",area:"arena",look:"cap",jersey:"lakers",route:[[313,412],[300,388],[287,372],[300,388]],speed:10,wait:2100,delay:1100},
    {id:"fan-bag",area:"arena",look:"bag",jersey:"warriors",route:[[340,432],[329,413],[307,391],[329,413]],speed:13,wait:1600,delay:2300},
    {id:"pier-walker",area:"pier",look:"cap",jersey:"knicks",route:[[293,679],[266,669],[237,651],[210,640],[237,651],[266,669]],speed:10,wait:2500,delay:300},
    {id:"pier-bag",area:"pier",look:"bag",jersey:"celtics",route:[[145,330],[128,293],[353,192],[128,293],[145,330],[299,573],[280,645],[254,680],[280,645],[299,573]],speed:14,wait:3100,delay:1700},
    {id:"pier-bench",area:"pier",look:"sit",jersey:"bulls",route:[[224,699]],speed:0,wait:0,delay:0},
    {id:"court-ball",area:"court",look:"ball",jersey:"warriors",route:[[397,739],[383,730],[365,714],[383,730]],speed:11,wait:900,delay:700},
    {id:"court-dribble",area:"court",look:"dribble",jersey:"clippers",route:[[353,697]],speed:0,wait:0,delay:0},
    {id:"court-seat-a",area:"court",look:"sit",jersey:"heat",route:[[311,722]],speed:0,wait:0,delay:0},
    {id:"court-seat-b",area:"court",look:"sit",jersey:"bucks",route:[[324,729]],speed:0,wait:0,delay:0}
  ];
  const modeFor=match=>!match?.isHome?"ambient":({scheduled:"enter",live:"live",final:"exit"}[match.state]||"ambient");
  const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function createCrowd(){return {mode:"ambient",elapsed:0,people:PEOPLE.map(p=>({...p,position:{x:p.route[0][0],y:p.route[0][1]},path:p.route.map(([x,y])=>({x,y})),index:1%p.route.length,pause:p.delay,walking:false,facing:1}))};}
  function advanceCrowd(crowd,delta,match,{active=true,reducedMotion=false,overview=false}={}){
    const mode=modeFor(match);
    if(mode!==crowd.mode){for(const p of crowd.people.filter(p=>p.area==="arena")){p.path=(mode==="exit"?[...p.route].reverse():p.route).map(([x,y])=>({x,y}));let nearest=0;for(let i=1;i<p.path.length;i++)if(near(p.position,p.path[i])<near(p.position,p.path[nearest]))nearest=i;p.index=nearest;p.pause=0;}crowd.mode=mode;}
    if(active&&!reducedMotion){crowd.elapsed+=Math.max(0,delta);for(const p of crowd.people){let ms=Math.max(0,delta),guard=0;p.walking=false;
      while(ms>0&&p.speed>0&&p.path.length>1&&guard++<100){if(p.pause>0){const used=Math.min(ms,p.pause);p.pause-=used;ms-=used;continue;}
        const goal=p.path[p.index],length=near(p.position,goal),speed=p.speed*(p.area==="arena"&&["enter","exit"].includes(mode)?1.25:1),needed=length/speed*1000;
        if(needed<=ms){p.position={...goal};ms-=needed;p.index=(p.index+1)%p.path.length;p.pause=p.wait;}else{const t=ms/needed,dx=goal.x-p.position.x;p.position={x:p.position.x+(goal.x-p.position.x)*t,y:p.position.y+(goal.y-p.position.y)*t};if(Math.abs(dx)>.1)p.facing=dx<0?-1:1;p.walking=true;ms=0;}
      }
    }}else for(const p of crowd.people)p.walking=false;
    return crowd.people.map((p,i)=>({id:p.id,area:p.area,look:p.look,jersey:p.jersey,...p.position,facing:p.facing,walking:p.walking,
      visible:(!overview||[0,3,7].includes(i))&&!(mode==="live"&&p.area==="arena"&&i>0),bob:p.walking?Math.sin(crowd.elapsed/160+i)*1.1:0,
      dribble:p.look==="dribble"&&active&&!reducedMotion?Math.abs(Math.sin(crowd.elapsed/180))*7:0}));
  }
  function npcSVG(person,F){let art=F.avatarSVG({...F.DEFAULT_AVATAR,nickname:"模擬路人",jersey:person.jersey,number:"",hair:person.look==="cap"?"short":"curls",headband:"none"},{pose:["ball","dribble"].includes(person.look)?"ball":"stand"});
    if(person.look==="cap")art=art.replace("</svg>",'<path d="M73 58q3-39 48-38 45 0 48 38l-48-7-48 7m42-6 64 12-8 8-57-12Z" fill="#e6ca87" stroke="#4f626a" stroke-width="3"/></svg>');
    if(person.look==="bag")art=art.replace('<g data-layer="arms"','<path d="m154 137 25 10 4 56-30 5Z" fill="#c79865" stroke="#3a535c" stroke-width="4"/><g data-layer="arms"');
    if(person.look==="sit")art=art.replace("M100 226v45m40-45v45","M100 226h20v38m20-38h20v38");
    return art;
  }
  return {STYLE,BAY_IDS,PEOPLE,groundSVG,lightsSVG,foregroundSVG,arenaGraphic,courtGraphic,modeFor,createCrowd,advanceCrowd,npcSVG};
});
