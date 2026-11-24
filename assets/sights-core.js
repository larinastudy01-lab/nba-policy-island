/* 原創微縮美國街景；與 NBA、球場及偶遇資料分開。座標單位同島圖。 */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.NBASights=api;})(globalThis,function(){
  "use strict";
  const A=typeof module==="object"&&module.exports?require("./archipelago-core.js"):globalThis.NBAArchipelago;
  const specs=[
  [
    "golden-gate",
    "金門大橋",
    true,
    "橘紅橋塔與吊索跨過海灣；北側車道、南側步道分流。"
  ],
  [
    "alcatraz",
    "惡魔島",
    false,
    "港外岩島上，層疊的舊建築剪影面向灣區。"
  ],
  [
    "lombard",
    "舊金山九曲花街",
    false,
    "坡道上的連續髮夾彎，兩側花圃沿高差展開。"
  ],
  [
    "hollywood",
    "好萊塢字牌",
    false,
    "白色 HOLLYWOOD 字牌立在洛城岩丘上。"
  ],
  [
    "griffith",
    "格里菲斯天文台",
    false,
    "三座圓頂與對稱門廊，俯瞰洛城街區。"
  ],
  [
    "santa-monica",
    "聖塔莫尼卡碼頭",
    true,
    "木棧橋、遊樂設施和摩天輪延伸到海上。"
  ],
  [
    "grand-canyon",
    "大峽谷",
    false,
    "赤褐岩層沿深谷切開，呈現西南沙地高差。"
  ],
  [
    "vegas",
    "拉斯維加斯歡迎招牌",
    false,
    "菱形復古招牌、星芒與燈泡迎接沙漠公路來客。"
  ],
  [
    "red-rocks",
    "紅岩露天劇場",
    false,
    "兩側紅色巨岩包圍階梯式露天座席。"
  ],
  [
    "reunion",
    "達拉斯重逢塔",
    false,
    "細長塔柱托起網格球體，是南部街區的天際線。"
  ],
  [
    "alamo",
    "阿拉莫",
    false,
    "沙色鐘形山牆、拱門與石造院落。"
  ],
  [
    "gateway-arch",
    "聖路易斯拱門",
    false,
    "纖細不鏽鋼拱線跨在河岸草坪上。"
  ],
  [
    "cloud-gate",
    "芝加哥雲門",
    true,
    "鏡面豆形雕塑坐落湖岸廣場，倒映島上天際線。"
  ],
  [
    "willis",
    "威利斯大廈",
    false,
    "黑色束管式高塔與雙天線，階梯輪廓向上收束。"
  ],
  [
    "navy-pier",
    "海軍碼頭摩天輪",
    false,
    "湖岸長堤上，摩天輪與彩色車廂映向水面。"
  ],
  [
    "liberty",
    "自由女神像",
    true,
    "從主島岸邊眺望持火炬的綠色女神，觀景點不在離島。"
  ],
  [
    "brooklyn",
    "布魯克林大橋",
    false,
    "石造雙塔與扇形纜索跨越東岸水道。"
  ],
  [
    "times-square",
    "時代廣場",
    false,
    "層疊招牌與幾何霓虹屏幕構成原創街角。"
  ],
  [
    "faneuil",
    "波士頓法尼爾廳",
    false,
    "紅磚市集、白色尖塔與三角山牆。"
  ],
  [
    "south-beach",
    "邁阿密南海灘救生站",
    false,
    "粉彩高腳救生站與木階梯面向南端沙灘。"
  ]
];
  const regions={"west":"西岸灣區與洛城","desert":"西南沙地","highland":"西部高地","south":"中南部","lakes":"五大湖岸","east":"東岸街廓","coast":"南端海濱"};
  const SIGHTS=specs.map(([key,name,photo,description])=>{const id='sight-'+key,district=A.owner(id).district;return {id,key,name,district,photo,description,...A.place('sight',id),region:regions[district],asset:'./assets/sights/'+key+'.svg',nightAsset:'./assets/sights/'+key+'-night.svg',pixelAsset:'./assets/pixel/sights/'+key+'.svg',pixelNightAsset:'./assets/pixel/sights/'+key+'-night.svg',color:'#74c5c0'};});
  const get=id=>SIGHTS.find(s=>s.id===id)||null;
  const xml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[c]);
  function art(key,night=false){
    const light=night?"#ffe39b":"#c5e8e4",stone=night?"#728d98":"#d7c9a8";
    const ground='<ellipse cx="124" cy="148" rx="97" ry="25" fill="#082b38" opacity=".27"/>';
    const arts={
      "golden-gate":`<path d="M8 140 221 32l18 15L26 158Z" fill="#344c59"/><path d="M9 134 221 26l18 15L27 152Z" fill="#738486"/><path d="M17 137 229 30" stroke="#e7ca7a" stroke-width="2" stroke-dasharray="9 7"/><path d="M30 153 241 46" stroke="${light}" stroke-width="5"/><g stroke="#c34c36" fill="none"><path d="M58 142V45h25v84M161 89V-5h25v81" stroke-width="8"/><path d="M58 65h25m-25 32h25M161 16h25m-25 30h25" stroke-width="5"/><path d="M4 112Q58 128 58 45Q107 129 161-5Q185 65 237 26" stroke-width="3"/><path d="M23 121v9m16-18v10m58-39v34m15-44v36m15-52v42m16-63v55m56-53v31m16-29v20" stroke-width="1.3"/></g><path d="M57 151v22m27-35v24m78-62v29m25-42v25" stroke="#566267" stroke-width="8"/>`,
      alcatraz:`<path d="m19 136 39-33 100-4 62 40-44 26-130-6Z" fill="#577b78"/><path d="m19 136 27 23 130 6 44-26v13l-43 27-130-7-28-23Z" fill="#34595e"/><path d="m51 108 94-32 53 27-94 34Z" fill="#a9aaa0"/><path d="M51 108v31l53 22v-24l94-34v28l-94 30" fill="#777f7e"/><path d="M104 137v24m15-30v16m17-21v15m17-21v16m17-22v16" stroke="#344c55" stroke-width="5"/><path d="M160 76V41h15v40M158 41h19l-9-12Z" fill="${stone}"/>`,
      lombard:`<path d="m24 140 73-119 111 30-65 115Z" fill="#7d9b69"/><path d="M24 140v15l119 25v-14l65-115v14l-65 115" fill="#596d58"/><path d="M108 28q65 9 19 27t24 27q44 8-18 24t1 27q27 3-14 25" fill="none" stroke="#e5d5b8" stroke-width="15"/><path d="M108 28q65 9 19 27t24 27q44 8-18 24t1 27q27 3-14 25" fill="none" stroke="#a0988c" stroke-width="10"/><path d="m61 74 17-26 13 4-16 26m-34 31 15-25 13 4-15 25m106-25 17-26 12 4-15 26" fill="#b77c7a"/><g fill="#e5a8b3"><circle cx="116" cy="63" r="6"/><circle cx="158" cy="91" r="6"/><circle cx="101" cy="121" r="6"/></g>`,
      hollywood:`<path d="M8 145 46 84l39 17 44-69 39 55 32-20 35 78Z" fill="#7a9272"/><path d="m26 143 47-43 42 14 22-50 40 42 34-17 23 56" fill="#5c7866"/><text x="125" y="101" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="25" fill="#f4efda" transform="rotate(-8 125 100)">HOLLYWOOD</text>`,
      griffith:`<path d="m25 141 96-40 102 44-97 29Z" fill="#84967a"/><path d="M39 124v24l84 20 80-27v-25l-80 22Z" fill="${stone}"/><path d="M30 118 120 83l92 34-89 30Z" fill="#e7d4b1"/><path d="M90 111V77h58v34M86 77a33 32 0 0 1 66 0Z" fill="#4f8784"/><path d="M40 120V97h30v23m-33-23a18 18 0 0 1 36 0Zm132 24V97h30v24m-33-24a18 18 0 0 1 36 0Z" fill="#668e85"/><path d="M111 144v18h16v-21" fill="#496577"/>`,
      "santa-monica":`<path d="m10 147 147-74 75 40-147 64Z" fill="#b79468"/><path d="m15 153 147-72m-130 80 147-72m-130 80 147-72" stroke="#d3b582" stroke-width="2"/><path d="M37 161v16m55-40v24m109-39v24" stroke="#6a7062" stroke-width="7"/>${wheel(151,69,45,light)}<path d="m42 117 28-14 24 13-28 15Z" fill="#d3736d"/><path d="M42 117v23l24 10v-19l28-15v23l-28 11" fill="#a9ccc0"/>`,
      "grand-canyon":`<path d="m12 115 46-63 48 10 31-22 84 34 15 68-69 24-48-26-51 29Z" fill="#c38e65"/><path d="m12 115 56 22 51-27 48 28 69-31v35l-69 24-48-26-51 29Z" fill="#966350"/><path d="m38 112 35-30 51 12 41-21 38 19-36 45-43-25-51 26Z" fill="#694e48"/><path d="m17 121 47 21m-39-35 39 17m106 17 57-25m-56 37 59-25" stroke="#e4ad79" stroke-width="4"/>`,
      vegas:`<path d="M83 153V65m76 88V65" stroke="#7b929b" stroke-width="7"/><path d="m26 79 94-51 97 50-97 49Z" fill="#f3deb4" stroke="#cf6e50" stroke-width="5"/><text x="120" y="71" text-anchor="middle" font-size="15" fill="#be534b" font-weight="bold">WELCOME</text><text x="120" y="91" text-anchor="middle" font-size="19" fill="#306a81" font-weight="bold">LAS VEGAS</text><path d="m120 8 5 13 14 1-11 9 4 14-12-8-12 8 4-14-11-9 14-1Z" fill="#e5ad4f"/><path d="M45 79 120 40l77 39-77 38Z" fill="none" stroke="${light}" stroke-width="3" stroke-dasharray="2 7"/>`,
      "red-rocks":`<path d="m18 140 22-99 34 10 5 91m86 8 6-124 34 20 20 92" fill="#ae6551"/><path d="m18 140 22-99 13 12-9 102m127-129 14 25 3 96" fill="#d18c66"/><path d="m66 93 43-25 57 31-57 41Z" fill="#d7b28a"/><path d="m63 108 46 25 60-33m-108 21 48 26 62-34m-113 20 51 27 65-35" stroke="#8f755e" stroke-width="5" fill="none"/>`,
      reunion:`<path d="m45 147 75-27 73 28-76 28Z" fill="#91a99c"/><path d="M112 138V63h13v78" fill="#a3afb0"/><circle cx="119" cy="45" r="33" fill="#7c929d" stroke="${stone}" stroke-width="3"/><ellipse cx="119" cy="45" rx="15" ry="33" fill="none" stroke="${light}"/><path d="M88 35h62m-62 20h62m-31-43v66" stroke="${light}" fill="none"/>`,
      alamo:`<path d="M29 145V81h47V63q23 3 23-15h43q0 18 24 15v18h44v64Z" fill="${stone}"/><path d="M29 145v10h181v-10" fill="#a58d76"/><path d="M101 145v-33q20-28 39 0v33" fill="#677274"/><path d="M45 97h18v21H45m131-21h18v21h-18" fill="#8e8b7e"/><path d="M80 82h82M90 93h62" stroke="#c1ae8d" stroke-width="4"/>`,
      "gateway-arch":`<path d="m20 147 92-29 104 31-94 29Z" fill="#8aab91"/><path d="M55 148Q119-112 185 148h-15Q119-65 71 149Z" fill="#ccd5d2"/><path d="M55 148Q119-112 185 148" fill="none" stroke="#eff0db" stroke-width="3"/>`,
      "cloud-gate":`<path d="m18 130 96-38 114 46-99 36Z" fill="#c8c6b1"/><path d="M49 113C37 70 85 48 116 69c32-30 86-7 85 30 1 29-34 44-52 39-15-4-8-23-28-23-20 1-14 27-38 22-14-3-29-11-34-24Z" fill="#a9c7cb" stroke="#e3e5d7" stroke-width="2"/><path d="M53 110q40-34 70-18t75-1q-12 39-49 35-7-19-28-11-17 20-38 18Z" fill="#627f91"/><path d="M62 87q27-25 52-9m18-3q33-15 49 8" fill="none" stroke="#e5f0e8" stroke-width="6"/>`,
      willis:`<path d="m49 146 65-27 78 30-69 29Z" fill="#9aa99d"/><path d="M66 140V53l28-10V15l29-11 32 14v37l28 12v76l-61 21Z" fill="#344b5c"/><path d="M123 4v160l60-21V67l-28-12V18Z" fill="#243849"/><path d="M104 12V-9m33 20V-5" stroke="#9ab6c2" stroke-width="2"/><path d="M77 65v73m27-112v120m32-113v112m28-64v54" stroke="${light}" stroke-width="3" stroke-dasharray="2 6"/>`,
      "navy-pier":`<path d="m12 148 145-58 76 32-148 55Z" fill="#bba783"/>${wheel(132,75,57,light)}<path d="m26 142 44-20 30 13-43 20Z" fill="#b66f67"/>`,
      liberty:`<path d="m70 141 47-21 50 23-48 25Z" fill="#b6b39b"/><path d="M85 137v-31h65v34l-31 16Z" fill="${stone}"/><path d="m99 106 7-47 12-13 16 15 8 44Z" fill="#72ad9b"/><circle cx="121" cy="37" r="11" fill="#93bbaa"/><path d="m102 62-15-34-7-3 5-9 11 8 18 32m17 8 25 15-8 10-25-11M113 27l-7-10m12 8V12m9 15 6-13" fill="#78ab98" stroke="#78ab98" stroke-width="4"/><path d="M85 14v-8m-7-1 7-13 8 13Z" fill="#e8bd64"/>`,
      brooklyn:`<path d="m10 144 201-95 23 21-200 94Z" fill="#899898"/><g fill="${stone}" stroke="#9a9184" stroke-width="2"><path d="M53 143V42h38v81H79V66q-6-13-12 0v70Z"/><path d="M154 94V-6h38v83h-12V18q-6-13-12 0v69Z"/></g><path d="M9 135 59 43 158-5 230 63M59 43l122 38M158-5 73 131" fill="none" stroke="#b8c0b4" stroke-width="1.5"/>`,
      "times-square":`<path d="m18 147 94-37 112 38-103 31Z" fill="#6b838a"/><path d="M39 133V42h56v108m34-5V11l57 22v108" fill="#40546b"/><path d="M45 53h43v29H45m1 8h42v31H46" fill="#d57b94"/><path d="M135 36h43v37h-43m0 9h43v34h-43" fill="#65b6c3"/><text x="67" y="73" text-anchor="middle" font-size="14" fill="#fff2c0">PLAY</text><text x="155" y="61" text-anchor="middle" font-size="12" fill="#143954">NBA</text><path d="m99 151 18-38 12 32Z" fill="#e8c072"/>`,
      faneuil:`<path d="M31 141V77l82-29 90 38v59l-85 23Z" fill="#b47161"/><path d="m23 78 89-43 99 48-92 27Z" fill="#607c7c"/><path d="M102 83V28h30v53m-34-53 19-25 20 25Z" fill="#dedac0"/><path d="M117 4V-8" stroke="#d9b46b" stroke-width="3"/><path d="M47 104v23m23-31v26m22-34v28m52-17v26m22-19v26m20-19v25" stroke="#e4d7b6" stroke-width="7"/>`,
      "south-beach":`<path d="m15 148 103-39 106 36-107 35Z" fill="#d3bc8d"/><path d="M69 137v-32m73 42v-29m35 15v-33" stroke="#8a9180" stroke-width="5"/><path d="m59 78 54-21 74 29-54 22Z" fill="#e3b07c"/><path d="M59 78v33l74 27v-30l54-22v30l-54 22" fill="#ce8f9e"/><path d="m52 77 61-31 84 34-64 32Z" fill="#83b7b1"/><path d="m133 138-14 18-30-11m40 2-30-12m38 3-30-12" fill="none" stroke="#d5d2b8" stroke-width="4"/><rect x="77" y="87" width="30" height="18" fill="#4b7f98"/>`
    };
    if(!arts[key])throw new RangeError("Unknown sight art");
    return ground+arts[key]+(night?'<ellipse cx="121" cy="151" rx="48" ry="9" fill="#ffe0a1" opacity=".17"/>':"");
  }
  function wheel(x,y,r,color){return `<g stroke="${color}" fill="none"><circle cx="${x}" cy="${y}" r="${r}" stroke-width="3"/>${Array.from({length:10},(_,i)=>{const a=i*Math.PI/5;return `<path d="M${x} ${y}L${x+Math.cos(a)*r} ${y+Math.sin(a)*r}"/><circle cx="${x+Math.cos(a)*r}" cy="${y+Math.sin(a)*r}" r="5" fill="${i%2?"#d68878":"#e0b765"}"/>`;}).join("")}<path d="m${x-25} 146 ${25} ${y-146} 25 ${146-y}" stroke-width="4"/></g>`;}
  function svg(id,night=false){const s=get(id);if(!s)throw new RangeError("Unknown sight");return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -15 250 200" role="img"><title>${xml(s.name)}・原創微縮街景${night?"夜景":""}</title>${art(s.key,night)}</svg>`;}
  function photoBackdrop(id,night=false){const s=get(id);if(!s?.photo)throw new RangeError("Not a scenic photo point");return `<rect width="960" height="640" fill="${night?"#172e49":"#92bec8"}"/><path d="M0 310Q200 270 410 320T960 300V640H0Z" fill="${night?"#244c60":"#4c8f9e"}"/><path d="M0 440 360 340 960 480V640H0Z" fill="${night?"#5b6e72":"#9fa99b"}"/><path d="M0 470 360 370 960 510M0 500l360-100 600 140" stroke="#c2bca0" fill="none" stroke-width="4"/><svg x="185" y="25" width="650" height="440" viewBox="0 -15 250 200">${art(s.key,night)}</svg>`;}
  function groundSVG(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" role="img"><title>金門海灣水道、橋端步行平台與四處跑車展示鋪面</title><path d="M90 230Q192 157 318 151L331 193Q221 253 127 309L90 292Z" fill="#246071" stroke="#96b3a0" stroke-width="5"/><path d="m87 284 37-19 34 26-22 30-49-20Z" fill="#4d6f72"/><path d="m87 276 37-19 34 26-22 30-49-20Z" fill="#a3b3a1" stroke="#d7d0ab" stroke-width="2"/><path d="M98 292 125 278m-20 24 26-14M170 239l24-10m-17 16 24-10m30-39 28-12" stroke="#7cb3bc" stroke-width="2" opacity=".65"/><g fill="#a6aca0" stroke="#d4c8a4" stroke-width="2"><path d="m288 263 31-16 39 17-32 17Z"/><path d="m156 575 31-15 35 16-32 16Z"/><path d="m178 630 30-15 34 16-31 16Z"/><path d="m678 365 31-16 38 17-32 17Z"/></g><g fill="none" stroke="#678184"><path d="m292 266 27-14 34 15m-276 282 22-11 27 13m-28 63 23-11 24 12m452-270 24-12 27 13"/></g></svg>`;}
  return {SIGHTS,get,art,svg,photoBackdrop,groundSVG};
});
