"use strict";

function initializeIsland() {
  const C = globalThis.NBAIsland;
  const F = globalThis.NBAFan;
  const S = globalThis.NBASights;
  const G = globalThis.NBAGames;
  const L = globalThis.NBATeamLogo;
  const { POLICY_CHALLENGE, calculatePolicy, createPolicySession } = globalThis.NBAPolicy;
  const $ = (id) => document.getElementById(id);
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const announce = (message) => { $("live-announcement").textContent = message; };
  let storage = null;
  try { storage = window.localStorage; } catch { /* 保留單次頁面功能。 */ }
  const policySession = createPolicySession(storage);
  const state = C.createIslandState();
  let fanUI = null;
  let explorer = null;
  let memoryUI = null;
  let shopUI = null;
  let teamQuery = "";
  let hoveredArena=null,focusedArena=null;
  function renderMapTeamName(){const team=C.TEAMS.find(t=>t.id===(hoveredArena||focusedArena||(state.kind==="nba"?state.id:null)));$("map-team-name").textContent=team?team.name:"指向或聚焦隊徽，查看完整隊名";$("map-team-name").dataset.teamId=team?.id||"";}
  let bayFixture="away",panelRequested=false,pendingPanelFocus=false;
  const practicedGames=new Set();let tutorialContinuation=null;
  const matchForTeam=id=>C.gameForTeam(id,state.gameState,bayFixture);
  const encounterConfig=F.encounterDateConfig(window.location.href);
  let encounterDateOverride=encounterConfig.isTest?encounterConfig.date:null;
  let encounterTimer=null,lastEncounterDate=null;
  const currentEncounter=()=>F.dailyEncounter(encounterDateOverride||F.taiwanDate(Date.now()));
  const adapter = globalThis.NBAOnline.createSupabaseAdapter(globalThis.NBA_SUPABASE_CONFIG, {storage});
  const mapNodes = new Map();
  const listNodes = new Map();
  const sightNodes = new Map();
  let policyOpen = false;
  let onlineReady = false;
  let onlineRulesVerified = false;
  let activityRows = null;
  let roomSnapshot = null;
  let onlineBusy = false;
  let polling = false;
  let serverOffset = 0;
  let game = null;
  let gameMode = null;
  let gameCourtId = null;
  let gameRoomId = null;
  let gameRound = null;
  let gameTimer = null;
  let gameFinished = false;
  let pendingScore = null;
  let scoreSubmitting = false;
  let lastResultToken = null;
  let onlineTimer = null;
  let audioUnlocked = false;
  let gameId = "shoot";
  const miniUI = globalThis.NBAGamesUI.initialize({getState:()=>game?miniSnapshot(game.tick(Date.now()+(gameMode==="online"?serverOffset:0))):null,onAction:actGame});
  const ns = "http://www.w3.org/2000/svg";

  function arenaGraphic(team) { return globalThis.NBAPixel.arenaMarkup(team); }
  function courtGraphic(court) { return globalThis.NBAPixel.courtMarkup(court); }
  function buildLandmarks() {
    $("landmark-layer").setAttribute("aria-label",`${C.TEAMS.length+C.COURTS.length+C.ENCOUNTERS.length} 個可探索地標，使用 Tab 選取後按 Enter 或空白鍵開啟`);
    for (const [kind,items] of [["nba",C.TEAMS],["court",C.COURTS],["encounter",C.ENCOUNTERS]]) {
      for (const item of items) {
        const node = document.createElement("button");
        node.type = "button";
        node.id = `landmark-${item.id}`;
        node.classList.add("landmark");
        node.dataset.kind = kind;
        if(kind==="nba")node.dataset.pixelModel=globalThis.NBAPixel.ARENAS[item.id];if(kind==="court")node.dataset.pixelModel=item.type;
        // 背景、建築與按鈕共用 MAP 座標，擴建後仍一起縮放。
        const frame=kind==="nba"?{x:80,y:68,w:160,h:132}:kind==="court"?{x:55,y:52,w:110,h:128}:{x:45,y:45,w:90,h:95};
        node.style.left=`${(item.x-frame.x)/C.MAP.width*100}%`;
        node.style.top=`${(item.y-frame.y)/C.MAP.height*100}%`;
        node.style.width=`${frame.w/C.MAP.width*100}%`;
        node.style.height=`${frame.h/C.MAP.height*100}%`;
        node.style.zIndex=String(Math.round(item.y)-(item.id==="harbor-01"?35:0));
        node.dataset.x=String(item.x);node.dataset.y=String(item.y);
        node.setAttribute("tabindex","0");
        node.setAttribute("role","button");
        node.setAttribute("aria-controls","station-panel");
        node.style.setProperty("--team-accent",item.accent || "#f3c45b");
        const graphic=document.createElementNS(ns,"svg");
        graphic.setAttribute("viewBox",`${-frame.x} ${-frame.y} ${frame.w} ${frame.h}`);
        graphic.setAttribute("aria-hidden","true");
        graphic.innerHTML = kind === "nba" ? arenaGraphic(item) : kind === "court" ? courtGraphic(item) : `<ellipse cy="14" rx="31" ry="16" fill="#0b293c"/><path d="M0-34 24-9 0 16-24-9Z" fill="${item.color}" stroke="#d4e3c9" stroke-width="2"/><text y="-3" text-anchor="middle" font-size="22" fill="#f9e5a8">？</text><ellipse class="selection-ring" cy="-5" rx="35" ry="31"/><text class="landmark-label court-label" y="39">${escapeHTML(item.name)}</text>`;
        const badge = document.createElementNS(ns,"text");
        if(kind==="court")graphic.innerHTML+=`<text class="landmark-game-label" y="${item.type==="roof"?71:60}">${escapeHTML(item.gameName)}</text>`;
        badge.classList.add("complete-label");
        badge.setAttribute("x","52"); badge.setAttribute("y","-43");
        badge.setAttribute("aria-hidden","true");badge.textContent="✓";
        const photoBadge = document.createElementNS(ns,"g");photoBadge.classList.add("photo-badge");
        photoBadge.setAttribute("aria-hidden","true");photoBadge.setAttribute("transform","translate(-58 -47)");
        photoBadge.innerHTML='<rect class="photo-badge-bg" x="-11" y="-10" width="22" height="20" rx="5"/><path class="photo-badge-icon" d="M-7-4h4l2-3h4l2 3h3v10H-7Z"/><circle class="photo-badge-icon" r="3" cy="1"/>';
        photoBadge.setAttribute("visibility","hidden");
        graphic.append(photoBadge);graphic.append(badge);node.append(graphic);
        if(kind==="nba"){
          const sign=element("span","arena-logo-sign"),branding=globalThis.NBAPixel.arenaBranding(item);sign.id="arena-logo-"+item.id;
          sign.setAttribute("aria-hidden","true");sign.dataset.mode="overview";
          const [roofX,roofY]=branding.roof,[signX,signY,signWidth,signHeight]=branding.sign;
          for(const [key,value]of [["roof-x",roofX/80*100],["roof-y",roofY/66*100],["sign-x",signX/80*100],["sign-y",signY/66*100],["sign-width",signWidth/80*100],["sign-height",signHeight/66*100]])sign.style.setProperty("--"+key,value+"%");
          sign.append(L.create(item,{variant:"map",eager:true}));
          const live=element("span","arena-logo-live","LIVE");live.id="arena-logo-live-"+item.id;live.hidden=true;sign.append(live);node.append(sign);
          node.setAttribute("title",item.name);
          node.addEventListener("mouseenter",()=>{hoveredArena=item.id;renderMapTeamName();});
          node.addEventListener("mouseleave",()=>{hoveredArena=null;renderMapTeamName();});
          node.addEventListener("focus",()=>{focusedArena=item.id;renderMapTeamName();});
          node.addEventListener("blur",()=>{focusedArena=null;renderMapTeamName();});
        }
        node.addEventListener("click",()=>openLandmark(kind,item.id));
        node.addEventListener("focus",()=>explorer?.focusOnly(item.id));
        node.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();if(!event.repeat)openLandmark(kind,item.id);}});
        $("landmark-layer").append(node);
        mapNodes.set(item.id,{node,badge,photoBadge});
        const button = document.createElement("button");
        button.type="button";button.id=`list-${item.id}`;
        button.style.setProperty("--team-color",item.color);
        button.style.setProperty("--team-accent",item.accent||"#e4efdd");
        button.setAttribute("aria-controls","station-panel");
        button.addEventListener("click",()=>openLandmark(kind,item.id));
        $("station-list").append(button);
        const symbol=kind==="nba"?L.create(item,{variant:"list"}):element("span","list-symbol",kind==="encounter"?"偶遇":item.type==="harbor"?"港邊":item.type==="park"?"公園":"屋頂");
        symbol.setAttribute("aria-hidden","true");
        const copy=element("span","list-copy"),title=element("strong",""),details=element("small","");
        copy.append(title,details);button.append(symbol,copy);
        listNodes.set(item.id,{button,kind,item,title,details});
        if(kind==="court"){
          const option=document.createElement("option");option.value=item.id;option.textContent=item.name+" · "+C.TEAMS.find(t=>t.id===item.teamIslandId).shortName+"島";
          $(`court-group-${item.type}`).append(option);
        }
      }
    }
    for(const team of C.TEAMS.filter(t=>t.expansion)){
      const image=document.createElement("img");image.id=`city-${team.id}`;image.className="city-scene";image.src=`./assets/pixel/cities/${team.id}.svg`;image.alt=`${team.city}城市印象：${team.cityScene}，原創像素場景`;
      image.style.left=`${(globalThis.NBAArchipelago.owner(team.id).x-155)/C.MAP.width*100}%`;image.style.top=`${(globalThis.NBAArchipelago.owner(team.id).y-65)/C.MAP.height*100}%`;image.style.width=`${110/C.MAP.width*100}%`;image.style.zIndex=String(Math.round(team.y)-40);$("city-layer").append(image);
    }
  }
  function courtStatus(id) {
    const activity = C.courtActivity(activityRows,id);
    if(activity === null)return adapter.configured ? "狀態待連線確認" : "真人連線未配置";
    return activity.waiting || activity.preparing || activity.playing ? `等待對手 ${activity.waiting} 房 · 準備中 ${activity.preparing} 房 · 對戰中 ${activity.playing} 房` : "目前無等待或對戰中的房間";
  }
  function buildSights(){
    for(const item of S.SIGHTS){
      const image=document.createElement("img");image.className="scenic-art";image.id=`scenic-art-${item.id}`;image.src=item.pixelAsset;image.alt="";image.setAttribute("aria-hidden","true");
      image.style.left=`${(item.x-item.width/2)/C.MAP.width*100}%`;image.style.top=`${(item.y-item.height)/C.MAP.height*100}%`;image.style.width=`${item.width/C.MAP.width*100}%`;image.style.height=`${item.height/C.MAP.height*100}%`;image.style.zIndex=String(item.key==="golden-gate"?3:Math.round(item.y)-2);
      const node=document.createElement("button");node.type="button";node.id=`landmark-${item.id}`;node.className="scenic-point";node.dataset.kind="sight";
      const point=item.entrance||{x:item.x,y:item.y};node.style.left=`${point.x/C.MAP.width*100}%`;node.style.top=`${point.y/C.MAP.height*100}%`;node.style.zIndex="2300";
      node.setAttribute("aria-label",`${item.name}・${item.photo?"沿步道前往觀景拍照":"查看街景名稱，保持玩家原位"}`);node.setAttribute("aria-controls","station-panel");
      const icon=element("span","scenic-icon",item.photo?"◎":"◇"),label=element("span","scenic-label",item.name+(item.photo?" · 拍照":""));node.append(icon,label);
      node.addEventListener("click",()=>openLandmark("sight",item.id));node.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();if(!event.repeat)openLandmark("sight",item.id);}});node.addEventListener("focus",()=>explorer?.focusOnly(item.id));
      $("scenery-layer").append(image,node);sightNodes.set(item.id,{node,image});
      const button=element("button","");button.id=`list-${item.id}`;button.type="button";button.setAttribute("aria-controls","station-panel");button.textContent=`${item.photo?"◎ 觀景拍照":"◇ 街景"}｜${item.name}・${item.region}`;button.addEventListener("click",()=>openLandmark("sight",item.id));$("station-list").append(button);listNodes.set(item.id,{button,kind:"sight",item});
    }
  }
  function renderMapAndDirectory() {
    const matches=C.searchTeams(teamQuery),matching=new Set(matches.map(t=>t.id));
    $("team-search-controls").hidden=state.filter!=="nba";$("team-search-status").textContent=`找到 ${matches.length}／${C.TEAMS.length} 支球隊${matches.length?"":"，請更換關鍵字。"}`;
    const complete = policySession.getState().completedPlanId !== null;
    const album = fanUI?.getState().homeAlbum || {};
    $("open-team-count").textContent=`${C.TEAMS.length}／30`;
    $("intro-team-count").textContent=String(C.TEAMS.length);$("filter-nba-count").textContent=String(C.TEAMS.length);
    $("filter-nba").setAttribute("aria-pressed",String(state.filter==="nba"));
    $("filter-court").setAttribute("aria-pressed",String(state.filter==="court"));
    $("filter-encounter").setAttribute("aria-pressed",String(state.filter==="encounter"));
    $("filter-sight").setAttribute("aria-pressed",String(state.filter==="sight"));
    for(const [id,{node}]of sightNodes){const selected=state.kind==="sight"&&state.id===id;node.dataset.selected=String(selected);node.setAttribute("aria-pressed",String(selected));const entry=listNodes.get(id);entry.button.hidden=state.filter!=="sight";entry.button.setAttribute("aria-pressed",String(selected));}
    for(const [id,{node,badge,photoBadge}] of mapNodes) {
      const kind=node.dataset.kind;
      const item=C.getLandmark(kind,id);
      const selected=state.kind===kind&&state.id===id;
      node.dataset.selected=String(selected);node.dataset.muted=String(state.filter!==kind);
      node.setAttribute("aria-pressed",String(selected));
      const done=kind==="nba"&&id==="warriors"&&complete;
      badge.setAttribute("visibility",done?"visible":"hidden");
      const photographed=kind==="nba"&&Boolean(album[item.arenaId]);
      photoBadge.setAttribute("visibility",photographed?"visible":"hidden");
      let status=kind==="encounter"?"探索地點・每日偶遇":courtStatus(id);
      if(kind==="nba"){
        const match=matchForTeam(id);
        node.dataset.state=match.state;node.dataset.glowing=String(match.glowing);
        status=`模擬${{idle:"無賽事",scheduled:"待開打",live:"進行中",final:"已完賽"}[match.state]}，${match.isHome?"本場主隊":"本場客隊"}${done?"，政策挑戰已完成":""}`;
        if(photographed)status+="，已收藏主場合影";
      }
      node.setAttribute("aria-label",`${item.name}${kind==="court"?"，"+item.gameName:""}，${item.region}，${status}`);
      const entry=listNodes.get(id);
      entry.button.hidden=kind!==state.filter||(kind==="nba"&&!matching.has(id));
      entry.button.setAttribute("aria-pressed",String(selected));
      entry.button.setAttribute("aria-label",`${item.name}${kind==="court"?"，"+item.gameName:""}，${status}`);
      entry.title.textContent=item.name+(done?" ✓":"");
      entry.details.textContent=(kind==="nba"?item.region:kind==="court"?item.gameName+"・"+status:status)+(photographed?"・合影已收藏":"");
    }
    renderMapTeamName();fanUI?.updateLocation(state);fanUI?.refreshGame();explorer?.refreshScene();explorer?.refreshEncounter();
  }
  function element(tag,className,text) {
    const node=document.createElement(tag);node.className=className;
    if(text!==undefined)node.textContent=String(text);
    return node;
  }
  function renderScoreboard(container,match) {
    const labels={idle:"今日無賽事",scheduled:"待開打",live:"LIVE",final:"完賽"};
    container.replaceChildren();container.dataset.state=match.state;
    const top=element("div","scoreboard-top");
    const status=element("span",match.state==="live"?"live-label":"",labels[match.state]+" ");
    status.append(element("span","demo-tag","模擬賽事"));
    top.append(status);top.append(element("span","",match.period||(match.state==="final"?"最終比分":"台灣時間")));
    container.append(top);
    if(match.state==="idle"){container.append(element("div","scoreboard-idle","今日無賽事，先逛逛這座島。"));return;}
    const rows=element("div","scoreboard-rows");
    for(const [side,team,score] of [["主隊",match.home,match.homeScore],["客隊",match.away,match.awayScore]]){
      const row=element("div","scoreboard-row"),name=element("strong","scoreboard-team"),copy=element("span","scoreboard-team-name",team.shortName+" ");
      copy.append(element("small","",team.abbr));name.append(L.create(team,{variant:"score",eager:true}),copy);
      row.append(element("span","side-label",side));row.append(name);row.append(element("b","",score===null?"—":score));rows.append(row);
    }
    container.append(rows);
    const footer=element("div","scoreboard-footer");
    if(match.state==="scheduled"){
      const time=element("time","",match.startTime);time.setAttribute("datetime",match.startTime);
      footer.append(time);footer.append(element("span",""," 開打（台灣時間 UTC+8）"));
    }else footer.textContent=match.state==="live"?`${match.period}・${match.home.shortName}主場亮燈中`:"比賽結束・最終比分保留";
    container.append(footer);
  }
  function renderPanel() {
    updatePanelVisibility();
    if(state.kind==="memory"){$("map-scoreboard").hidden=true;$("tour-map").dataset.policyOpen="false";return;}
    const item=C.getLandmark(state.kind,state.id);
    $("tour-map").dataset.policyOpen=String(state.kind==="nba"&&state.id==="warriors"&&policyOpen);
    $("panel-title").textContent=item.name;
    $("panel-category").textContent=`${C.TEAMS.find(t=>t.id===item.teamIslandId)?.shortName||item.region}島 / ${state.kind==="nba"?"NBA ARENA":state.kind==="court"?"PUBLIC COURT":state.kind==="sight"?"SCENIC VIEW":"ISLAND ENCOUNTER"}`;
    $("nba-panel").hidden=state.kind!=="nba";
    $("court-panel").hidden=state.kind!=="court";
    $("encounter-panel").hidden=state.kind!=="encounter";
    $("sight-panel").hidden=state.kind!=="sight";
    $("shop-panel").hidden=state.kind!=="shop";
    if(state.kind==="shop"){$("panel-category").textContent="球隊周邊 / TEAM SHOP";$("map-scoreboard").hidden=true;shopUI?.refreshEntrance();renderPolicyProgress();return;}
    if(state.kind==="nba"){
      const match=matchForTeam(item.id);
      L.mount($("team-badge"),item,{variant:"panel",eager:true});
      $("team-badge").style.setProperty("--team-color",item.color);
      $("team-badge").style.setProperty("--team-accent",item.accent);
      $("team-english").textContent=item.englishName;
      $("team-city").textContent=item.city||"待補";$("team-abbr").textContent=item.abbr;$("team-region").textContent=item.region;
      $("team-scene").textContent=item.cityScene;
      const station=F.getStation(item.id);$("team-venue").textContent=station?.venue||item.venue;$("team-representative").textContent=station?`${station.starName}（隊史球星）`:"本島先開放主場探索；球星合影尚未開放";
      $("find-star").disabled=!station;$("find-star").textContent=station?"進館找球星 ↗":"球星合影尚未開放";
      $("nba-shop-launch").hidden=!globalThis.NBAShop.getShop("shop-"+item.id);
      $("team-side").textContent=`${item.region}・${match.isHome?"本場主隊":"本場客隊（主場球館本場不亮燈）"}`;
      renderScoreboard($("team-game"),match);renderScoreboard($("map-scoreboard"),match);
      $("map-scoreboard").hidden=false;
      $("policy-launch").hidden=item.id!=="warriors";
      $("team-policy-status").hidden=item.id!=="warriors";
      $("other-team-note").hidden=item.id==="warriors";
      $("policy-challenge").hidden=item.id!=="warriors"||!policyOpen;
      $("policy-launch").setAttribute("aria-expanded",String(item.id==="warriors"&&policyOpen));
    }else if(state.kind==="court"){
      $("map-scoreboard").hidden=true;$("court-select").value=item.id;
      const rules=G.getGame(item.gameId);
      $("court-description").textContent=`${item.region}球場・${item.name}。${item.scene}。好友房間只在指定球場內加入。`;
      $("court-game-name").textContent=rules.name;$("court-game-instructions").textContent=`操作：${rules.instructions}`;$("court-game-win").textContent=`勝負：${rules.win}`;$("court-game-limit").textContent=`本局上限 ${rules.durationMs/1000} 秒；相同結果依規則顯示平手。${item.gameId==="duel"?"單人對手會明確標示為電腦。":"單人練習沒有對手或假玩家。"}`;
      $("practice-start").textContent=`單人練習｜${rules.name}`;$("friend-pk-title").textContent=`好友 PK｜${rules.name}`;
      $("court-activity").textContent=`真人房間：${courtStatus(item.id)}`;
      renderRoom();
    }else if(state.kind==="sight"){
      $("map-scoreboard").hidden=true;
      $("sight-image").src=$("island-map").dataset.theme==="night"?item.pixelNightAsset:item.pixelAsset;$("sight-image").alt=`${item.name}的原創斜俯視街景插畫`;
      $("sight-description").textContent=item.description;$("sight-access").textContent=item.photo?"已沿步道抵達觀景點。可用已儲存的球迷造型拍照與下載 PNG；景點照不計入主場或偶遇收藏。":"街景眺望・此處沒有開放步行入口；鏡頭查看地標，玩家保持原位。";$("sight-photo").hidden=!item.photo;
    }else{
      $("map-scoreboard").hidden=true;fanUI?.renderEncounterPanel(item.id);
    }
    renderPolicyProgress();
  }
  function openLandmark(kind,id,focus=true) {
    hoveredArena=null;focusedArena=null;
    if(kind!=="memory")memoryUI?.cancelNavigation();
    if(["practice","tutorial"].includes(gameMode)&&(kind!=="court"||id!==gameCourtId))leavePractice(false);
    if(gameMode==="online"&&(kind!=="court"||id!==gameCourtId)){stopGameTimer();stopSounds();$("play-court").hidden=true;}
    C.selectLandmark(state,kind,id);
    if(kind==="memory"){panelRequested=false;pendingPanelFocus=false;setDirectory(false);explorer?.visit(id);renderMapAndDirectory();renderPanel();return;}
    panelRequested=true;pendingPanelFocus=focus;setDirectory(false);
    const scenery=kind==="sight"&& !S.get(id).photo;
    if(scenery)explorer?.inspect(id);else explorer?.visit(id);
    renderMapAndDirectory();renderPanel();
    if(gameMode==="online"&&game&&kind==="court"&&id===gameCourtId){$("play-court").hidden=false;if(!gameFinished&&gameTimer===null){gameTimer=setInterval(tickGame,50);tickGame();}}
    if(focus&&(scenery||explorer?.hasArrived(id))){pendingPanelFocus=false;$("panel-title").focus();}
    announce(scenery?`眺望${S.get(id).name}；玩家位置未變。`:explorer?.hasArrived(id)?`已開啟${C.getLandmark(kind,id).name}資訊。`:`正沿步道前往${C.getLandmark(kind,id).name}，抵達後開啟資訊。`);
    if(kind==="court"&&onlineReady)refreshMyRooms();
  }
  function updatePanelVisibility(){const open=Boolean(panelRequested&&(state.kind==="sight"&&!S.get(state.id).photo||explorer?.hasArrived(state.id)));$("station-panel").hidden=!open;$("tour-map").dataset.panelOpen=String(open);}
  function closeStationPanel(back=true){panelRequested=false;pendingPanelFocus=false;updatePanelVisibility();if(back)explorer?.backToDistrict();}
  function setDirectory(open){$("station-directory").hidden=!open;$("toggle-directory").setAttribute("aria-expanded",String(open));}
  $("station-close").addEventListener("click",()=>{closeStationPanel();$("camera-back").focus();});
  $("toggle-directory").addEventListener("click",()=>{const open=$("station-directory").hidden;setDirectory(open);if(open)$("station-directory").scrollIntoView?.({block:"start",behavior:"auto"});});
  $("bay-fixture").addEventListener("change",()=>{bayFixture=$("bay-fixture").value==="home"?"home":"away";$("fixture-description").textContent=bayFixture==="home"?"勇士主場迎戰湖人；只有勇士在 LIVE 時脈動。十五場示範，非 NBA 即時賽況。":"勇士客場打湖人；只有湖人在 LIVE 時脈動。十五場示範，非 NBA 即時賽況。";renderMapAndDirectory();renderPanel();});
  function setFilter(kind) {state.filter=kind;renderMapAndDirectory();}
  $("filter-nba").addEventListener("click",()=>setFilter("nba"));
  $("filter-court").addEventListener("click",()=>setFilter("court"));
  $("filter-encounter").addEventListener("click",()=>setFilter("encounter"));
  $("filter-sight").addEventListener("click",()=>setFilter("sight"));
  $("team-search").addEventListener("input",()=>{teamQuery=$("team-search").value;renderMapAndDirectory();});
  $("team-search-form").addEventListener("submit",event=>{event.preventDefault();teamQuery=$("team-search").value;renderMapAndDirectory();});
  $("team-search-clear").addEventListener("click",()=>{teamQuery="";$("team-search").value="";renderMapAndDirectory();$("team-search").focus();});
  $("sight-photo").addEventListener("click",()=>{if(state.kind==="sight"&&explorer?.hasArrived(state.id))fanUI.openSight(state.id,$("island-map").dataset.theme);});
  $("quick-nba").addEventListener("click",()=>openLandmark("nba","warriors"));
  $("quick-courts").addEventListener("click",()=>openLandmark("court",C.COURTS[0].id));
  $("court-select").addEventListener("change",()=>openLandmark("court",$("court-select").value,false));
  document.querySelectorAll('input[name="game-state"]').forEach(input=>input.addEventListener("change",()=>{if(!input.checked)return;C.setGameState(state,input.value);renderMapAndDirectory();renderPanel();announce("模擬賽況已更新；政策與真人房間不受影響。");}));
  $("policy-launch").addEventListener("click",()=>{policyOpen=!policyOpen;renderPanel();if(policyOpen)$("policy-title").focus();});
  $("nba-shop-launch").addEventListener("click",()=>{const id="shop-"+state.id;if(state.kind==="nba"&&globalThis.NBAShop.getShop(id))openLandmark("shop",id);});
  $("policy-title").setAttribute("tabindex","-1");

  const policyElements = {
    form:$("policy-form"),options:document.querySelectorAll('input[name="policy-plan"]'),results:$("policy-results"),resultTitle:$("policy-result-title"),resultContent:$("policy-result-content"),confirm:$("confirm-policy"),retry:$("retry-policy"),comparison:$("policy-comparison"),comparisonRows:$("policy-comparison-rows"),completion:$("policy-completion-message"),storageMessage:$("policy-storage-message"),hint:$("policy-trial-hint"),announcement:$("policy-announcement")
  };
  function number(value) {
    return value.toLocaleString("zh-TW", { maximumFractionDigits: 2 });
  }

  function renderPolicyResult(result) {
    const container=policyElements.resultContent;container.replaceChildren();
    const expected = result.isExpected ? "（期望值）" : "";
    const outcome=element("p","policy-outcome",result.passed?"✓ 兩項目標皆通過":"✕ 尚未同時達到兩項目標");outcome.dataset.passed=String(result.passed);container.append(outcome);
    const metrics=element("dl","policy-metrics");
    for(const [label,value,unit,isExpected] of [[`學生入場${expected}`,result.students,"人",result.isExpected],[`一般球迷入場${expected}`,result.generalFans,"人",result.isExpected],["總入場人數",result.total,"人",false],["票房收入",result.revenue,"點",false]]){
      const group=element("div","");group.append(element("dt","",label));const amount=element("dd","");
      if(isExpected)amount.append(element("span","expected-prefix","平均"));
      amount.append(element("b","metric-number",number(value)));amount.append(element("span","",unit));group.append(amount);metrics.append(group);
    }
    container.append(metrics);
    const goals=element("ul","policy-goal-results");
    const studentVerdict=result.studentGoalMet?(result.isExpected?"期望值達到，單次不保證":"通過"):"未通過";
    for(const [met,text] of [[result.studentGoalMet,`學生至少 ${POLICY_CHALLENGE.goals.students} 人：${studentVerdict}`],[result.revenueGoalMet,`收入至少 ${number(POLICY_CHALLENGE.goals.revenue)} 點：${result.revenueGoalMet?"通過":"未通過"}`]]){
      const item=element("li","",`${met?"✓":"✕"} ${text}`);item.dataset.met=String(met);goals.append(item);
    }
    container.append(goals);container.append(element("p","policy-calculation",`計算：${result.formula}`));container.append(element("p","policy-tradeoff",`取捨：${result.tradeoff}`));
    if(result.isExpected)container.append(element("p","policy-expected-note",`這是入場期望值，不是一次隨機抽籤的結果。學生 ${POLICY_CHALLENGE.students.registered} × ${number(result.lotteryChance*100)}% = ${number(result.students)} 人，一般球迷 ${POLICY_CHALLENGE.generalFans.registered} × ${number(result.lotteryChance*100)}% = ${number(result.generalFans)} 人；單次學生人數可能高於或低於 ${number(result.students)} 人。總共仍售出 ${number(result.total)} 張票，收入固定 ${number(result.revenue)} 點。`));
  }

  function renderComparison(selectedPlan) {
    policyElements.comparisonRows.replaceChildren();
    for(const plan of POLICY_CHALLENGE.plans){
      const result = calculatePolicy(plan.id);
      const average = result.isExpected ? "平均 " : "";
      const expected = result.isExpected ? "（期望值）" : "";
      const row=element("tr","");row.dataset.current=String(plan.id===selectedPlan);
      const heading=element("th","",plan.name);heading.setAttribute("scope","row");
      if(plan.id===selectedPlan)heading.append(element("span","comparison-current","本次試算"));
      row.append(heading);
      for(const [label,text] of [["學生入場",`${average}${number(result.students)} 人${expected}`],["一般球迷入場",`${average}${number(result.generalFans)} 人${expected}`],["票房收入",`${number(result.revenue)} 點`],["是否達標",`${result.passed?"✓ 兩項通過":"✕ 未同時達標"}；學生${result.studentGoalMet?"✓":"✕"}／收入${result.revenueGoalMet?"✓":"✕"}`]]){
        const cell=element("td","",text);cell.dataset.label=label;row.append(cell);
      }
      policyElements.comparisonRows.append(row);
    }
  }


  function renderPolicyProgress(){
    const completed=policySession.getState().completedPlanId!==null;
    $("policy-progress-global").textContent=`已完成 ${completed?1:0}／1 個政策挑戰`;
    $("policy-progress-global").dataset.completed=String(completed);
    $("team-policy-status").textContent=completed?"✓ 勇士門票政策挑戰已完成":"勇士主場的第一個政策挑戰，等你決策。";
    const badge=mapNodes.get("warriors")?.badge;
    if(badge)badge.setAttribute("visibility",completed?"visible":"hidden");
    renderMapAndDirectory();
  }
  function renderPolicy() {
    const state = policySession.getState();
    policyElements.options.forEach((input) => { input.checked = input.value === state.selectedPlan; });
    policyElements.results.hidden = !state.result;
    $("policy-seat-map").hidden=!state.result;$("policy-seat-grid").replaceChildren();
    if(state.result){const allocation=globalThis.NBAPolicy.seatAllocation(state.result.planId);$("policy-seat-grid").setAttribute("aria-label",allocation.description);$("policy-seat-grid").dataset.expected=String(allocation.expected);
      for(const seat of allocation.seats){const cell=element("span",`${seat.type}-seat`,seat.type==="student"?"學":"普");cell.dataset.type=seat.type;cell.setAttribute("aria-hidden","true");$("policy-seat-grid").append(cell);}
      $("policy-seat-caption").textContent=allocation.description;$("seat-expected-label").hidden=!allocation.expected;}
    if (state.result) {
      policyElements.resultTitle.textContent = `${state.result.name}｜試算結果`;
      renderPolicyResult(state.result);
    } else {
      policyElements.resultContent.innerHTML = "";
    }
    const alreadyConfirmed = Boolean(state.result && state.completedPlanId === state.result.planId);
    policyElements.confirm.disabled = !state.result || alreadyConfirmed;
    policyElements.confirm.textContent = alreadyConfirmed ? "此決策已確認" : "確認決策";
    policyElements.comparison.hidden = !state.comparisonVisible;
    if (state.comparisonVisible) renderComparison(state.result?.planId);
    else policyElements.comparisonRows.replaceChildren();
    const selectedName = POLICY_CHALLENGE.plans.find((plan) => plan.id === state.selectedPlan)?.name;
    policyElements.hint.textContent = state.result ? "可比較三方案後確認決策，或重新試算。" : selectedName?`已選擇「${selectedName}」，請重新按「試算」查看結果。`:"本次選項與結果已清空。請選擇一個方案後試算；完成紀錄保留。";
    policyElements.completion.hidden = state.completedPlanId === null;
    if (state.completedPlanId !== null) {
      const confirmed = calculatePolicy(state.completedPlanId);
      policyElements.completion.textContent = `已完成 1／1 個政策挑戰｜已確認「${confirmed.name}」。${confirmed.passed ? "兩項目標皆通過。" : "此決策未同時達到兩項目標，仍可重新試算其他方案。"}`;
    }
    policyElements.storageMessage.hidden = state.storageAvailable;
    policyElements.storageMessage.textContent = state.storageAvailable ? "" : "此環境無法讀寫 localStorage，完成進度僅保留於本次頁面；重新整理後可能無法保留。";
    renderPolicyProgress();
  }

  policyElements.options.forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      policySession.selectPlan(input.value);
      renderPolicy();
      policyElements.announcement.textContent = "已更換方案，請重新按試算查看結果。";
    });
  });

  policyElements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = policySession.simulate();
    if(!result){policyElements.hint.textContent="請先選擇一個售票方案。";policyElements.options[0].focus();return;}
    renderPolicy();
    policyElements.announcement.textContent = `${result.name}：學生${result.isExpected ? "平均" : ""}${result.students}人，一般球迷${result.isExpected ? "平均" : ""}${result.generalFans}人，收入${result.revenue}點，${result.passed ? "兩項目標皆通過" : "未同時達到兩項目標"}。`;
    policyElements.resultTitle.focus();
  });

  policyElements.confirm.addEventListener("click", () => {
    if (!policySession.confirm()) return;
    renderPolicy();
    policyElements.announcement.textContent = "決策已確認。勇士站政策挑戰已完成，可回到地圖查看完成標記。";
    policyElements.completion.focus({ preventScroll: true });
  });

  policyElements.retry.addEventListener("click", () => {
    policySession.retry();
    renderPolicy();
    policyElements.announcement.textContent = "可重新選擇方案並試算；已完成進度不受影響。";
    const selected = Array.from(policyElements.options).find((input) => input.checked);
    (selected||policyElements.options[0]).focus();
  });
  policyElements.form.addEventListener("reset",event=>{
    event.preventDefault();policySession.reset();renderPolicy();
    policyElements.announcement.textContent="已重設本次選擇與結果，既有完成紀錄保留。";
    policyElements.options[0].focus();
  });


  function errorMessage(error){
    const messages={ALREADY_JOINED:"你已加入此房間，請從「我的房間」繼續。",ROOM_FULL:"房間已滿，最多只能兩位玩家。",ROOM_NOT_WAITING:"這個房間已開始或結束，不能再加入。",ROOM_EXPIRED:"房間已到期，請重新開房。",WRONG_COURT:"邀請碼屬於另一座球場，請使用完整加入連結。",ROOM_NOT_FOUND:"找不到這個邀請碼。",NOT_HOST:"只有房主能開始或重開對戰。",NOT_READY:"需要兩位玩家都就緒。",NOT_MEMBER:"你不是這個房間的玩家。",ROUND_MISMATCH:"局數已變更，不能提交舊局成績。",TOO_EARLY:"投籃時間尚未結束，請稍後重送。",SCORE_CLOSED:"本局成績已截止。",SCORE_ALREADY_SUBMITTED:"你的成績已提交，無法重複覆寫。",INVALID_SCORE:"成績格式無效。",TOO_MANY_ROOMS:"你已有五個未到期的房間，請先離開不需要的房間。"};
    Object.assign(messages,{GAME_SQL_REQUIRED:"請先手動套用 games-v2.sql 增量，才可使用專屬遊戲好友 PK。",GAME_OR_SEED_MISMATCH:"遊戲或共同種子已更新，請重新同步房間。",TURN_MISMATCH:"回合已更新，請重新選擇目前招式。",TURN_CLOSED:"本回合已截止。",MOVE_ALREADY_SUBMITTED:"本回合已鎖定，不能改招。",SERVER_RESULT_ONLY:"猜招結果由伺服器結算。"});
    return Object.entries(messages).find(([code])=>String(error.message).includes(code))?.[1]||"連線未完成。請檢查網路、Supabase 公開設定、匿名登入與 games-v2.sql 增量，再按重新連線。";
  }
  function renderConnection(){
    const label=!adapter.configured?(adapter.reason==="UNCONFIGURED"?"尚未配置":"設定無效"):onlineReady?"已連線":"尚未連線";
    $("connection-status").textContent=`真人連線：${label}`;
    $("online-badge").textContent=label;
    $("online-help").textContent=!adapter.configured?"尚未配置可用的 Supabase 公開連線，真人邀戰目前不可用；單機練習可直接使用。":onlineReady?"已連接真實房間資料。開房後把加入連結分享給朋友，不提供假玩家或自動填入對手。":"真人連線尚未成功，房間狀態待確認；可先單機練習或重新連線。";
    $("create-room").disabled=!onlineReady||onlineBusy;
    $("join-room").disabled=!onlineReady||onlineBusy;
    $("connection-retry").hidden=!adapter.configured||onlineReady;
  }
  function receiveRoom(snapshot){
    if(!snapshot?.room||!Array.isArray(snapshot.players))throw new Error("INVALID_ROOM_DATA");
    if(roomSnapshot?.room.id===snapshot.room.id&&(snapshot.room.round<roomSnapshot.room.round||(snapshot.room.round===roomSnapshot.room.round&&Date.parse(snapshot.server_now)<Date.parse(roomSnapshot.server_now))))return;
    roomSnapshot=snapshot;
    const serverTime=Date.parse(snapshot.server_now);
    if(Number.isFinite(serverTime))serverOffset=serverTime-Date.now();
    const room=snapshot.room;
    if(!room.game_id&&room.court_id!=="harbor-01")throw new Error("GAME_SQL_REQUIRED");
    const own=snapshot.players.find(p=>p.user_id===adapter.userId());
    if((room.status==="countdown"||room.status==="playing")&&own?.score===null&&state.kind==="court"&&state.id===room.court_id){
      if(gameMode!=="online"||gameRoomId!==room.id||gameRound!==room.round)startGame("online",room.court_id,Date.parse(room.starts_at),room.id,room.round,room.game_id||G.forCourt(room.court_id).id,room.game_seed??1);
    }else if(room.status==="waiting"&&gameMode==="online"&&gameRoomId===room.id&&gameRound!==room.round){
      stopGameTimer();game=null;gameMode=null;pendingScore=null;$("play-court").hidden=true;
    }
    if(room.status==="finished"&&lastResultToken!==`${room.id}:${room.round}`&&state.kind==="court"&&state.id===room.court_id)showOnlineResult(snapshot);
    if(room.status==="cancelled"&&gameMode==="online"&&gameRoomId===room.id){stopGameTimer();game=null;$("shoot-button").disabled=true;$("shot-feedback").textContent="房間已取消，本局不計勝負。";}
    renderRoom();
    if(gameMode==="online"&&game&&!gameFinished&&state.kind==="court"&&state.id===gameCourtId)tickGame();
  }
  function renderRoom(){
    const room=roomSnapshot?.room;
    $("room-panel").hidden=!room||state.kind!=="court"||room.court_id!==state.id;
    if(!room)return;
    const players=roomSnapshot.players;
    const own=players.find(p=>p.user_id===adapter.userId());
    const host=room.host_id===adapter.userId();
    const rules=G.getGame(room.game_id||G.forCourt(room.court_id).id);
    const labels={waiting:players.length<2?"等待對手（1／2）":`雙方準備中（${players.filter(p=>p.ready).length}／2 就緒）`,countdown:"兩人已就緒，倒數後同時開始。",playing:Date.now()+serverOffset>=Date.parse(room.ends_at)?"遊戲時間結束，等待雙方成績結算。":`對戰中：${rules.name}・共同種子 ${room.game_seed??"待更新 SQL"}`,finished:"本局已結束，可查看雙方結果。",cancelled:"房間已取消。"};
    $("room-state").textContent=`${onlineReady?"":"連線中斷，以下是上次同步狀態。"}第 ${room.round} 局・${labels[room.status]||room.status}`;
    $("room-invite-value").value=C.inviteURL(window.location.href,room.court_id,room.invite_code);
    $("room-players").innerHTML=players.map(player=>`<li>${escapeHTML(player.display_name)}${player.user_id===room.host_id?"（房主）":""}${player.user_id===adapter.userId()?"・你":""}<small>${player.result?G.describeResult(rules.id,player.result):player.score===null?(room.status==="finished"?"未提交成績":player.ready?"已就緒":"尚未就緒"):`命中 ${player.score} 球／出手 ${player.attempts} 次`}</small></li>`).join("")+(players.length<2?'<li>空位・等待朋友加入<small>此處沒有自動產生的玩家。</small></li>':"");
    $("ready-toggle").disabled=!onlineReady||onlineBusy||room.status!=="waiting";
    $("ready-toggle").textContent=own?.ready?"取消就緒":"準備好了";
    $("room-start").disabled=!onlineReady||onlineBusy||!host||room.status!=="waiting"||players.length!==2||!players.every(p=>p.ready);
    $("room-restart").hidden=!host||room.status!=="finished";
    $("room-restart").disabled=!onlineReady||onlineBusy;
    $("room-leave").disabled=!onlineReady||onlineBusy;
    $("resubmit-score").hidden=!pendingScore||pendingScore.roomId!==room.id||room.status==="finished"||room.status==="cancelled";
    $("resubmit-score").disabled=!onlineReady||scoreSubmitting;
  }
  async function refreshMyRooms(){
    if(!onlineReady||state.kind!=="court")return;
    const courtId=state.id;
    try{
      const rows=await adapter.myRooms(courtId);
      if(state.kind!=="court"||state.id!==courtId)return;
      $("my-rooms").hidden=false;$("my-rooms-list").replaceChildren();
      if(!rows.length){$("my-rooms-list").textContent="目前沒有你在這座球場的房間。";return;}
      for(const room of rows){const button=document.createElement("button");button.type="button";button.textContent=`第 ${room.round} 局・${room.status}・${room.invite_code.slice(0,6)}…`;button.addEventListener("click",()=>runRoomAction(()=>adapter.get(room.id)));$("my-rooms-list").append(button);}
    }catch(error){$("lobby-notice").textContent=errorMessage(error);}
  }
  async function syncOnline(){
    if(!adapter.configured||polling)return;
    polling=true;
    try{
      await adapter.connect();
      if(adapter.capabilities&&!onlineRulesVerified){try{const capabilities=await adapter.capabilities();if(capabilities.version!==2)throw new Error("GAME_SQL_REQUIRED");onlineRulesVerified=true;}catch(error){if(String(error.message).includes("nba_games_capabilities"))throw new Error("GAME_SQL_REQUIRED");throw error;}}
      const [rows,snapshot]=await Promise.all([adapter.activity(),roomSnapshot?adapter.get(roomSnapshot.room.id):Promise.resolve(null)]);
      activityRows=rows;onlineReady=true;
      if(snapshot)receiveRoom(snapshot);
      renderConnection();renderMapAndDirectory();if(state.kind==="court")$("court-activity").textContent=`真人房間：${courtStatus(state.id)}`;
      await refreshMyRooms();
    }catch(error){onlineReady=false;activityRows=null;renderConnection();renderRoom();renderMapAndDirectory();if(state.kind==="court")$("court-activity").textContent="真人房間：連線中斷，狀態待確認";$("lobby-notice").textContent=errorMessage(error);}
    finally{polling=false;}
  }
  function onlineRoundRunning(){return gameMode==="online"&&game&&["countdown","playing"].includes(game.tick(Date.now()+serverOffset).phase);}
  async function runRoomAction(action){
    if(!onlineReady||onlineBusy)return;
    onlineBusy=true;renderConnection();renderRoom();
    try{const snapshot=await action();if(snapshot?.room)receiveRoom(snapshot);$("lobby-notice").textContent="房間資料已同步。";await refreshMyRooms();}
    catch(error){$("lobby-notice").textContent=errorMessage(error);announce(errorMessage(error));}
    finally{onlineBusy=false;renderConnection();renderRoom();}
  }
  function playerName(){const name=$("player-name").value.trim();if(!name||Array.from(name).length>24){$("lobby-notice").textContent="請先輸入 1–24 個字的暱稱。";$("player-name").focus();return null;}return name;}
  $("room-form").addEventListener("submit",event=>{event.preventDefault();if(state.kind!=="court"||onlineRoundRunning())return;const name=playerName();if(name)runRoomAction(()=>adapter.create(state.id,name));});
  $("join-room").addEventListener("click",()=>{if(state.kind!=="court"||onlineRoundRunning())return;const name=playerName();const invite=$("invite-code").value.trim().toLowerCase();if(!/^[a-f0-9]{24}$/.test(invite)){$("lobby-notice").textContent="請輸入完整的 24 碼邀請碼。";return;}if(name)runRoomAction(()=>adapter.join(state.id,invite,name));});
  $("ready-toggle").addEventListener("click",()=>{audioUnlocked=true;if(!roomSnapshot)return;const own=roomSnapshot.players.find(p=>p.user_id===adapter.userId());const roomId=roomSnapshot.room.id;
    if(!own?.ready&&!practicedGames.has(C.getLandmark("court",state.id).gameId)){
      tutorialContinuation=()=>{if(roomSnapshot?.room.id===roomId&&state.kind==="court")runRoomAction(()=>adapter.ready(roomId,true));};startGame("tutorial",state.id,Date.now()+200);return;}
    runRoomAction(()=>adapter.ready(roomId,!own?.ready));});
  $("room-start").addEventListener("click",()=>{audioUnlocked=true;if(roomSnapshot)runRoomAction(()=>adapter.start(roomSnapshot.room.id));});
  $("room-restart").addEventListener("click",()=>roomSnapshot&&runRoomAction(()=>adapter.restart(roomSnapshot.room.id)));
  $("room-leave").addEventListener("click",()=>roomSnapshot&&runRoomAction(async()=>{await adapter.leave(roomSnapshot.room.id);roomSnapshot=null;pendingScore=null;if(gameMode==="online"){stopGameTimer();stopSounds();game=null;gameMode=null;$("play-court").hidden=true;}$("room-panel").hidden=true;return null;}));
  $("copy-invite").addEventListener("click",async()=>{try{if(!navigator.clipboard)throw new Error();await navigator.clipboard.writeText($("room-invite-value").value);$("lobby-notice").textContent="加入連結已複製，請自行分享給朋友。";}catch{$("room-invite-value").focus();$("room-invite-value").select();$("lobby-notice").textContent="請手動複製已選取的加入連結。";}});
  $("connection-retry").addEventListener("click",syncOnline);

  function stopSounds(){
    for(const id of ["sound-hit","sound-end"]){const audio=$(id);audio.pause();audio.currentTime=0;}
  }
  function playSound(id){
    if(!audioUnlocked||!$("sound-enabled").checked)return;
    const audio=$(id);
    audio.currentTime=0;
    const blocked=()=>{$("sound-status").textContent="音效未能播放，請切換音效開關再試；畫面回饋與計分仍有效。";};
    try{const playing=audio.play();if(playing?.catch)playing.catch(blocked);}catch{blocked();}
  }
  $("sound-enabled").addEventListener("change",()=>{
    audioUnlocked=true;
    $("sound-status").textContent=$("sound-enabled").checked?"音效開啟：命中與終場時播放。":"音效關閉，仍會顯示命中與終場文字。";
    if(!$("sound-enabled").checked)stopSounds();
  });
  function stopGameTimer(){if(gameTimer!==null){clearInterval(gameTimer);gameTimer=null;}}
  function leavePractice(focus=true){
    if(!["practice","tutorial"].includes(gameMode))return;
    stopGameTimer();stopSounds();game=null;gameMode=null;gameFinished=false;
    tutorialContinuation=null;$("tutorial-controls").hidden=true;
    $("shoot-button").disabled=true;$("play-court").hidden=true;
    if(focus){panelRequested=true;renderPanel();$("panel-title").focus();}
  }
  function startGame(mode,courtId,startsAt,roomId=null,round=null,selectedGame=null,seed=1){
    const court=C.getLandmark("court",courtId);gameId=selectedGame||court.gameId;
    stopGameTimer();stopSounds();game=mode==="tutorial"?globalThis.NBAPractice.createTutorial(gameId,{seed}):G.createGame(gameId,{seed,online:mode==="online"});game.start(startsAt);gameMode=mode;gameCourtId=courtId;gameRoomId=roomId;gameRound=round;gameFinished=false;pendingScore=null;
    if(mode!=="tutorial")tutorialContinuation=null;
    closeStationPanel(false);$("tutorial-controls").hidden=mode!=="tutorial";$("tutorial-begin").disabled=true;$("tutorial-feedback").textContent="不計分試玩，最多 12 秒。先試一次操作，或直接跳過。";
    $("game-stage").dataset.scene=court.type;
    $("game-stage").dataset.game=gameId;
    $("game-stage").setAttribute("aria-label",`${court.name}，${G.getGame(gameId).instructions}`);
    $("play-court").hidden=false;$("round-result").hidden=true;$("practice-fan-result").hidden=true;
    $("game-mode-label").textContent=mode==="tutorial"?"不計分操作試玩・不是正式對局":mode==="practice"?"單機練習・非真人連線":"好友 1 對 1・真人房間";
    $("shooting-title").textContent=`${court.name}｜${G.getGame(gameId).name}`;
    $("game-context").textContent=(mode==="practice"?`一秒後開始。${gameId==="duel"?"本次對手為電腦，非真人。":"沒有對手，也不會建立房間。"}`:`伺服器共同開始時間與種子 ${seed}；結果由本局雙方實際提交。`)+` ${G.getGame(gameId).win}`;
    if(mode==="tutorial")$("game-context").textContent=`先試操作，不計分、不送出成績。${gameId==="duel"?"這段試玩對手為電腦。":""}正式開始會重新倒數並歸零；好友房間會在你結束試玩並就緒後，由伺服器設定共同開始時間。`;
    $("game-steps").innerHTML=`<li>${escapeHTML(G.getGame(gameId).instructions)}</li><li>${escapeHTML(G.getGame(gameId).win)}</li><li>聚焦場景可用方向鍵、1／2／3、空白鍵；也可點下方按鈕。離場會停止本機遊戲。</li>`;
    $("practice-restart").hidden=mode!=="practice";
    $("practice-leave").hidden=!["practice","tutorial"].includes(mode);
    $("shot-feedback").textContent="準備好，找到你的投籃節奏。";
    gameTimer=setInterval(tickGame,50);tickGame();$("game-stage").focus();
  }
  function tickGame(){
    if(!game)return;
    const now=Date.now()+(gameMode==="online"?serverOffset:0);
    const snapshot=game.tick(now);
    const visibleSnapshot=miniSnapshot(snapshot);
    $("game-timer").textContent=(snapshot.remainingMs/1000).toFixed(1);
    $("game-hits").textContent=String(snapshot.id==="allround"?snapshot.hits:visibleSnapshot.score);$("game-attempts").textContent=String(snapshot.attempts);
    $("aim-cursor").style.left=`${(snapshot.child?.aim??snapshot.aim)*100}%`;
    miniUI.render(visibleSnapshot);
    if(gameMode==="tutorial"){
      $("game-rule-tag").textContent="不計分試玩｜最多 12 秒";
      $("game-hits").textContent="0";$("game-attempts").textContent="0";$("tutorial-begin").disabled=!(snapshot.interactions>0||snapshot.phase==="finished");
      if(snapshot.phase==="finished"){gameFinished=true;stopGameTimer();$("tutorial-feedback").textContent="試玩結束，沒有記錄成績。按正式開始會以完整規則重新開局。";}return;
    }
    const active=snapshot.child||snapshot;
    $("aim-description").textContent=snapshot.phase==="countdown"?`倒數 ${Math.ceil((snapshot.startsAt-now)/1000)} 秒`:!$("aim-meter").hidden?`瞄準 ${Math.round(active.aim*100)}%・抓準金色命中區`:"使用方向鍵、1／2／3 或場景下方按鈕。";
    if(snapshot.phase==="finished"&&!gameFinished){
      gameFinished=true;stopGameTimer();playSound("sound-end");$("shoot-button").disabled=true;$("shot-feedback").textContent="本局結束！停止計分。";
      if(gameMode==="practice"){
        $("round-result").hidden=false;$("round-result-title").textContent="單機練習結果";
        const r=snapshot.result,duel=gameId==="duel"?`電腦 ${r.pcScore} 分。${r.score===r.pcScore?"平手！":r.score>r.pcScore?"你獲勝！":"電腦獲勝。"}`:"沒有真人或模擬對手。";
        $("round-result-content").textContent=`${G.describeResult(gameId,r)}。${gameId==="shoot"?`你命中 ${r.hits} 球，出手 ${r.attempts} 次。`:""}這是單機練習。${duel}`;renderPracticeFan();announce("單機練習結束，結果已顯示。");
      }else if(gameId==="duel"){$("shot-feedback").textContent="回合已結束，等待伺服器依雙方招式結算。";}
      else{pendingScore={roomId:gameRoomId,round:gameRound,gameId,seed:snapshot.seed,result:snapshot.result,score:snapshot.hits,attempts:snapshot.attempts};submitLocalScore();}
    }
  }
  function miniSnapshot(snapshot){
    if(gameMode!=="online"||gameId!=="duel")return snapshot;
    const own=roomSnapshot?.players.find(p=>p.user_id===adapter.userId());
    return {...snapshot,score:roomSnapshot?.duel?.scores?.[(own?.slot||1)-1]||0,onlineDuel:{...(roomSnapshot?.duel||{}),players:roomSnapshot?.players||[],ownId:adapter.userId()}};
  }
  function renderPracticeFan(){
    const visible=Boolean(fanUI&&gameMode==="practice"&&gameFinished);
    $("practice-fan-result").hidden=!visible;
    if(visible){const avatar=fanUI.savedAvatar();$("practice-fan-avatar").innerHTML=fanUI.renderAvatar(avatar);$("practice-fan-caption").textContent=`${avatar.nickname}，這一局的努力收進你的球迷故事。`;}
  }
  function actGame(action){
    audioUnlocked=true;if(!game||gameFinished||state.kind!=="court"||state.id!==gameCourtId)return;
    if(gameMode==="online"&&gameId==="duel"){
      const turn=roomSnapshot?.duel?.turn,ownSubmitted=roomSnapshot?.duel?.submitted;
      if(action.type==="choose"&&Number.isInteger(turn)&&!ownSubmitted&&turn===Math.floor(Math.max(0,Date.now()+serverOffset-Date.parse(roomSnapshot.room.starts_at))/7000))runRoomAction(()=>adapter.choose(gameRoomId,gameRound,turn,Number(action.value)));
      return;
    }
    const result=game.act(action,Date.now()+(gameMode==="online"?serverOffset:0));
    if(gameMode==="tutorial"){$("tutorial-feedback").textContent=result.feedback;tickGame();return;}
    if(result.accepted){$("shot-feedback").textContent=gameId==="shoot"?(result.hit?"命中！＋1":"差一點，再抓準節奏。"):result.feedback;if(result.hit)playSound("sound-hit");}tickGame();
  }
  $("shoot-button").addEventListener("click",()=>actGame({type:"shoot"}));
  $("game-stage").addEventListener("keydown",event=>{if(event.target===$("game-stage"))miniUI.key(event);});
  $("practice-start").addEventListener("click",()=>{audioUnlocked=true;if(state.kind!=="court")return;if(roomSnapshot&&["countdown","playing"].includes(roomSnapshot.room.status)){$("lobby-notice").textContent="真人對局進行中，請先完成對局。";return;}tutorialContinuation=null;startGame(practicedGames.has(C.getLandmark("court",state.id).gameId)?"practice":"tutorial",state.id,Date.now()+1000);});
  function finishTutorial(){if(gameMode!=="tutorial")return;practicedGames.add(gameId);const continuation=tutorialContinuation,courtId=gameCourtId;tutorialContinuation=null;
    if(continuation){leavePractice(false);panelRequested=true;renderPanel();continuation();}else startGame("practice",courtId,Date.now()+1000);}
  $("tutorial-begin").addEventListener("click",finishTutorial);$("tutorial-skip").addEventListener("click",finishTutorial);
  $("practice-restart").addEventListener("click",()=>{audioUnlocked=true;if(gameMode==="practice")startGame("practice",gameCourtId,Date.now()+1000);});
  $("practice-leave").addEventListener("click",()=>leavePractice());
  async function submitLocalScore(){
    if(!pendingScore||scoreSubmitting)return;
    scoreSubmitting=true;renderRoom();
    try{const p=pendingScore;const snapshot=await(adapter.submitResult?adapter.submitResult(p.roomId,p.round,p.gameId,p.seed,p.result):adapter.submit(p.roomId,p.round,p.score,p.attempts));pendingScore=null;receiveRoom(snapshot);$("shot-feedback").textContent=snapshot.room.status==="finished"?"雙方成績已結算。":"你的成績已提交，等待雙方結果。";}
    catch(error){$("lobby-notice").textContent=errorMessage(error);$("shot-feedback").textContent="成績尚未送出，請在成績截止前按重送。";}
    finally{scoreSubmitting=false;renderRoom();}
  }
  $("resubmit-score").addEventListener("click",submitLocalScore);
  function showOnlineResult(snapshot){
    if(!gameFinished)playSound("sound-end");
    $("practice-fan-result").hidden=true;
    lastResultToken=`${snapshot.room.id}:${snapshot.room.round}`;
    game=null;gameMode="online";gameCourtId=snapshot.room.court_id;gameRoomId=snapshot.room.id;gameRound=snapshot.room.round;gameFinished=true;
    const own=snapshot.players.find(p=>p.user_id===adapter.userId());
    $("game-timer").textContent="0.0";$("game-hits").textContent=own?.score===null?"?":String(own?.score??0);$("game-attempts").textContent=own?.attempts===null?"?":String(own?.attempts??0);
    gameId=snapshot.room.game_id||"shoot";
    const seriesPoints=gameId==="allround"&&snapshot.players.length===2&&snapshot.players.every(p=>p.result)?G.eventPoints(snapshot.players[0].result,snapshot.players[1].result):null;
    const result=snapshot.outcome||(snapshot.players.some(p=>p.result)?G.resolvePlayers(gameId,snapshot.players):C.resolveScores(snapshot.players));const winner=snapshot.players.find(p=>p.user_id===result.winnerId);
    $("play-court").hidden=false;$("round-result").hidden=false;$("round-result-title").textContent=result.type==="draw"?"平手！下局再分高下。":result.type==="no-contest"?"雙方未提交，本局不計勝負。":`${winner?.display_name||"玩家"} 獲勝${result.type==="forfeit"?"（對方未提交）":""}`;
    $("round-result-content").innerHTML=`<div class="round-score-row">${snapshot.players.map((p,i)=>`<span>${escapeHTML(p.display_name)}：${p.result?G.describeResult(gameId,p.result):p.score===null?"未提交":`${p.score} 球`}${seriesPoints?`・場勝分 ${seriesPoints[i]}`:""}</span>`).join("")}</div><p>${gameId==="allround"?"三項分別比較：勝者得 1 場勝分，平手各得 0.5；三項加總決勝。":""}本結果來自這個房間的雙方實際提交，沒有模擬玩家。由房主按「再來一局」後，雙方須重新就緒。</p>`;
    $("game-mode-label").textContent="好友 1 對 1・真人對局結果";
    $("shooting-title").textContent=`${C.getLandmark("court",snapshot.room.court_id).name}｜第 ${snapshot.room.round} 局`;
    $("shoot-button").disabled=true;$("practice-restart").hidden=true;
    $("practice-leave").hidden=true;
    stopGameTimer();pendingScore=null;
  }

  buildLandmarks();
  buildSights();
  memoryUI=globalThis.NBAMemoryUI.initialize({storage,onNavigate:id=>openLandmark("memory",id),onFocus:id=>explorer?.focusOnly(id),onAnnounce:announce});
  shopUI=globalThis.NBAShopUI.initialize({storage,config:globalThis.NBA_SHOP_CONFIG,getSelection:()=>state,hasArrived:id=>Boolean(explorer?.hasArrived(id)),onVisit:id=>openLandmark("shop",id),onFocus:id=>explorer?.focusOnly(id),onAnnounce:announce});
  fanUI=globalThis.NBAFanUI.initializeFan({storage,getSelection:()=>state,getGameState:()=>state.gameState,getEncounter:currentEncounter,getBayFixture:()=>bayFixture,onContinue:()=>closeStationPanel(),
    getPlayerPosition:()=>explorer?.position(),hasArrived:id=>explorer?explorer.hasArrived(id):state.id===id,
    onReveal:()=>explorer?.refreshEncounter(),
    onVisit:(id,kind="nba")=>openLandmark(kind,id),onChange:()=>{renderMapAndDirectory();renderPracticeFan();}});
  let lastArrivalContext="";
  explorer=globalThis.NBAExplorerUI.initialize({getSelection:()=>state,getGameState:()=>state.gameState,getEncounter:currentEncounter,getBayFixture:()=>bayFixture,onView:camera=>{memoryUI.observeView(camera);shopUI.observeView(camera);if(camera.level!=="venue")closeStationPanel(false);},
    onPosition:(position,walker)=>{memoryUI.observePosition(position,walker);shopUI.refreshEntrance();fanUI.updateLocation();const key=`${state.kind}:${state.id}:${explorer?.hasArrived(state.id)}`;
      if(key!==lastArrivalContext){if(state.kind==="encounter")fanUI.renderEncounterPanel(state.id);if(explorer?.hasArrived(state.id)&&panelRequested){renderPanel();if(pendingPanelFocus){pendingPanelFocus=false;$("panel-title").focus();}}}lastArrivalContext=key;},onAnnounce:announce});
  // 初始化期間 explorer 尚未賦值；再以行走模型的初始座標渲染一次。
  fanUI.updateLocation();
  function refreshEncounterDay(){const date=currentEncounter().date;if(date!==lastEncounterDate){lastEncounterDate=date;if(state.kind==="encounter")fanUI.renderEncounterPanel(state.id);fanUI.refreshGame();explorer?.refreshEncounter();}}
  $("encounter-test-controls").hidden=!encounterConfig.canTest;
  $("encounter-test-date").value=encounterConfig.date;
  function renderTestDate(){ $("encounter-test-status").textContent=encounterDateOverride?`本機測試日期：${encounterDateOverride}。公開網址忽略此設定。`:"目前依台灣當日日期；測試控制只在本機可用。"; }
  function saveTestDateURL(){if(!encounterConfig.canTest)return;const url=new URL(window.location.href);if(encounterDateOverride)url.searchParams.set("encounterDate",encounterDateOverride);else url.searchParams.delete("encounterDate");try{window.history?.replaceState(null,"",url.href);}catch{/* 可手動使用文件中的本機測試網址。 */}}
  $("encounter-test-controls").addEventListener("submit",event=>{event.preventDefault();if(!encounterConfig.canTest)return;const date=$("encounter-test-date").value;if(!F.validDateKey(date)){$("encounter-test-status").textContent="請輸入有效日期。";return;}encounterDateOverride=date;refreshEncounterDay();renderTestDate();saveTestDateURL();});
  $("encounter-test-reset").addEventListener("click",()=>{if(!encounterConfig.canTest)return;encounterDateOverride=null;$("encounter-test-date").value=F.taiwanDate(Date.now());refreshEncounterDay();renderTestDate();saveTestDateURL();});
  renderTestDate();refreshEncounterDay();encounterTimer=setInterval(refreshEncounterDay,30000);
  renderMapAndDirectory();renderPanel();renderPolicy();renderConnection();
  const invitation=C.parseInvite(window.location.href);
  if(invitation){openLandmark("court",invitation.courtId,false);$("invite-code").value=invitation.invite;$("lobby-notice").textContent="已定位朋友指定的球場；連線後輸入暱稱，按加入朋友房間。";}
  if(adapter.configured){syncOnline();onlineTimer=setInterval(syncOnline,2000);}
  window.addEventListener("pagehide",()=>{stopGameTimer();stopSounds();if(encounterTimer!==null){clearInterval(encounterTimer);encounterTimer=null;}if(onlineTimer!==null){clearInterval(onlineTimer);onlineTimer=null;}});
  window.addEventListener("pageshow",event=>{if(event.persisted){refreshEncounterDay();if(encounterTimer===null)encounterTimer=setInterval(refreshEncounterDay,30000);if(game&&!gameFinished&&state.kind==="court"&&state.id===gameCourtId){gameTimer=setInterval(tickGame,50);tickGame();}if(adapter.configured&&onlineTimer===null){syncOnline();onlineTimer=setInterval(syncOnline,2000);}}});
}

if(typeof module!=="undefined"&&module.exports){module.exports={...require("./assets/island-core.js"),...require("./assets/policy-core.js")};}
else if(typeof document!=="undefined")initializeIsland();
