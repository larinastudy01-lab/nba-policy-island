'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../assets/island-core.js'),A=require('../assets/archipelago-core.js'),E=require('../assets/explorer-core.js'),P=require('../assets/pixel-core.js'),F=require('../assets/fan-core.js'),M=require('../assets/memory-core.js'),City=require('../assets/city-art.cjs');
const oldIds=['warriors','lakers','clippers','nuggets','mavericks','bulls','celtics','knicks','spurs','thunder','suns','timberwolves','bucks','sixers','heat','raptors'];
const added=['nets','cavaliers','jazz','rockets','blazers','kings','grizzlies','pelicans','pistons','pacers','wizards','hawks','hornets','magic'];
const close=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<.001;
test('all thirty NBA IDs comprise the original sixteen and fourteen requested additions, one island and arena each',()=>{
  assert.deepEqual(C.TEAMS.map(t=>t.id).sort(),[...oldIds,...added].sort());assert.equal(new Set(C.TEAMS.map(t=>t.id)).size,30);assert.equal(new Set(C.TEAMS.map(t=>t.arenaId)).size,30);assert.equal(new Set(A.ISLANDS.map(i=>i.id)).size,30);
  for(const team of C.TEAMS){const i=A.owner(team.id);assert.equal(C.TEAMS.filter(t=>t.islandId===i.id).length,1);assert(A.ROAD_NODES['gate-'+team.id]);assert.deepEqual(E.roadPath(E.entrance('warriors'),team.id).at(-1),team.entrance);assert.ok(team.city&&team.venue&&team.cityScene);for(const p of A.coast(i))assert.ok(p.x>=0&&p.y>=0&&p.x<=A.MAP.width&&p.y<=A.MAP.height);}
});
test('Knicks to Nets uses its 130-world-unit short bridge; Warriors to Rockets crosses regions on the southern branch',()=>{
  const bridge=A.ROAD_EDGES.find(e=>e.linkId==='ny-short-bridge');assert(bridge?.bridge);const a=A.ROAD_NODES[bridge.from],b=A.ROAD_NODES[bridge.to];assert.equal(Math.hypot(a.x-b.x,a.y-b.y),130);const route=E.roadPath(E.entrance('knicks'),'nets');assert(route.some(p=>close(p,a)));assert(route.some(p=>close(p,b)));assert(route.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-route[i].x,p.y-route[i].y),0)<700);
  const long=E.roadPath(E.entrance('warriors'),'rockets');for(const id of ['sea-west-665','sea-central-665','sea-central-1840','gate-rockets'])assert(long.some(p=>close(p,A.ROAD_NODES[id])),id);
  for(const [id,region]of [['cavaliers','lakes'],['jazz','highland'],['rockets','south'],['nets','east']])assert.equal(A.owner(id).district,region);
});
test('four priority island cameras contain their shores and bridgeheads; overview never changes arrival position',()=>{
  const camera=E.createCamera(),walker=E.createWalker();for(const id of ['nets','cavaliers','jazz','rockets']){E.walk(walker,id,0,true);E.focusIsland(camera,id);for(const p of [...A.coast(A.owner(id)),A.ROAD_NODES['gate-'+id],C.getLandmark('nba',id).entrance]){const v=E.worldToViewport(p,camera.view);assert.ok(v.x>=0&&v.y>=0&&v.x<=1&&v.y<=1,id);}E.focusVenue(camera,id);const saved=JSON.stringify(walker);E.fullIsland(camera);assert.equal(JSON.stringify(walker),saved);assert.ok(E.hasArrived(walker,id));}
});
test('all thirty teams are searchable by Chinese, English, abbreviation, city and ID without changing stored data',()=>{
  assert.equal(C.searchTeams('   ').length,30);for(const t of C.TEAMS){for(const query of [t.name,t.englishName.toUpperCase(),t.abbr,t.city,t.id])assert(C.searchTeams(query).some(row=>row.id===t.id),query);}
  assert.equal(C.searchTeams('not-a-team').length,0);assert.equal(C.searchTeams(' Houston ')[0].id,'rockets');assert.equal(C.searchTeams('BKN')[0].id,'nets');assert.equal(C.searchTeams('騎士')[0].id,'cavaliers');
});
test('fourteen city impressions have distinct original geometry, day/night assets and neutral-walled arena variants',()=>{
  const hashes=new Set();for(const id of added){const tile=City.city(id),night=City.city(id,true);hashes.add(crypto.createHash('sha256').update(JSON.stringify(tile.pixels)).digest('hex'));assert.notDeepEqual(tile.pixels,night.pixels);for(const suffix of ['','-night'])for(const type of ['cities','arenas'])for(const ext of ['png','svg'])assert(fs.existsSync(path.join(__dirname,'../assets/pixel',type,id+suffix+'.'+ext)));
    const t=C.getLandmark('nba',id);assert(t.expansion);assert(P.ARENAS[id]);assert(P.arena(t).pixels.includes(t.color));assert(P.arena(t).pixels.includes('#718c96'));}
  assert.equal(hashes.size,14);assert.equal(Object.keys(A.CITY_SCENES).length,14);assert.equal(F.STATIONS.length,16);assert.deepEqual(F.STATIONS.map(s=>s.teamId).sort(),oldIds.sort());assert.equal(F.OPTIONS.jersey.length,30);assert.deepEqual(P.SPEC.frame,[16,24]);assert.deepEqual(P.SPEC.topAnchor,[4,10]);
});
test('one confirmed event may have two island entrances but keeps one canonical read record, including reload and old saves',()=>{
  const original=M.EVENTS.find(e=>e.teamId==='warriors'),shared={...original,id:'shared-fixture',entrances:[{id:'memory-reserved-cavaliers',teamId:'cavaliers',point:'test-cavs'},{id:'memory-reserved-warriors',teamId:'warriors',point:'test-warriors'}]};
  const catalog=M.createCatalog([shared]),values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},book=M.createBook(storage,[shared]);assert.equal(catalog.entrances.length,2);for(const entry of catalog.entrances){assert.equal(catalog.get(entry.id).id,shared.id);book.mark(entry.id,1000);}assert.equal(book.snapshot().read.length,1);assert.equal(book.snapshot().read[0].eventId,shared.id);assert(M.createBook(storage,[shared]).has('memory-reserved-warriors'));
  const legacy={version:1,read:[{eventId:'memory-bulls-1998',readAt:'2026-11-25T00:00:00Z'}]};assert.deepEqual(M.normalize(legacy),legacy);
});
test('both reserved pairings have four reachable coordinates but no public content, hints, book rows or mark permission',()=>{
  assert.equal(M.DRAFT_EVENTS.length,2);assert.equal(M.RESERVED_ENTRANCES.length,4);assert.equal(M.EVENTS.length,5);assert.equal(M.ENTRANCES.length,5);assert.equal(M.createCatalog([...M.EVENTS,...M.DRAFT_EVENTS]).events.length,5);
  for(const p of M.RESERVED_ENTRANCES){assert.deepEqual(E.roadPath(E.entrance('warriors'),p.id).at(-1),p.entrance);assert(A.contains(A.owner(p.id),p.entrance));assert.equal(M.get(p.id),null);assert.equal(M.getEntrance(p.id),null);assert.equal(C.getLandmark('memory',p.id),null);assert.throws(()=>M.createBook(null).mark(p.id));}
});
test('fifteen explicitly simulated fixtures cover each team once and only the current home glows',()=>{
  assert.equal(C.MATCHES.length,15);assert.equal(new Set(C.MATCHES.flatMap(m=>[m.homeId,m.awayId])).size,30);for(const t of C.TEAMS)for(const state of C.GAME_STATES){const game=C.gameForTeam(t.id,state);assert(game.home&&game.away);assert.equal(game.glowing,state==='live'&&game.homeId===t.id);if(state==='final')assert.equal(game.glowing,false);}
});
