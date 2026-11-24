"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const C=require("../assets/island-core.js");
const O=require("../assets/online.js");
const root=path.resolve(__dirname,"..");
const sql=fs.readFileSync(path.join(root,"supabase/schema.sql"),"utf8");

test("16 unique NBA teams and 15 distinct courts, five per public zone",()=>{
  assert.equal(C.TEAMS.length,16);assert.equal(C.COURTS.length,15);
  assert.equal(new Set([...C.TEAMS,...C.COURTS,...C.ENCOUNTERS].map(x=>x.id)).size,34);
  assert.equal(C.TEAMS.filter(t=>t.region==="洛城街區").length,2);
  assert.equal(C.TEAMS.filter(t=>t.region==="五大湖區").length,2);
  assert.equal(C.TEAMS.filter(t=>t.region==="東岸街區").length,3);
  for(const type of ["harbor","park","roof"])assert.equal(C.COURTS.filter(c=>c.type===type).length,5);
  for(const item of [...C.TEAMS,...C.COURTS]){assert.ok(item.x>0&&item.x<C.MAP.width);assert.ok(item.y>0&&item.y<C.MAP.height);assert.ok(item.name);}
});
test("landmark kinds route to separate data and reject invalid IDs",()=>{
  const state=C.createIslandState();
  for(const team of C.TEAMS){C.selectLandmark(state,"nba",team.id);assert.equal(state.kind,"nba");assert.equal(state.id,team.id);}
  for(const court of C.COURTS){C.selectLandmark(state,"court",court.id);assert.equal(state.kind,"court");assert.equal(state.id,court.id);}
  assert.equal(C.getLandmark("nba","harbor-01"),null);assert.equal(C.getLandmark("court","warriors"),null);
  assert.throws(()=>C.selectLandmark(state,"court","unknown"),RangeError);
});
test("both team panels share home/away scores in all four states; only home arenas glow",()=>{
  for(const match of C.MATCHES){
    for(const state of C.GAME_STATES){
      const home=C.gameForTeam(match.homeId,state),away=C.gameForTeam(match.awayId,state);
      for(const key of ["id","homeId","awayId","homeScore","awayScore","period","startTime"])assert.equal(home[key],away[key],key);
      assert.equal(home.isHome,true);assert.equal(away.isHome,false);
      assert.equal(home.glowing,state==="live");assert.equal(away.glowing,false);
      if(state==="idle"||state==="scheduled"){assert.equal(home.homeScore,null);assert.equal(home.awayScore,null);}
    }
  }
  assert.equal(C.TEAMS.filter(t=>C.gameForTeam(t.id,"live").glowing).length,8);
  assert.equal(C.TEAMS.filter(t=>C.gameForTeam(t.id,"final").glowing).length,0);
  const warriors=C.gameForTeam("warriors","live");
  assert.equal(warriors.homeId,"lakers");assert.equal(warriors.awayId,"warriors");
  assert.equal(warriors.homeScore,74);assert.equal(warriors.awayScore,78);assert.equal(warriors.glowing,false);
  assert.equal(C.gameForTeam("lakers","final").homeScore,101);
  assert.equal(C.gameForTeam("lakers","final").awayScore,108);
});
test("game state changes do not mutate independent policy state",()=>{
  const {createPolicySession}=require("../assets/policy-core.js");const policy=createPolicySession(null);policy.selectPlan("reserved");policy.simulate();policy.confirm();
  const original=policy.getState(),state=C.createIslandState();
  for(const game of C.GAME_STATES){C.setGameState(state,game);assert.deepEqual(policy.getState(),original);}
});
test("a future team with only landmark data safely defaults to no scheduled game",()=>{
  C.TEAMS.push({id:"future-team",name:"Future",abbr:"NEW",x:400,y:300});
  try{const match=C.gameForTeam("future-team","live");assert.equal(match.state,"idle");assert.equal(match.homeScore,null);assert.equal(match.glowing,false);}finally{C.TEAMS.pop();}
});
test("shooting rejects early, rapid and late shots and scores aim hits",()=>{
  const game=C.createShootingGame();
  assert.equal(game.shoot(0).accepted,false);game.start(1000);
  assert.equal(game.tick(999).phase,"countdown");assert.equal(game.shoot(999).accepted,false);
  assert.equal(game.shoot(1300).hit,true);assert.equal(game.shoot(1301).accepted,false);
  assert.equal(game.shoot(1800).hit,false);assert.equal(game.shoot(2500).hit,true);
  assert.equal(game.tick(2500).hits,2);assert.equal(game.tick(2500).attempts,3);
  assert.equal(game.shoot(31000).accepted,false);assert.equal(game.tick(31000).phase,"finished");
  assert.equal(game.tick(31000).remainingMs,0);assert.equal(game.shoot(2000).accepted,false);
});
test("30 second game caps shots at 60 and restart resets time and score",()=>{
  const game=C.createShootingGame();game.start(0);
  for(let at=0;at<30000;at+=500)game.shoot(at);
  assert.equal(game.tick(30000).attempts,60);assert.equal(game.shoot(30000).accepted,false);
  const reset=game.reset();assert.equal(reset.phase,"ready");assert.equal(reset.hits,0);assert.equal(reset.attempts,0);assert.equal(reset.remainingMs,30000);
  game.start(40000);assert.equal(game.tick(40000).remainingMs,30000);assert.equal(game.tick(40000).attempts,0);
});
test("online result resolves win, loss, draw, missing score and no contest from actual submissions",()=>{
  const p=(a,b)=>[{user_id:"a",score:a},{user_id:"b",score:b}];
  assert.deepEqual(C.resolveScores(p(10,8)),{type:"win",winnerId:"a"});
  assert.deepEqual(C.resolveScores(p(1,8)),{type:"win",winnerId:"b"});
  assert.deepEqual(C.resolveScores(p(0,0)),{type:"draw",winnerId:null});
  assert.deepEqual(C.resolveScores(p(null,0)),{type:"forfeit",winnerId:"b"});
  assert.deepEqual(C.resolveScores(p(null,null)),{type:"no-contest",winnerId:null});
  assert.deepEqual(C.resolveScores([{user_id:"a",score:2}]),{type:"pending",winnerId:null});
});
test("join guard rejects duplicate, third player, expired and non-waiting rooms",()=>{
  const room={status:"waiting",expiresAt:10000,players:[{user_id:"host"}]};
  assert.equal(C.roomJoinError(room,"guest",0),null);
  assert.equal(C.roomJoinError(room,"host",0),"ALREADY_JOINED");
  room.players.push({user_id:"guest"});
  assert.equal(C.roomJoinError(room,"third",0),"ROOM_FULL");
  assert.equal(C.roomJoinError(room,"guest",0),"ALREADY_JOINED");
  assert.equal(C.roomJoinError({...room,players:[],status:"playing"},"third",0),"ROOM_NOT_WAITING");
  assert.equal(C.roomJoinError(room,"third",10000),"ROOM_EXPIRED");
});
test("court status uses only its real room summary and has a distinct disconnected state",()=>{
  assert.equal(C.courtActivity(null,"harbor-01"),null);
  const rows=[{court_id:"harbor-01",waiting_count:2,preparing_count:1,playing_count:3}];
  assert.deepEqual(C.courtActivity(rows,"harbor-01"),{waiting:2,preparing:1,playing:3});
  assert.deepEqual(C.courtActivity(rows,"park-01"),{waiting:0,preparing:0,playing:0});
});
test("invite links retain file and GitHub Pages subpaths and target the exact court",()=>{
  const code="0123456789abcdef01234567";
  for(const base of [pathToFileURL(path.join(root,"index.html")).href,"https://example.github.io/nba-policy-island/"]){
    const result=C.inviteURL(base,"roof-05",code);assert.deepEqual(C.parseInvite(result),{courtId:"roof-05",invite:code});
    assert.equal(new URL(result).pathname,new URL(base).pathname);
  }
  assert.equal(C.parseInvite("https://example.test/?court=unknown&invite="+code),null);
  assert.equal(C.parseInvite("https://example.test/?court=park-01&invite=bad"),null);
});
test("configuration accepts only public keys and never calls fetch without config",async()=>{
  assert.equal(O.validateConfig({}).reason,"UNCONFIGURED");
  assert.equal(O.validateConfig({url:"https://x.supabase.co",publishableKey:"sb_secret_never_allowed"}).valid,false);
  const jwt=role=>"header."+Buffer.from(JSON.stringify({role})).toString("base64url")+".signature";
  assert.equal(O.validateConfig({url:"https://x.supabase.co",publishableKey:jwt("service_role")}).valid,false);
  assert.equal(O.validateConfig({url:"https://x.supabase.co",publishableKey:jwt("anon")}).valid,true);
  assert.equal(O.validateConfig({url:"http://x.supabase.co",publishableKey:"sb_publishable_public_example_key"}).valid,false);
  let calls=0;const adapter=O.createSupabaseAdapter({}, {fetch:async()=>{calls++;}});
  await assert.rejects(adapter.connect(),/UNCONFIGURED/);await assert.rejects(adapter.create("park-01","a"),/UNCONFIGURED/);assert.equal(calls,0);
});
test("Supabase adapter uses anonymous Auth and own-score RPC without a caller-supplied player ID",async()=>{
  const calls=[];
  const adapter=O.createSupabaseAdapter({url:"https://x.supabase.co",publishableKey:"sb_publishable_public_example_key"},{fetch:async(url,options)=>{calls.push({url,...options,body:JSON.parse(options.body)});return {ok:true,json:async()=>url.includes("/auth/")?{access_token:"user-session",refresh_token:"refresh",expires_at:Math.floor(Date.now()/1000)+3600,user:{id:"own-id"}}:{room:{id:"room"},players:[]}};}});
  await adapter.create("park-01","Player");await adapter.submit("room",3,7,20);
  assert.ok(calls[0].url.endsWith("/auth/v1/signup"));
  assert.ok(calls[1].url.endsWith("/rpc/nba_create_room"));assert.equal(calls[1].headers.Authorization,"Bearer user-session");
  assert.deepEqual(calls[2].body,{p_room:"room",p_round:3,p_score:7,p_attempts:20});assert.equal(adapter.userId(),"own-id");
  assert.equal(Object.hasOwn(calls[2].body,"user_id"),false);
});
test("SQL contract covers every RPC and all 15 court IDs; database execution remains pending",()=>{
  const online=fs.readFileSync(path.join(root,"assets/online.js"),"utf8");
  const allSql=sql+fs.readFileSync(path.join(root,"supabase/games-v2.sql"),"utf8");
  for(const [,name] of online.matchAll(/rpc\("(nba_[a-z_]+)"/g))assert.ok(allSql.includes(`function public.${name}(`),name);
  const courts=sql.match(/court_id = any\(array\[([^\]]+)\]/)[1].match(/'(?:harbor|park|roof)-\d+'/g).map(x=>x.slice(1,-1));
  assert.deepEqual([...courts].sort(),C.COURTS.map(c=>c.id).sort());
  assert.equal((sql.match(/enable row level security/g)||[]).length,2);
  assert.match(sql,/primary key \(room_id,user_id\)/);assert.match(sql,/unique \(room_id,slot\)/);assert.match(sql,/slot in \(1,2\)/);
  const join=sql.match(/function public\.nba_join_room\([\s\S]*?\n\$\$;/)[0];
  assert.ok(join.indexOf("for update")<join.indexOf("ROOM_FULL"));assert.match(join,/ALREADY_JOINED/);assert.match(join,/WRONG_COURT/);
  const submit=sql.match(/function public\.nba_submit_score\([\s\S]*?\n\$\$;/)[0];
  assert.match(submit,/user_id=auth\.uid\(\)/);assert.doesNotMatch(submit,/p_user/);assert.match(submit,/ROUND_MISMATCH/);assert.match(submit,/SCORE_ALREADY_SUBMITTED/);assert.match(submit,/p_attempts>60/);
  assert.doesNotMatch(sql,/grant\s+(?:all|insert|update|delete)\b/i);
  for(const body of sql.matchAll(/create or replace function[\s\S]*?\n\$\$;/g))assert.match(body[0],/security definer set search_path = ''/);
});
test("HTML assets and anchors resolve locally and beneath /nba-policy-island/",()=>{
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);
  for(const [,ref] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    if(ref.startsWith("data:"))continue;
    if(ref.startsWith("#")){assert.ok(ids.includes(ref.slice(1)),ref);continue;}
    assert.ok(ref.startsWith("./"),ref);assert.ok(fs.existsSync(path.join(root,ref)),ref);assert.ok(new URL(ref,"https://example.github.io/nba-policy-island/").pathname.startsWith("/nba-policy-island/"));
  }
  assert.doesNotMatch(html,/\son\w+=/i);assert.ok(html.includes('id="policy-challenge"'));
  assert.ok(html.includes("多倫多暴龍"));assert.ok(html.includes("16／30"));
});
