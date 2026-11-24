"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const P=require('../assets/pixel-core.js'),C=require('../assets/island-core.js'),E=require('../assets/explorer-core.js'),B=require('../assets/bay-scene.js'),F=require('../assets/fan-core.js'),S=require('../assets/sights-core.js');
const root=path.join(__dirname,'..'),hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
function mask(t){return hash(t.pixels.map(Boolean));}
test('six genuinely different stadium silhouettes cover all 16 unchanged arena IDs',()=>{
  assert.equal(P.MODELS.length,6);assert.deepEqual(Object.keys(P.ARENAS).sort(),C.TEAMS.map(t=>t.id).sort());assert.equal(new Set(Object.values(P.ARENAS)).size,6);
  const shapes=P.MODELS.map(model=>P.arena(C.TEAMS.find(t=>P.ARENAS[t.id]===model)));assert.equal(new Set(shapes.map(mask)).size,6);
  for(const team of C.TEAMS){assert.notEqual(hash(P.arena(team).pixels),hash(P.arena(team,true).pixels));assert.equal(P.arena(team).width,80);assert.match(P.arenaMarkup(team),/arena-halo/);}
});
test('harbor, park and roof have distinct court scenery and 15 game IDs stay paired',()=>{
  const tiles=['harbor','park','roof'].map(type=>P.court(type));assert.equal(new Set(tiles.map(mask)).size,3);assert.equal(C.COURTS.length,15);assert.equal(new Set(C.COURTS.map(c=>c.gameId)).size,15);for(const type of ['harbor','park','roof'])assert.equal(C.COURTS.filter(c=>c.type===type).length,5);
});
test('eight pedestrian silhouettes are used by the original ten people; day/night changes no route data',()=>{
  assert.equal(P.PEOPLE.length,8);assert.equal(new Set(P.PEOPLE.map(model=>mask(P.actor({}, {model}).body))).size,8);assert.equal(new Set(B.PEOPLE.map(p=>p.pixelModel)).size,8);assert.equal(B.PEOPLE.length,10);
  const crowd=B.createCrowd(),routes=hash(B.PEOPLE.map(p=>p.route));B.advanceCrowd(crowd,100,C.gameForTeam('warriors','live'));assert.equal(hash(B.PEOPLE.map(p=>p.route)),routes);
});
test('player layers use 16x24 cells, 8 directions and 4 distinguishable walking poses with stable feet',()=>{
  assert.deepEqual(P.SPEC.frame,[16,24]);assert.deepEqual(P.SPEC.sheet,[80,192]);assert.deepEqual(P.SPEC.foot,[8,22]);assert.deepEqual(P.SPEC.topAnchor,[4,10]);
  const directions=[];for(const direction of P.SPEC.directions){const frames=[0,1,2,3].map(frame=>P.actor({}, {model:'neutral',direction,walking:true,frame}));assert.equal(new Set(frames.map(f=>hash([f.body.pixels,f.top.pixels]))).size,4);directions.push(hash(frames[0].body.pixels));for(const f of frames){assert.equal(f.body.pixels[13*16+8],null);assert.ok(f.top.pixels[13*16+8]);assert.equal(f.body.width,16);assert.equal(f.body.height,24);}}
  assert.equal(new Set(directions).size,8);for(let i=0;i<8;i++)assert.equal(P.direction(Math.cos(i*Math.PI/4),Math.sin(i*Math.PI/4)),P.SPEC.directions[i]);
});
test('player clothing remains neutral regardless of saved team; roster settings and draft storage survive',()=>{
  const a=P.actor(F.DEFAULT_AVATAR,{model:'neutral'}),b=P.actor({...F.DEFAULT_AVATAR,jersey:'lakers',number:'23'},{model:'neutral'});assert.deepEqual(a.top.pixels,b.top.pixels);
  const records=new Map(),store={getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v)},session=F.createFanSession(store);session.edit({nickname:'Pixel fan',jersey:'lakers',number:'07'});session.save();const restored=F.createFanSession(store).getState();assert.equal(restored.saved.jersey,'lakers');assert.equal(restored.saved.number,'07');assert.equal(restored.saved.nickname,'Pixel fan');
});
test('saved vector-era photos remain vector; new captures snapshot pixel style without mutating the old album',()=>{
  const old=F.createPhoto('warriors',F.DEFAULT_AVATAR,{capturedAt:'2026-11-24T01:00:00Z'});delete old.artVersion;const oldMarkup=F.photoSVG(old);assert.match(oldMarkup,/stroke-linecap="round"/);
  const records=new Map([[F.ALBUM_KEY,JSON.stringify({version:1,photos:[old]})]]),store={getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v)},session=F.createFanSession(store);
  assert.equal(F.photoSVG(session.getState().album.warriors),oldMarkup);const fresh=F.createPhoto('lakers',session.getState().saved);assert.equal(fresh.artVersion,'pixel-v1');assert.match(F.photoSVG(fresh),/shape-rendering="crispEdges"/);session.collect(fresh);session.edit({nickname:'After clothes'});session.save();assert.equal(F.photoSVG(session.getState().album.warriors),oldMarkup);assert.equal(F.createFanSession(store).getState().collected,2);
});
test('new home, encounter and landmark photos embed pixel shapes and keep the public export self-contained',()=>{
  const encounter=F.createEncounterPhoto(F.dailyEncounter('2026-01-01'),F.DEFAULT_AVATAR);assert.equal(encounter.artVersion,'pixel-v1');
  for(const s of S.SIGHTS.filter(s=>s.photo)){const record=F.normalizePhoto({version:3,kind:'sight',artVersion:'pixel-v1',locationId:s.id,avatar:F.DEFAULT_AVATAR,pose:'ball',background:'night',capturedAt:'2026-11-24T01:00:00Z'});const svg=F.photoSVG(record);assert.match(svg,/shape-rendering="crispEdges"/);assert.doesNotMatch(svg,/<image|href=|foreignObject/);assert.ok(svg.includes(s.name));}
  assert.equal(F.normalizePhoto(encounter).artVersion,'pixel-v1');
});
test('pixel walk frames follow the existing graph, snap only display and stop on arrival or reduced motion',()=>{
  const w=E.createWalker();E.walk(w,'meet-pier',0);E.tick(w,320);assert.ok(P.SPEC.directions.includes(w.direction));assert.ok(w.frame>=0&&w.frame<4);assert.equal(w.moving,true);const location={...w.position};assert.ok(Number.isFinite(location.x)&&Number.isFinite(location.y));E.tick(w,10000);assert.equal(w.frame,0);assert.ok(E.hasArrived(w,'meet-pier'));E.walk(w,'harbor-01',11000,true);assert.equal(w.frame,0);assert.ok(E.hasArrived(w,'harbor-01'));
});
test('all 20 pixel landmarks, 18 car views and manifest asset pairs resolve with exact native grid sizes',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/pixel/manifest.json')));assert.equal(manifest.files.length,130);assert.equal(manifest.props.length,9);const dirs={};for(const item of manifest.files){for(const ext of ['png','svg'])assert.ok(fs.existsSync(path.join(root,'assets/pixel',item.name+'.'+ext)));if(item.name.startsWith('cars/'))assert.deepEqual([item.width,item.height],[26,20]);dirs[item.name]=true;}
  assert.equal(manifest.files.filter(i=>i.name.startsWith('sights/')).length,40);assert.equal(manifest.files.filter(i=>i.name.startsWith('cars/')).length,18);for(const s of S.SIGHTS)for(const p of [s.pixelAsset,s.pixelNightAsset])assert.ok(fs.existsSync(path.join(root,p)));
});