'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../assets/shop-core.js'),A=require('../assets/archipelago-core.js'),E=require('../assets/explorer-core.js'),C=require('../assets/island-core.js'),Art=require('../assets/shop-art.cjs');
function memory(initial={}){const values=new Map(Object.entries(initial));let blocked=false;return {values,block(value){blocked=value;},getItem:key=>values.get(key)??null,setItem(key,value){if(blocked)throw Error('Quota');values.set(key,value);}};}
const state=session=>{const {notice,ready,...data}=session.snapshot();return data;};
test('two team shops have four distinct merch types each, local pixel art and explicitly unavailable jersey IDs',()=>{
  assert.equal(S.SHOPS.length,2);assert.equal(S.PRODUCTS.length,8);assert.equal(new Set(S.PRODUCTS.map(p=>p.id)).size,8);for(const shop of S.SHOPS){const list=S.PRODUCTS.filter(p=>p.shopId===shop.id);assert.deepEqual(list.map(p=>p.type),['cap','mini-ball','scarf','poster']);for(const [file,svg]of [[shop.asset,Art.storefront(shop).svg(shop.name+'・原創等距像素店鋪')],[shop.nightAsset,Art.storefront(shop,true).svg(shop.name+'・原創等距像素店鋪')]])assert.equal(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),svg);}
  for(const product of S.PRODUCTS){assert(Number.isSafeInteger(product.price)&&product.price>0);assert(product.assetId);assert(fs.existsSync(path.resolve(__dirname,'..',product.asset)));assert.notEqual(S.getProduct(product.id),null);}
  assert.equal(S.RESERVED_PRODUCTS.length,2);for(const p of S.RESERVED_PRODUCTS){assert.equal(p.type,'jersey');assert.equal(p.available,false);assert.equal(p.price,null);assert(p.assetId);assert.equal(S.getProduct(p.id),null);}
});
test('shop doors use the island road graph, have non-overlapping building hot areas and retain cross-sea access',()=>{
  for(const shop of S.SHOPS){assert.equal(C.getLandmark('shop',shop.id).id,shop.id);assert(A.contains(A.owner(shop.id),shop.entrance));assert.deepEqual(E.entrance(shop.id),shop.entrance);assert.deepEqual(E.roadPath(E.entrance(shop.teamId),shop.id).at(-1),shop.entrance);const cam=E.createCamera();assert.equal(E.interactiveVisible(cam,shop.id),false);E.focusVenue(cam,shop.id);assert.equal(E.interactiveVisible(cam,shop.id),true);assert.equal(cam.islandId,shop.islandId);
    const arena=C.getLandmark('nba',shop.teamId),court=C.COURTS.find(p=>p.teamIslandId===shop.teamId);assert(shop.x-shop.width/2>arena.x+80);assert(shop.y<court.y-52);}
  const route=E.roadPath(E.entrance('shop-warriors'),'shop-lakers');for(const id of ['sea-west-560','sea-west-910'])assert(route.some(p=>p.x===A.ROAD_NODES[id].x&&p.y===A.ROAD_NODES[id].y));assert.equal(C.TEAMS.length,30);assert.equal(C.COURTS.length,15);
});
test('first configurable grant is persisted once; zero is valid and later config changes do not refill',()=>{
  for(const grant of [0,200,1200]){const storage=memory(),one=S.createSession(storage,{initialCoins:grant});assert.equal(one.snapshot().balance,grant);assert.equal(S.createSession(storage,{initialCoins:9999}).snapshot().balance,grant);assert.equal(one.snapshot().initialGrant,grant);}
  for(const invalid of [-1,1.5,'300',Infinity,Number.MAX_SAFE_INTEGER])assert.equal(S.initialCoins({initialCoins:invalid}),1200);
});
test('quantities are positive bounded integers; rejected adds, merges and updates leave all purchase data unchanged',()=>{
  const session=S.createSession(memory());assert(session.add('warriors-cap','2').ok);assert(session.add('warriors-cap','3').ok);assert.equal(session.snapshot().cart[0].quantity,5);
  for(const q of ['',0,-1,1.5,'1e1','1.5','NaN',Infinity,null,{},100]){const before=state(session);assert.equal(session.add('warriors-cap',q).ok,false);assert.equal(session.update('warriors-cap',q).ok,false);assert.deepEqual(state(session),before);}
  assert(session.update('warriors-cap',99).ok);const before=state(session);assert.equal(session.add('warriors-cap',1).ok,false);assert.deepEqual(state(session),before);assert.equal(session.add('warriors-jersey',1).code,'product');assert.equal(session.add('fake',1).code,'product');
});
test('shared cart merges by SKU across teams and reloads exact totals; removal and clear never touch wallet or collection',()=>{
  const storage=memory(),session=S.createSession(storage);session.add('warriors-cap',1);session.add('lakers-mini-ball',2);assert.equal(S.cartTotal(session.snapshot().cart),440);const restored=S.createSession(storage);assert.equal(restored.snapshot().cart.length,2);assert.equal(S.cartTotal(restored.snapshot().cart),440);restored.remove('warriors-cap');assert.deepEqual(restored.snapshot().cart,[{productId:'lakers-mini-ball',quantity:2}]);restored.clear();assert.equal(restored.snapshot().balance,1200);assert.deepEqual(restored.snapshot().collection,[]);
});
test('insufficient balance, empty cart and missing items give concrete errors and change no saved purchase state',()=>{
  const storage=memory(),session=S.createSession(storage,{initialCoins:100});assert.equal(session.checkout().code,'empty');session.add('warriors-cap',1);const before=state(session),raw=storage.values.get(S.STORAGE_KEY);const result=session.checkout();assert.equal(result.code,'balance');assert.match(result.message,/120.*100.*20/);assert.deepEqual(state(session),before);assert.equal(storage.values.get(S.STORAGE_KEY),raw);assert.equal(session.update('fake',1).code,'missing');assert.equal(session.remove('fake').code,'missing');
});
test('checkout atomically deducts 280, collects both teams, clears the cart and cannot charge again after submit or reload',()=>{
  const storage=memory(),session=S.createSession(storage);session.add('warriors-cap',1);session.add('lakers-mini-ball',1);const result=session.checkout();assert.equal(result.ok,true);assert.equal(result.total,280);assert.equal(session.snapshot().balance,920);assert.equal(session.snapshot().cart.length,0);assert.equal(session.snapshot().collection.length,2);assert.deepEqual(session.snapshot().equipment,{});assert.equal(session.checkout().code,'empty');assert.equal(session.snapshot().balance,920);
  const reload=S.createSession(storage,{initialCoins:9999});assert.equal(reload.snapshot().balance,920);assert.equal(reload.snapshot().collection.length,2);assert.equal(reload.snapshot().purchases,1);
});
test('failed storage during checkout rolls back wallet, collection and cart; a retry succeeds only once',()=>{
  const storage=memory(),session=S.createSession(storage);session.add('warriors-cap',1);session.add('lakers-mini-ball',1);const before=state(session),raw=storage.values.get(S.STORAGE_KEY);storage.block(true);assert.equal(session.checkout().code,'storage');assert.deepEqual(state(session),before);assert.equal(storage.values.get(S.STORAGE_KEY),raw);storage.block(false);assert(session.checkout().ok);assert.equal(session.snapshot().balance,920);
});
test('unavailable storage permits this-page cart edits but never reports a completed purchase or loses funds',()=>{
  const session=S.createSession(null);assert(session.add('warriors-cap',1).ok);assert.equal(session.checkout().ok,false);assert.equal(session.snapshot().balance,1200);assert.equal(session.snapshot().cart.length,1);assert.equal(session.snapshot().collection.length,0);assert.match(session.snapshot().notice,/儲存/);
});
test('malformed shopping data is not overwritten or rewarded again; unrelated avatar/photo/policy keys stay intact',()=>{
  for(const raw of ['{','null','{"version":2}','{"version":1,"balance":-1}']){const storage=memory({[S.STORAGE_KEY]:raw}),session=S.createSession(storage);assert.equal(session.snapshot().ready,false);assert.equal(session.add('warriors-cap',1).ok,false);assert.equal(session.checkout().ok,false);assert.equal(storage.values.get(S.STORAGE_KEY),raw);}
  const storage=memory({'nba-policy-island:fan:v1':'avatar','nba-policy-island:photos:v1':'photo','nba-policy-island:policy:v1':'policy'}),session=S.createSession(storage);session.add('warriors-cap',1);session.checkout();assert.equal(storage.values.get('nba-policy-island:fan:v1'),'avatar');assert.equal(storage.values.get('nba-policy-island:photos:v1'),'photo');assert.equal(storage.values.get('nba-policy-island:policy:v1'),'policy');
});
test('prices always come from catalog; existing equipment stays separate when more collectibles are purchased',()=>{
  const storage=memory(),session=S.createSession(storage);session.add('warriors-cap',1);session.checkout();const saved=JSON.parse(storage.values.get(S.STORAGE_KEY));saved.equipment={cap:'warriors-cap'};saved.cart=[{productId:'lakers-scarf',quantity:1,price:1}];storage.values.set(S.STORAGE_KEY,JSON.stringify(saved));const reload=S.createSession(storage);assert.equal(reload.checkout().total,180);assert.deepEqual(reload.snapshot().equipment,{cap:'warriors-cap'});assert.equal(reload.snapshot().balance,900);
});
test('stale tabs cannot overwrite a newer shopping snapshot or submit its purchase a second time',()=>{
  const storage=memory(),first=S.createSession(storage);first.add('warriors-cap',1);const stale=S.createSession(storage);assert(first.checkout().ok);const before=state(stale);assert.equal(stale.checkout().code,'conflict');assert.deepEqual(state(stale),before);assert.equal(S.createSession(storage).snapshot().balance,1080);
});
