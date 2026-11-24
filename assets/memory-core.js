/* 原創策展文字與資料；史料連結僅供自主查閱，不載入外部影音。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./archipelago-core.js'):root.NBAArchipelago);if(typeof module==='object'&&module.exports)module.exports=api;else root.NBAMemory=api;})(globalThis,function(A){
  'use strict';
  const STORAGE_KEY='nba-policy-island:memories:v1';
  const EVENTS=[
    {id:'memory-lakers-2020',teamId:'lakers',date:'2020-01-26',season:'2019–20',title:'留一處安靜的位置',point:'湖人紀念廣場・紀念牆',presentation:'memorial',form:'靜態紀念牆・自主閱讀',
      text:['2020 年 1 月 26 日，Kobe、女兒 Gianna 與另外七人於直升機事故中罹難。','這座島用九束靜態花朵留出安靜的位置，也悼念同場罹難的另外七人。你可以選擇閱讀，或只是停留後繼續走。'],
      reflection:'留給每一段生命的空間，不需要用分數或任務來衡量。',sources:[{title:'NBA｜Kobe Bryant Tribute',url:'https://www.nba.com/kobe-bryant-tribute'}]},
    {id:'memory-bulls-1998',teamId:'bulls',date:'1998-06-14',season:'1997–98',title:'第六冠前的關鍵跳投',point:'公牛街頭球場・環島花園復刻投籃點',presentation:'shot',form:'投籃位置・可選像素重現',score:'CHI 87：86 UTA',
      text:['1998 年總冠軍賽第六戰，Michael Jordan 的關鍵跳投助公牛以 87：86 勝出，拿下第六冠。','在島上的街頭球場，我們用粉筆位置與一球時機練習回望這個片刻。這不是比賽原場地，也不是 Jordan 生涯最後一次出手。'],
      reflection:'試著留意出手前的等待；你這次的命中或失手，都不會改寫歷史比分。',sources:[{title:'NBA｜1998 Finals：Jordan 的關鍵一球',url:'https://www.nba.com/news/history-finals-moments-michael-jordan-last-shot-1998'}]},
    {id:'memory-warriors-2015',teamId:'warriors',date:'2015-06-16',season:'2014–15',title:'記分板上的 2015 冠軍夜',point:'勇士廣場・冠軍記分板',presentation:'scoreboard',form:'靜態冠軍記分板',score:'GSW 105：97 CLE',
      text:['2015 年 6 月 16 日，勇士在總冠軍賽第六戰以 105：97 擊敗騎士，贏得冠軍。','島上記分板固定留在這一夜。它是歷史展板，與工具列可切換的模擬賽況分開，不會隨今日示範比分改變。'],
      reflection:'一個比分能留下結局；你的球迷記憶裡，還有哪些人與片刻？',sources:[{title:'勇士官方｜2015/06/16 冠軍戰回顧',url:'https://www.nba.com/warriors/gameday/20150616/recap'},{title:'NBA｜2015 Finals Game 6 比賽資料',url:'https://www.nba.com/game/gsw-vs-cle-0041400406'}]},
    {id:'memory-knicks-1970',teamId:'knicks',date:'1970-05-08',season:'1969–70',title:'舊報紙裡的第一冠',point:'尼克街角・舊報紙亭',presentation:'newspaper',form:'原創報紙展板・非報紙原件',score:'NYK 113：99 LAL',
      text:['1970 年總冠軍賽第七戰，Willis Reed 帶傷回到場上；尼克贏下隊史首冠。','這份報紙是島上重新編排的展板，不是當年報紙的掃描或複製。翻讀時，也可以想想：一座城市如何把球隊故事留在街角？'],
      reflection:'展板紀錄比賽故事，並不鼓勵帶傷運動；自己的身體感受同樣值得被照顧。',sources:[{title:'NBA｜Willis Reed 的 1970 第七戰回歸',url:'https://www.nba.com/news/history-finals-moments-hobbled-willis-reed-inspires-knicks-victory-in-game-7'}]},
    {id:'memory-raptors-2019',teamId:'raptors',date:'2019-05-12',season:'2018–19',title:'四次彈框的決勝球',point:'暴龍島・屋頂邊線投籃點',presentation:'shot',form:'投籃位置・可選像素重現',score:'TOR 92：90 PHI',bounces:4,
      text:['2019 年東區準決賽第七戰，Kawhi Leonard 的決勝球彈框四次後落入，暴龍以 92：90 晉級。','島上用簡化的像素球與籃框留下等待落點的感覺。投籃互動只是自選重現，不模擬真實球員能力，也不影響自由探索。'],
      reflection:'球還沒落下之前，你會先看球、看計時器，還是看身旁一起等待的人？',sources:[{title:'NBA｜Raptors 92, Sixers 90 比賽回顧',url:'https://www.nba.com/watch/video/game-recap-raptors-92-sixers-90'},{title:'NBA｜2019 第七戰 Kawhi 決勝球',url:'https://www.nba.com/watch/video/2019-east-semis-game-7-kawhis-shot-vs-76ers?plsrc=nba'}]}
  ].map(e=>({...e,name:e.point,kind:'memory',islandId:'island-'+e.teamId,asset:'./assets/memories/'+e.id+'.svg',...A.place('memory',e.id)}));
  const DRAFT_EVENTS=[
    {id:'memory-shared-cavaliers-warriors',published:false,sourceStatus:'pending',teamIds:['cavaliers','warriors'],entrances:[{id:'memory-reserved-cavaliers',teamId:'cavaliers'},{id:'memory-reserved-warriors',teamId:'warriors'}]},
    {id:'memory-shared-jazz-bulls',published:false,sourceStatus:'pending',teamIds:['jazz','bulls'],entrances:[{id:'memory-reserved-jazz',teamId:'jazz'},{id:'memory-reserved-bulls',teamId:'bulls'}]}
  ];
  // Event identity and physical entrance identity are separate. Publication requires sources.
  function createCatalog(records){const events=records.filter(e=>e.published!==false&&e.sourceStatus!=='pending'&&Array.isArray(e.sources)&&e.sources.length),entrances=[],byEvent=new Map(),byEntrance=new Map();
    for(const e of events){if(byEvent.has(e.id))throw new Error('Duplicate memory event');byEvent.set(e.id,e);
      for(const p of e.entrances||[{id:e.id,teamId:e.teamId,point:e.point}]){if(byEntrance.has(p.id))throw new Error('Duplicate memory entrance');const entry={...e,...p,eventId:e.id,kind:'memory',name:p.point||e.point,asset:p.asset||e.asset,...A.place('memory',p.id)};entrances.push(entry);byEntrance.set(p.id,entry);}}
    return {events,entrances,get:id=>byEvent.get(id)||byEvent.get(byEntrance.get(id)?.eventId)||null,getEntrance:id=>byEntrance.get(id)||null,forEvent:id=>entrances.filter(p=>p.eventId===id)};
  }
  const catalog=createCatalog(EVENTS),get=catalog.get,ENTRANCES=catalog.entrances;
  const RESERVED_ENTRANCES=DRAFT_EVENTS.flatMap(e=>e.entrances.map(p=>({...p,eventId:e.id,published:false,...A.place('memory',p.id)})));
  function normalize(value,records=EVENTS){const lookup=createCatalog(records),rows=value&&value.version===1&&Array.isArray(value.read)?value.read:[],found=new Set(),read=[];for(const p of rows){const event=p&&lookup.get(p.eventId);if(event&&typeof p.readAt==='string'&&Number.isFinite(Date.parse(p.readAt))&&!found.has(event.id)){found.add(event.id);read.push({eventId:event.id,readAt:p.readAt});}}return {version:1,read};}
  function createBook(storage,records=EVENTS){const lookup=createCatalog(records);let data=normalize(null,records),notice='';try{const raw=storage?.getItem(STORAGE_KEY);if(raw)data=normalize(JSON.parse(raw),records);if(!storage)notice='瀏覽器儲存不可用，閱讀紀錄僅保留於本次頁面。';}catch{notice='無法讀取瀏覽器儲存；閱讀紀錄先保留於本次頁面。';}
    return {snapshot:()=>normalize(data,records),notice:()=>notice,has:id=>data.read.some(p=>p.eventId===lookup.get(id)?.id),mark(id,now=Date.now()){const e=lookup.get(id);if(!e)throw new RangeError('Unknown memory');if(!data.read.some(p=>p.eventId===e.id))data.read.push({eventId:e.id,readAt:new Date(now).toISOString()});try{if(!storage)throw new Error('No storage');storage.setItem(STORAGE_KEY,JSON.stringify(data));notice='';}catch{notice='儲存不可用；本次頁面仍可閱讀及回看，重新整理後可能無法保留。';}return normalize(data,records);}};
  }
  function hintVisible(camera,event,position){return Boolean(camera&&camera.level!=='island'&&camera.islandId===event.islandId&&position&&Math.hypot(position.x-event.entrance.x,position.y-event.entrance.y)<82);}
  // 一次出手，8 秒到期；與公共球場及真人成績完全分開。
  function createShot(){let phase='idle',start=0,hit=false;const snapshot=now=>{if(phase==='playing'&&now-start>=8000)phase='timeout';const t=Math.max(0,now-start)%1800/1800;return {phase,hit,aim:t<.5?t*2:2-t*2,remaining:phase==='playing'?Math.max(0,8000-(now-start)):0};};return {snapshot,start(now){start=now;phase='playing';hit=false;return snapshot(now);},shoot(now,manualAim){const s=snapshot(now);if(s.phase!=='playing')return {...s,accepted:false};const aim=Number.isFinite(manualAim)?Math.max(0,Math.min(1,manualAim)):s.aim;hit=aim>=.4&&aim<=.6;phase='finished';return {...snapshot(now),accepted:true,hit,aim};},cancel(){phase='idle';hit=false;}};}
  return {EVENTS,ENTRANCES,DRAFT_EVENTS,RESERVED_ENTRANCES,STORAGE_KEY,get,getEntrance:catalog.getEntrance,forEvent:catalog.forEvent,createCatalog,normalize,createBook,hintVisible,createShot};
});
