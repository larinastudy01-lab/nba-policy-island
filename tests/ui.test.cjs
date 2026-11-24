"use strict";
// Node 元素／事件替身；不啟動瀏覽器、不控制桌面、不驗證像素排版。
const test=require("node:test");const assert=require("node:assert/strict");const fs=require("node:fs");const path=require("node:path");const vm=require("node:vm");
const root=path.resolve(__dirname,"..");const html=fs.readFileSync(path.join(root,"index.html"),"utf8");const C=require("../assets/island-core.js");const P=require("../assets/policy-core.js");
function boot(initial={},adapterFixture=null){
  const nodes=new Map(),inputs=[],timers=new Map(),records=new Map(Object.entries(initial));let clock=100000,id=0,fetchCalls=0;
  const document={activeElement:null};
  class Element{
    constructor(tag="div"){this.tagName=tag.toUpperCase();this.children=[];this.attributes=new Map();this.listeners=new Map();this.dataset={};this.hidden=false;this.disabled=false;this.checked=false;this.value="";this.textContent="";this.className="";this._html="";this.style={setProperty(name,value){this[name]=value;}};this.classList={add:(...values)=>{this.className=[this.className,...values].join(" ").trim();}};}
    set innerHTML(value){this._html=value;this._text="";this.children=[];}get innerHTML(){return this._html+this.children.map(child=>`<${child.tagName.toLowerCase()}>${child._text}${child.innerHTML}</${child.tagName.toLowerCase()}>`).join("");}
    set textContent(value){this._text=String(value);this._html="";this.children=[];}get textContent(){return this._text+this.children.map(child=>child.textContent).join("");}
    setAttribute(key,value){this.attributes.set(key,String(value));}getAttribute(key){return this.attributes.get(key)??null;}
    append(child){this.children.push(child);if(child.id)nodes.set(child.id,child);}replaceChildren(...children){this.children=[];this.textContent="";for(const child of children)this.append(child);}
    addEventListener(type,callback){const handlers=this.listeners.get(type)||[];handlers.push(callback);this.listeners.set(type,handlers);}
    emit(type,extra={}){if(this.disabled)return;const event={target:this,preventDefault(){this.defaultPrevented=true;},...extra};for(const cb of this.listeners.get(type)||[])cb(event);return event;}
    focus(){document.activeElement=this;}select(){this.selected=true;}
    play(){this.plays=(this.plays||0)+1;return Promise.resolve();}pause(){this.pauses=(this.pauses||0)+1;}
  }
  for(const [,tag,raw] of html.matchAll(/<([a-z][a-z\d-]*)\b([^>]*)>/gi)){
    const attrs=Object.fromEntries([...raw.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(x=>[x[1],x[2]??""]));if(!attrs.id&&tag!=="input")continue;
    const el=new Element(tag);el.id=attrs.id;el.name=attrs.name;el.value=attrs.value||"";el.checked=Object.hasOwn(attrs,"checked");el.hidden=Object.hasOwn(attrs,"hidden");el.disabled=Object.hasOwn(attrs,"disabled");
    if(attrs.id)nodes.set(attrs.id,el);if(tag==="input")inputs.push(el);
  }
  document.getElementById=id=>nodes.get(id)||null;document.createElement=tag=>new Element(tag);document.createElementNS=(ns,tag)=>new Element(tag);document.querySelectorAll=selector=>inputs.filter(input=>input.name===selector.match(/name="([^"]+)"/)?.[1]);
  const storage={getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)};
  class ClockDate extends Date{static now(){return clock;}}
  const windowSurface=new Element("window");windowSurface.localStorage=storage;windowSurface.location={href:"file:///project/index.html"};
  const context=vm.createContext({document,window:windowSurface,navigator:{},URL,atob,Date:ClockDate,fetch:async()=>{fetchCalls++;throw new Error("Unexpected network");},setInterval:callback=>{timers.set(++id,callback);return id;},clearInterval:id=>timers.delete(id)});
  for(const file of ["assets/supabase-config.js","assets/island-core.js","assets/policy-core.js","assets/online.js","script.js"]){if(file==="script.js"&&adapterFixture)context.NBAOnline={createSupabaseAdapter:()=>adapterFixture};vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),context,{filename:file});}
  return {get(name){assert.ok(nodes.has(name),`Missing ${name}`);return nodes.get(name);},nodes,document,records,network:()=>fetchCalls,now:()=>clock,timerCount:()=>timers.size,windowEvent:(name,extra)=>windowSurface.emit(name,extra),select(name,value){for(const input of inputs.filter(i=>i.name===name))input.checked=input.value===value;inputs.find(i=>i.name===name&&i.value===value).emit("change");},advance(ms){clock+=ms;for(const cb of [...timers.values()])cb();}};
}
test("app builds 23 named keyboard-operable HTML buttons aligned to island coordinates",()=>{
  const app=boot();assert.equal(app.get("landmark-layer").children.length,23);
  for(const item of [...C.TEAMS,...C.COURTS]){const node=app.get(`landmark-${item.id}`);assert.equal(node.tagName,"BUTTON");assert.equal(node.getAttribute("role"),"button");assert.equal(node.getAttribute("tabindex"),"0");assert.equal(node.dataset.x,String(item.x));assert.equal(node.dataset.y,String(item.y));const dx=node.dataset.kind==="nba"?80:55;assert.equal(node.style.left,`${(item.x-dx)/1200*100}%`);assert.ok(node.getAttribute("aria-label").includes(item.name));}
  assert.equal(app.get("station-list").children.filter(n=>!n.hidden).length,8);app.get("filter-court").emit("click");assert.equal(app.get("station-list").children.filter(n=>!n.hidden).length,15);
});
test("all 8 arenas and 15 public courts open the correct distinct panel",()=>{
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
  for(const court of C.COURTS){app.get(`list-${court.id}`).emit("click");app.get("practice-start").emit("click");assert.match(app.get("shooting-title").textContent,new RegExp(court.name));assert.match(app.get("game-mode-label").textContent,/非真人/);assert.equal(app.get("game-hits").textContent,"0");}
  app.advance(1300);app.get("game-stage").emit("keydown",{code:"Space",key:" "});assert.equal(app.get("game-hits").textContent,"1");
  app.advance(30000);assert.equal(app.get("shoot-button").disabled,true);assert.equal(app.get("game-timer").textContent,"0.0");assert.match(app.get("round-result-content").textContent,/沒有真人或模擬對手/);
  app.get("practice-restart").emit("click");assert.equal(app.get("game-hits").textContent,"0");assert.equal(app.get("game-attempts").textContent,"0");assert.equal(app.get("game-timer").textContent,"30.0");assert.equal(app.get("round-result").hidden,true);assert.equal(app.network(),0);
});
test("audio is opt-in, successful shots and final buzzer play once, while held Space is ignored",()=>{
  const app=boot();assert.equal(app.get("sound-hit").plays||0,0);assert.equal(app.get("sound-end").plays||0,0);
  app.get("quick-courts").emit("click");app.get("practice-start").emit("click");app.advance(1300);
  app.get("game-stage").emit("keydown",{code:"Space",key:" ",repeat:true});assert.equal(app.get("game-attempts").textContent,"0");
  app.get("shoot-button").emit("click");assert.equal(app.get("game-hits").textContent,"1");assert.equal(app.get("sound-hit").plays||0,0);
  app.get("sound-enabled").checked=true;app.get("sound-enabled").emit("change");app.advance(1200);app.get("shoot-button").emit("click");assert.equal(app.get("sound-hit").plays,1);
  app.advance(30000);assert.equal(app.get("sound-end").plays,1);assert.equal(app.timerCount(),0);
  app.get("game-stage").emit("keydown",{code:"Space",key:" "});app.advance(1000);assert.equal(app.get("sound-end").plays,1);assert.equal(app.get("game-hits").textContent,"2");
  app.get("sound-enabled").checked=false;app.get("sound-enabled").emit("change");assert.ok(app.get("sound-end").pauses>0);assert.match(app.get("sound-status").textContent,/音效關閉/);
});
test("leaving practice, changing landmark and hiding the page clear the active timer",()=>{
  const app=boot();app.get("quick-courts").emit("click");app.get("practice-start").emit("click");assert.equal(app.timerCount(),1);
  app.get("practice-leave").emit("click");assert.equal(app.timerCount(),0);assert.equal(app.get("play-court").hidden,true);
  app.get("practice-start").emit("click");app.get("landmark-harbor-02").emit("click");assert.equal(app.timerCount(),0);assert.equal(app.get("play-court").hidden,true);
  app.get("practice-start").emit("click");assert.equal(app.get("game-stage").dataset.scene,"harbor");app.windowEvent("pagehide");assert.equal(app.timerCount(),0);
  app.windowEvent("pageshow",{persisted:true});assert.equal(app.timerCount(),1);app.advance(32000);assert.equal(app.get("game-timer").textContent,"0.0");assert.equal(app.timerCount(),0);
});
test("an audio playback rejection preserves the hit score and visual feedback",async()=>{
  const app=boot();app.get("quick-courts").emit("click");app.get("practice-start").emit("click");
  app.get("sound-enabled").checked=true;app.get("sound-enabled").emit("change");
  app.get("sound-hit").play=()=>Promise.reject(new Error("Playback blocked"));
  app.advance(1300);app.get("shoot-button").emit("click");await Promise.resolve();
  assert.equal(app.get("game-hits").textContent,"1");assert.match(app.get("shot-feedback").textContent,/命中/);assert.match(app.get("sound-status").textContent,/音效未能播放/);
});
test("required three-stop demonstration finishes Lakers game, reserved policy and a harbor practice",()=>{
  const app=boot();app.get("landmark-lakers").emit("click");assert.equal(app.get("landmark-lakers").dataset.glowing,"true");assert.equal(app.get("landmark-warriors").dataset.glowing,"false");
  app.get("landmark-warriors").emit("click");app.get("policy-launch").emit("click");app.select("policy-plan","reserved");app.get("policy-form").emit("submit");assert.match(app.get("policy-result-content").innerHTML,/2,400/);
  app.get("landmark-harbor-01").emit("click");app.get("practice-start").emit("click");app.advance(1300);app.get("shoot-button").emit("click");app.advance(29700);
  assert.equal(app.get("game-timer").textContent,"0.0");assert.match(app.get("round-result-content").textContent,/命中 1 球/);assert.equal(app.timerCount(),0);
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
  app.get("ready-toggle").emit("click");await settle();assert.equal(app.get("room-start").disabled,true);
  players.push({user_id:"guest",display_name:"測試朋友",ready:false,score:null,attempts:null});app.advance(2000);await settle();assert.equal(app.get("room-start").disabled,true);
  players[1].ready=true;app.advance(2000);await settle();assert.equal(app.get("room-start").disabled,false);
  app.get("room-start").emit("click");await settle();assert.equal(app.get("shoot-button").disabled,true);app.advance(5300);await settle();app.get("game-stage").emit("keydown",{key:" ",code:"Space"});assert.equal(app.get("game-hits").textContent,"1");
  players[1].score=2;players[1].attempts=3;app.advance(30000);await settle();assert.equal(submissions,1);assert.equal(app.get("round-result").hidden,false);assert.match(app.get("round-result-title").textContent,/測試朋友.*獲勝/);assert.match(app.get("round-result-content").innerHTML,/2 球/);
  app.get("game-stage").emit("keydown",{key:" ",code:"Space"});assert.equal(submissions,1);assert.equal(app.get("shoot-button").disabled,true);
  app.get("room-restart").emit("click");await settle();assert.equal(room.round,2);assert.equal(players.every(p=>!p.ready&&p.score===null),true);assert.equal(app.get("room-start").disabled,true);assert.match(app.get("room-state").textContent,/第 2 局/);assert.equal(app.network(),0);
});
