'use strict';
// Terminal-only tests: real Three.js geometry/GLTF parsing, no browser or WebGL.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'..'),BASE=path.join(ROOT,'prototype/three-islands'),Core=require('../prototype/three-islands/core.js');
const C=require('../assets/island-core.js'),A=require('../assets/archipelago-core.js'),E=require('../assets/explorer-core.js'),F=require('../assets/fan-core.js');
const read=p=>fs.readFileSync(path.join(BASE,p),'utf8');
const storage=initial=>{const data=new Map(Object.entries(initial||{}));return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};

test('prototype shares all 30 island IDs, 15 game destinations and existing feature entrances',()=>{
  assert.equal(C.TEAMS.length,30);assert.equal(new Set(C.TEAMS.map(t=>t.id)).size,30);assert.equal(C.COURTS.length,15);
  for(const team of C.TEAMS){const rows=Core.destinations(team.id);assert(rows.some(p=>p.id===team.id));for(const p of rows){assert.equal(A.owner(p.id).teamId,team.id);assert(E.ROAD_NODES[p.id]);const route=E.roadPath(E.entrance('warriors'),p.id);assert.deepEqual(route.at(-1),E.entrance(p.id));assert(Core.legacyCommand(p.kind,p.id).select);}}
  assert.equal(F.STATIONS.length,16);assert.deepEqual(Core.DETAIL_TEAMS,['warriors','lakers','bulls']);
  assert.throws(()=>Core.legacyCommand('shop','warriors'));assert.throws(()=>Core.legacyCommand('nba','<script>'));
});
test('world/scene coordinates round-trip, cameras are independent of player position',()=>{
  const walker=E.createWalker('warriors');for(const t of C.TEAMS){const p=Core.sceneToWorld(Core.worldToScene(t.entrance));assert(Math.hypot(p.x-t.entrance.x,p.y-t.entrance.y)<1e-9);const before=JSON.stringify(walker);for(const overview of [true,false])assert(Core.cameraFrame(t.id,overview).span>0);assert.equal(JSON.stringify(walker),before);}
  E.walk(walker,'lakers',0);E.tick(walker,5000);assert(E.hasArrived(walker,'lakers'));const before={...walker.position};Core.cameraFrame('lakers',true);assert.deepEqual(walker.position,before);
  E.walk(walker,'bulls',5001);const old=walker.token;E.walk(walker,'shop-lakers',5100);assert.equal(E.tick(walker,10000,old),false);E.tick(walker,10000);assert(E.hasArrived(walker,'shop-lakers'));
});
test('prototype storage never writes original avatar, album, policy or shopping keys',()=>{
  const avatar={...F.DEFAULT_AVATAR,nickname:'測試球迷',skin:'deep'},s=storage({[F.AVATAR_KEY]:JSON.stringify({version:1,avatar}),[F.ALBUM_KEY]:'legacy'});
  assert.equal(Core.readAvatar(s).nickname,'測試球迷');const before=s.data.get(F.AVATAR_KEY);assert(Core.saveState(s,{teamId:'bulls',locationId:'lakers',theme:'night'}));assert.equal(Core.readState(s).locationId,'lakers');assert.equal(s.data.get(F.AVATAR_KEY),before);assert.equal(s.data.get(F.ALBUM_KEY),'legacy');
  for(const bad of ['{','null',JSON.stringify({version:1,locationId:'trunk-west'})])assert.doesNotThrow(()=>Core.readState(storage({[Core.SAVE_KEY]:bad})));
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};assert.equal(Core.readAvatar(blocked).nickname,F.DEFAULT_AVATAR.nickname);assert.equal(Core.saveState(blocked,{}),false);
});
test('mobile budgets, lazy detail selection and pause conditions are explicit',()=>{
  assert.equal(Core.quality('auto',390,3).detailBudget,1);assert.equal(Core.quality('auto',1200,3).pixelRatio,1.25);assert.equal(Core.quality('low',1400).targetFPS,30);
  for(const t of C.TEAMS)for(const overview of [true,false])assert(Core.detailPlan(t.id,overview).length<=1);
  for(const state of [{hidden:true,moving:true},{visible:false,moving:true},{legacyOpen:true,moving:true},{overview:true},{reducedMotion:true}])assert.equal(Core.shouldAnimate(state),false);
  assert(Core.shouldAnimate({moving:true,reducedMotion:true}));assert(Core.shouldAnimate({cameraMoving:true,overview:true}));
});
test('both cards share scores; only simulated home lights up; final retains score',()=>{
  assert.equal(Core.matchText('warriors','live','away'),Core.matchText('lakers','live','away'));assert.match(Core.matchText('warriors','live','away'),/78：74/);
  assert.equal(C.gameForTeam('warriors','live','away').glowing,false);assert.equal(C.gameForTeam('lakers','live','away').glowing,true);assert.equal(C.gameForTeam('lakers','final').glowing,false);assert.match(Core.matchText('warriors','final'),/108：101/);assert.match(Core.matchText('bulls','scheduled'),/台灣時間/);
});
test('classic scripts also initialize in browser order without CommonJS dependencies',()=>{
  const vm=require('node:vm'),context=vm.createContext({console,URL,Date,Intl,TextEncoder,TextDecoder});for(const m of read('index.html').matchAll(/<script src="([^"]+)" defer><\/script>/g)){const file=path.resolve(BASE,m[1]);vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});}
  assert.equal(context.NBA3DCore.destinations('warriors').length,6);assert.equal(context.NBA3DCore.readState(null).locationId,'warriors');assert.equal(context.NBAIsland.TEAMS.length,30);
});
test('all prototype HTML IDs, local references, 30 thumbnail hashes and GLB manifests resolve under Pages subpath',()=>{
  const html=read('index.html'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
  for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(!m[1].startsWith('.'))continue;const file=path.resolve(BASE,m[1]);assert(fs.existsSync(file),m[1]);const url=new URL(m[1],'https://example.github.io/nba-policy-island/prototype/three-islands/');assert(url.pathname.startsWith('/nba-policy-island/'));}
  for(const id of [...read('app.js').matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]))assert(ids.includes(id),id);
  const logos=JSON.parse(read('assets/team/manifest.json'));assert.equal(logos.length,30);for(const r of logos){assert(C.TEAMS.some(t=>t.id===r.teamId));assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(BASE,r.path))).digest('hex'),r.sha256);}
  for(const r of JSON.parse(read('assets/models/manifest.json'))){const b=fs.readFileSync(path.join(BASE,r.path));assert.equal(b.length,r.bytes);assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),r.sha256);const json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));assert(!json.images?.length);assert(!json.extensionsRequired?.length);for(const buffer of json.buffers)assert(!buffer.uri,'GLB is self contained');}
});

