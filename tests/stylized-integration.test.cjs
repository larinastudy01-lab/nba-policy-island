'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const C=require('../assets/island-core.js'),A=require('../assets/archipelago-core.js'),E=require('../assets/explorer-core.js'),F=require('../assets/fan-core.js'),Controller=require('../assets/map-controller.js');
const root=path.resolve(__dirname,'..'),base=path.join(root,'prototype/three-islands');
test('shared controller reaches all original 30 arenas and 15 courts without changing IDs',()=>{
  const c=Controller.create({getSelection:()=>({id:'warriors'})});let now=0;
  for(const p of [...C.TEAMS,...C.COURTS]){c.visit(p.id,now);c.tick(now+6000);assert(c.hasArrived(p.id));assert.deepEqual({x:c.position().x,y:c.position().y},E.entrance(p.id));now+=7000;}
  const before=c.position();c.fullIsland();assert.deepEqual(c.position(),before);c.districtView('island-lakers');assert.deepEqual(c.position(),before);c.destroy();
});
test('new destination cancels old arrival and dialog/background pause preserves travel time',()=>{
  const c=Controller.create({getSelection:()=>({id:'warriors'})});c.visit('lakers',1000);c.tick(1300);c.pause(true,1300);const before=c.position();c.pause(false,11300);c.tick(11300);assert.equal(c.position().x,before.x);assert.equal(c.position().y,before.y);assert.equal(c.hasArrived('lakers'),false);
  c.visit('nets',11400);c.tick(17000);assert(c.hasArrived('nets'));assert.equal(c.hasArrived('lakers'),false);c.backToDistrict();assert.equal(c.camera.islandId,'island-nets');c.setTheme('night');assert.equal(c.getTheme(),'night');assert(c.hasArrived('nets'));
});
test('historical pixel and new 3D albums coexist, remain immutable after changing clothes',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  const old=F.createPhoto('lakers',{...F.DEFAULT_AVATAR,nickname:'Historical'});data.set(F.ALBUM_KEY,JSON.stringify({version:1,photos:[old]}));const session=F.createFanSession(storage);
  const modern={...F.createPhoto('warriors',{...F.DEFAULT_AVATAR,nickname:'Snapshot'}),artVersion:'stylized-3d-v1'};session.collect(modern);const saved=JSON.parse(data.get(F.ALBUM_KEY));assert.equal(saved.photos.length,2);assert.equal(saved.photos.find(p=>p.teamId==='lakers').artVersion,old.artVersion);assert.equal(F.normalizePhoto(modern).artVersion,'stylized-3d-v1');modern.avatar.nickname='Edited later';assert.equal(JSON.parse(data.get(F.ALBUM_KEY)).photos.find(p=>p.teamId==='warriors').avatar.nickname,'Snapshot');assert.match(F.photoSVG(old),/Historical/);
});
test('formal bootstrap has one renderer and local import map, legacy artwork is inert',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.match(html,/<template id="fallback-world">/);assert(!/<iframe\b/.test(html));const map=JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);for(const value of Object.values(map.imports)){assert(value.startsWith('./'));assert(fs.existsSync(path.resolve(root,value)));}
  const boot=fs.readFileSync(path.join(root,'assets/map-bootstrap.js'),'utf8');assert.match(boot,/location.protocol==='file:'/);assert.match(boot,/template.content.cloneNode/);assert.match(boot,/mountWorld\(false\)/);const main=fs.readFileSync(path.join(root,'assets/three-map/main.js'),'utf8');assert.match(main,/antialias:true/);assert.match(main,/PCFSoftShadowMap/);assert(!/setPixelRatio\(\.[1-5]\)/.test(main));
});
let registered=false;
async function modules(){
  if(!registered){require('node:module').registerHooks({resolve(s,c,next){if(s==='three')return {url:pathToFileURL(path.join(base,'vendor/three-r187/build/three.module.js')).href,shortCircuit:true};if(s.startsWith('three/addons/'))return {url:pathToFileURL(path.join(base,'vendor/three-r187/addons',s.slice(13))).href,shortCircuit:true};return next(s,c);}});registered=true;}
  Object.assign(globalThis,{NBAIsland:C,NBAArchipelago:A,NBAFan:F,NBASights:require('../assets/sights-core.js'),NBAMemory:require('../assets/memory-core.js'),NBAShop:require('../assets/shop-core.js'),NBAVehicles:require('../assets/vehicle-core.js'),NBATraffic:require('../assets/traffic-core.js'),document:{createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})}});
  const T=await import(pathToFileURL(path.join(base,'vendor/three-r187/build/three.module.js')).href);T.TextureLoader.prototype.load=(url,done)=>{const texture=new T.Texture();queueMicrotask(()=>done?.(texture));return texture;};return T;
}
test('smooth model modules cover 30 city features and have curved geometry and finite avatar options',async()=>{
  const T=await modules(),M=await import(pathToFileURL(path.join(root,'assets/three-map/models.js')).href);assert.deepEqual(Object.keys(M.CITY).sort(),C.TEAMS.map(t=>t.id).sort());const kit=M.createKit(),parent=new T.Group();
  for(const team of C.TEAMS){const group=new T.Group();M.stadium(kit,group,team,{detail:['warriors','lakers','bulls'].includes(team.id)});M.cityFeature(kit,group,team);assert(group.children.length>3);parent.add(group);}
  const actor=M.character(kit,F.DEFAULT_AVATAR);assert.equal(actor.userData.legs.length,2);assert.equal(actor.userData.arms.length,2);assert([...kit.geometries.values()].some(g=>g.type==='SphereGeometry'));assert([...kit.materials.values()].every(m=>!m.flatShading));kit.dispose();
});
test('detail LRU, raycast targets, home-only LIVE and night illumination remain independent',async()=>{
  const T=await modules(),{createWorld}=await import(pathToFileURL(path.join(root,'assets/three-map/world.js')).href),world=createWorld(new T.Scene());world.library.treeInstances=async()=>new T.Group();world.library.normalized=async()=>new T.Group();
  for(const id of ['warriors','lakers','bulls','warriors']){await world.loadDetail(id);world.visibility(id,false,2);assert(world.details.size<=2);assert.equal([...world.details.values()].filter(d=>d.group.visible).length,1);assert(world.hits.some(h=>h.parent===world.details.get(id).group&&h.userData.id===id));}
  world.setNight(true);world.update(16,100,{teamId:'warriors',overview:false,state:'live',fixture:'away',reduced:false});const rings=world.root.children.filter(o=>o.geometry?.type==='RingGeometry');assert.equal(rings.filter(r=>r.visible).length,C.TEAMS.filter(t=>C.gameForTeam(t.id,'live','away').glowing).length);assert(world.lighting().night);world.update(16,100,{teamId:'warriors',overview:false,state:'final',fixture:'away',reduced:true});assert(rings.every(r=>!r.visible));assert(world.lighting().night);world.visibility('bulls',false,1);assert(world.details.size<=1);world.destroy();assert.equal(world.details.size,0);
});
