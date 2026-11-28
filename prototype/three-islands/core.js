/* Shared IDs and road graph; no renderer or writes to production save keys. */
(function(r,f){const api=f(typeof module==='object'&&module.exports?{A:require('../../assets/archipelago-core.js'),C:require('../../assets/island-core.js'),E:require('../../assets/explorer-core.js'),F:require('../../assets/fan-core.js'),S:require('../../assets/sights-core.js'),M:require('../../assets/memory-core.js'),Shop:require('../../assets/shop-core.js')}:{A:r.NBAArchipelago,C:r.NBAIsland,E:r.NBAExplorer,F:r.NBAFan,S:r.NBASights,M:r.NBAMemory,Shop:r.NBAShop});if(typeof module==='object'&&module.exports)module.exports=api;else r.NBA3DCore=api;})(globalThis,function({A,C,E,F,S,M,Shop}){
  const DETAIL_TEAMS=['warriors','lakers','bulls'],SAVE_KEY='nba-policy-island:prototype3d:v1',SCALE=.1;
  const PALETTE={sea:'#367d95',deep:'#225269',shore:'#d8ca9b',grass:'#93b29a',cliff:'#607d73',stone:'#c6cec1',navy:'#18364b',blue:'#2867b2',gold:'#eac45c',orange:'#c58051',wood:'#b29267',leaf:'#397456',bark:'#73533e',window:'#a7d6df',warm:'#ffe2a0',brick:'#aa7569',white:'#eee7cf'};
  const worldToScene=p=>({x:p.x*SCALE,y:2.2,z:p.y*SCALE});
  const sceneToWorld=p=>({x:p.x/SCALE,y:p.z/SCALE});
  const all=[...C.TEAMS.map(p=>({...p,kind:'nba'})),...C.COURTS.map(p=>({...p,kind:'court'})),...Shop.SHOPS,...C.ENCOUNTERS.map(p=>({...p,kind:'encounter'})),...S.SIGHTS.filter(p=>p.photo).map(p=>({...p,kind:'sight'})),...M.ENTRANCES.map(p=>({...p,kind:'memory'}))];
  function destinations(teamId){if(!C.TEAMS.some(t=>t.id===teamId))throw Error('Unknown team');return all.filter(p=>A.owner(p.id)?.teamId===teamId).map(p=>({id:p.id,kind:p.kind,name:p.name||p.title||p.point,entrance:{...p.entrance},action:p.kind==='court'?'開始練習':p.kind==='shop'?'進入商店':p.kind==='nba'?'開啟球館':'前往探索'}));}
  function getDestination(id){const p=all.find(p=>p.id===id);return p?{...p,entrance:{...p.entrance}}:null;}
  function readAvatar(storage){try{const p=JSON.parse(storage?.getItem(F.AVATAR_KEY)||'null');return F.normalizeAvatar(p?.avatar);}catch{return F.normalizeAvatar();}}
  function readState(storage){let value;try{value=JSON.parse(storage?.getItem(SAVE_KEY)||'null');}catch{}const id=value?.version===1&&getDestination(value.locationId)&&E.ROAD_NODES[value.locationId]?value.locationId:'warriors';const owner=A.owner(id);return {version:1,teamId:C.TEAMS.some(t=>t.id===value?.teamId)?value.teamId:owner?.teamId||'warriors',locationId:id,theme:value?.theme==='night'?'night':'day',position:E.entrance(id)};}
  function saveState(storage,state){try{storage?.setItem(SAVE_KEY,JSON.stringify({version:1,teamId:state.teamId,locationId:state.locationId,theme:state.theme}));return Boolean(storage);}catch{return false;}}
  function cameraFrame(teamId,overview=false){const island=A.getIsland(teamId);if(!island)throw Error('Unknown team');return overview?{x:180,z:112.5,span:425}:{x:(island.x+(teamId==='warriors'?15:0))*SCALE,z:(island.y+(teamId==='warriors'?-5:10))*SCALE,span:teamId==='warriors'?55:51};}
  function legacyCommand(kind,id,action='open'){
    if(kind==='fan')return {select:null,click:'my-fan'};
    if(kind==='cart')return {select:null,click:'shop-cart-open'};
    const p=getDestination(id);if(!p||p.kind!==kind)throw Error('Unknown feature');
    const select=kind==='shop'?'shop-go-'+A.owner(id).teamId:kind==='memory'?'landmark-'+id:'list-'+id;
    const click=kind==='shop'?'shop-enter':action==='policy'&&id==='warriors'?'policy-launch':action==='photo'&&kind==='nba'?'find-star':null;
    return {select,click,id,kind};
  }
  function quality(mode,width,dpr=1){const low=mode==='low'||mode==='auto'&&width<760;return {low,pixelRatio:low?.75:Math.min(1.25,dpr),shadowSize:low?512:1024,targetFPS:low?30:60,detailBudget:low?1:2};}
  function detailPlan(teamId,overview){return !overview&&DETAIL_TEAMS.includes(teamId)?[teamId]:[];}
  function matchText(teamId,state,fixture){const g=C.gameForTeam(teamId,state,fixture);if(g.state==='idle')return '模擬賽事｜今日無賽事';const names=g.away.shortName+'（客） vs '+g.home.shortName+'（主）';if(g.state==='scheduled')return '模擬賽事｜'+names+'｜'+g.startTime+' 開打（台灣時間）';return (g.state==='live'?'模擬 LIVE｜':'模擬完賽｜')+g.away.shortName+' '+g.awayScore+'：'+g.homeScore+' '+g.home.shortName+(g.period?'｜'+g.period:'');}
  function shouldAnimate({hidden=false,visible=true,legacyOpen=false,reducedMotion=false,overview=false,moving=false,cameraMoving=false}){return !hidden&&visible&&!legacyOpen&&(cameraMoving||moving||!reducedMotion&&!overview);}
  return {DETAIL_TEAMS,SAVE_KEY,SCALE,PALETTE,all,worldToScene,sceneToWorld,destinations,getDestination,readAvatar,readState,saveState,cameraFrame,legacyCommand,quality,detailPlan,matchText,shouldAnimate};
});
