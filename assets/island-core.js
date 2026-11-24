"use strict";
(function(root,factory){const api=factory(typeof module!=="undefined"&&module.exports?require("./games-core.js"):root.NBAGames);if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.NBAIsland=api;})(typeof globalThis!=="undefined"?globalThis:this,function(Games){
  const MAP = {width:1600,height:1000};
  const TEAMS = [
    {id:"warriors",name:"金州勇士",shortName:"勇士",abbr:"GSW",englishName:"Golden State Warriors",region:"西岸海灣",color:"#2464b9",accent:"#f3c45b",x:255,y:350},
    {id:"lakers",name:"洛杉磯湖人",shortName:"湖人",abbr:"LAL",englishName:"Los Angeles Lakers",region:"洛城街區",color:"#65429a",accent:"#efc451",x:235,y:510},
    {id:"clippers",name:"洛杉磯快艇",shortName:"快艇",abbr:"LAC",englishName:"Los Angeles Clippers",region:"洛城街區",color:"#235482",accent:"#f17878",x:410,y:540},
    {id:"nuggets",name:"丹佛金塊",shortName:"金塊",abbr:"DEN",englishName:"Denver Nuggets",region:"西部高地",color:"#245375",accent:"#f2ca65",x:545,y:345},
    {id:"mavericks",name:"達拉斯獨行俠",shortName:"獨行俠",abbr:"DAL",englishName:"Dallas Mavericks",region:"南部街區",color:"#286e9e",accent:"#b7d8eb",x:750,y:675},
    {id:"bulls",name:"芝加哥公牛",shortName:"公牛",abbr:"CHI",englishName:"Chicago Bulls",region:"五大湖區",color:"#9c3649",accent:"#f9bbc1",x:1000,y:460},
    {id:"celtics",name:"波士頓塞爾提克",shortName:"塞爾提克",abbr:"BOS",englishName:"Boston Celtics",region:"東岸街區",color:"#27755c",accent:"#b9e3b3",x:1390,y:320},
    {id:"knicks",name:"紐約尼克",shortName:"尼克",abbr:"NYK",englishName:"New York Knicks",region:"東岸街區",color:"#2965a0",accent:"#f3a064",x:1370,y:480},
    {id:"spurs",name:"聖安東尼奧馬刺",shortName:"馬刺",abbr:"SAS",englishName:"San Antonio Spurs",region:"南部街區",color:"#475866",accent:"#d5dee5",x:775,y:810},
    {id:"thunder",name:"奧克拉荷馬雷霆",shortName:"雷霆",abbr:"OKC",englishName:"Oklahoma City Thunder",region:"內陸平原",color:"#287aa9",accent:"#f2a454",x:755,y:505},
    {id:"suns",name:"鳳凰城太陽",shortName:"太陽",abbr:"PHX",englishName:"Phoenix Suns",region:"西南沙漠",color:"#73559b",accent:"#f7a653",x:505,y:680},
    {id:"timberwolves",name:"明尼蘇達灰狼",shortName:"灰狼",abbr:"MIN",englishName:"Minnesota Timberwolves",region:"北部林地",color:"#294f70",accent:"#a4ce70",x:800,y:205},
    {id:"bucks",name:"密爾瓦基公鹿",shortName:"公鹿",abbr:"MIL",englishName:"Milwaukee Bucks",region:"五大湖區",color:"#326b55",accent:"#e6d6aa",x:1000,y:320},
    {id:"sixers",name:"費城 76 人",shortName:"76 人",abbr:"PHI",englishName:"Philadelphia 76ers",region:"東岸街區",color:"#3269ab",accent:"#f4a0a8",x:1300,y:625},
    {id:"heat",name:"邁阿密熱火",shortName:"熱火",abbr:"MIA",englishName:"Miami Heat",region:"南端海濱",color:"#963b52",accent:"#f1bc68",x:1250,y:865},
    {id:"raptors",name:"多倫多暴龍",shortName:"暴龍",abbr:"TOR",englishName:"Toronto Raptors",region:"東北湖岸",color:"#8d4053",accent:"#d9c2dc",x:1180,y:205}
  ];
  const courtGroups = [
    {prefix:"harbor",region:"港邊",color:"#367d94",names:["潮汐一號","燈塔半場","海風球場","貨櫃碼頭","日落棧橋"]},
    {prefix:"park",region:"公園",color:"#478668",names:["榕樹球場","綠丘半場","溪畔球場","中央草地","環島花園"]},
    {prefix:"roof",region:"屋頂",color:"#856299",names:["天際一號","霓虹天台","雲端半場","東城高台","星光屋頂"]}
  ];
  const cities={warriors:"舊金山",lakers:"洛杉磯",clippers:"洛杉磯",nuggets:"丹佛",mavericks:"達拉斯",bulls:"芝加哥",celtics:"波士頓",knicks:"紐約",spurs:"聖安東尼奧",thunder:"奧克拉荷馬市",suns:"鳳凰城",timberwolves:"明尼亞波利斯",bucks:"密爾瓦基",sixers:"費城",heat:"邁阿密",raptors:"多倫多"};
  TEAMS.forEach(team=>{team.city=cities[team.id];team.arenaId=`arena-${team.id}`;});
  const scenes={harbor:"海風、燈塔與碼頭邊的球框",park:"樹蔭、草地與步道旁的球框",roof:"天際線、樓群與高台上的球框"};
  const publicPositions={harbor:[[350,710],[480,805],[590,875],[960,825],[1400,750]],park:[[405,260],[650,190],[600,470],[920,690],[1030,585]],roof:[[990,170],[1170,410],[1455,600],[1115,745],[860,330]]};
  const COURTS = courtGroups.flatMap(group=>group.names.map((name,i)=>{const id=`${group.prefix}-${String(i+1).padStart(2,"0")}`,game=Games.forCourt(id);return {id,name,region:group.region,type:group.prefix,scene:scenes[group.prefix],color:group.color,x:publicPositions[group.prefix][i][0],y:publicPositions[group.prefix][i][1],gameId:game.id,gameName:game.name};}));
  const ENCOUNTERS = [
    {id:"meet-pier",name:"西岸碼頭步道",region:"島上偶遇",scene:"西岸港灣木棧道、海風與燈塔",type:"pier",color:"#41899b",x:225,y:660},
    {id:"meet-plaza",name:"中央廣場",region:"島上偶遇",scene:"環島路交會的籃球廣場",type:"plaza",color:"#a5824d",x:895,y:575},
    {id:"meet-garden",name:"五大湖畔公園",region:"島上偶遇",scene:"湖岸樹蔭、公園拱門與波光",type:"garden",color:"#4c8a6b",x:1130,y:540}
  ].map(place=>({...place,background:`./assets/encounters/${place.id}.svg`}));
  const MATCHES = [
    {id:"bay-derby",homeId:"lakers",awayId:"warriors",startTime:"11:00",live:{home:74,away:78,period:"第 3 節"},final:{home:101,away:108}},
    {id:"coast-highland",homeId:"clippers",awayId:"nuggets",startTime:"10:30",live:{home:62,away:66,period:"第 3 節"},final:{home:110,away:114}},
    {id:"highland-city",homeId:"mavericks",awayId:"bulls",startTime:"09:30",live:{home:55,away:51,period:"第 2 節"},final:{home:112,away:106}},
    {id:"city-derby",homeId:"celtics",awayId:"knicks",startTime:"08:30",live:{home:89,away:85,period:"第 4 節"},final:{home:119,away:113}},
    {id:"new-city-one",homeId:"spurs",awayId:"thunder",startTime:"09:00",live:{home:64,away:67,period:"第 3 節"},final:{home:104,away:109}},
    {id:"new-city-two",homeId:"suns",awayId:"timberwolves",startTime:"10:00",live:{home:52,away:56,period:"第 2 節"},final:{home:113,away:116}},
    {id:"new-city-three",homeId:"bucks",awayId:"sixers",startTime:"08:00",live:{home:86,away:80,period:"第 4 節"},final:{home:118,away:111}},
    {id:"south-bay",homeId:"heat",awayId:"raptors",startTime:"08:30",live:{home:71,away:70,period:"第 3 節"},final:{home:105,away:103}}
  ];
  const GAME_STATES=["idle","scheduled","live","final"];
  function getLandmark(kind,id){return (kind==="nba"?TEAMS:kind==="court"?COURTS:kind==="encounter"?ENCOUNTERS:[]).find(item=>item.id===id)||null;}
  function gameForTeam(teamId,state="live"){
    if(!GAME_STATES.includes(state)||!TEAMS.some(team=>team.id===teamId))throw new RangeError("Unknown team or game state.");
    const match=MATCHES.find(game=>game.homeId===teamId||game.awayId===teamId);
    if(!match){const team=TEAMS.find(t=>t.id===teamId);return {id:null,state:"idle",homeId:teamId,awayId:null,home:team,away:null,homeScore:null,awayScore:null,period:null,startTime:null,isHome:true,glowing:false};}
    const score=state==="live"?match.live:state==="final"?match.final:null;
    return {id:match.id,state,homeId:match.homeId,awayId:match.awayId,home:TEAMS.find(t=>t.id===match.homeId),away:TEAMS.find(t=>t.id===match.awayId),homeScore:score?.home??null,awayScore:score?.away??null,period:state==="live"?match.live.period:null,startTime:match.startTime,isHome:match.homeId===teamId,glowing:state==="live"&&match.homeId===teamId};
  }
  function createIslandState(){return {kind:"nba",id:"warriors",filter:"nba",gameState:"live"};}
  function selectLandmark(state,kind,id){if(!getLandmark(kind,id))throw new RangeError("Unknown landmark.");state.kind=kind;state.id=id;state.filter=kind;return state;}
  function setGameState(state,value){if(!GAME_STATES.includes(value))throw new RangeError("Unknown game state.");state.gameState=value;}
  function createShootingGame({durationMs=30000,cooldownMs=500,cycleMs=1200}={}){
    let startsAt=null,phase="ready",hits=0,attempts=0,lastShot=-Infinity;
    function snapshot(now){const elapsed=startsAt===null?0:Math.max(0,now-startsAt);const remaining=startsAt===null?durationMs:Math.max(0,durationMs-elapsed);if(startsAt!==null&&now>=startsAt+durationMs)phase="finished";else if(startsAt!==null&&phase!=="finished")phase=now<startsAt?"countdown":"playing";const cycle=(elapsed%cycleMs)/cycleMs;return {phase,hits,attempts,startsAt,endsAt:startsAt===null?null:startsAt+durationMs,remainingMs:phase==="finished"?0:remaining,aim:cycle<.5?cycle*2:(1-cycle)*2};}
    return {
      start(at){if(!Number.isFinite(at))throw new TypeError("Invalid start time.");startsAt=at;phase="countdown";hits=0;attempts=0;lastShot=-Infinity;return snapshot(at);},
      tick(now){return snapshot(now);},
      shoot(now){const state=snapshot(now);if(state.phase!=="playing"||now-lastShot<cooldownMs)return {...state,accepted:false,hit:false};lastShot=now;attempts+=1;const hit=Math.abs(state.aim-.5)<=.14;if(hit)hits+=1;return {...snapshot(now),accepted:true,hit};},
      reset(){startsAt=null;phase="ready";hits=0;attempts=0;lastShot=-Infinity;return snapshot(0);}
    };
  }
  function resolveScores(players){
    if(players.length!==2)return {type:"pending",winnerId:null};
    const submitted=players.filter(p=>Number.isInteger(p.score)&&p.score>=0);
    if(submitted.length===0)return {type:"no-contest",winnerId:null};
    if(submitted.length===1)return {type:"forfeit",winnerId:submitted[0].user_id};
    if(players[0].score===players[1].score)return {type:"draw",winnerId:null};
    return {type:"win",winnerId:players[0].score>players[1].score?players[0].user_id:players[1].user_id};
  }
  function roomJoinError(room,userId,now=Date.now()){
    if(room.players.some(p=>p.user_id===userId))return "ALREADY_JOINED";
    if(room.expiresAt&&now>=room.expiresAt)return "ROOM_EXPIRED";
    if(room.status!=="waiting")return "ROOM_NOT_WAITING";
    if(room.players.length>=2)return "ROOM_FULL";
    return null;
  }
  function courtActivity(rows,courtId){if(rows===null)return null;const row=rows.find(item=>item.court_id===courtId);return {waiting:Number(row?.waiting_count||0),preparing:Number(row?.preparing_count||0),playing:Number(row?.playing_count||0)};}
  function inviteURL(base,courtId,invite){if(!getLandmark("court",courtId))throw new RangeError("Unknown court.");const url=new URL(base);url.search="";url.searchParams.set("court",courtId);url.searchParams.set("invite",invite);url.hash="play-court";return url.href;}
  function parseInvite(base){const url=new URL(base);const courtId=url.searchParams.get("court");const invite=url.searchParams.get("invite");return getLandmark("court",courtId)&&/^[a-f0-9]{24}$/i.test(invite||"")?{courtId,invite:invite.toLowerCase()}:null;}
  return {MAP,TEAMS,COURTS,ENCOUNTERS,MATCHES,GAME_STATES,getLandmark,gameForTeam,createIslandState,selectLandmark,setGameState,createShootingGame,resolveScores,roomJoinError,courtActivity,inviteURL,parseInvite};
});