let registered=false;
async function modules(extra={}){
  // Node 24 resolves the browser's import map without a package installation.
  if(!registered){require('node:module').registerHooks({resolve(specifier,context,next){if(specifier==='three')return {url:pathToFileURL(path.join(BASE,'vendor/three-r187/build/three.module.js')).href,shortCircuit:true};if(specifier.startsWith('three/addons/'))return {url:pathToFileURL(path.join(BASE,'vendor/three-r187/addons',specifier.slice(13))).href,shortCircuit:true};return next(specifier,context);}});registered=true;}
  Object.assign(globalThis,{ProgressEvent:class{constructor(type,props){Object.assign(this,{type},props);}},NBA3DCore:Core,NBAIsland:C,NBAArchipelago:A,NBATraffic:require('../assets/traffic-core.js'),NBAShop:require('../assets/shop-core.js'),...extra});
  return {load:file=>import(pathToFileURL(file).href)};
}
test('real GLTFLoader parses both imported meshes, normalized clones and tree instancing share cache',async()=>{
  const m=await modules(),THREE=await m.load(path.join(BASE,'vendor/three-r187/build/three.module.js')),{GLTFLoader}=await m.load(path.join(BASE,'vendor/three-r187/addons/loaders/GLTFLoader.js')),{AssetLibrary}=await m.load(path.join(BASE,'asset-library.js'));
  const library=new AssetLibrary();library.loader.loadAsync=async url=>{const b=fs.readFileSync(require('node:url').fileURLToPath(url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
  const [a,b]=await Promise.all([library.get('quaternius-tree'),library.get('quaternius-tree')]);assert.equal(a,b);assert.equal(library.loads,1);const tree=await library.normalized('quaternius-tree',5.5);const bounds=new THREE.Box3().setFromObject(tree);assert(Math.abs(bounds.min.y)<1e-5);assert(Math.abs(Math.max(...bounds.getSize(new THREE.Vector3()).toArray())-5.5)<1e-5);
  const instances=await library.treeInstances([{x:1,y:2,z:3},{x:4,y:2,z:3}]);assert(instances.children.every(o=>o.isInstancedMesh&&o.count===2));await library.get('quaternius-sports-car');assert.equal(library.loads,2);await assert.rejects(library.get('fake-car'));await library.dispose();assert.equal(library.cache.size,0);
});
test('real scene geometry creates 30 coasts, only one visible detail, LRU eviction and independent night/LIVE layers',async()=>{
  const m=await modules(),THREE=await m.load(path.join(BASE,'vendor/three-r187/build/three.module.js'));THREE.TextureLoader.prototype.load=()=>new THREE.Texture();
  const {buildWorld}=await m.load(path.join(BASE,'scene.js'));const scene=new THREE.Scene(),library={async treeInstances(){return new THREE.Group();},async normalized(){return new THREE.Group();}},world=buildWorld(scene,library);
  for(const id of ['warriors','lakers','bulls','warriors']){await world.loadDetail(id);world.visibility(id,false,2);assert.equal([...world.details.values()].filter(d=>d.root.visible).length,1);assert(world.details.size<=2);}
  world.setNight(true);world.match('live','home',1000,true);const d=world.details.get('warriors');assert(d.beam.visible);let glow=0;d.root.traverse(o=>{if(o.geometry?.type==='RingGeometry'&&o.visible)glow++;});assert.equal(glow,1);world.match('final','home',1000,true);glow=0;d.root.traverse(o=>{if(o.geometry?.type==='RingGeometry'&&o.visible)glow++;});assert.equal(glow,0);assert(d.beam.visible);world.setNight(false);assert.equal(d.beam.visible,false);
  world.updateCruise(16);const before=d.cruise.position.clone();world.updateCruise(0);assert(d.cruise.position.equals(before));world.visibility('lakers',true,1);assert.equal([...world.details.values()].filter(d=>d.root.visible).length,0);world.dispose();assert.equal(world.details.size,0);
});
test('original iframe bridge targets existing UI IDs, gates arrival and unloads on close',async()=>{
  let opened=0,closed=0;const nodes=new Map(),listeners=new Map();const element=id=>{if(!nodes.has(id))nodes.set(id,{id,value:id==='game-state'?'live':'away',dataset:{},addEventListener(type,fn){listeners.set(id+type,fn);},click(){this.clicked=true;},scrollIntoView(){},showModal(){this.open=true;},close(){this.open=false;listeners.get(id+'close')?.();}});return nodes.get(id);};
  const frame=element('legacy-frame'),target=new Map();for(const id of ['shop-go-warriors','shop-enter','fan-map-marker','bay-fixture','shop-dialog'])target.set(id,{dataset:{location:'shop-warriors'},click(){this.clicked=true;},dispatchEvent(){},scrollIntoView(){}});frame.contentDocument={getElementById:id=>target.get(id),querySelector:()=>null};
  const m=await modules({document:{getElementById:element},Event:class{}}),{createLegacyBridge}=await m.load(path.join(BASE,'legacy-bridge.js'));const bridge=createLegacyBridge({onOpen(){opened++;},onClose(){closed++;},onError(error){throw error;}});await bridge.open('shop','shop-warriors');assert.equal(opened,1);assert.match(frame.src,/index.html$/);await frame.onload();assert(target.get('shop-go-warriors').clicked);assert(target.get('shop-enter').clicked);element('legacy-dialog').close();assert.equal(closed,1);assert.equal(frame.src,'about:blank');assert.equal(frame.onload,null);bridge.dispose();
});
test('prototype app event wiring boots on desktop/mobile substitutes, selects 30 teams and preserves feature return position',async()=>{
  const m=await modules(),THREE=await m.load(path.join(BASE,'vendor/three-r187/build/three.module.js'));THREE.TextureLoader.prototype.load=()=>new THREE.Texture();const {buildWorld}=await m.load(path.join(BASE,'scene.js')),{createLegacyBridge}=await m.load(path.join(BASE,'legacy-bridge.js'));
  for(const width of [1000,390]){
    const app=await require('./three-ui-harness.cjs')({THREE,buildWorld,createLegacyBridge,Core,width});await app.advance(1600);assert(app.renders()>0);assert.equal(app.snapshot().quality,width<760?'low':'standard');
    for(const team of C.TEAMS){app.get('team-'+team.id).click();await app.settle();assert.equal(app.snapshot().teamId,team.id);}
    app.get('team-warriors').click();await app.settle();await app.advance(1000);const before=app.snapshot().position;app.get('overview').click();await app.advance(1200);assert(app.snapshot().overview);assert.deepEqual(app.snapshot().position,before);app.get('island-view').click();await app.settle();await app.advance(1500);
    app.get('policy').click();assert(app.snapshot().legacyOpen);assert.match(app.get('legacy-frame').src,/index.html$/);app.get('legacy-close').click();assert.equal(app.snapshot().legacyOpen,false);assert.deepEqual(app.snapshot().position,before);
    app.get('night').click();assert.equal(app.snapshot().theme,'night');app.get('game-state').value='final';app.get('game-state').emit('change');assert.match(app.get('game-status').textContent,/108：101/);
    app.get('team-lakers').click();await app.settle();app.get('arena').click();await app.advance(5000);assert.equal(app.snapshot().locationId,'lakers');assert(app.snapshot().legacyOpen);app.get('legacy-close').click();const lakers=app.snapshot().position;app.get('overview').click();await app.advance(1200);assert.deepEqual(app.snapshot().position,lakers);
    app.get('island-view').click();await app.settle();const court=Core.destinations('lakers').find(p=>p.kind==='court');app.get('destinations').children.find(b=>b.dataset.destination===court.id).click();await app.advance(32);const walking=app.snapshot();assert(walking.moving);app.hidden(true);await app.advance(12000);assert.deepEqual(app.snapshot().position,walking.position);app.hidden(false);await app.advance(32);assert(app.snapshot().moving,'background time must not fast-forward the walker');await app.advance(5000);assert.equal(app.snapshot().locationId,court.id);assert(app.snapshot().legacyOpen);app.get('legacy-close').click();
    app.hidden(true);assert.equal(app.raf.size,0);app.hidden(false);app.observers[0].callback([{isIntersecting:false}]);assert.equal(app.raf.size,0);app.dispose();assert.equal(app.raf.size,0);
  }
});
