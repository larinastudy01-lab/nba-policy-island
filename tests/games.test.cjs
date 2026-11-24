"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const G=require("../assets/games-core.js"),C=require("../assets/island-core.js"),F=require("../assets/fan-core.js");
const seed=2026;
function make(id,options={}){const game=G.createGame(id,{seed,...options});game.start(0);return game;}
const nextAim=after=>{for(let t=after;t<after+1200;t++)if(Math.abs(G.aimAt(t)-.5)<.005)return t;throw new Error("No aim window");};
test("30 arena IDs, 16 photo points, 3 encounters, 15 distinct court/game pairs and geographic relations",()=>{
  assert.equal(new Set(C.TEAMS.map(t=>t.arenaId)).size,30);assert.equal(F.STATIONS.length,16);assert.equal(C.ENCOUNTERS.length,3);
  assert.equal(new Set(C.COURTS.map(c=>c.gameId)).size,15);assert.equal(G.GAMES.length,15);
  for(const c of C.COURTS){assert.equal(G.forCourt(c.id).id,c.gameId);assert.equal(G.getGame(c.gameId).name,c.gameName);}
  const t=Object.fromEntries(C.TEAMS.map(t=>[t.id,t]));
  assert.ok(t.warriors.y<t.lakers.y&&t.lakers.y<t.suns.y&&t.suns.x>t.lakers.x);
  assert.equal(t.lakers.region,t.clippers.region);assert.ok(t.thunder.x>t.nuggets.x&&t.thunder.y>t.nuggets.y);
  assert.ok(t.spurs.y>t.mavericks.y);assert.ok(t.timberwolves.y<t.bucks.y&&t.timberwolves.x<t.bucks.x);
  assert.ok(t.bucks.y<t.bulls.y&&t.raptors.x>t.bucks.x&&t.raptors.y<t.bucks.y);
  assert.ok(t.celtics.y<t.knicks.y&&t.knicks.y<t.sixers.y);assert.equal(t.heat.y,Math.max(...C.TEAMS.map(t=>t.y)));
});
test("all map landmark rectangles remain inside the shared viewBox and do not cover each other",()=>{
  const nodes=[...C.TEAMS.map(t=>({...t,box:[80,68,160,132]})),...C.COURTS.map(t=>({...t,box:[55,52,110,128]})),...C.ENCOUNTERS.map(t=>({...t,box:[45,45,90,95]}))];
  for(const n of nodes){assert.ok(n.x-n.box[0]>=0&&n.x-n.box[0]+n.box[2]<=C.MAP.width);assert.ok(n.y-n.box[1]>=0&&n.y-n.box[1]+n.box[3]<=C.MAP.height);}
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],w=Math.min(a.x-a.box[0]+a.box[2],b.x-b.box[0]+b.box[2])-Math.max(a.x-a.box[0],b.x-b.box[0]),h=Math.min(a.y-a.box[1]+a.box[3],b.y-b.box[1]+b.box[3])-Math.max(a.y-a.box[1],b.y-b.box[1]);assert.ok(w<=0||h<=0,`${a.id} covers ${b.id}`);}
});
for(const config of G.GAMES)test(`${config.id}: start, finite timeout, immutable final score and reset`,()=>{
  const game=G.createGame(config.id,{seed});assert.equal(game.tick(0).phase,"ready");game.start(1000);assert.equal(game.tick(0).phase,"countdown");assert.equal(game.act("shoot",0).accepted,false);
  const start=game.tick(1000);assert.equal(start.phase,"playing");const end=game.tick(1000+config.durationMs+1000);assert.equal(end.phase,"finished");assert.equal(end.remainingMs,0);
  const result=game.result();game.act({type:"choose",value:1},999999);assert.deepEqual(game.result(),result);
  assert.equal(game.reset().phase,"ready");assert.equal(game.result().score,0);game.start(200000);assert.equal(game.tick(200000).attempts,0);
  assert.equal(G.compareResults(config.id,result,result),0);assert.equal(G.resolvePlayers(config.id,[{user_id:"a",result},{user_id:"b",result}]).type,"draw");
});
test("shooting and five-point tour keep timing, cooldown and only advance on a make",()=>{
  const g=make("shoot");assert.equal(g.shoot(0).hit,false);assert.equal(g.shoot(300).accepted,false);assert.equal(g.shoot(900).hit,true);assert.equal(g.tick(30000).score,1);
  const five=make("five");for(let i=0;i<5;i++)five.shoot(300+1200*i);assert.equal(five.result().progress,5);assert.equal(five.tick(6000).phase,"finished");assert.equal(five.result().completed,true);
  assert.equal(G.compareResults("five",{completed:true,elapsedMs:5000},{completed:true,elapsedMs:6000}),1);
  assert.equal(G.compareResults("five",{completed:false,progress:3},{completed:false,progress:2}),1);
});
test("wind gives identical 8 winds, supports aiming and limits attempts",()=>{
  const a=make("wind"),b=make("wind");
  for(let i=0;i<8;i++){const time=i*600,v=a.tick(time);assert.equal(v.wind,b.tick(time).wind);a.act({type:"aim",value:-v.wind},time);b.act({type:"aim",value:-v.wind},time);assert.equal(a.shoot(time).hit,true);b.shoot(time);}
  assert.equal(a.result().score,8);assert.deepEqual(a.result(),b.result());assert.equal(a.shoot(8000).accepted,false);
});
test("bank uses ten indicated reflection zones; buzzer has 6 locked 5-second rounds and 2/3 points",()=>{
  const bank=make("bank");for(let i=0;i<10;i++)bank.act({type:"choose",value:2-G.pick(seed,i,3)},i*200);assert.equal(bank.result().score,10);
  const buzz=make("buzzer");for(let i=0;i<6;i++){buzz.act({type:"range",value:i%2?"far":"near"},i*5000);const now=nextAim(i*5000+180);assert.equal(buzz.shoot(now).hit,true);assert.equal(buzz.shoot(now+600).accepted,false);}
  assert.equal(buzz.tick(30000).score,15);assert.equal(buzz.result().attempts,6);
});
test("dribble changes lanes, counts ten obstacles and adds exact collision penalties",()=>{
  const safe=make("dribble"),collide=make("dribble");
  for(let i=0;i<10;i++){const t=i*2000+400,blocked=G.pick(seed,i,5);safe.act({type:"lane",value:(blocked+1)%3},t);collide.act({type:"lane",value:blocked},t);safe.tick((i+1)*2000);collide.tick((i+1)*2000);}
  assert.equal(safe.result().timeMs,20000);assert.equal(collide.result().timeMs,40000);assert.equal(G.compareResults("dribble",safe.result(),collide.result()),1);
});
test("passing has one chance per wave and rebound judges actual lane at landing",()=>{
  const pass=make("pass");for(let i=0;i<15;i++){const t=i*2000+200;assert.equal(pass.act({type:"choose",value:G.pick(seed,i,7)},t).hit,true);assert.equal(pass.act({type:"choose",value:0},t+200).accepted,false);}assert.equal(pass.tick(30000).score,15);
  const reb=make("rebound");for(let i=0;i<10;i++){reb.act({type:"lane",value:G.pick(seed,i,7)},i*2500+1000);reb.tick((i+1)*2500);}assert.equal(reb.result().score,10);
});
test("duel alternates 5 attacks each, computer is explicit, duplicate choices lock and online has no fake choices",()=>{
  const duel=make("duel");for(let i=0;i<10;i++){const pc=G.pick(seed,i,14),choice=i%2?pc:(pc+1)%3;duel.act({type:"choose",value:choice},i*7000+200);assert.equal(duel.act({type:"choose",value:2},i*7000+500).accepted,false);}duel.tick(70000);assert.equal(duel.result().score,10);assert.equal(duel.result().pcScore,0);
  const online=make("duel",{online:true});assert.equal(online.act({type:"choose",value:0},200).accepted,false);assert.equal(online.tick(70000).pcScore,0);assert.equal(Object.keys(online.tick(70000).answered).length,0);
});
test("memory shows before accepting input, grows routes and stops on a wrong answer",()=>{
  const g=make("memory");assert.equal(g.act({type:"choose",value:0},0).accepted,false);
  for(let round=0;round<6;round++){const v=g.tick(g.result().elapsedMs),seq=v.sequence;let t=v.memoryStart+seq.length*600+400;for(const item of seq){g.act({type:"choose",value:item},t);t+=200;}}
  assert.equal(g.result().longest,8);assert.equal(g.result().rounds,6);assert.equal(g.tick(44000).phase,"finished");
  const wrong=make("memory");const seq=wrong.tick(0).sequence;wrong.act({type:"choose",value:(seq[0]+1)%3},2200);assert.equal(wrong.tick(2300).phase,"finished");
  assert.equal(G.compareResults("memory",{longest:5,rounds:2},{longest:5,rounds:1}),1);
});
test("relay repeats failed steps, completes three waves and compares timeout progress",()=>{
  const g=make("relay");let t=200;
  for(let wave=0;wave<3;wave++){g.act({type:"choose",value:(G.pick(seed,wave,20)+1)%3},t);assert.equal(g.tick(t).step,0);t+=200;g.act({type:"choose",value:G.pick(seed,wave,20)},t);t+=200;g.act({type:"choose",value:G.pick(seed,wave,21)},t);t=nextAim(t+200);g.shoot(t);t+=200;}
  assert.equal(g.result().progress,3);assert.equal(g.result().completed,true);assert.equal(G.compareResults("relay",{completed:false,progress:2},{completed:false,progress:1}),1);
});
test("rhythm alternates fixed beats, awards combo bonuses and breaks combo on a wrong beat",()=>{
  const g=make("rhythm");for(let beat=1;beat<=48;beat++)g.act({type:beat%2?"left":"right"},beat*600);assert.equal(g.tick(30000).hits,48);assert.ok(g.result().score>480);
  const bad=make("rhythm");bad.act("left",600);bad.act("left",1200);assert.equal(bad.tick(1200).combo,0);assert.equal(bad.result().score,10);assert.equal(bad.act("right",1250).accepted,false);
});
test("defense punishes fake jumps and accepts only the real-shot reaction window",()=>{
  const g=make("defense");g.shoot(500);const v=g.tick(1000);assert.equal(g.shoot(v.trueAt).accepted,false);for(let i=1;i<10;i++){const v=g.tick(i*3000);assert.equal(g.shoot(i*3000+v.trueAt+100).hit,true);}assert.equal(g.tick(30000).score,9);
});
test("maze supports moving defenders, max steps and lower successful-route step ranking",()=>{
  const g=make("maze");let time=0;
  for(let level=0;level<3;level++){
    const queue=[{x:2,y:4,steps:0,route:[]}],seen=new Set();let route=null;
    while(queue.length){const q=queue.shift();if(q.y===0){route=q.route;break;}if(q.steps===12)continue;for(const type of ["up","left","right","wait"]){const step=q.steps+1,defs=[{x:G.pick(seed,level*40+step,12)+1,y:2},{x:G.pick(seed,level*40+step,13),y:1}];let x=q.x+(type==="left"?-1:type==="right"?1:0),y=q.y-(type==="up"?1:0);if(x<0||x>4||y<0||defs.some(d=>d.x===x&&d.y===y)){x=q.x;y=q.y;}if(defs.some(d=>d.x===x&&d.y===y)){x=2;y=4;}const key=[x,y,step].join();if(!seen.has(key)){seen.add(key);queue.push({x,y,steps:step,route:[...q.route,type]});}}}
    assert.ok(route);for(const type of route){time+=200;g.act(type,time);}
  }
  assert.equal(g.result().progress,3);assert.ok(g.result().steps<=36);assert.equal(g.tick(time).phase,"finished");assert.equal(G.compareResults("maze",{progress:2,steps:10},{progress:2,steps:12}),1);
});
test("allround uses five shots, five pass waves and five defense chances; awards match points per event",()=>{
  const g=make("allround");for(let i=0;i<5;i++)g.shoot(300+i*1200);
  let s=g.tick(5100);assert.equal(s.stage,1);const passStart=s.child.startsAt;
  for(let i=0;i<5;i++)g.act({type:"choose",value:G.pick(seed,i,7)},passStart+i*2000+200);
  s=g.tick(passStart+8200);assert.equal(s.stage,2);const defStart=s.child.startsAt;
  for(let i=0;i<5;i++){s=g.tick(defStart+i*3000);g.shoot(defStart+i*3000+s.child.trueAt+100);}
  g.tick(defStart+15000);assert.deepEqual(g.result().subscores,[5,5,5]);assert.equal(g.result().attempts,15);
  assert.equal(G.compareResults("allround",{subscores:[5,1,1]},{subscores:[4,2,2]}),-1);
  assert.equal(G.compareResults("allround",{subscores:[5,1,3]},{subscores:[4,2,3]}),0);
  assert.deepEqual(make("allround").tick(40000).result.subscores,[0,0,0]);
});
test("seed questions reproduce without sharing mutable state, and missing results never create fake opponents",()=>{
  for(const conf of G.GAMES){const a=make(conf.id),b=make(conf.id);assert.deepEqual(a.tick(250),b.tick(250));assert.equal(G.resolvePlayers(conf.id,[{user_id:"a",result:a.result()}]).type,"pending");assert.equal(G.resolvePlayers(conf.id,[{user_id:"a",result:a.result()},{user_id:"b",result:null}]).type,"forfeit");}
});
test("legacy home album indexes by arena ID, and old encounter scene/name survive new lakeside scenery",()=>{
  const old={version:2,kind:"encounter",teamId:"clippers",starId:"paul",locationId:"meet-garden",background:"meet-garden",encounterDate:"2026-01-03",avatar:F.DEFAULT_AVATAR,pose:"stand",capturedAt:"2026-01-03T04:00:00Z"};
  const normalized=F.normalizePhoto(old);assert.equal(normalized.sceneVersion,1);assert.equal(F.photoInfo(normalized).venue,"綠園入口");assert.doesNotMatch(F.photoSVG(old),/#397b96/);
  const fresh=F.createEncounterPhoto(F.dailyEncounter("2026-01-03"),F.DEFAULT_AVATAR);assert.equal(F.photoInfo(fresh).venue,"五大湖畔公園");assert.match(F.photoSVG(fresh),/#397b96/);
  const session=F.createFanSession(null);session.collect(F.createPhoto("warriors",F.DEFAULT_AVATAR));session.collect(fresh);assert.ok(session.getState().homeAlbum["arena-warriors"]);assert.equal(session.getState().collected,1);assert.equal(session.getState().encounterCollected,1);
});
test("incremental SQL seals moves, validates own/round/game/seed and has deterministic per-game comparison",()=>{
  const sql=fs.readFileSync(path.join(__dirname,"../supabase/games-v2.sql"),"utf8");
  for(const g of G.GAMES){assert.ok(sql.includes(`'${g.id}'`));assert.ok(sql.includes(`'${g.courtId}'`));}
  assert.match(sql,/nba_duel_moves enable row level security/);assert.match(sql,/revoke all on public\.nba_duel_moves from public,anon,authenticated/);assert.doesNotMatch(sql,/grant select.*nba_duel_moves/);
  const submit=sql.match(/function public\.nba_submit_result\([\s\S]*?\n\$\$;/)[0];for(const guard of ["ROUND_MISMATCH","GAME_OR_SEED_MISMATCH","SCORE_ALREADY_SUBMITTED","SERVER_RESULT_ONLY","NOT_MEMBER"])assert.ok(submit.includes(guard));assert.match(submit,/user_id=auth\.uid\(\)/);assert.doesNotMatch(submit,/p_user/);
  const move=sql.match(/function public\.nba_choose_move\([\s\S]*?\n\$\$;/)[0];assert.match(move,/for update/);assert.match(move,/MOVE_ALREADY_SUBMITTED/);assert.match(move,/TURN_MISMATCH/);assert.match(sql,/a is not null and b is not null/);assert.match(sql,/nba_compare_result\(r.game_id,ar,br\)/);
});
test("every game ranks a winner, loser and exact tie using its own result rule",()=>{
  for(const game of G.GAMES){
    let a={score:2},b={score:1};
    if(["five","relay"].includes(game.id)){a={completed:true,progress:game.id==="five"?5:3,elapsedMs:5000};b={completed:true,progress:a.progress,elapsedMs:6000};}
    if(game.id==="dribble"){a={timeMs:20000};b={timeMs:22000};}
    if(game.id==="memory"){a={longest:5,rounds:3};b={longest:4,rounds:4};}
    if(game.id==="maze"){a={progress:3,steps:18};b={progress:3,steps:21};}
    if(game.id==="allround"){a={subscores:[5,4,1]};b={subscores:[4,3,5]};assert.deepEqual(G.eventPoints(a,b),[2,1]);}
    assert.equal(G.compareResults(game.id,a,b),1,game.id);assert.equal(G.compareResults(game.id,b,a),-1,game.id);assert.equal(G.compareResults(game.id,a,a),0,game.id);
  }
});
test("new Supabase RPC payloads carry round/game/seed and never allow a caller-supplied player identity",async()=>{
  const Online=require("../assets/online.js"),calls=[];
  const adapter=Online.createSupabaseAdapter({url:"https://example.supabase.co",publishableKey:"sb_publishable_abcdefghijklmnop"},{fetch:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>url.endsWith('/signup')?{access_token:"test",user:{id:"own"},expires_in:3600}:{room:{id:"r"},players:[]}};}});
  const r=make("wind").tick(45000).result;await adapter.submitResult("r",4,"wind",99,r);await adapter.choose("r",4,2,1);
  assert.deepEqual(calls.at(-2).body,{p_room:"r",p_round:4,p_game:"wind",p_seed:99,p_result:r});assert.deepEqual(calls.at(-1).body,{p_room:"r",p_round:4,p_turn:2,p_move:1});assert.ok(calls.every(c=>!Object.keys(c.body).some(k=>k.includes("user"))));
});
