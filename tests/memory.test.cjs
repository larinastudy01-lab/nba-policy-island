'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('../assets/memory-core.js'),A=require('../assets/archipelago-core.js'),E=require('../assets/explorer-core.js'),C=require('../assets/island-core.js');
const Art=require('../assets/memory-art.js');
test('five independent sourced events map to the five preserved islands, local art and walkable entrances',()=>{
  assert.equal(new Set(M.EVENTS.map(e=>e.id)).size,5);assert.deepEqual(M.EVENTS.map(e=>e.teamId).sort(),['bulls','knicks','lakers','raptors','warriors']);
  for(const event of M.EVENTS){assert.equal(event.islandId,'island-'+event.teamId);assert.equal(C.getLandmark('memory',event.id).eventId,event.id);assert.equal(A.owner(event.id).id,event.islandId);assert.ok(A.contains(A.owner(event.id),event.entrance));assert.match(event.date,/^\d{4}-\d{2}-\d{2}$/);assert.ok(event.season&&event.title&&event.text.length&&event.point&&event.presentation);
    for(const s of event.sources){const url=new URL(s.url);assert.equal(url.protocol,'https:');assert.equal(url.hostname,'www.nba.com');}
    for(const file of [event.asset,event.asset.replace('.svg','-point.svg')]){const text=fs.readFileSync(path.resolve(__dirname,'..',file),'utf8');assert.match(text,/shape-rendering="crispEdges"/);assert.doesNotMatch(text,/<script|<image|https?:\/\/(?!www\.w3\.org)/);}
    assert.equal(fs.readFileSync(path.resolve(__dirname,'..',event.asset),'utf8'),Art.svg(event));
    assert.equal(fs.readFileSync(path.resolve(__dirname,'..',event.asset.replace('.svg','-point.svg')),'utf8'),Art.svg(event,true));
    const route=E.roadPath(E.entrance('warriors'),event.id);assert.deepEqual(route.at(-1),event.entrance);const walker=E.createWalker();E.walk(walker,event.id,0,true);assert.ok(E.hasArrived(walker,event.id));
  }
});
test('memorial is static and explicitly remembers all nine; contest remakes are optional and retain historical scores',()=>{
  const memorial=M.get('memory-lakers-2020');assert.equal(memorial.presentation,'memorial');assert.equal(memorial.score,undefined);assert.match(memorial.text.join(' '),/Kobe.*Gianna.*另外七人/);assert.equal(M.EVENTS.filter(e=>e.presentation==='shot').length,2);assert.equal(M.get('memory-bulls-1998').score,'CHI 87：86 UTA');assert.equal(M.get('memory-raptors-2019').bounces,4);
});
test('read book requires explicit marking, deduplicates, reloads and never writes old avatar/photo/policy keys',()=>{
  const store=new Map([['nba-policy-progress','legacy-policy'],['nba-fan-avatar','legacy-avatar']]);const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
  const book=M.createBook(storage);assert.equal(book.snapshot().read.length,0);for(const e of M.EVENTS){book.mark(e.id,1000);book.mark(e.id,2000);}assert.equal(book.snapshot().read.length,5);assert.ok(book.snapshot().read.every(p=>p.readAt==='1970-01-01T00:00:01.000Z'));assert.equal(M.createBook(storage).snapshot().read.length,5);assert.equal(store.get('nba-policy-progress'),'legacy-policy');assert.equal(store.get('nba-fan-avatar'),'legacy-avatar');assert.equal(store.size,3);
  const exported=book.snapshot();exported.read.length=0;assert.equal(book.snapshot().read.length,5);assert.throws(()=>book.mark('fake'));
});
test('blocked, malformed, unsupported or unknown memory records do not affect this-page reading',()=>{
  for(const raw of ['{','null','{"version":99,"read":[]}',JSON.stringify({version:1,read:[null,{eventId:'fake',readAt:'2020-01-01'},{eventId:M.EVENTS[0].id,readAt:'invalid'}]})]){const book=M.createBook({getItem:()=>raw,setItem(){}});assert.equal(book.snapshot().read.length,0);book.mark(M.EVENTS[0].id);assert.ok(book.has(M.EVENTS[0].id));}
  const book=M.createBook({getItem(){throw Error();},setItem(){throw Error();}});book.mark(M.EVENTS[0].id);assert.ok(book.has(M.EVENTS[0].id));assert.match(book.notice(),/本次頁面/);
});
test('history hints require close range on that exact island and never appear in overview or from simulated scores',()=>{
  for(const event of M.EVENTS){const camera=E.createCamera();assert.equal(M.hintVisible(camera,event,event.entrance),false);E.focusIsland(camera,event.teamId);assert.equal(M.hintVisible(camera,event,event.entrance),true);assert.equal(M.hintVisible(camera,event,{x:0,y:0}),false);E.focusIsland(camera,event.teamId==='warriors'?'lakers':'warriors');assert.equal(M.hintVisible(camera,event,event.entrance),false);}
});
test('single-shot replay accepts one hit/miss, times out, restarts, cancels and supports static aim',()=>{
  const shot=M.createShot();assert.equal(shot.shoot(0).accepted,false);shot.start(0);assert.equal(shot.shoot(450).hit,true);assert.equal(shot.shoot(451).accepted,false);shot.start(1000);assert.equal(shot.shoot(1001).hit,false);shot.start(2000);assert.equal(shot.snapshot(10000).phase,'timeout');assert.equal(shot.shoot(10000,.5).accepted,false);shot.start(12000);assert.equal(shot.shoot(12001,.5).hit,true);shot.start(13000);shot.cancel();assert.equal(shot.snapshot(13001).phase,'idle');
});
test('a history visit preserves current list filter, matches, policy and all existing public-court IDs',()=>{
  const state=C.createIslandState(),before=JSON.stringify(C.MATCHES);C.selectLandmark(state,'memory',M.EVENTS[0].id);assert.equal(state.filter,'nba');for(const status of C.GAME_STATES)C.setGameState(state,status);assert.equal(JSON.stringify(C.MATCHES),before);assert.equal(state.kind,'memory');assert.equal(C.COURTS.length,15);assert.equal(new Set(C.COURTS.map(p=>p.gameId)).size,15);
});
