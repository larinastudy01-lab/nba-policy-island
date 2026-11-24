"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const B=require("../assets/bay-scene.js"),E=require("../assets/explorer-core.js"),C=require("../assets/island-core.js"),F=require("../assets/fan-core.js"),P=require("../assets/policy-core.js"),G=require("../assets/games-core.js"),T=require("../assets/practice-core.js");
const root=path.resolve(__dirname,"..");
test("bay has a shared scale/light standard, 10 independent simulated visitors and five local SVG layers",()=>{
  assert.ok(B.STYLE.waterLevel<B.STYLE.pierLevel&&B.STYLE.pierLevel<B.STYLE.plazaLevel);assert.ok(B.STYLE.personWidth<B.STYLE.playerWidth);
  assert.equal(B.PEOPLE.length,10);assert.equal(new Set(B.PEOPLE.map(p=>p.id)).size,10);assert.deepEqual(["arena","pier","court"].map(a=>B.PEOPLE.filter(p=>p.area===a).length),[3,3,4]);
  for(const [file,markup] of [["bay-ground.svg",B.groundSVG()],["bay-lights.svg",B.lightsSVG()],...["arena","pier","court"].map(part=>[`bay-foreground-${part}.svg`,B.foregroundSVG(part)])])assert.equal(fs.readFileSync(path.join(root,"assets",file),"utf8"),markup);
});
test("Warriors -> bay boardwalk -> Tidal has connected explicit pedestrian junctions and a wooden bridge",()=>{
  const route=E.roadPath(E.entrance("warriors"),"meet-pier");assert.ok(route.some(p=>p.x===E.ROAD_NODES["bay-shore"].x&&p.y===E.ROAD_NODES["bay-shore"].y));
  assert.deepEqual(E.roadPath(E.entrance("meet-pier"),"harbor-01").at(-1),E.entrance("harbor-01"));
  assert.ok(E.ROAD_EDGES.some(e=>e.from==="meet-pier"&&e.to==="harbor-01"&&e.bridge&&e.surface==="wood"));
});
test("away Warriors never trigger home crowd flow; home fixture shares scores and swaps glow/night eligibility",()=>{
  for(const status of C.GAME_STATES)assert.equal(B.modeFor(C.gameForTeam("warriors",status,"away")),"ambient");
  for(const [status,mode] of [["scheduled","enter"],["live","live"],["final","exit"]])assert.equal(B.modeFor(C.gameForTeam("warriors",status,"home")),mode);
  const home=C.gameForTeam("warriors","live","home"),away=C.gameForTeam("lakers","live","home");assert.equal(home.homeScore,away.homeScore);assert.equal(home.awayScore,away.awayScore);assert.equal(home.glowing,true);assert.equal(away.glowing,false);
  assert.equal(F.nightAvailable("warriors","live","home"),true);assert.equal(F.nightAvailable("lakers","live","home"),false);
  const photo=F.createPhoto("warriors",F.DEFAULT_AVATAR,{background:"night"},"live","home");assert.equal(F.normalizePhoto(photo).background,"night");assert.equal(C.gameForTeam("warriors","final","home").glowing,false);
});
test("crowd moves continuously, turns, pauses and resumes without teleporting when a match mode changes",()=>{
  const crowd=B.createCrowd(),match=C.gameForTeam("warriors","scheduled","home");let previous=B.advanceCrowd(crowd,0,match),moving=false,paused=false,left=false,right=false;
  for(let i=0;i<1800;i++){const frame=B.advanceCrowd(crowd,80,match);for(let j=0;j<frame.length;j++){const p=frame[j];assert.ok(Math.hypot(p.x-previous[j].x,p.y-previous[j].y)<=2.1,`teleport ${p.id}`);moving||=p.walking;paused||=!p.walking;left||=p.facing===-1;right||=p.facing===1;}previous=frame;}
  assert.ok(moving&&paused&&left&&right);const before=previous.map(p=>[p.x,p.y]);const after=B.advanceCrowd(crowd,0,C.gameForTeam("warriors","final","home"));assert.deepEqual(after.map(p=>[p.x,p.y]),before);
});
test("overview/reduced-motion/background crowd stays still; LIVE home leaves eight visible people",()=>{
  const crowd=B.createCrowd(),match=C.gameForTeam("warriors","live","home"),before=crowd.people.map(p=>({...p.position}));
  const overview=B.advanceCrowd(crowd,99999,match,{active:false,overview:true});assert.equal(overview.filter(p=>p.visible).length,3);assert.deepEqual(crowd.people.map(p=>p.position),before);
  const reduced=B.advanceCrowd(crowd,99999,match,{active:true,reducedMotion:true});assert.equal(reduced.filter(p=>p.visible).length,8);assert.ok(reduced.every(p=>!p.walking&&p.dribble===0));assert.deepEqual(crowd.people.map(p=>p.position),before);
});
for(const [plan,students,general,expected] of [["regular",0,60,false],["reserved",20,40,false],["lottery",15,45,true]])test(`60-seat ${plan} matches policy numbers and expectation labels`,()=>{
  const layout=P.seatAllocation(plan);assert.equal(layout.seats.length,60);assert.equal(new Set(layout.seats.map(s=>s.id)).size,60);assert.equal(layout.seats.filter(s=>s.type==="student").length,students);assert.equal(layout.seats.filter(s=>s.type==="general").length,general);assert.equal(layout.expected,expected);if(expected)assert.match(layout.description,/期望值/);
});
for(const rules of G.GAMES)test(`${rules.id}: unscored tutorial accepts controls, expires, and never transfers points to a fresh formal game`,()=>{
  const trial=T.createTutorial(rules.id,{seed:4});trial.start(0);let accepted=false;
  for(let time=0;time<=12000;time+=120){const snapshot=trial.tick(time);assert.equal(snapshot.score,0);assert.equal(snapshot.hits,0);assert.equal(snapshot.attempts,0);assert.equal(snapshot.result,null);
    const s=snapshot.child||snapshot;const choices=[{type:"choose",value:0},{type:"left"},{type:"right"},{type:"aim",value:-s.wind},{type:"shoot"},{type:"up"},{type:"wait"}];
    for(const action of choices){const reply=trial.act(action,time);accepted||=reply.accepted;assert.equal(reply.result,null);}
  }
  assert.ok(accepted,rules.id);assert.equal(trial.tick(13000).phase,"finished");
  const formal=G.createGame(rules.id,{seed:4});formal.start(20000);const clean=formal.tick(20000);assert.equal(clean.hits,0);assert.equal(clean.score,0);assert.equal(clean.elapsedMs,0);assert.equal(clean.durationMs,rules.durationMs);
});
