"use strict";
// Node 元素／事件替身；不啟動瀏覽器、不控制桌面、不驗證像素排版。
const test=require("node:test");const assert=require("node:assert/strict");const fs=require("node:fs");const path=require("node:path");const vm=require("node:vm");
const root=path.resolve(__dirname,"..");const html=fs.readFileSync(path.join(root,"index.html"),"utf8");const C=require("../assets/island-core.js");const P=require("../assets/policy-core.js");
const F=require("../assets/fan-core.js");
const G=require("../assets/games-core.js");
function boot(initial={},adapterFixture=null,options={}){
  const nodes=new Map(),inputs=[],timers=new Map(),records=new Map(Object.entries(initial));let clock=options.now??100000,id=0,fetchCalls=0;
  const docEvents=new Map();
  const document={activeElement:null,hidden:false,addEventListener(type,callback){const list=docEvents.get(type)||[];list.push(callback);docEvents.set(type,list);}};
  class Element{
    constructor(tag="div"){this.tagName=tag.toUpperCase();this.children=[];this.attributes=new Map();this.listeners=new Map();this.dataset={};this.hidden=false;this.disabled=false;this.checked=false;this.value="";this.textContent="";this.className="";this._html="";this.style={setProperty(name,value){this[name]=value;}};this.classList={add:(...values)=>{this.className=[this.className,...values].join(" ").trim();}};}
    set innerHTML(value){this._html=value;this._text="";this.children=[];}get innerHTML(){return this._html+this.children.map(child=>`<${child.tagName.toLowerCase()}>${child._text}${child.innerHTML}</${child.tagName.toLowerCase()}>`).join("");}
    set textContent(value){this._text=String(value);this._html="";this.children=[];}get textContent(){return this._text+this.children.map(child=>child.textContent).join("");}
    setAttribute(key,value){this.attributes.set(key,String(value));}getAttribute(key){return this.attributes.get(key)??null;}
    removeAttribute(key){this.attributes.delete(key);}
    append(...children){for(const child of children){this.children.push(child);if(child&&typeof child==='object')child.parentElement=this;if(child.id)nodes.set(child.id,child);}}replaceChildren(...children){this.children=[];this.textContent="";for(const child of children)this.append(child);}
    contains(target){for(let node=target;node;node=node.parentElement)if(node===this)return true;return false;}
    closest(selector){const match=selector.match(/^button\[data-([\w-]+)\]$/);if(!match)return null;const key=match[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase());for(let node=this;node;node=node.parentElement)if(node.tagName==='BUTTON'&&node.dataset[key]!==undefined)return node;return null;}
    addEventListener(type,callback){const handlers=this.listeners.get(type)||[];handlers.push(callback);this.listeners.set(type,handlers);}
    emit(type,extra={}){if(this.disabled)return;const event={target:this,preventDefault(){this.defaultPrevented=true;},...extra};for(const cb of this.listeners.get(type)||[])cb(event);return event;}
    focus(){document.activeElement=this;}select(){this.selected=true;}
    play(){this.plays=(this.plays||0)+1;return Promise.resolve();}pause(){this.pauses=(this.pauses||0)+1;}
    showModal(){this.open=true;}close(){this.open=false;this.emit("close");}
    click(){if(this.tagName==="A")downloads.push({href:this.href,download:this.download});this.emit("click");}
  }
  for(const [,tag,raw] of html.matchAll(/<([a-z][a-z\d-]*)\b([^>]*)>/gi)){
    const attrs=Object.fromEntries([...raw.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(x=>[x[1],x[2]??""]));if(!attrs.id&&tag!=="input")continue;
    const el=new Element(tag);el.id=attrs.id;el.name=attrs.name;el.value=attrs.value||"";el.checked=Object.hasOwn(attrs,"checked");el.hidden=Object.hasOwn(attrs,"hidden");el.disabled=Object.hasOwn(attrs,"disabled");
    if(attrs.id)nodes.set(attrs.id,el);if(tag==="input")inputs.push(el);
  }
  document.getElementById=id=>nodes.get(id)||null;document.createElement=tag=>new Element(tag);document.createElementNS=(ns,tag)=>new Element(tag);document.querySelectorAll=selector=>inputs.filter(input=>input.name===selector.match(/name="([^"]+)"/)?.[1]);
  const storage={getItem:key=>{if(options.storageBlocked)throw new Error("Storage blocked");return records.get(key)??null;},setItem:(key,value)=>{if(options.storageBlocked||options.storageWriteBlocked)throw new Error("Storage blocked");records.set(key,value);}};
  class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
  let intersection=()=>{};
  const windowSurface=new Element("window");windowSurface.localStorage=storage;windowSurface.location={href:options.url||"file:///project/index.html"};windowSurface.IntersectionObserver=class{constructor(callback){intersection=callback;}observe(){}disconnect(){}};
  // 舊流程預設測減少動態效果的直接抵達；移動測試明確傳 reducedMotion:false。
  const motion=new Element("media");motion.matches=options.reducedMotion!==false;windowSurface.matchMedia=()=>motion;
  const downloads=[],revoked=[];class LocalURL extends URL{static createObjectURL(){return "blob:local-test-png";}static revokeObjectURL(value){revoked.push(value);}}
  const context=vm.createContext({document,window:windowSurface,navigator:{},URL:LocalURL,atob,Date:ClockDate,fetch:async()=>{fetchCalls++;throw new Error("Unexpected network");},setInterval:(callback,delay)=>{timers.set(++id,{callback,delay});return id;},clearInterval:id=>timers.delete(id)});
  for(const file of ["assets/archipelago-core.js","assets/memory-core.js","assets/shop-config.js","assets/shop-core.js","assets/pixel-core.js","assets/pixel-tiles.js","assets/supabase-config.js","assets/games-core.js","assets/sights-core.js","assets/traffic-core.js","assets/island-core.js","assets/team-logo-ui.js","assets/explorer-core.js","assets/bay-scene.js","assets/practice-core.js","assets/policy-core.js","assets/online.js","assets/fan-core.js","assets/fan-ui.js","assets/games-ui.js","assets/explorer-ui.js","assets/memory-ui.js","assets/shop-ui.js","script.js"]){if(file==="script.js"&&adapterFixture)context.NBAOnline={createSupabaseAdapter:()=>adapterFixture};vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),context,{filename:file});if(file==="assets/shop-config.js"&&Object.hasOwn(options,"initialCoins"))context.NBA_SHOP_CONFIG={initialCoins:options.initialCoins};if(file==="assets/memory-core.js"&&options.memoryRecords){const api=context.NBAMemory,cat=api.createCatalog(options.memoryRecords);context.NBAMemory={...api,EVENTS:cat.events,ENTRANCES:cat.entrances,get:cat.get,getEntrance:cat.getEntrance,forEvent:cat.forEvent,createBook:storage=>api.createBook(storage,options.memoryRecords)};}}
  // timerCount 預設只計 50ms 投籃計時；可另指定 30000ms 檢查每日輪替計時。
  return {blockStorageWrites(value){options.storageWriteBlocked=value;},startPractice(withTutorial=false){nodes.get("practice-start").emit("click");if(!withTutorial&&!nodes.get("tutorial-controls").hidden)nodes.get("tutorial-skip").emit("click");},ready(){nodes.get("ready-toggle").emit("click");if(!nodes.get("tutorial-controls").hidden)nodes.get("tutorial-skip").emit("click");},mapVisibility(isIntersecting){intersection([{isIntersecting}]);},visibility(hidden){document.hidden=hidden;for(const cb of docEvents.get("visibilitychange")||[])cb();},get(name){assert.ok(nodes.has(name),`Missing ${name}`);return nodes.get(name);},nodes,document,records,downloads,revoked,setPNGExporter:handler=>{context.NBAFan.exportPNG=handler;},network:()=>fetchCalls,now:()=>clock,timerCount:(delay=50)=>[...timers.values()].filter(item=>item.delay===delay).length,windowEvent:(name,extra)=>windowSurface.emit(name,extra),reduceMotion(value){motion.matches=value;motion.emit("change");},select(name,value){for(const input of inputs.filter(i=>i.name===name))input.checked=input.value===value;inputs.find(i=>i.name===name&&i.value===value).emit("change");},advance(ms){clock+=ms;for(const timer of [...timers.values()])timer.callback();}};
}
function logoFrames(node){const result=[];function visit(n){if(n.className?.split(' ').includes('team-logo'))result.push(n);for(const child of n.children||[])visit(child);}visit(node);return result;}
test('all thirty search rows use stable lazy decorative logos from shared team data',()=>{
  const app=boot(),original=new Map();
  for(const team of C.TEAMS){const row=app.get('list-'+team.id),frame=logoFrames(row)[0],image=frame.children[1];original.set(team.id,frame);assert.equal(frame.dataset.teamId,team.id);assert.equal(frame.getAttribute('aria-hidden'),'true');assert.equal(image.alt,'');assert.equal(image.loading,'lazy');assert.equal(image.src,team.logo);assert.equal(image.width,image.height);assert.match(row.textContent,new RegExp(team.name));}
  for(const query of ['公牛','騎士','LAL','LAC','NYK','BKN']){app.get('team-search').value=query;app.get('team-search').emit('input');for(const team of C.searchTeams(query)){assert.equal(app.get('list-'+team.id).hidden,false);assert.equal(logoFrames(app.get('list-'+team.id))[0],original.get(team.id));}}
  app.select('game-state','final');for(const team of C.TEAMS)assert.equal(logoFrames(app.get('list-'+team.id))[0],original.get(team.id));
});
test('selected cards and both scoreboard rows resolve the correct home and away logos across thirty teams and game states',()=>{
  const app=boot();
  for(const team of C.TEAMS){app.get('list-'+team.id).emit('click');assert.equal(logoFrames(app.get('team-badge'))[0].children[1].src,team.logo);const match=C.gameForTeam(team.id);for(const id of ['team-game','map-scoreboard']){const frames=logoFrames(app.get(id));assert.deepEqual(frames.map(f=>f.dataset.teamId),[match.homeId,match.awayId]);assert.deepEqual(frames.map(f=>f.children[1].src),[match.home.logo,match.away.logo]);}}
  app.get('list-warriors').emit('click');for(const mode of ['scheduled','live','final','idle']){app.select('game-state',mode);assert.equal(logoFrames(app.get('team-game')).length,mode==='idle'?0:2);assert.equal(app.get('landmark-warriors').dataset.glowing,'false');assert.equal(app.get('landmark-lakers').dataset.glowing,String(mode==='live'));}
  app.get('bay-fixture').value='home';app.get('bay-fixture').emit('change');app.select('game-state','live');assert.deepEqual(logoFrames(app.get('team-game')).map(f=>f.dataset.teamId),['warriors','lakers']);
});
test('arena signs only populate the current team island and overview hides every sign without moving the fan',()=>{
  const app=boot();for(const team of C.TEAMS){assert.equal(app.get('arena-logo-'+team.id).hidden,true);assert.equal(app.get('arena-logo-'+team.id).children.length,0);}
  app.get('landmark-warriors').emit('keydown',{key:'Enter'});assert.equal(app.get('arena-logo-warriors').hidden,false);assert.equal(logoFrames(app.get('arena-logo-warriors'))[0].children[1].src,C.getLandmark('nba','warriors').logo);
  app.get('landmark-lakers').emit('keydown',{key:' '});assert.equal(app.get('arena-logo-warriors').hidden,true);assert.equal(app.get('arena-logo-lakers').hidden,false);
  const position=app.get('fan-map-marker').style.left;app.get('camera-overview').emit('click');assert.equal(app.get('fan-map-marker').style.left,position);for(const team of C.TEAMS)assert.equal(app.get('arena-logo-'+team.id).hidden,true);
});
test('store headers, cross-team cart rows and memory team fields share the same decorative logo renderer',()=>{
  const app=boot();enterShop(app);assert.equal(logoFrames(app.get('shop-team-logo'))[0].children[1].src,C.getLandmark('nba','warriors').logo);addMerch(app,'warriors-cap');app.get('shop-continue').emit('click');enterShop(app,'lakers');addMerch(app,'lakers-mini-ball');assert.equal(logoFrames(app.get('shop-team-logo'))[0].dataset.teamId,'lakers');assert.deepEqual(logoFrames(app.get('shop-cart-items')).map(f=>f.dataset.teamId),['warriors','lakers']);app.get('shop-close').emit('click');app.get('shop-cart-open').emit('click');assert.equal(app.get('shop-team-logo').hidden,true);app.get('shop-close').emit('click');
  const M=require('../assets/memory-core.js');assert.deepEqual(logoFrames(app.get('memory-book-list')).map(f=>f.dataset.teamId),M.EVENTS.map(e=>e.teamId));
  for(const id of ['memory-lakers-2020','memory-bulls-1998']){app.get('landmark-'+id).emit('click');const team=C.getLandmark('nba',M.get(id).teamId);assert.equal(logoFrames(app.get('memory-team-logo'))[0].children[1].src,team.logo);app.get('memory-close').emit('click');}assert.equal(app.network(),0);
});
test('a failed team image exposes the abbreviation in the same reserved frame and a load restores the image',()=>{
  const app=boot();app.get('list-cavaliers').emit('click');const frame=logoFrames(app.get('team-badge'))[0],[fallback,image]=frame.children;
  assert.equal(fallback.textContent,'CLE');image.emit('load');assert.equal(frame.dataset.loaded,'true');assert.equal(fallback.hidden,true);assert.equal(image.hidden,false);
  image.emit('error');assert.equal(frame.dataset.loaded,'false');assert.equal(fallback.hidden,false);assert.equal(image.hidden,true);assert.equal(frame.getAttribute('aria-hidden'),'true');assert.match(app.get('panel-title').textContent,/騎士/);
});
function enterShop(app,team='warriors'){app.get('landmark-shop-'+team).emit('click');if(app.get('fan-map-marker').dataset.moving==='true')app.advance(5000);app.get('shop-enter').emit('click');assert.equal(app.get('shop-dialog').open,true);}
function addMerch(app,id,quantity='1'){app.get('shop-product').value=id;app.get('shop-add-quantity').value=quantity;return app.get('shop-add-form').emit('submit');}
test('shops require walking to the door, support keyboard opening and keep the existing camera and island position',()=>{
  const app=boot({},null,{reducedMotion:false});assert.equal(app.get('shop-layer').children.length,2);app.get('landmark-shop-warriors').emit('focus');assert.equal(app.get('island-map').dataset.teamIsland,'island-warriors');assert.equal(app.get('fan-map-marker').dataset.location,'warriors');app.get('landmark-shop-warriors').emit('keydown',{key:'Enter',repeat:true});assert.equal(app.get('fan-map-marker').dataset.moving,'false');app.get('landmark-shop-warriors').emit('keydown',{key:'Enter'});assert.equal(app.get('fan-map-marker').dataset.moving,'true');assert.equal(app.get('shop-enter').disabled,true);assert.equal(Boolean(app.get('shop-dialog').open),false);app.advance(5000);assert.equal(app.get('shop-panel').hidden,false);assert.equal(app.get('shop-enter').disabled,false);assert.equal(Boolean(app.get('shop-dialog').open),false);app.get('landmark-shop-warriors').emit('keydown',{key:' '});assert.equal(app.get('shop-dialog').open,true);assert.equal(app.get('shop-products').children.length,4);app.get('shop-close').emit('click');const point=app.get('fan-map-marker').style.left;app.get('camera-overview').emit('click');assert.equal(app.get('fan-map-marker').style.left,point);assert.equal(app.get('fan-map-marker').dataset.location,'shop-warriors');
});
test('Warriors purchase selection survives the cross-island walk to Lakers and both teams share the saved cart',()=>{
  const app=boot({},null,{reducedMotion:false});enterShop(app);const event=addMerch(app,'warriors-cap');assert.equal(event.defaultPrevented,true);app.get('shop-continue').emit('click');app.get('landmark-shop-lakers').emit('click');assert.equal(app.get('fan-map-marker').dataset.moving,'true');app.advance(5000);app.get('shop-enter').emit('click');assert.match(app.get('shop-heading').textContent,/湖人/);addMerch(app,'lakers-mini-ball');assert.equal(app.get('shop-cart-items').children.length,2);assert.match(app.get('shop-cart-items').textContent,/勇士球迷帽/);assert.match(app.get('shop-cart-items').textContent,/湖人迷你籃球/);assert.equal(app.get('shop-total').textContent,'280');assert.equal(app.get('shop-balance').textContent,'1,200');assert.equal(app.network(),0);
  const reload=boot(Object.fromEntries(app.records));reload.get('shop-cart-open').emit('click');assert.equal(reload.get('shop-cart-items').children.length,2);assert.equal(reload.get('shop-total').textContent,'280');assert.equal(reload.get('shop-catalog').hidden,true);
});
test('cart container delegates nested dynamic update/remove buttons once and recalculates totals without charging',()=>{
  const app=boot();enterShop(app);addMerch(app,'warriors-cap');addMerch(app,'warriors-poster');const container=app.get('shop-cart-items');assert.equal(container.listeners.get('click').length,1);app.get('cart-qty-warriors-cap').value='3';container.emit('input',{target:app.get('cart-qty-warriors-cap')});assert.equal(app.get('shop-total').textContent,'460');assert.match(app.get('cart-subtotal-warriors-cap').textContent,/360/);container.emit('click',{target:app.get('cart-update-warriors-cap').children[0]});assert.equal(app.get('shop-total').textContent,'460');container.emit('click',{target:app.get('cart-remove-warriors-poster').children[0]});assert.equal(container.children.length,1);assert.equal(app.get('shop-total').textContent,'360');assert.equal(app.get('shop-balance').textContent,'1,200');
  for(let i=0;i<3;i++){addMerch(app,'warriors-poster');container.emit('click',{target:app.get('cart-remove-warriors-poster').children[0]});}assert.equal(container.listeners.get('click').length,1);app.get('shop-clear').emit('click');assert.equal(container.children.length,0);assert.equal(app.get('shop-total').textContent,'0');assert.equal(app.get('shop-balance').textContent,'1,200');assert.equal(app.get('shop-collection').children.length,0);
});
test('invalid shop and cart quantities are rejected by submit validation while the prior saved cart and balance remain',()=>{
  const app=boot(),key='nba-policy-island:shop:v1';enterShop(app);for(const q of ['0','-1','1.5','1e1','']){addMerch(app,'warriors-cap',q);assert.equal(app.get('shop-cart-items').children.length,0);assert.match(app.get('shop-message').textContent,/正整數/);}addMerch(app,'warriors-cap');const raw=app.records.get(key);app.get('cart-qty-warriors-cap').value='0';app.get('shop-cart-items').emit('input',{target:app.get('cart-qty-warriors-cap')});const event=app.get('shop-checkout-form').emit('submit');assert.equal(event.defaultPrevented,true);assert.equal(app.records.get(key),raw);assert.equal(app.get('shop-balance').textContent,'1,200');assert.equal(app.get('shop-collection').children.length,0);assert.match(app.get('shop-message').textContent,/數量尚未有效套用/);
  app.get('cart-qty-warriors-cap').value='1';app.get('shop-cart-items').emit('input',{target:app.get('cart-qty-warriors-cap')});assert.equal(app.get('cart-qty-warriors-cap').getAttribute('aria-invalid'),'false');assert.equal(app.get('shop-message').dataset.error,'false');
});
test('insufficient funds and empty cart display exact reasons and never deduct coins or drop merchandise',()=>{
  const app=boot({},null,{initialCoins:100}),key='nba-policy-island:shop:v1';app.get('shop-cart-open').emit('click');app.get('shop-checkout-form').emit('submit');assert.match(app.get('shop-message').textContent,/購物車是空的/);app.get('shop-close').emit('click');enterShop(app);addMerch(app,'warriors-cap');const before=app.records.get(key);app.get('shop-checkout-form').emit('submit');assert.match(app.get('shop-message').textContent,/需要 120.*100.*20/);assert.equal(app.get('shop-balance').textContent,'100');assert.equal(app.get('shop-cart-items').children.length,1);assert.equal(app.records.get(key),before);
});
test('successful submit collects both teams, saves 920 coins across refresh and never equips or alters the fan',()=>{
  const app=boot(),key='nba-policy-island:shop:v1';enterShop(app);addMerch(app,'warriors-cap');app.get('shop-close').emit('click');enterShop(app,'lakers');addMerch(app,'lakers-mini-ball');const fan=app.get('fan-map-avatar').innerHTML;app.get('shop-checkout-form').emit('submit');assert.match(app.get('shop-message').textContent,/模擬結帳成功/);assert.equal(app.get('shop-cart-items').children.length,0);assert.equal(app.get('shop-balance').textContent,'920');assert.equal(app.get('shop-collection').children.length,2);assert.equal(app.get('fan-map-avatar').innerHTML,fan);const saved=JSON.parse(app.records.get(key));assert.deepEqual(saved.equipment,{});assert.equal(saved.purchases,1);app.get('shop-checkout-form').emit('submit');assert.equal(app.get('shop-balance').textContent,'920');
  const reload=boot(Object.fromEntries(app.records),null,{initialCoins:99999});reload.get('shop-cart-open').emit('click');assert.equal(reload.get('shop-balance').textContent,'920');assert.equal(reload.get('shop-collection').children.length,2);assert.equal(reload.get('shop-cart-items').children.length,0);assert.match(reload.get('shop-grant-note').textContent,/1,200/);
});
test('failed local storage write during checkout preserves visible cart, coins, collection and the stored snapshot',()=>{
  const app=boot(),key='nba-policy-island:shop:v1';enterShop(app);addMerch(app,'warriors-cap');const saved=app.records.get(key);app.blockStorageWrites(true);app.get('shop-checkout-form').emit('submit');assert.equal(app.get('shop-balance').textContent,'1,200');assert.equal(app.get('shop-cart-items').children.length,1);assert.equal(app.get('shop-collection').children.length,0);assert.equal(app.records.get(key),saved);assert.match(app.get('shop-message').textContent,/儲存失敗/);app.blockStorageWrites(false);app.get('shop-checkout-form').emit('submit');assert.equal(app.get('shop-balance').textContent,'1,080');assert.equal(app.get('shop-collection').children.length,1);
});
test('thirty-island overview exposes regions first, then only the selected region team names',()=>{
  const app=boot();assert.equal(app.get('region-layer').children.length,8);assert(app.get('region-layer').children.every(b=>!b.hidden));assert(app.get('district-layer').children.every(b=>b.hidden));assert.equal(app.get('open-team-count').textContent,'30／30');
  app.get('region-east').emit('click');assert.equal(app.get('island-map').dataset.district,'east');assert.equal(app.get('island-map').dataset.teamIsland,'');const names=app.get('district-layer').children.filter(b=>!b.hidden);assert.deepEqual(names.map(b=>b.dataset.team).sort(),['celtics','knicks','nets','sixers','wizards']);assert(app.get('region-layer').children.every(b=>b.hidden));
  app.get('district-island-nets').emit('click');assert.equal(app.get('island-map').dataset.teamIsland,'island-nets');app.get('landmark-nets').emit('keydown',{key:'Enter'});assert.match(app.get('panel-title').textContent,/籃網/);assert.match(app.get('team-scene').textContent,/褐石/);assert.equal(app.get('find-star').disabled,true);app.get('camera-overview').emit('click');assert(app.get('district-layer').children.every(b=>b.hidden));assert.equal(app.get('fan-map-marker').dataset.location,'nets');
});
test('team search finds all thirty Chinese names plus English, abbreviation and city; clear restores all teams',()=>{
  const app=boot();app.get('toggle-directory').emit('click');for(const team of C.TEAMS){app.get('team-search').value=team.name;app.get('team-search').emit('input');assert.equal(app.get('station-list').children.filter(b=>!b.hidden).length,1);assert.equal(app.get('list-'+team.id).hidden,false);}
  for(const [term,id]of [[' BKN ','nets'],['Cleveland','cavaliers'],['鹽湖城','jazz'],['Houston','rockets']]){app.get('team-search').value=term;const e=app.get('team-search-form').emit('submit');assert.equal(e.defaultPrevented,true);assert.equal(app.get('list-'+id).hidden,false);}
  app.get('team-search').value='not-a-team';app.get('team-search').emit('input');assert.match(app.get('team-search-status').textContent,/0／30/);app.get('team-search-clear').emit('click');assert.equal(app.get('station-list').children.filter(b=>!b.hidden).length,30);app.get('filter-court').emit('click');assert.equal(app.get('team-search-controls').hidden,true);assert.equal(app.get('station-list').children.filter(b=>!b.hidden).length,15);
});
test('Knicks to Nets then old Warriors to Rockets arrive via new navigation and preserve player position on overview',()=>{
  const app=boot({},null,{reducedMotion:false});app.get('region-east').emit('click');app.get('district-island-knicks').emit('click');app.get('landmark-knicks').emit('click');app.advance(5000);assert.equal(app.get('fan-map-marker').dataset.location,'knicks');app.get('station-close').emit('click');app.get('list-nets').emit('click');assert.equal(app.get('fan-map-marker').dataset.moving,'true');app.advance(5000);assert.equal(app.get('fan-map-marker').dataset.location,'nets');assert.match(app.get('team-venue').textContent,/籃網/);
  app.get('list-warriors').emit('click');app.advance(5000);app.get('list-rockets').emit('click');app.advance(5000);assert.equal(app.get('fan-map-marker').dataset.location,'rockets');assert.match(app.get('team-venue').textContent,/火箭/);assert.equal(app.get('city-layer').children.length,14);app.get('map-night').emit('click');assert.match(app.get('city-rockets').src,/-night.svg$/);assert.equal(app.get('landmark-jazz').dataset.glowing,'true');assert.equal(app.get('landmark-rockets').dataset.glowing,'false');app.select('game-state','final');assert.equal(app.get('landmark-jazz').dataset.glowing,'false');assert.match(app.get('team-game').innerHTML,/111/);
  const pos=[app.get('fan-map-marker').style.left,app.get('fan-map-marker').style.top];app.get('camera-overview').emit('click');assert.deepEqual([app.get('fan-map-marker').style.left,app.get('fan-map-marker').style.top],pos);assert.equal(app.get('fan-map-marker').dataset.location,'rockets');assert.equal(app.get('station-panel').hidden,true);assert.equal(app.network(),0);
});
test('two scene entrances share one read decision in a supplied catalog; unverified production placeholders stay hidden',()=>{
  const M=require('../assets/memory-core.js'),original=M.EVENTS.find(e=>e.teamId==='warriors'),shared={...original,id:'shared-fixture',title:'TEST FIXTURE ONLY',entrances:[{id:'memory-reserved-cavaliers',teamId:'cavaliers',point:'Fixture A'},{id:'memory-reserved-warriors',teamId:'warriors',point:'Fixture B'}]},app=boot({},null,{memoryRecords:[...M.EVENTS,shared]});
  app.get('landmark-memory-reserved-cavaliers').emit('click');assert.equal(app.get('memory-place').textContent,'Fixture A');app.get('memory-mark').emit('click');app.get('memory-close').emit('click');app.get('landmark-memory-reserved-warriors').emit('click');assert.equal(app.get('memory-place').textContent,'Fixture B');assert.equal(app.get('memory-mark').disabled,true);assert.match(app.get('memory-progress').textContent,/1／6/);assert.equal(JSON.parse(app.records.get(M.STORAGE_KEY)).read[0].eventId,'shared-fixture');
  const published=boot();assert.equal(published.get('memory-book-list').children.length,5);for(const p of M.RESERVED_ENTRANCES)assert.equal(published.nodes.has('landmark-'+p.id),false);
});
test("memory hints stay off overview; optional memorial reading does not mark until explicit save and reload",()=>{
  const app=boot();const point='memory-lakers-2020';assert.equal(app.get('memory-layer').children.length,10);assert.equal(app.get('landmark-'+point).dataset.visible,'false');app.get('memory-open').emit('click');assert.equal(app.get('memory-dialog').open,true);app.get('memory-go-'+point).emit('click');assert.equal(app.get('fan-map-marker').dataset.location,point);assert.equal(app.get('memory-dialog').open,false);assert.equal(app.get('station-panel').hidden,true);assert.equal(app.get('landmark-'+point).dataset.visible,'true');assert.equal(app.records.has('nba-policy-island:memories:v1'),false);
  app.get('landmark-'+point).emit('keydown',{key:'Enter'});assert.equal(app.get('memory-dialog').open,true);assert.equal(app.get('memory-shot').hidden,true);assert.match(app.get('memory-text').textContent,/另外七人/);app.get('memory-mark').emit('click');assert.match(app.get('memory-progress').textContent,/1／5/);const saved=app.records.get('nba-policy-island:memories:v1');app.get('memory-close').emit('click');app.get('camera-overview').emit('click');assert.equal(app.get('landmark-'+point).dataset.visible,'false');assert.equal(app.get('fan-map-marker').dataset.location,point);
  const reload=boot({'nba-policy-island:memories:v1':saved});reload.get('memory-open').emit('click');const before=reload.get('fan-map-marker').dataset.location;reload.get('memory-review-'+point).emit('click');assert.equal(reload.get('fan-map-marker').dataset.location,before);assert.equal(reload.get('memory-mark').disabled,true);assert.equal(reload.network(),0);
});
test("memory latest travel cancels stale readers; keyboard focus only moves camera until activation",()=>{
  const app=boot({},null,{reducedMotion:false}),id='memory-bulls-1998';app.get('landmark-'+id).emit('focus');assert.equal(app.get('island-map').dataset.teamIsland,'island-bulls');assert.equal(app.get('fan-map-marker').dataset.location,'warriors');app.get('landmark-'+id).emit('keydown',{key:' ',repeat:true});assert.equal(app.get('fan-map-marker').dataset.location,'warriors');app.get('landmark-'+id).emit('keydown',{key:' '});assert.equal(app.get('fan-map-marker').dataset.moving,'true');assert.equal(Boolean(app.get('memory-dialog').open),false);app.get('list-harbor-01').emit('click');app.advance(5000);assert.equal(app.get('fan-map-marker').dataset.location,'harbor-01');assert.equal(Boolean(app.get('memory-dialog').open),false);
  app.get('landmark-'+id).emit('click');app.advance(5000);assert.equal(app.get('fan-map-marker').dataset.location,id);assert.equal(app.get('memory-dialog').open,true);assert.match(app.get('memory-historic-score').textContent,/87：86/);assert.equal(app.get('memory-shot').hidden,false);
});
test("memory static aim gives hit without movement, repeat ignored, and close/background clean timers",()=>{
  const app=boot();app.get('landmark-memory-bulls-1998').emit('click');assert.equal(app.get('memory-static-aim').hidden,false);app.get('memory-shot-start').emit('click');assert.equal(app.timerCount(),1);app.get('memory-manual-aim').value='50';app.get('memory-manual-aim').emit('input');app.get('memory-shot').emit('keydown',{key:' ',repeat:true});assert.equal(app.timerCount(),1);app.get('memory-shot').emit('keydown',{key:' '});assert.match(app.get('memory-shot-feedback').textContent,/命中/);assert.equal(app.timerCount(),0);assert.equal(app.records.has('nba-policy-island:memories:v1'),false);
  app.get('memory-shot-start').emit('click');app.advance(8000);assert.match(app.get('memory-shot-feedback').textContent,/8 秒已結束/);assert.equal(app.timerCount(),0);app.get('memory-shot-start').emit('click');app.visibility(true);assert.equal(app.timerCount(),0);assert.match(app.get('memory-shot-feedback').textContent,/取消/);app.visibility(false);app.get('memory-shot-start').emit('click');app.get('memory-close').emit('click');assert.equal(app.timerCount(),0);app.get('list-harbor-01').emit('click');app.startPractice();assert.equal(app.get('game-hits').textContent,'0');assert.equal(app.timerCount(),1);
});
test("competitive history is labeled recreation; all four match states preserve memorial and stored read progress",()=>{
  const app=boot({},null,{reducedMotion:false});app.get('landmark-memory-raptors-2019').emit('click');app.advance(5000);assert.match(app.get('memory-scene-caption').textContent,/非歷史影像/);app.get('memory-shot-start').emit('click');app.advance(450);app.get('memory-shoot').emit('click');assert.equal(app.get('memory-shot-stage').dataset.bounces,'4');assert.match(app.get('memory-historic-score').textContent,/92：90/);app.get('memory-mark').emit('click');app.get('memory-close').emit('click');const record=app.records.get('nba-policy-island:memories:v1');
  for(const state of ['idle','scheduled','live','final']){app.select('game-state',state);assert.equal(app.records.get('nba-policy-island:memories:v1'),record);app.get('landmark-memory-lakers-2020').emit('click');app.advance(5000);assert.equal(app.get('memory-shot').hidden,true);app.get('memory-close').emit('click');}
  assert.equal(app.get('landmark-lakers').dataset.glowing,'false');app.get('map-night').emit('click');assert.equal(app.get('island-map').dataset.theme,'night');assert.equal(app.records.get('nba-policy-island:memories:v1'),record);assert.equal(app.network(),0);
});
test("camera controls cover island, district and venue, returning without moving the saved fan",()=>{
  const app=boot();assert.equal(app.get("island-map").dataset.view,"island");assert.equal(app.get("district-layer").children.length,30);
  const origin=app.get("fan-map-marker").style.left;app.get("district-island-warriors").emit("click");assert.equal(app.get("island-map").dataset.view,"district");assert.equal(app.get("fan-map-marker").style.left,origin);
  app.get("landmark-warriors").emit("click");assert.equal(app.get("island-map").dataset.view,"venue");assert.match(app.get("island-world").style.transform,/scale\(6.4285/);
  app.get("camera-back").emit("click");assert.equal(app.get("island-map").dataset.view,"district");assert.equal(app.get("island-map").dataset.district,"west");
  app.get("camera-overview").emit("click");assert.equal(app.get("island-map").dataset.view,"island");assert.equal(app.get("fan-map-marker").style.left,origin);assert.equal(app.get("landmark-warriors").getAttribute("aria-pressed"),"true");
});
test("walking gates encounter reveal until arrival, supports map actor and shares one loop with nearby pedestrians",()=>{
  const app=boot({},null,{url:"file:///project/index.html?encounterDate=2026-01-01",reducedMotion:false});
  app.get("list-meet-pier").emit("click");assert.equal(app.timerCount(16),1);assert.equal(app.get("fan-map-marker").dataset.moving,"true");assert.equal(app.get("encounter-character").hidden,true);assert.equal(app.get("island-encounter-actor").hidden,true);
  app.get("encounter-character").emit("click");app.get("encounter-photo").emit("click");assert.equal(Boolean(app.get("star-dialog").open),false);
  app.advance(200);assert.equal(app.get("fan-map-marker").dataset.location,"");app.advance(5000);
  assert.equal(app.timerCount(16),1);assert.equal(app.get("fan-map-marker").dataset.moving,"false");assert.equal(app.get("fan-map-marker").dataset.location,"meet-pier");assert.equal(app.get("encounter-character").hidden,false);assert.equal(app.get("island-encounter-actor").hidden,false);
  app.get("island-encounter-actor").emit("click");assert.match(app.get("encounter-star-name").textContent,/柯瑞/);app.get("encounter-photo").emit("click");app.get("capture-photo").emit("click");app.get("collect-photo").emit("click");assert.ok(JSON.parse(app.records.get(F.ALBUM_KEY)).encounters.some(p=>p.starId==="curry"));
});
test("latest destination cancels travel; overview during walking stays full-island after arrival",()=>{
  const app=boot({},null,{reducedMotion:false});app.get("list-heat").emit("click");app.advance(700);const previous=app.get("fan-map-marker").style.left;
  app.get("list-roof-02").emit("click");assert.equal(app.timerCount(16),1);assert.equal(app.get("fan-map-marker").style.left,previous);
  app.get("camera-overview").emit("click");assert.equal(app.get("island-map").dataset.view,"island");app.advance(5000);
  assert.equal(app.get("fan-map-marker").dataset.location,"roof-02");assert.equal(app.get("island-map").dataset.view,"island");assert.equal(app.timerCount(16),0);
  app.get("list-harbor-01").emit("click");app.windowEvent("pagehide");assert.equal(app.timerCount(16),0);app.advance(5000);app.windowEvent("pageshow",{persisted:true});assert.equal(app.get("fan-map-marker").dataset.location,"harbor-01");assert.equal(app.timerCount(16),1);
});
test("day/night lighting stays enabled after final without changing away glow, photo rules or policy",()=>{
  const app=boot();app.get("map-night").emit("click");assert.equal(app.get("island-map").dataset.theme,"night");assert.equal(app.get("map-night").getAttribute("aria-pressed"),"true");
  assert.equal(app.get("landmark-lakers").dataset.glowing,"true");assert.equal(app.get("landmark-warriors").dataset.glowing,"false");
  app.select("game-state","final");assert.equal(app.get("island-map").dataset.theme,"night");assert.equal(app.get("landmark-lakers").dataset.glowing,"false");assert.match(app.get("team-game").innerHTML,/108/);assert.match(app.get("map-light-status").textContent,/照明開啟/);
  app.get("map-day").emit("click");assert.equal(app.get("island-map").dataset.theme,"day");assert.equal(app.get("landmark-lakers").dataset.glowing,"false");
});
test("mobile-compatible roof directory locates the exact venue and starts its dedicated game",()=>{
  const app=boot();app.get("filter-court").emit("click");app.get("list-roof-02").emit("click");assert.equal(app.get("island-map").dataset.district,"lakes");assert.equal(app.get("fan-map-marker").dataset.location,"roof-02");assert.match(app.get("court-game-name").textContent,/節奏運球/);app.startPractice();assert.equal(app.get("play-court").hidden,false);assert.equal(app.timerCount(),1);
  app.get("district-select").value="west";app.get("district-select").emit("change");assert.equal(app.get("fan-map-marker").dataset.location,"roof-02");assert.equal(app.get("island-map").dataset.district,"west");
});
test("keyboard landmark focus reveals a clipped destination without moving; reduced motion visits directly",()=>{
  const app=boot();app.get("landmark-celtics").emit("focus");assert.equal(app.get("island-map").dataset.view,"venue");assert.equal(app.get("island-map").dataset.district,"east");assert.equal(app.get("fan-map-marker").dataset.location,"warriors");
  app.get("landmark-celtics").emit("keydown",{key:"Enter"});assert.equal(app.get("fan-map-marker").dataset.location,"celtics");assert.equal(app.timerCount(16),0);
});
test("saving clothes during travel updates shared avatar without teleporting or restarting the route",()=>{
  const app=boot({},null,{reducedMotion:false});app.get("list-heat").emit("click");app.advance(500);const x=app.get("fan-map-marker").style.left,y=app.get("fan-map-marker").style.top;
  app.get("my-fan").emit("click");app.get("fan-nickname").value="路上的島民";app.get("fan-nickname").emit("input");app.get("fan-form").emit("submit");
  assert.equal(app.get("fan-map-marker").style.left,x);assert.equal(app.get("fan-map-marker").style.top,y);assert.equal(app.get("fan-map-marker").dataset.moving,"true");assert.equal(app.timerCount(16),1);assert.match(app.get("fan-map-name").textContent,/路上的島民/);
  app.advance(5000);assert.equal(app.get("fan-map-marker").dataset.location,"heat");assert.match(app.get("fan-map-avatar").innerHTML,/路上的島民/);
});
test("enabling reduced motion during a trip snaps to the target and clears travel animation timer",()=>{
  const app=boot({},null,{reducedMotion:false});app.get("list-roof-03").emit("click");app.advance(200);assert.equal(app.timerCount(16),1);
  app.reduceMotion(true);assert.equal(app.timerCount(16),0);assert.equal(app.get("fan-map-marker").dataset.location,"roof-03");assert.equal(app.get("fan-map-marker").dataset.moving,"false");assert.match(app.get("island-world").style.transform,/scale\(6.4285/);
});
test("first screen hides station/directory; arrival opens a panel and close returns to the same district",()=>{
  const app=boot({},null,{reducedMotion:false});assert.equal(app.get("station-panel").hidden,true);assert.equal(app.get("station-directory").hidden,true);assert.equal(app.get("tour-map").dataset.panelOpen,"false");
  app.get("toggle-directory").emit("click");assert.equal(app.get("station-directory").hidden,false);app.get("list-meet-pier").emit("click");assert.equal(app.get("station-directory").hidden,true);assert.equal(app.get("station-panel").hidden,true);
  app.advance(5000);assert.equal(app.get("station-panel").hidden,false);assert.equal(app.get("tour-map").dataset.panelOpen,"true");assert.equal(app.document.activeElement,app.get("panel-title"));
  const position=app.get("fan-map-marker").style.left;app.get("station-close").emit("click");assert.equal(app.get("station-panel").hidden,true);assert.equal(app.get("island-map").dataset.view,"district");assert.equal(app.get("island-map").dataset.district,"west");assert.equal(app.get("fan-map-marker").style.left,position);
});
test("bay uses one loop, preserves crowd positions at night, pauses offscreen/background and supports static reduced motion",()=>{
  const app=boot({},null,{reducedMotion:false});assert.equal(app.timerCount(16),0);assert.equal(app.get("npc-layer").children.length,10);assert.equal(app.get("npc-layer").children.filter(p=>!p.hidden).length,3);
  app.get("district-island-warriors").emit("click");assert.equal(app.timerCount(16),1);app.advance(100);const npc=app.get("npc-fan-ticket"),point=[npc.style.left,npc.style.top];app.get("map-night").emit("click");assert.deepEqual([npc.style.left,npc.style.top],point);
  app.visibility(true);assert.equal(app.timerCount(16),0);app.advance(5000);assert.deepEqual([npc.style.left,npc.style.top],point);app.visibility(false);assert.equal(app.timerCount(16),1);assert.deepEqual([npc.style.left,npc.style.top],point);
  app.get("district-select").value="east";app.get("district-select").emit("change");assert.equal(app.timerCount(16),0);app.advance(4000);assert.deepEqual([npc.style.left,npc.style.top],point);
  app.get("district-select").value="west";app.get("district-select").emit("change");assert.equal(app.timerCount(16),1);app.reduceMotion(true);assert.equal(app.timerCount(16),0);assert.equal(app.get("island-map").dataset.crowdActive,"false");assert.equal(app.network(),0);
});
test("home-fixture entrance/exit crowd, arena glow and night photo permission agree without changing stored policy",()=>{
  const app=boot();app.get("landmark-warriors").emit("click");app.get("bay-fixture").value="home";app.get("bay-fixture").emit("change");app.select("game-state","scheduled");assert.equal(app.get("island-map").dataset.crowdMode,"enter");
  app.select("game-state","live");assert.equal(app.get("landmark-warriors").dataset.glowing,"true");assert.equal(app.get("landmark-lakers").dataset.glowing,"false");assert.equal(app.get("island-map").dataset.crowdMode,"live");app.get("find-star").emit("click");assert.equal(app.get("photo-night-option").disabled,false);app.get("star-close").emit("click");
  app.get("map-night").emit("click");app.select("game-state","final");assert.equal(app.get("island-map").dataset.crowdMode,"exit");assert.equal(app.get("island-map").dataset.theme,"night");assert.equal(app.get("landmark-warriors").dataset.glowing,"false");assert.match(app.get("team-game").innerHTML,/108/);
  app.get("bay-fixture").value="away";app.get("bay-fixture").emit("change");assert.equal(app.get("island-map").dataset.crowdMode,"ambient");assert.match(app.get("fixture-description").textContent,/客場/);
});
test("scrolling the map out of the viewport pauses pedestrian work and resumes without advancing hidden time",()=>{
  const app=boot({},null,{reducedMotion:false});app.get("district-island-warriors").emit("click");app.advance(100);const npc=app.get("npc-pier-walker"),point=[npc.style.left,npc.style.top];app.mapVisibility(false);assert.equal(app.timerCount(16),0);app.advance(9000);assert.deepEqual([npc.style.left,npc.style.top],point);app.mapVisibility(true);assert.equal(app.timerCount(16),1);assert.deepEqual([npc.style.left,npc.style.top],point);
});
test("policy seat display follows only the latest calculation, labels lottery expectation and clears on reset",()=>{
  const app=boot();app.get("landmark-warriors").emit("click");app.get("policy-launch").emit("click");assert.equal(app.get("policy-seat-map").hidden,true);
  for(const [plan,count,expected] of [["regular",0,false],["reserved",20,false],["lottery",15,true]]){app.select("policy-plan",plan);assert.equal(app.get("policy-seat-map").hidden,true);app.get("policy-form").emit("submit");const grid=app.get("policy-seat-grid");assert.equal(grid.children.length,60);assert.equal(grid.children.filter(s=>s.dataset.type==="student").length,count);assert.equal(grid.dataset.expected,String(expected));assert.equal(app.get("seat-expected-label").hidden,!expected);}
  assert.match(app.get("policy-seat-caption").textContent,/期望值/);app.get("policy-form").emit("reset");assert.equal(app.get("policy-seat-map").hidden,true);assert.equal(app.get("policy-seat-grid").children.length,0);
});
test("an unscored shot tutorial starts a fresh full 30-second practice and cannot submit a score",()=>{
  const app=boot();app.get("list-harbor-01").emit("click");app.startPractice(true);assert.equal(app.get("tutorial-controls").hidden,false);assert.match(app.get("game-mode-label").textContent,/不計分/);app.advance(1300);app.get("shoot-button").emit("click");
  assert.equal(app.get("game-hits").textContent,"0");assert.equal(app.get("game-attempts").textContent,"0");assert.equal(app.get("tutorial-begin").disabled,false);assert.match(app.get("tutorial-feedback").textContent,/不計分/);
  app.get("tutorial-begin").emit("click");assert.equal(app.get("tutorial-controls").hidden,true);assert.equal(app.get("game-timer").textContent,"30.0");assert.equal(app.get("game-hits").textContent,"0");app.advance(31300);assert.equal(app.get("round-result").hidden,false);assert.equal(app.timerCount(),0);app.get("practice-leave").emit("click");assert.equal(app.get("station-panel").hidden,false);assert.equal(app.get("court-select").value,"harbor-01");assert.equal(app.network(),0);
});
test("all 15 tutorials can be skipped; changing courts or leaving clears their interval and controls",()=>{
  const app=boot();for(const court of C.COURTS){app.get(`list-${court.id}`).emit("click");app.startPractice(true);assert.equal(app.get("tutorial-controls").hidden,false,court.id);assert.equal(app.timerCount(),1);app.get("tutorial-skip").emit("click");assert.equal(app.get("tutorial-controls").hidden,true);assert.equal(app.get("game-timer").textContent,(G.getGame(court.gameId).durationMs/1000).toFixed(1));app.get("practice-leave").emit("click");assert.equal(app.timerCount(),0);}
  const fresh=boot();fresh.get("list-roof-02").emit("click");fresh.startPractice(true);fresh.get("list-warriors").emit("click");assert.equal(fresh.timerCount(),0);assert.equal(fresh.get("tutorial-controls").hidden,true);assert.equal(fresh.get("play-court").hidden,true);
});
test("tutorial deadline never shows a scored result and still allows formal start",()=>{
  const app=boot();app.get("list-park-05").emit("click");app.startPractice(true);app.advance(14000);assert.equal(app.timerCount(),0);assert.equal(app.get("round-result").hidden,true);assert.equal(app.get("tutorial-begin").disabled,false);assert.equal(app.get("game-hits").textContent,"0");app.get("tutorial-begin").emit("click");assert.equal(app.get("game-timer").textContent,"45.0");
});
test("district encounter clue hides identity; continue-island closes the photo and preserves collection/location",()=>{
  const app=boot({},null,{url:"file:///project/index.html?encounterDate=2026-01-01"});assert.equal(app.get("district-clue").hidden,true);app.get("district-island-warriors").emit("click");assert.equal(app.get("district-clue").hidden,false);assert.doesNotMatch(app.get("district-clue").textContent,/柯瑞|curry/i);
  app.get("list-meet-pier").emit("click");app.get("island-encounter-actor").emit("click");app.get("encounter-photo").emit("click");app.get("capture-photo").emit("click");app.get("collect-photo").emit("click");const record=app.records.get(F.ALBUM_KEY);app.get("photo-continue-island").emit("click");assert.equal(app.get("star-dialog").open,false);assert.equal(app.get("island-map").dataset.view,"district");assert.equal(app.get("fan-map-marker").dataset.location,"meet-pier");assert.equal(app.records.get(F.ALBUM_KEY),record);
});
test("app builds 48 named keyboard-operable HTML buttons aligned to island coordinates",()=>{
  const app=boot();assert.equal(app.get("landmark-layer").children.length,48);
  for(const item of [...C.TEAMS,...C.COURTS,...C.ENCOUNTERS]){const node=app.get(`landmark-${item.id}`);assert.equal(node.tagName,"BUTTON");assert.equal(node.getAttribute("role"),"button");assert.equal(node.getAttribute("tabindex"),"0");assert.equal(node.dataset.x,String(item.x));assert.equal(node.dataset.y,String(item.y));const dx=node.dataset.kind==="nba"?80:node.dataset.kind==="court"?55:45;assert.equal(node.style.left,`${(item.x-dx)/C.MAP.width*100}%`);assert.ok(node.getAttribute("aria-label").includes(item.name));}
  assert.equal(app.get("station-list").children.filter(n=>!n.hidden).length,30);app.get("filter-court").emit("click");assert.equal(app.get("station-list").children.filter(n=>!n.hidden).length,15);
});
test("all 30 arenas and 15 public courts open the correct distinct panel",()=>{
  const app=boot();
  for(const team of C.TEAMS){app.get(`landmark-${team.id}`).emit("click");assert.equal(app.get("nba-panel").hidden,false);assert.equal(app.get("court-panel").hidden,true);assert.equal(app.get("panel-title").textContent,team.name);}
  for(const court of C.COURTS){app.get(`list-${court.id}`).emit("click");assert.equal(app.get("court-panel").hidden,false);assert.equal(app.get("nba-panel").hidden,true);assert.equal(app.get("panel-title").textContent,court.name);}
});
test("landmark Enter/Space handlers, quick entrances and focus target work in event stubs",()=>{
  const app=boot();const event=app.get("landmark-bulls").emit("keydown",{key:"Enter"});assert.equal(event.defaultPrevented,true);assert.equal(app.get("panel-title").textContent,"芝加哥公牛");
  app.get("landmark-park-05").emit("keydown",{key:" "});assert.equal(app.get("panel-title").textContent,"環島花園");assert.equal(app.document.activeElement,app.get("panel-title"));
  app.get("quick-nba").emit("click");assert.equal(app.get("panel-title").textContent,"金州勇士");app.get("quick-courts").emit("click");assert.equal(app.get("panel-title").textContent,"潮汐一號");
});
test("home and away panels share scoreboard; LIVE glow stops on final score",()=>{
  const app=boot();const home=app.get("team-game").innerHTML;app.get("landmark-lakers").emit("click");assert.equal(app.get("team-game").innerHTML,home);
  assert.equal(app.get("landmark-warriors").dataset.glowing,"false");assert.equal(app.get("landmark-lakers").dataset.glowing,"true");
  app.select("game-state","final");assert.match(app.get("team-game").innerHTML,/108/);assert.match(app.get("team-game").innerHTML,/101/);for(const team of C.TEAMS)assert.equal(app.get(`landmark-${team.id}`).dataset.glowing,"false");
});
test("existing policy save survives new island, game filters and public court selection",()=>{
  const save={version:1,challengeId:P.POLICY_CHALLENGE.id,stationId:"warriors",completed:true,planId:"reserved"};const app=boot({[P.POLICY_CHALLENGE.storageKey]:JSON.stringify(save)});
  assert.match(app.get("policy-progress-global").textContent,/1／1/);assert.match(app.get("policy-result-content").innerHTML,/2,400/);
  const result=app.get("policy-result-content").innerHTML;for(const state of C.GAME_STATES){app.select("game-state",state);assert.equal(app.get("policy-result-content").innerHTML,result);}
  app.get("landmark-harbor-01").emit("click");assert.match(app.get("policy-progress-global").textContent,/1／1/);app.get("landmark-warriors").emit("click");app.get("policy-launch").emit("click");assert.equal(app.get("policy-challenge").hidden,false);
  assert.equal(app.get("landmark-warriors").children[0].children.at(-1).getAttribute("visibility"),"visible");
});
test("policy trial and confirmation remain functional inside Warriors panel",()=>{
  const app=boot();app.get("policy-launch").emit("click");app.select("policy-plan","lottery");app.get("policy-form").emit("submit");assert.match(app.get("policy-result-content").innerHTML,/期望值/);assert.match(app.get("policy-result-content").innerHTML,/1,800/);
  app.select("policy-plan","reserved");assert.equal(app.get("policy-results").hidden,true);app.get("policy-form").emit("submit");app.get("confirm-policy").emit("click");assert.match(app.get("policy-progress-global").textContent,/1／1/);assert.equal(JSON.parse(app.records.get(P.POLICY_CHALLENGE.storageKey)).planId,"reserved");
});
test("policy table highlights only a calculated plan; reset clears the trial while keeping completion",()=>{
  const app=boot();app.select("policy-plan","reserved");
  const submit=app.get("policy-form").emit("submit");assert.equal(submit.defaultPrevented,true);
  let rows=app.get("policy-comparison-rows").children;assert.equal(rows.length,3);
  assert.equal(rows.filter(row=>row.dataset.current==="true").length,1);assert.match(rows[1].textContent,/2,400/);assert.match(rows[2].textContent,/平均 15 人（期望值）/);
  app.get("confirm-policy").emit("click");const saved=app.records.get(P.POLICY_CHALLENGE.storageKey);
  app.select("policy-plan","lottery");assert.match(app.get("policy-trial-hint").textContent,/重新/);
  rows=app.get("policy-comparison-rows").children;assert.equal(rows.some(row=>row.dataset.current==="true"),false);
  const reset=app.get("policy-form").emit("reset");assert.equal(reset.defaultPrevented,true);
  for(const id of ["regular","reserved","lottery"])assert.equal(app.get(`plan-${id}`).checked,false);
  assert.equal(app.get("policy-results").hidden,true);assert.equal(app.get("policy-comparison").hidden,true);assert.equal(app.records.get(P.POLICY_CHALLENGE.storageKey),saved);
  app.get("policy-form").emit("submit");assert.match(app.get("policy-trial-hint").textContent,/請先選擇/);assert.equal(app.get("policy-results").hidden,true);
});
test("public-court optgroups and select stay in sync with every map and directory choice",()=>{
  const app=boot();for(const type of ["harbor","park","roof"])assert.equal(app.get(`court-group-${type}`).children.length,5);
  for(const court of C.COURTS){app.get(`landmark-${court.id}`).emit("click");assert.equal(app.get("court-select").value,court.id);}
  app.get("court-select").value="harbor-02";app.get("court-select").emit("change");
  assert.equal(app.get("panel-title").textContent,"燈塔半場");assert.equal(app.get("landmark-harbor-02").dataset.selected,"true");assert.equal(app.get("list-harbor-02").getAttribute("aria-pressed"),"true");
});
test("map and panel scoreboards agree, use a semantic start time and distinguish away Warriors",()=>{
  const app=boot();assert.equal(app.get("map-scoreboard").innerHTML,app.get("team-game").innerHTML);
  assert.match(app.get("team-side").textContent,/客隊/);assert.equal(app.get("team-city").textContent,"舊金山");
  app.select("game-state","scheduled");
  const descendants=node=>[node,...node.children.flatMap(descendants)];
  const time=descendants(app.get("team-game")).find(node=>node.tagName==="TIME");
  assert.ok(time);assert.equal(time.getAttribute("datetime"),"11:00");assert.equal(time.textContent,"11:00");
  app.get("landmark-lakers").emit("click");assert.match(app.get("team-side").textContent,/主隊/);
  app.get("quick-courts").emit("click");assert.equal(app.get("map-scoreboard").hidden,true);
});
test("unconfigured multiplayer has disabled invitation actions, no room and zero network calls",()=>{
  const app=boot();app.get("quick-courts").emit("click");assert.equal(app.get("create-room").disabled,true);assert.equal(app.get("join-room").disabled,true);assert.equal(app.get("room-panel").hidden,true);assert.equal(app.get("room-players").innerHTML,"");assert.equal(app.network(),0);assert.match(app.get("online-badge").textContent,/尚未配置/);
});
test("all 15 courts can start the shared practice, with time limit and restart",()=>{
  const app=boot();
  for(const court of C.COURTS){app.get(`list-${court.id}`).emit("click");assert.equal(app.get("court-game-name").textContent,court.gameName);assert.match(app.get(`list-${court.id}`).innerHTML,new RegExp(court.gameName));app.startPractice();assert.match(app.get("shooting-title").textContent,new RegExp(court.name));assert.match(app.get("game-mode-label").textContent,/非真人/);assert.equal(app.get("game-hits").textContent,"0");app.advance(G.getGame(court.gameId).durationMs+1000);assert.equal(app.get("round-result").hidden,false);assert.equal(app.timerCount(),0);app.get("practice-restart").emit("click");assert.equal(app.get("game-timer").textContent,(G.getGame(court.gameId).durationMs/1000).toFixed(1));}
  app.get("list-harbor-01").emit("click");app.startPractice();
  app.advance(1300);app.get("game-stage").emit("keydown",{code:"Space",key:" "});assert.equal(app.get("game-hits").textContent,"1");
  app.advance(30000);assert.equal(app.get("shoot-button").disabled,true);assert.equal(app.get("game-timer").textContent,"0.0");assert.match(app.get("round-result-content").textContent,/沒有真人或模擬對手/);
  app.get("practice-restart").emit("click");assert.equal(app.get("game-hits").textContent,"0");assert.equal(app.get("game-attempts").textContent,"0");assert.equal(app.get("game-timer").textContent,"30.0");assert.equal(app.get("round-result").hidden,true);assert.equal(app.network(),0);
});
test("audio is opt-in, successful shots and final buzzer play once, while held Space is ignored",()=>{
  const app=boot();assert.equal(app.get("sound-hit").plays||0,0);assert.equal(app.get("sound-end").plays||0,0);
  app.get("quick-courts").emit("click");app.startPractice();app.advance(1300);
  app.get("game-stage").emit("keydown",{code:"Space",key:" ",repeat:true});assert.equal(app.get("game-attempts").textContent,"0");
  app.get("shoot-button").emit("click");assert.equal(app.get("game-hits").textContent,"1");assert.equal(app.get("sound-hit").plays||0,0);
  app.get("sound-enabled").checked=true;app.get("sound-enabled").emit("change");app.advance(1200);app.get("shoot-button").emit("click");assert.equal(app.get("sound-hit").plays,1);
  app.advance(30000);assert.equal(app.get("sound-end").plays,1);assert.equal(app.timerCount(),0);
  app.get("game-stage").emit("keydown",{code:"Space",key:" "});app.advance(1000);assert.equal(app.get("sound-end").plays,1);assert.equal(app.get("game-hits").textContent,"2");
  app.get("sound-enabled").checked=false;app.get("sound-enabled").emit("change");assert.ok(app.get("sound-end").pauses>0);assert.match(app.get("sound-status").textContent,/音效關閉/);
});
test("leaving practice, changing landmark and hiding the page clear the active timer",()=>{
  const app=boot();app.get("quick-courts").emit("click");app.startPractice();assert.equal(app.timerCount(),1);
  app.get("practice-leave").emit("click");assert.equal(app.timerCount(),0);assert.equal(app.get("play-court").hidden,true);
  app.startPractice();app.get("landmark-harbor-02").emit("click");assert.equal(app.timerCount(),0);assert.equal(app.get("play-court").hidden,true);
  app.startPractice();assert.equal(app.get("game-stage").dataset.scene,"harbor");app.windowEvent("pagehide");assert.equal(app.timerCount(),0);
  app.windowEvent("pageshow",{persisted:true});assert.equal(app.timerCount(),1);app.advance(62000);assert.equal(app.get("game-timer").textContent,"0.0");assert.equal(app.timerCount(),0);
});
test("an audio playback rejection preserves the hit score and visual feedback",async()=>{
  const app=boot();app.get("quick-courts").emit("click");app.startPractice();
  app.get("sound-enabled").checked=true;app.get("sound-enabled").emit("change");
  app.get("sound-hit").play=()=>Promise.reject(new Error("Playback blocked"));
  app.advance(1300);app.get("shoot-button").emit("click");await Promise.resolve();
  assert.equal(app.get("game-hits").textContent,"1");assert.match(app.get("shot-feedback").textContent,/命中/);assert.match(app.get("sound-status").textContent,/音效未能播放/);
});
test("required three-stop demonstration finishes Lakers game, reserved policy and a harbor practice",()=>{
  const app=boot();app.get("landmark-lakers").emit("click");assert.equal(app.get("landmark-lakers").dataset.glowing,"true");assert.equal(app.get("landmark-warriors").dataset.glowing,"false");
  app.get("landmark-warriors").emit("click");app.get("policy-launch").emit("click");app.select("policy-plan","reserved");app.get("policy-form").emit("submit");assert.match(app.get("policy-result-content").innerHTML,/2,400/);
  app.get("landmark-harbor-01").emit("click");app.startPractice();app.advance(1300);app.get("shoot-button").emit("click");app.advance(29700);
  assert.equal(app.get("game-timer").textContent,"0.0");assert.match(app.get("round-result-content").textContent,/命中 1 球/);assert.equal(app.timerCount(),0);
});

test("wardrobe previews drafts but applies the shared map avatar only after saving, then reloads",()=>{
  const app=boot(), original=app.get("fan-map-avatar").innerHTML;
  app.get("my-fan").emit("click");assert.equal(app.get("fan-dialog").open,true);
  app.get("fan-nickname").value="海風球迷";app.get("fan-nickname").emit("input");app.get("fan-jersey").value="lakers";app.get("fan-jersey").emit("change");
  assert.equal(app.get("fan-map-avatar").innerHTML,original);assert.match(app.get("avatar-preview").innerHTML,/海風球迷/);assert.match(app.get("fan-draft-label").textContent,/試穿/);
  const submit=app.get("fan-form").emit("submit");assert.equal(submit.defaultPrevented,true);assert.match(app.get("fan-map-avatar").innerHTML,/海風球迷/);
  const saved=app.records.get(F.AVATAR_KEY);const restored=boot({[F.AVATAR_KEY]:saved});assert.equal(restored.get("fan-nickname").value,"海風球迷");assert.match(restored.get("fan-map-avatar").innerHTML,/海風球迷/);
  app.get("fan-form").emit("reset");assert.equal(app.get("fan-nickname").value,F.DEFAULT_AVATAR.nickname);assert.match(app.get("fan-map-avatar").innerHTML,/海風球迷/);
  app.get("fan-random").emit("click");assert.match(app.get("fan-map-avatar").innerHTML,/海風球迷/);assert.equal(app.get("fan-jersey").children.length,30);
  for(const item of [...C.TEAMS,...C.COURTS]){app.get(`landmark-${item.id}`).emit("click");assert.equal(app.get("fan-map-marker").dataset.location,item.id);assert.equal(app.get("fan-map-marker").style.left,`${Math.round(item.entrance.x/2)*2/C.MAP.width*100}%`);}
});
test("each NBA arena opens its real station data and point before photo mode; public courts do not",()=>{
  const app=boot();
  for(const station of F.STATIONS){
    app.get(`landmark-${station.teamId}`).emit("click");app.get("find-star").emit("click");assert.equal(app.get("star-dialog").open,true);
    assert.equal(app.get("arena-explore").hidden,false);assert.equal(app.get("photo-studio").hidden,true);assert.equal(app.get("star-portrait").src,station.illustration);assert.equal(app.get("arena-background").src,station.background);assert.match(app.get("arena-clue").textContent,new RegExp(station.point));
    app.get("star-landmark").emit("click");assert.equal(app.get("photo-studio").hidden,false);assert.equal(app.get("photo-star-name").textContent,station.starName);app.get("star-close").emit("click");
  }
  app.get("landmark-harbor-01").emit("click");app.get("find-star").emit("click");assert.equal(app.get("star-dialog").open,false);assert.equal(app.get("court-panel").hidden,false);
});
test("dress up, find Curry, capture, collect, download fixture and review unchanged old photo after changing clothes",async()=>{
  const app=boot();app.get("my-fan").emit("click");app.get("fan-nickname").value="拍照小島民";app.get("fan-nickname").emit("input");app.get("fan-form").emit("submit");app.get("fan-close").emit("click");
  app.get("landmark-warriors").emit("click");app.get("find-star").emit("click");assert.equal(app.get("photo-studio").hidden,true);app.get("star-landmark").emit("click");assert.match(app.get("photo-star-name").textContent,/柯瑞/);
  app.get("photo-pose").value="ball";app.get("photo-pose").emit("change");app.get("capture-photo").emit("click");const frozen=app.get("photo-image").src;assert.equal(app.get("photo-pose").disabled,true);app.get("collect-photo").emit("click");
  assert.equal(app.get("fan-album-count").textContent,"已收集 1／16");app.get("collect-photo").emit("click");assert.equal(app.get("fan-album-count").textContent,"已收集 1／16");
  const restored=boot(Object.fromEntries(app.records));assert.equal(restored.get("fan-album-count").textContent,"已收集 1／16");assert.equal(restored.get("landmark-warriors").children[0].children.at(-2).getAttribute("visibility"),"visible");
  let exported;app.setPNGExporter(async record=>{exported=record;return new Blob(["test fixture, not rasterized"],{type:"image/png"});});app.get("download-photo").emit("click");await new Promise(resolve=>setImmediate(resolve));
  assert.equal(exported.avatar.nickname,"拍照小島民");assert.equal(exported.pose,"ball");assert.equal(app.downloads.length,1);assert.match(app.downloads[0].download,/nba-policy-island-warriors-.*\.png/);assert.equal(app.get("photo-png-link").hidden,false);
  app.get("star-close").emit("click");assert.equal(app.revoked.length,1);app.get("my-fan").emit("click");app.get("fan-nickname").value="換裝後球迷";app.get("fan-nickname").emit("input");app.get("fan-jersey").value="bulls";app.get("fan-jersey").emit("change");app.get("fan-form").emit("submit");
  app.get("fan-tab-album").emit("click");const card=app.get("fan-album-grid").children.find(node=>node.dataset.teamId==="warriors");card.emit("click");assert.equal(app.get("photo-image").src,frozen);assert.equal(app.get("photo-fan-name").textContent,"拍照小島民");assert.match(app.get("fan-map-avatar").innerHTML,/換裝後球迷/);
  app.get("retake-photo").emit("click");assert.equal(app.get("photo-fan-name").textContent,"換裝後球迷");assert.equal(JSON.parse(app.records.get(F.ALBUM_KEY)).photos[0].avatar.nickname,"拍照小島民");
});
test("night option follows live home arena, while an archived Lakers night photo survives final status",()=>{
  const app=boot();app.get("find-star").emit("click");app.get("star-landmark").emit("click");assert.equal(app.get("photo-night-option").disabled,true);app.get("star-close").emit("click");
  app.get("landmark-lakers").emit("click");app.get("find-star").emit("click");app.get("star-landmark").emit("click");assert.equal(app.get("photo-night-option").disabled,false);
  app.get("photo-background").value="night";app.get("photo-background").emit("change");app.get("capture-photo").emit("click");app.get("collect-photo").emit("click");const frozen=app.get("photo-image").src;
  app.select("game-state","final");assert.equal(app.get("photo-night-option").disabled,true);assert.equal(app.get("photo-image").src,frozen);assert.equal(app.get("landmark-lakers").dataset.glowing,"false");
  app.get("retake-photo").emit("click");assert.equal(app.get("photo-background").value,"day");assert.equal(JSON.parse(app.records.get(F.ALBUM_KEY)).photos[0].background,"night");
});
test("photo camera badge, Warriors policy badge and home-game glow remain independent across states",()=>{
  const app=boot();app.select("policy-plan","reserved");app.get("policy-form").emit("submit");app.get("confirm-policy").emit("click");const policySave=app.records.get(P.POLICY_CHALLENGE.storageKey);
  app.get("find-star").emit("click");app.get("star-landmark").emit("click");app.get("capture-photo").emit("click");app.get("collect-photo").emit("click");
  const graphic=app.get("landmark-warriors").children[0];assert.equal(graphic.children.at(-2).getAttribute("visibility"),"visible");assert.equal(graphic.children.at(-1).getAttribute("visibility"),"visible");
  for(const state of C.GAME_STATES){app.select("game-state",state);assert.equal(graphic.children.at(-2).getAttribute("visibility"),"visible");assert.equal(graphic.children.at(-1).getAttribute("visibility"),"visible");assert.equal(app.get("landmark-warriors").dataset.glowing,"false");}
  assert.equal(app.records.get(P.POLICY_CHALLENGE.storageKey),policySave);assert.match(app.get("list-warriors").getAttribute("aria-label"),/已收藏主場合影/);
});
test("blocked localStorage shows a notice while this-page avatar, photos and collection still work",()=>{
  const app=boot({},null,{storageBlocked:true});assert.equal(app.get("fan-storage-notice").hidden,false);
  app.get("fan-nickname").value="本次島民";app.get("fan-nickname").emit("input");app.get("fan-form").emit("submit");assert.match(app.get("fan-map-avatar").innerHTML,/本次島民/);
  app.get("find-star").emit("click");app.get("star-landmark").emit("click");app.get("capture-photo").emit("click");app.get("collect-photo").emit("click");assert.equal(app.get("fan-album-count").textContent,"已收集 1／16");assert.equal(app.get("photo-storage-notice").hidden,false);assert.equal(app.get("download-photo").disabled,false);assert.equal(app.network(),0);
});
test("practice result uses the same saved avatar and nickname, ignores unsaved clothing",()=>{
  const app=boot();app.get("fan-nickname").value="結算球迷";app.get("fan-nickname").emit("input");app.get("fan-form").emit("submit");
  app.get("fan-nickname").value="未儲存";app.get("fan-nickname").emit("input");app.get("quick-courts").emit("click");app.startPractice();app.advance(31000);
  assert.equal(app.get("practice-fan-result").hidden,false);assert.match(app.get("practice-fan-caption").textContent,/結算球迷/);assert.doesNotMatch(app.get("practice-fan-avatar").innerHTML,/未儲存/);assert.equal(app.get("game-timer").textContent,"0.0");
});

test("encounter map and mobile directory route to a third panel, revealing identity only after visiting and clicking",()=>{
  const app=boot({},null,{url:"file:///project/index.html?encounterDate=2026-01-01"});
  app.get("filter-encounter").emit("click");assert.equal(app.get("station-list").children.filter(node=>!node.hidden).length,3);
  app.get("list-meet-garden").emit("click");assert.equal(app.get("encounter-panel").hidden,false);assert.equal(app.get("court-panel").hidden,true);assert.equal(app.get("nba-panel").hidden,true);assert.equal(app.get("encounter-character").hidden,true);
  app.get("landmark-meet-pier").emit("click");assert.match(app.get("encounter-presence").textContent,/熟悉的身影/);assert.equal(app.get("encounter-reveal").hidden,true);assert.doesNotMatch(app.get("encounter-character").getAttribute("aria-label"),/柯瑞/);
  app.get("encounter-photo").emit("click");assert.equal(Boolean(app.get("star-dialog").open),false);
  app.get("encounter-character").emit("click");assert.match(app.get("encounter-star-name").textContent,/柯瑞/);assert.equal(app.get("fan-map-marker").dataset.location,"meet-pier");assert.equal(app.get("encounter-character").dataset.revealed,"true");
  for(const state of C.GAME_STATES){app.select("game-state",state);assert.match(app.get("encounter-star-name").textContent,/柯瑞/);}
  const refresh=boot({},null,{url:"file:///project/index.html?encounterDate=2026-01-01"});refresh.get("list-meet-pier").emit("click");assert.equal(refresh.get("encounter-portrait").src,app.get("encounter-portrait").src);
});
test("legacy home collection and a new encounter coexist through download, next-day rotation and reload",async()=>{
  const home=F.createPhoto("warriors",{...F.DEFAULT_AVATAR,nickname:"舊版角色"},{capturedAt:"2026-01-01T01:00:00Z"});
  const app=boot({[F.ALBUM_KEY]:JSON.stringify({version:1,photos:[home]})},null,{url:"file:///project/index.html?encounterDate=2026-01-01"});
  app.get("list-meet-pier").emit("click");app.get("encounter-character").emit("click");app.get("encounter-photo").emit("click");assert.equal(app.get("photo-home-options").hidden,true);assert.equal(app.get("photo-venue-name").textContent,"西岸碼頭步道");
  app.get("photo-pose").value="ball";app.get("photo-pose").emit("change");app.get("capture-photo").emit("click");const frozen=app.get("photo-image").src;app.get("collect-photo").emit("click");
  assert.equal(app.get("album-tab-home-count").textContent,"1／16");assert.equal(app.get("album-tab-encounter-count").textContent,"1／16");
  let exported;app.setPNGExporter(async record=>{exported=record;return new Blob(["PNG protocol fixture"],{type:"image/png"});});app.get("download-photo").emit("click");await new Promise(resolve=>setImmediate(resolve));assert.equal(exported.kind,"encounter");assert.equal(exported.locationId,"meet-pier");assert.match(app.downloads[0].download,/encounter-curry/);
  app.get("star-close").emit("click");app.get("encounter-test-date").value="2026-01-02";app.get("encounter-test-controls").emit("submit");assert.equal(app.get("encounter-character").hidden,true);
  app.get("my-fan").emit("click");app.get("fan-nickname").value="隔日換裝";app.get("fan-nickname").emit("input");app.get("fan-form").emit("submit");app.get("fan-tab-album").emit("click");app.get("album-tab-encounter").emit("click");app.get("fan-album-grid").children.find(node=>node.dataset.starId==="curry").emit("click");assert.equal(app.get("photo-image").src,frozen);assert.equal(app.get("download-photo").disabled,false);
  const restored=boot(Object.fromEntries(app.records));assert.equal(restored.get("album-tab-home-count").textContent,"1／16");assert.equal(restored.get("album-tab-encounter-count").textContent,"1／16");assert.equal(JSON.parse(app.records.get(F.ALBUM_KEY)).photos[0].avatar.nickname,"舊版角色");
});
test("Taiwan midnight updates the visited place and invalidates an uncaptured yesterday encounter",()=>{
  const now=Date.parse("2026-11-24T15:59:30Z"), schedule=F.dailyEncounter("2026-11-24");
  const app=boot({},null,{now,url:"https://example.github.io/nba-policy-island/?encounterDate=2026-01-01"});assert.equal(app.get("encounter-test-controls").hidden,true);
  app.get(`list-${schedule.locationId}`).emit("click");app.get("encounter-character").emit("click");app.get("encounter-photo").emit("click");assert.equal(app.get("capture-photo").disabled,false);
  app.advance(60000);assert.match(app.get("encounter-date").textContent,/2026-11-25/);assert.equal(app.get("encounter-reveal").hidden,true);assert.equal(app.get("capture-photo").disabled,true);assert.match(app.get("photo-status").textContent,/日期已更新/);
  assert.equal(app.timerCount(30000),1);app.windowEvent("pagehide");assert.equal(app.timerCount(30000),0);app.windowEvent("pageshow",{persisted:true});assert.equal(app.timerCount(30000),1);
});
test("local date form cycles star and location, while public date controls cannot override today",()=>{
  const app=boot({},null,{url:"file:///project/index.html?encounterDate=2026-01-01"});app.get("list-meet-pier").emit("click");assert.equal(app.get("encounter-test-controls").hidden,false);
  app.get("encounter-test-date").value="2026-01-02";const submit=app.get("encounter-test-controls").emit("submit");assert.equal(submit.defaultPrevented,true);app.get("list-meet-plaza").emit("click");app.get("encounter-character").emit("click");assert.match(app.get("encounter-star-name").textContent,/魔術強森/);
  const online=boot({},null,{now:Date.parse("2026-11-24T06:00:00Z"),url:"https://example.github.io/nba-policy-island/"});online.get("list-meet-pier").emit("click");const before=online.get("encounter-date").textContent;online.get("encounter-test-date").value="2026-01-01";online.get("encounter-test-controls").emit("submit");assert.equal(online.get("encounter-date").textContent,before);
});

test("friend-room UI flow with a backend fixture: create, duplicate, ready, timed result and rematch",async()=>{
  // 僅測前端消費真實資料形狀的流程，不取代 Supabase/RLS/兩裝置實測。
  let app,created=false,submissions=0;
  const room={id:"test-room",court_id:"harbor-01",invite_code:"0123456789abcdef01234567",host_id:"host",status:"waiting",round:1,starts_at:null,ends_at:null,expires_at:new Date(7300000).toISOString()};
  let players=[];
  const snapshot=()=>{if(room.status==="countdown"&&app.now()>=Date.parse(room.starts_at))room.status="playing";return JSON.parse(JSON.stringify({room,players,server_now:new Date(app?.now()??100000).toISOString()}));};
  const adapter={configured:true,connect:async()=>({id:"host"}),userId:()=>"host",activity:async()=>[],myRooms:async()=>created?[{...room}]:[],get:async()=>snapshot(),
    create:async(court,name)=>{created=true;room.court_id=court;players=[{user_id:"host",display_name:name,ready:false,score:null,attempts:null}];return snapshot();},
    join:async()=>{const error=C.roomJoinError({status:room.status,players},"host",app.now());if(error)throw new Error(error);return snapshot();},
    ready:async(id,ready)=>{players[0].ready=ready;return snapshot();},
    start:async()=>{if(players.length!==2||!players.every(p=>p.ready))throw new Error("NOT_READY");room.status="countdown";room.starts_at=new Date(app.now()+5000).toISOString();room.ends_at=new Date(app.now()+35000).toISOString();return snapshot();},
    submit:async(id,round,score,attempts)=>{submissions++;assert.equal(id,room.id);assert.equal(round,room.round);assert.ok(app.now()>=Date.parse(room.ends_at));players[0].score=score;players[0].attempts=attempts;room.status="finished";return snapshot();},
    restart:async()=>{room.round++;room.status="waiting";for(const p of players){p.ready=false;p.score=null;p.attempts=null;}return snapshot();}
  };
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  app=boot({},adapter);await settle();app.get("quick-courts").emit("click");app.get("player-name").value="測試房主";
  app.get("room-form").emit("submit");await settle();assert.equal(app.get("room-panel").hidden,false);assert.equal(app.get("room-start").disabled,true);assert.match(app.get("room-invite-value").value,/court=harbor-01&invite=/);
  app.get("invite-code").value=room.invite_code;app.get("join-room").emit("click");await settle();assert.match(app.get("lobby-notice").textContent,/已加入/);assert.equal(players.length,1);
  app.get("ready-toggle").emit("click");await settle();assert.equal(players[0].ready,false);assert.equal(app.get("tutorial-controls").hidden,false);assert.equal(submissions,0);
  app.get("practice-leave").emit("click");app.get("tutorial-skip").emit("click");await settle();assert.equal(players[0].ready,false);
  app.get("ready-toggle").emit("click");app.get("tutorial-skip").emit("click");await settle();assert.equal(players[0].ready,true);assert.equal(app.get("room-start").disabled,true);
  players.push({user_id:"guest",display_name:"測試朋友",ready:false,score:null,attempts:null});app.advance(2000);await settle();assert.equal(app.get("room-start").disabled,true);
  players[1].ready=true;app.advance(2000);await settle();assert.equal(app.get("room-start").disabled,false);
  app.get("room-start").emit("click");await settle();assert.equal(app.get("shoot-button").disabled,true);app.advance(5300);await settle();app.get("game-stage").emit("keydown",{key:" ",code:"Space"});assert.equal(app.get("game-hits").textContent,"1");
  players[1].score=2;players[1].attempts=3;app.advance(30000);await settle();assert.equal(submissions,1);assert.equal(app.get("round-result").hidden,false);assert.match(app.get("round-result-title").textContent,/測試朋友.*獲勝/);assert.match(app.get("round-result-content").innerHTML,/2 球/);
  app.get("game-stage").emit("keydown",{key:" ",code:"Space"});assert.equal(submissions,1);assert.equal(app.get("shoot-button").disabled,true);
  app.get("room-restart").emit("click");await settle();assert.equal(room.round,2);assert.equal(players.every(p=>!p.ready&&p.score===null),true);assert.equal(app.get("room-start").disabled,true);assert.match(app.get("room-state").textContent,/第 2 局/);assert.equal(app.network(),0);
});

test("court controls route keyboard, range drag and touch/button actions to the selected dedicated game",()=>{
  const app=boot();
  for(const c of C.COURTS)assert.ok(app.get(`landmark-${c.id}`).children[0].innerHTML.includes(c.gameName));
  app.get("list-harbor-03").emit("click");app.startPractice();app.advance(1000);
  assert.equal(app.get("mini-wind").hidden,false);assert.equal(app.get("aim-meter").hidden,true);
  const wind=Math.round((G.randomAt(1,0,2)*140-70)/10)*10;app.get("mini-wind-aim").value=String(-wind);app.get("mini-wind-aim").emit("input");app.get("shoot-button").emit("click");assert.equal(app.get("game-hits").textContent,"1");
  app.get("list-harbor-04").emit("click");assert.equal(app.timerCount(),0);app.startPractice();app.advance(1000);const zone=2-G.pick(1,0,3);app.get("game-stage").emit("keydown",{key:String(zone+1)});assert.equal(app.get("game-hits").textContent,"1");
  app.get("list-roof-04").emit("click");app.startPractice();app.advance(1000);assert.equal(app.get("mini-up").hidden,false);app.get("mini-up").emit("click");assert.equal(app.get("game-attempts").textContent,"1");app.get("practice-leave").emit("click");const before=app.get("game-attempts").textContent;app.get("mini-up").emit("click");assert.equal(app.get("game-attempts").textContent,before);assert.equal(app.timerCount(),0);
});
test("dribble, rhythm and computer duel expose distinct controls; held keys never multiply actions",()=>{
  const app=boot();app.get("list-park-01").emit("click");app.startPractice();app.advance(1000);assert.equal(app.get("mini-arrows").hidden,false);assert.equal(app.get("shoot-button").hidden,true);
  app.get("game-stage").emit("keydown",{key:"ArrowRight"});assert.match(app.get("mini-scene").innerHTML,/cx="450"/);const scene=app.get("mini-scene").innerHTML;app.get("game-stage").emit("keydown",{key:"ArrowRight",repeat:true});assert.equal(app.get("mini-scene").innerHTML,scene);
  app.get("list-roof-02").emit("click");app.startPractice();app.advance(1600);app.get("mini-left").emit("click");assert.equal(app.get("game-hits").textContent,"10");app.get("game-stage").emit("keydown",{key:"ArrowLeft",repeat:true});assert.equal(app.get("game-attempts").textContent,"1");app.advance(600);app.get("game-stage").emit("keydown",{key:"ArrowRight"});assert.equal(app.get("game-hits").textContent,"20");
  app.get("list-park-04").emit("click");app.startPractice();assert.match(app.get("game-context").textContent,/電腦，非真人/);app.advance(1000);app.get("mini-choice-0").emit("click");assert.match(app.get("shot-feedback").textContent,/電腦/);assert.equal(app.get("mini-choice-1").disabled,true);app.advance(7000);assert.equal(app.get("mini-choice-1").disabled,false);app.advance(70000);assert.match(app.get("round-result-content").textContent,/電腦/);
  assert.equal(app.get("mini-left").listeners.get("click").length,1);assert.equal(app.get("game-stage").listeners.get("keydown").length,1);assert.equal(app.network(),0);
});
test("memory input is disabled during demonstration and allround changes active control families",()=>{
  const app=boot();app.get("list-park-05").emit("click");app.startPractice();app.advance(1000);assert.equal(app.get("mini-choice-0").disabled,true);app.advance(2200);assert.equal(app.get("mini-choice-0").disabled,false);
  const seq=[0,1,2].map(i=>G.pick(1,i,9));for(const n of seq){app.get(`mini-choice-${n}`).emit("click");app.advance(200);}assert.equal(app.get("game-hits").textContent,"3");
  app.get("list-roof-05").emit("click");app.startPractice();app.advance(1000);assert.equal(app.get("mini-choices").hidden,true);assert.equal(app.get("shoot-button").hidden,false);app.advance(15000);assert.equal(app.get("mini-choices").hidden,false);assert.equal(app.get("shoot-button").hidden,true);app.advance(10000);assert.equal(app.get("mini-choices").hidden,true);assert.equal(app.get("shoot-label").textContent,"封阻");app.advance(15000);assert.equal(app.get("round-result").hidden,false);assert.match(app.get("round-result-content").textContent,/投籃 0／傳球 0／封阻 0/);
});
test("new room submits game ID, common seed and structured result; rematch cannot use prior round",async()=>{
  let app,payload;
  const room={id:"wind-room",court_id:"harbor-03",game_id:"wind",game_seed:987,invite_code:"0123456789abcdef01234567",host_id:"a",status:"waiting",round:3,starts_at:null,ends_at:null};
  const players=[{user_id:"a",slot:1,display_name:"甲",score:null,attempts:null,result:null,ready:true},{user_id:"b",slot:2,display_name:"乙",score:null,attempts:null,result:null,ready:true}];
  const snap=()=>JSON.parse(JSON.stringify({room,players,server_now:new Date(app?.now()??100000).toISOString()}));
  const adapter={configured:true,connect:async()=>({id:"a"}),userId:()=>"a",activity:async()=>[],myRooms:async()=>[],create:async()=>snap(),get:async()=>snap(),start:async()=>{room.status="countdown";room.starts_at=new Date(app.now()+5000).toISOString();room.ends_at=new Date(app.now()+50000).toISOString();return snap();},submitResult:async(...args)=>{payload=args;players[0].result=args[4];players[0].score=args[4].score;return snap();},restart:async()=>{room.round++;room.game_seed=988;room.status="waiting";players.forEach(p=>{p.ready=false;p.score=null;p.result=null;});return snap();}};
  const settle=()=>new Promise(r=>setImmediate(r));app=boot({},adapter);await settle();app.get("list-harbor-03").emit("click");app.get("player-name").value="甲";app.get("room-form").emit("submit");await settle();app.get("room-start").emit("click");await settle();app.advance(5000);await settle();assert.match(app.get("game-context").textContent,/種子 987/);
  app.advance(45000);await settle();assert.equal(payload[0],room.id);assert.equal(payload[1],3);assert.equal(payload[2],"wind");assert.equal(payload[3],987);assert.equal(payload[4].gameId,"wind");assert.equal(payload.length,5);
  room.status="finished";app.advance(2000);await settle();app.get("room-restart").emit("click");await settle();assert.equal(room.round,4);assert.equal(app.get("room-start").disabled,true);assert.equal(app.get("play-court").hidden,true);
});

test("friend duel UI never invents opponent choices and reveals only backend-provided completed turns",async()=>{
  // 記憶體後端形狀替身；不是 SQL 執行或兩裝置連線測試。
  let app;const moves=new Map();const room={id:"duel-room",court_id:"park-04",game_id:"duel",game_seed:42,invite_code:"0123456789abcdef01234567",host_id:"a",status:"waiting",round:1,starts_at:null,ends_at:null};
  const players=[{user_id:"a",slot:1,display_name:"甲",score:null,result:null,ready:true},{user_id:"b",slot:2,display_name:"乙",score:null,result:null,ready:true}];
  const snap=()=>{const turn=room.starts_at?Math.max(0,Math.min(9,Math.floor((app.now()-Date.parse(room.starts_at))/7000))):0;const history=[];for(let n=0;n<10;n++){const a=moves.get(`${n}:a`),b=moves.get(`${n}:b`);if(a!==undefined&&b!==undefined)history.push({turn:n,attack:a,defense:b,scored:a!==b});}return JSON.parse(JSON.stringify({room,players,duel:{turn,submitted:moves.has(`${turn}:a`),history,scores:[history.filter(x=>x.scored).length*2,0]},server_now:new Date(app?.now()??100000).toISOString()}));};
  const adapter={configured:true,connect:async()=>({id:"a"}),userId:()=>"a",activity:async()=>[],myRooms:async()=>[],create:async()=>snap(),get:async()=>snap(),start:async()=>{room.status="countdown";room.starts_at=new Date(app.now()+5000).toISOString();room.ends_at=new Date(app.now()+75000).toISOString();return snap();},choose:async(id,round,turn,move)=>{assert.equal(id,room.id);assert.equal(round,1);if(moves.has(`${turn}:a`))throw new Error("MOVE_ALREADY_SUBMITTED");moves.set(`${turn}:a`,move);return snap();}};
  const settle=()=>new Promise(r=>setImmediate(r));app=boot({},adapter);await settle();app.get("list-park-04").emit("click");app.get("player-name").value="甲";app.get("room-form").emit("submit");await settle();app.get("room-start").emit("click");await settle();app.advance(5000);await settle();assert.match(app.get("mini-prompt").textContent,/好友 PK/);assert.doesNotMatch(app.get("mini-scene").innerHTML,/電腦/);
  app.get("mini-choice-1").emit("click");await settle();assert.equal(moves.size,1);assert.equal(app.get("mini-choice-0").disabled,true);assert.doesNotMatch(app.get("mini-prompt").textContent,/上回合進攻/);
  app.advance(1000);await settle();assert.doesNotMatch(app.get("mini-prompt").textContent,/上回合進攻/);assert.equal(moves.size,1);
  moves.set("0:b",2);app.advance(500);await settle();assert.match(app.get("mini-prompt").textContent,/進攻 2／防守 3/);assert.equal(app.get("game-hits").textContent,"2");
  app.get("landmark-warriors").emit("click");assert.equal(app.timerCount(),0);assert.equal(app.get("play-court").hidden,true);app.get("mini-choice-2").emit("click");assert.equal(moves.size,2);
});
test("configured rooms remain disabled until backend confirms the games-v2 capability",async()=>{
  const adapter={configured:true,connect:async()=>({id:"a"}),userId:()=>"a",capabilities:async()=>({version:1}),activity:async()=>{throw new Error("must not read rooms before capability");}};
  const app=boot({},adapter);await new Promise(r=>setImmediate(r));app.get("quick-courts").emit("click");assert.equal(app.get("create-room").disabled,true);assert.equal(app.get("join-room").disabled,true);assert.match(app.get("lobby-notice").textContent,/games-v2.sql/);assert.equal(app.get("room-panel").hidden,true);
});

test('20 scenery directory entries inspect 16 views without moving and walk to four real photo entrances',()=>{
  const app=boot(),S=require('../assets/sights-core.js');app.get('filter-sight').emit('click');assert.equal(app.get('station-list').children.filter(n=>!n.hidden).length,20);const before=app.get('fan-map-marker').dataset.location;
  for(const sight of S.SIGHTS.filter(s=>!s.photo)){app.get(`list-${sight.id}`).emit('click');assert.equal(app.get('sight-panel').hidden,false);assert.equal(app.get('station-panel').hidden,false);assert.equal(app.get('fan-map-marker').dataset.location,before);assert.equal(app.get('sight-photo').hidden,true);}
  for(const sight of S.SIGHTS.filter(s=>s.photo)){app.get(`landmark-${sight.id}`).emit('keydown',{key:'Enter'});assert.equal(app.get('fan-map-marker').dataset.location,sight.id);assert.equal(app.get('station-panel').hidden,false);assert.equal(app.get('sight-photo').hidden,false);assert.equal(app.get('nba-panel').hidden,true);}
  assert.equal(app.network(),0);
});
test('scenic photo waits for arrival, snapshots saved clothes and downloads through existing PNG UI without altering albums',async()=>{
  const app=boot({},null,{reducedMotion:false});app.get('list-sight-golden-gate').emit('click');app.get('sight-photo').emit('click');assert.equal(Boolean(app.get('star-dialog').open),false);app.advance(5000);assert.equal(app.get('fan-map-marker').dataset.location,'sight-golden-gate');app.get('sight-photo').emit('click');assert.equal(app.get('star-dialog').open,true);assert.equal(app.get('collect-photo').hidden,true);app.get('capture-photo').emit('click');let exported;app.setPNGExporter(async p=>{exported=p;return {type:'image/png'};});app.get('download-photo').emit('click');await new Promise(r=>setImmediate(r));assert.equal(exported.kind,'sight');assert.equal(exported.locationId,'sight-golden-gate');assert.equal(app.downloads.length,1);assert.match(app.downloads[0].download,/sight-golden-gate.*\.png/);app.get('collect-photo').emit('click');assert.equal(app.records.has('nba-policy-island:photos:v1'),false);app.get('photo-back-scene').emit('click');assert.equal(app.get('star-dialog').open,false);assert.equal(app.get('station-panel').hidden,false);
  app.get('list-warriors').emit('click');app.advance(5000);app.get('find-star').emit('click');app.get('star-landmark').emit('click');assert.equal(app.get('collect-photo').hidden,false);assert.equal(app.get('photo-subject-label').textContent,'\u7403\u661f');
});
test('cars use the one shared loop, heading lights survive final score and pause on overview, hidden page and reduced motion',()=>{
  const app=boot({},null,{reducedMotion:false});assert.equal(app.timerCount(16),0);assert.equal(app.get('traffic-layer').children.length,6);app.get('district-island-warriors').emit('click');assert.equal(app.timerCount(16),1);app.advance(100);const car=app.get('car-720s'),before=[car.dataset.x,car.dataset.y];app.get('map-night').emit('click');assert.equal(car.dataset.headlights,'true');assert.deepEqual([car.dataset.x,car.dataset.y],before);app.select('game-state','final');assert.equal(car.dataset.headlights,'true');assert.equal(app.get('landmark-lakers').dataset.glowing,'false');
  app.advance(100);assert.notDeepEqual([car.dataset.x,car.dataset.y],before);const point=[car.dataset.x,car.dataset.y];app.visibility(true);assert.equal(app.timerCount(16),0);app.advance(7000);app.visibility(false);assert.deepEqual([car.dataset.x,car.dataset.y],point);app.mapVisibility(false);assert.equal(app.timerCount(16),0);app.mapVisibility(true);assert.equal(app.timerCount(16),1);app.get('camera-overview').emit('click');assert.equal(app.timerCount(16),0);app.advance(3000);assert.deepEqual([car.dataset.x,car.dataset.y],point);
  app.get('district-island-suns').emit('click');assert.equal(app.timerCount(16),1);const other=app.get('car-aventador'),otherPoint=[other.dataset.x,other.dataset.y];app.advance(100);assert.notDeepEqual([other.dataset.x,other.dataset.y],otherPoint);assert.deepEqual([car.dataset.x,car.dataset.y],point);app.reduceMotion(true);assert.equal(app.timerCount(16),0);app.advance(3000);app.reduceMotion(false);assert.equal(app.timerCount(16),1);app.windowEvent('pagehide');assert.equal(app.timerCount(16),0);
});
test('scenic night artwork and PNG background change independently from venue LIVE eligibility',()=>{
  const app=boot();app.get('list-sight-cloud-gate').emit('click');app.get('map-night').emit('click');assert.match(app.get('sight-image').src,/-night.svg$/);assert.match(app.get('scenic-art-sight-cloud-gate').src,/-night.svg$/);app.get('sight-photo').emit('click');app.get('capture-photo').emit('click');assert.ok(decodeURIComponent(app.get('photo-image').src).includes('#172e49'));app.get('photo-back-scene').emit('click');app.get('map-day').emit('click');assert.doesNotMatch(app.get('sight-image').src,/-night.svg$/);app.get('sight-photo').emit('click');app.get('capture-photo').emit('click');assert.ok(decodeURIComponent(app.get('photo-image').src).includes('#92bec8'));assert.equal(app.network(),0);
});
test('pixel map models and eight-direction player frames share the original navigation and one animation timer',()=>{
  const app=boot({},null,{reducedMotion:false}),P=require('../assets/pixel-core.js');for(const team of C.TEAMS)assert.equal(app.get(`landmark-${team.id}`).dataset.pixelModel,P.ARENAS[team.id]);for(const court of C.COURTS)assert.equal(app.get(`landmark-${court.id}`).dataset.pixelModel,court.type);
  app.get('list-meet-pier').emit('click');assert.equal(app.timerCount(16),1);app.advance(320);assert.match(app.get('fan-map-avatar').innerHTML,/data-direction=/);assert.match(app.get('fan-map-avatar').innerHTML,/data-neutral="true"/);const before=app.get('fan-map-avatar').innerHTML;app.advance(150);assert.notEqual(app.get('fan-map-avatar').innerHTML,before);app.advance(5000);assert.equal(app.get('fan-map-marker').dataset.location,'meet-pier');assert.match(app.get('fan-map-avatar').innerHTML,/data-frame="0"/);assert.equal(app.timerCount(16),1);app.reduceMotion(true);assert.equal(app.timerCount(16),0);
});
test('pixel NPCs expose eight models, idle frames stay still and background preserves sprite state',()=>{
  const app=boot({},null,{reducedMotion:false});const models=new Set([...app.nodes.values()].filter(n=>n.id?.startsWith('npc-')&&n.dataset.pixelModel).map(n=>n.dataset.pixelModel));assert.equal(models.size,8);app.get('district-island-warriors').emit('click');app.advance(1800);const npc=app.get('npc-fan-ticket');assert.ok(npc.dataset.direction);const frame=npc.dataset.frame;app.visibility(true);app.advance(9000);assert.equal(npc.dataset.frame,frame);assert.equal(app.timerCount(16),0);app.visibility(false);app.get('map-night').emit('click');app.select('game-state','final');assert.equal(app.get('island-map').dataset.theme,'night');assert.equal(app.get('landmark-lakers').dataset.glowing,'false');app.get('camera-overview').emit('click');assert.equal(app.timerCount(16),0);
});
test('team-island UI navigates Warriors across sea bridges to Lakers, enters the arena and returns without teleporting',()=>{
  const app=boot({},null,{reducedMotion:false});app.get('district-island-warriors').emit('click');assert.equal(app.get('island-map').dataset.teamIsland,'island-warriors');assert.equal(app.get('landmark-lakers').dataset.interactive,'false');assert.equal(app.get('landmark-harbor-01').dataset.interactive,'true');
  app.get('list-lakers').emit('click');assert.equal(app.get('fan-map-marker').dataset.moving,'true');assert.equal(app.get('station-panel').hidden,true);app.advance(5000);assert.equal(app.get('fan-map-marker').dataset.location,'lakers');assert.equal(app.get('station-panel').hidden,false);assert.equal(app.get('island-map').dataset.teamIsland,'island-lakers');
  app.get('find-star').emit('click');assert.equal(app.get('star-dialog').open,true);assert.ok(app.get('arena-caption').textContent.includes(F.getStation('lakers').venue));app.get('star-close').emit('click');app.get('station-close').emit('click');assert.equal(app.get('island-map').dataset.view,'district');assert.equal(app.get('island-map').dataset.teamIsland,'island-lakers');const position=[app.get('fan-map-marker').style.left,app.get('fan-map-marker').style.top];app.get('camera-overview').emit('click');assert.deepEqual([app.get('fan-map-marker').style.left,app.get('fan-map-marker').style.top],position);assert.equal(app.get('fan-map-marker').dataset.location,'lakers');
});
test('overview team names expose only home LIVE; keyboard expands a secondary sight without moving the fan',()=>{
  const app=boot();assert.equal(app.get('district-island-lakers').dataset.live,'true');assert.equal(app.get('district-island-warriors').dataset.live,'false');app.select('game-state','final');assert.equal(app.get('district-island-lakers').dataset.live,'false');
  app.get('district-island-warriors').emit('click');assert.equal(app.get('landmark-sight-lombard').dataset.interactive,'false');const position=app.get('fan-map-marker').style.left;app.get('landmark-sight-lombard').emit('focus');assert.equal(app.get('landmark-sight-lombard').dataset.interactive,'true');assert.equal(app.get('fan-map-marker').style.left,position);app.get('landmark-sight-lombard').emit('keydown',{key:'Enter'});assert.equal(app.get('sight-panel').hidden,false);assert.equal(app.get('fan-map-marker').style.left,position);
});
