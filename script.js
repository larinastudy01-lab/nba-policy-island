"use strict";

function initializeIsland() {
  const C = globalThis.NBAIsland;
  const { POLICY_CHALLENGE, calculatePolicy, createPolicySession } = globalThis.NBAPolicy;
  const $ = (id) => document.getElementById(id);
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const announce = (message) => { $("live-announcement").textContent = message; };
  let storage = null;
  try { storage = window.localStorage; } catch { /* 保留單次頁面功能。 */ }
  const policySession = createPolicySession(storage);
  const state = C.createIslandState();
  let fanUI = null;
  const adapter = globalThis.NBAOnline.createSupabaseAdapter(globalThis.NBA_SUPABASE_CONFIG, {storage});
  const mapNodes = new Map();
  const listNodes = new Map();
  let policyOpen = false;
  let onlineReady = false;
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
  const ns = "http://www.w3.org/2000/svg";

  function arenaGraphic(team) {
    return `<ellipse class="arena-halo" cy="-12" rx="73" ry="43"/><ellipse cy="17" rx="62" ry="23" fill="#0a2539" opacity=".5"/><path d="M-55-28 0 2V27L-55-3Z" fill="#536c7b"/><path d="M0 2 55-28V-3L0 27Z" fill="#274456"/><path d="M-55-28 0-58 55-28 0 2Z" fill="${team.color}" stroke="${team.accent}" stroke-width="1.5"/><path d="M-42-29 0-51 42-29 0-7ZM-24-40 24-15M-24-15 24-40" fill="none" stroke="#ffffff25"/><path class="arena-rim" d="M-55-28 0 2 55-28" fill="none" stroke="#9aabb1"/><path d="M-44-10v9m10-4v9m10-4v9m45-7v9m12-15v9m12-16v9" stroke="#f3dc8b99" stroke-width="2"/><text class="roof-text" y="-23">${team.abbr}</text><text class="landmark-label" y="47">${escapeHTML(team.shortName)}主場</text><ellipse class="selection-ring" cy="-9" rx="77" ry="53"/><rect class="hit-area" x="-76" y="-65" width="152" height="118"/>`;
  }
  function courtGraphic(court) {
    const depth = court.type === "roof" ? 25 : 7;
    return `<ellipse cy="17" rx="43" ry="18" fill="#0a2539" opacity=".45"/><path d="M-43-18 0 4 43-18V${depth-16}L0 ${depth+5} -43 ${depth-16}Z" fill="${court.type === "roof" ? "#52677b" : "#355d56"}"/><g transform="matrix(1 .5 -1 .5 0 -18)"><rect x="-26" y="-17" width="52" height="34" fill="${court.color}" stroke="#e0e3ca"/><path d="M0-17v34M-26-7h12V7h-12M26-7H14V7h12" fill="none" stroke="#e0e3ca" stroke-width=".8"/><circle r="6" fill="none" stroke="#e0e3ca" stroke-width=".8"/></g><path d="M-29-23v-18m58 18v-18" stroke="#b9d0cf" stroke-width="1.8"/><path d="m-36-42 14 0m0 3-14 0m51-3h14m0 3H22" stroke="#ecded1" stroke-width="2"/><ellipse cx="-29" cy="-35" rx="5" ry="2" fill="none" stroke="#f3c45b"/><ellipse cx="29" cy="-35" rx="5" ry="2" fill="none" stroke="#f3c45b"/><text class="landmark-label court-label" y="${depth+23}">${escapeHTML(court.name)}</text><ellipse class="selection-ring" cy="-8" rx="49" ry="37"/><rect class="hit-area" x="-50" y="-48" width="100" height="${depth+83}"/>`;
  }
  function buildLandmarks() {
    for (const [kind,items] of [["nba",C.TEAMS],["court",C.COURTS]]) {
      for (const item of items) {
        const node = document.createElement("button");
        node.type = "button";
        node.id = `landmark-${item.id}`;
        node.classList.add("landmark");
        node.dataset.kind = kind;
        // 和 1200×800 島圖共用座標：建築、標籤、按鈕命中範圍一起縮放。
        const frame=kind==="nba"?{x:80,y:68,w:160,h:132}:{x:55,y:52,w:110,h:114};
        node.style.left=`${(item.x-frame.x)/1200*100}%`;
        node.style.top=`${(item.y-frame.y)/800*100}%`;
        node.style.width=`${frame.w/1200*100}%`;
        node.style.height=`${frame.h/800*100}%`;
        node.style.zIndex=String(Math.round(item.y));
        node.dataset.x=String(item.x);node.dataset.y=String(item.y);
        node.setAttribute("tabindex","0");
        node.setAttribute("role","button");
        node.setAttribute("aria-controls","station-panel");
        node.style.setProperty("--team-accent",item.accent || "#f3c45b");
        const graphic=document.createElementNS(ns,"svg");
        graphic.setAttribute("viewBox",`${-frame.x} ${-frame.y} ${frame.w} ${frame.h}`);
        graphic.setAttribute("aria-hidden","true");
        graphic.innerHTML = kind === "nba" ? arenaGraphic(item) : courtGraphic(item);
        const badge = document.createElementNS(ns,"text");
        badge.classList.add("complete-label");
        badge.setAttribute("x","52"); badge.setAttribute("y","-43");
        badge.setAttribute("aria-hidden","true");badge.textContent="✓";
        const photoBadge = document.createElementNS(ns,"g");photoBadge.classList.add("photo-badge");
        photoBadge.setAttribute("aria-hidden","true");photoBadge.setAttribute("transform","translate(-58 -47)");
        photoBadge.innerHTML='<rect class="photo-badge-bg" x="-11" y="-10" width="22" height="20" rx="5"/><path class="photo-badge-icon" d="M-7-4h4l2-3h4l2 3h3v10H-7Z"/><circle class="photo-badge-icon" r="3" cy="1"/>';
        photoBadge.setAttribute("visibility","hidden");
        graphic.append(photoBadge);graphic.append(badge);node.append(graphic);
        node.addEventListener("click",()=>openLandmark(kind,item.id));
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
        listNodes.set(item.id,{button,kind,item});
        if(kind==="court"){
          const option=document.createElement("option");option.value=item.id;option.textContent=item.name;
          $(`court-group-${item.type}`).append(option);
        }
      }
    }
  }
  function courtStatus(id) {
    const activity = C.courtActivity(activityRows,id);
    if(activity === null)return adapter.configured ? "狀態待連線確認" : "真人連線未配置";
    return activity.waiting || activity.preparing || activity.playing ? `等待對手 ${activity.waiting} 房 · 準備中 ${activity.preparing} 房 · 對戰中 ${activity.playing} 房` : "目前無等待或對戰中的房間";
  }
  function renderMapAndDirectory() {
    const complete = policySession.getState().completedPlanId !== null;
    const album = fanUI?.getState().album || {};
    $("open-team-count").textContent=`${C.TEAMS.length}／30`;
    $("filter-nba").setAttribute("aria-pressed",String(state.filter==="nba"));
    $("filter-court").setAttribute("aria-pressed",String(state.filter==="court"));
    for(const [id,{node,badge,photoBadge}] of mapNodes) {
      const kind=node.dataset.kind;
      const item=C.getLandmark(kind,id);
      const selected=state.kind===kind&&state.id===id;
      node.dataset.selected=String(selected);node.dataset.muted=String(state.filter!==kind);
      node.setAttribute("aria-pressed",String(selected));
      const done=kind==="nba"&&id==="warriors"&&complete;
      badge.setAttribute("visibility",done?"visible":"hidden");
      const photographed=kind==="nba"&&Boolean(album[id]);
      photoBadge.setAttribute("visibility",photographed?"visible":"hidden");
      let status=courtStatus(id);
      if(kind==="nba"){
        const match=C.gameForTeam(id,state.gameState);
        node.dataset.state=match.state;node.dataset.glowing=String(match.glowing);
        status=`模擬${{idle:"無賽事",scheduled:"待開打",live:"進行中",final:"已完賽"}[match.state]}，${match.isHome?"本場主隊":"本場客隊"}${done?"，政策挑戰已完成":""}`;
        if(photographed)status+="，已收藏主場合影";
      }
      node.setAttribute("aria-label",`${item.name}，${item.region}，${status}`);
      const entry=listNodes.get(id);
      entry.button.hidden=kind!==state.filter;
      entry.button.setAttribute("aria-pressed",String(selected));
      entry.button.setAttribute("aria-label",`${item.name}，${status}`);
      entry.button.innerHTML=`<span class="list-symbol" aria-hidden="true">${kind==="nba"?item.abbr:item.type==="harbor"?"港邊":item.type==="park"?"公園":"屋頂"}</span><span class="list-copy"><strong>${escapeHTML(item.name)}${done?" ✓":""}</strong><small>${escapeHTML(kind==="nba"?item.region:status)}${photographed?"・合影已收藏":""}</small></span>`;
    }
    fanUI?.updateLocation(state);fanUI?.refreshGame();
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
      const row=element("div","scoreboard-row");const name=element("strong","",team.shortName+" ");
      name.append(element("small","",team.abbr));row.append(element("span","side-label",side));row.append(name);row.append(element("b","",score===null?"—":score));rows.append(row);
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
    const item=C.getLandmark(state.kind,state.id);
    $("tour-map").dataset.policyOpen=String(state.kind==="nba"&&state.id==="warriors"&&policyOpen);
    $("panel-title").textContent=item.name;
    $("panel-category").textContent=`${item.region} / ${state.kind==="nba"?"NBA ARENA":"PUBLIC COURT"}`;
    $("nba-panel").hidden=state.kind!=="nba";
    $("court-panel").hidden=state.kind!=="court";
    if(state.kind==="nba"){
      const match=C.gameForTeam(item.id,state.gameState);
      $("team-badge").textContent=item.abbr;
      $("team-badge").style.setProperty("--team-color",item.color);
      $("team-badge").style.setProperty("--team-accent",item.accent);
      $("team-english").textContent=item.englishName;
      $("team-city").textContent=item.city||"待補";$("team-abbr").textContent=item.abbr;$("team-region").textContent=item.region;
      $("team-side").textContent=`${item.region}・${match.isHome?"本場主隊":"本場客隊（主場球館本場不亮燈）"}`;
      renderScoreboard($("team-game"),match);renderScoreboard($("map-scoreboard"),match);
      $("map-scoreboard").hidden=false;
      $("policy-launch").hidden=item.id!=="warriors";
      $("team-policy-status").hidden=item.id!=="warriors";
      $("other-team-note").hidden=item.id==="warriors";
      $("policy-challenge").hidden=item.id!=="warriors"||!policyOpen;
      $("policy-launch").setAttribute("aria-expanded",String(item.id==="warriors"&&policyOpen));
    }else{
      $("map-scoreboard").hidden=true;$("court-select").value=item.id;
      $("court-description").textContent=`${item.region}球場・${item.name}。${item.scene}；和其他 14 座球場共用 30 秒投籃規則。好友房間只在指定球場內加入。`;
      $("court-activity").textContent=`真人房間：${courtStatus(item.id)}`;
      renderRoom();
    }
    renderPolicyProgress();
  }
  function openLandmark(kind,id,focus=true) {
    if(gameMode==="practice"&&(kind!=="court"||id!==gameCourtId))leavePractice(false);
    C.selectLandmark(state,kind,id);
    renderMapAndDirectory();renderPanel();
    if(focus)$("panel-title").focus();
    announce(`已開啟${C.getLandmark(kind,id).name}${kind==="nba"?"主場":"球場"}面板。`);
    if(kind==="court"&&onlineReady)refreshMyRooms();
  }
  function setFilter(kind) {state.filter=kind;renderMapAndDirectory();}
  $("filter-nba").addEventListener("click",()=>setFilter("nba"));
  $("filter-court").addEventListener("click",()=>setFilter("court"));
  $("quick-nba").addEventListener("click",()=>openLandmark("nba","warriors"));
  $("quick-courts").addEventListener("click",()=>openLandmark("court",C.COURTS[0].id));
  $("court-select").addEventListener("change",()=>openLandmark("court",$("court-select").value,false));
  document.querySelectorAll('input[name="game-state"]').forEach(input=>input.addEventListener("change",()=>{if(!input.checked)return;C.setGameState(state,input.value);renderMapAndDirectory();renderPanel();announce("模擬賽況已更新；政策與真人房間不受影響。");}));
  $("policy-launch").addEventListener("click",()=>{policyOpen=!policyOpen;renderPanel();if(policyOpen)$("policy-title").focus();});
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
    return Object.entries(messages).find(([code])=>String(error.message).includes(code))?.[1]||"連線未完成。請檢查網路、Supabase 公開設定、匿名登入與 SQL，再按重新連線。";
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
    roomSnapshot=snapshot;
    const serverTime=Date.parse(snapshot.server_now);
    if(Number.isFinite(serverTime))serverOffset=serverTime-Date.now();
    const room=snapshot.room;
    const own=snapshot.players.find(p=>p.user_id===adapter.userId());
    if((room.status==="countdown"||room.status==="playing")&&own?.score===null){
      if(gameMode!=="online"||gameRoomId!==room.id||gameRound!==room.round)startGame("online",room.court_id,Date.parse(room.starts_at),room.id,room.round);
    }else if(room.status==="waiting"&&gameMode==="online"&&gameRoomId===room.id&&gameRound!==room.round){
      stopGameTimer();game=null;gameMode=null;pendingScore=null;$("play-court").hidden=true;
    }
    if(room.status==="finished"&&lastResultToken!==`${room.id}:${room.round}`)showOnlineResult(snapshot);
    if(room.status==="cancelled"&&gameMode==="online"&&gameRoomId===room.id){stopGameTimer();game=null;$("shoot-button").disabled=true;$("shot-feedback").textContent="房間已取消，本局不計勝負。";}
    renderRoom();
  }
  function renderRoom(){
    const room=roomSnapshot?.room;
    $("room-panel").hidden=!room||state.kind!=="court"||room.court_id!==state.id;
    if(!room)return;
    const players=roomSnapshot.players;
    const own=players.find(p=>p.user_id===adapter.userId());
    const host=room.host_id===adapter.userId();
    const labels={waiting:players.length<2?"等待對手（1／2）":`雙方準備中（${players.filter(p=>p.ready).length}／2 就緒）`,countdown:"兩人已就緒，倒數後同時開始。",playing:Date.now()+serverOffset>=Date.parse(room.ends_at)?"投籃時間結束，等待雙方成績結算。":"對戰中，雙方各自投籃 30 秒。",finished:"本局已結束，可查看雙方結果。",cancelled:"房間已取消。"};
    $("room-state").textContent=`${onlineReady?"":"連線中斷，以下是上次同步狀態。"}第 ${room.round} 局・${labels[room.status]||room.status}`;
    $("room-invite-value").value=C.inviteURL(window.location.href,room.court_id,room.invite_code);
    $("room-players").innerHTML=players.map(player=>`<li>${escapeHTML(player.display_name)}${player.user_id===room.host_id?"（房主）":""}${player.user_id===adapter.userId()?"・你":""}<small>${player.score===null?(room.status==="finished"?"未提交成績":player.ready?"已就緒":"尚未就緒"):`命中 ${player.score} 球／出手 ${player.attempts} 次`}</small></li>`).join("")+(players.length<2?'<li>空位・等待朋友加入<small>此處沒有自動產生的玩家。</small></li>':"");
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
  $("ready-toggle").addEventListener("click",()=>{audioUnlocked=true;if(!roomSnapshot)return;const own=roomSnapshot.players.find(p=>p.user_id===adapter.userId());runRoomAction(()=>adapter.ready(roomSnapshot.room.id,!own?.ready));});
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
    if(gameMode!=="practice")return;
    stopGameTimer();stopSounds();game=null;gameMode=null;gameFinished=false;
    $("shoot-button").disabled=true;$("play-court").hidden=true;
    if(focus)$("panel-title").focus();
  }
  function startGame(mode,courtId,startsAt,roomId=null,round=null){
    stopGameTimer();stopSounds();game=C.createShootingGame();game.start(startsAt);gameMode=mode;gameCourtId=courtId;gameRoomId=roomId;gameRound=round;gameFinished=false;pendingScore=null;
    const court=C.getLandmark("court",courtId);
    $("game-stage").dataset.scene=court.type;
    $("game-stage").setAttribute("aria-label",`${court.name}，${court.scene}；按空白鍵出手`);
    $("play-court").hidden=false;$("round-result").hidden=true;$("practice-fan-result").hidden=true;
    $("game-mode-label").textContent=mode==="practice"?"單機練習・非真人連線":"好友 1 對 1・真人房間";
    $("shooting-title").textContent=`${C.getLandmark("court",courtId).name}｜投籃挑戰`;
    $("game-context").textContent=mode==="practice"?"一秒後開始。每次出手間隔至少 0.5 秒；沒有對手，也不會建立房間。":"以伺服器開始時間同步，倒數後雙方各投 30 秒；對手成績會在結算時顯示。";
    $("practice-restart").hidden=mode!=="practice";
    $("practice-leave").hidden=mode!=="practice";
    $("shot-feedback").textContent="準備好，找到你的投籃節奏。";
    gameTimer=setInterval(tickGame,50);tickGame();$("game-stage").focus();
  }
  function tickGame(){
    if(!game)return;
    const now=Date.now()+(gameMode==="online"?serverOffset:0);
    const snapshot=game.tick(now);
    $("game-timer").textContent=(snapshot.remainingMs/1000).toFixed(1);
    $("game-hits").textContent=String(snapshot.hits);$("game-attempts").textContent=String(snapshot.attempts);
    $("aim-cursor").style.left=`${snapshot.aim*100}%`;
    $("shoot-button").disabled=snapshot.phase!=="playing";
    $("aim-description").textContent=snapshot.phase==="countdown"?`倒數 ${Math.ceil((snapshot.startsAt-now)/1000)} 秒`:`瞄準 ${Math.round(snapshot.aim*100)}%・金色命中區為 36%–64%`;
    if(snapshot.phase==="finished"&&!gameFinished){gameFinished=true;stopGameTimer();playSound("sound-end");$("shoot-button").disabled=true;$("shot-feedback").textContent="時間到！停止出手。";if(gameMode==="practice"){$("round-result").hidden=false;$("round-result-title").textContent="單機練習結果";$("round-result-content").textContent=`你命中 ${snapshot.hits} 球，出手 ${snapshot.attempts} 次。這是單機練習，沒有真人或模擬對手。`;renderPracticeFan();announce("單機練習時間到，結果已顯示。");}else{pendingScore={roomId:gameRoomId,round:gameRound,score:snapshot.hits,attempts:snapshot.attempts};submitLocalScore();}}
  }
  function renderPracticeFan(){
    const visible=Boolean(fanUI&&gameMode==="practice"&&gameFinished);
    $("practice-fan-result").hidden=!visible;
    if(visible){const avatar=fanUI.savedAvatar();$("practice-fan-avatar").innerHTML=fanUI.renderAvatar(avatar);$("practice-fan-caption").textContent=`${avatar.nickname}，這一局的努力收進你的球迷故事。`;}
  }
  function shoot(){audioUnlocked=true;if(!game)return;const result=game.shoot(Date.now()+(gameMode==="online"?serverOffset:0));if(result.accepted){$("shot-feedback").textContent=result.hit?"命中！＋1":"差一點，再抓準節奏。";if(result.hit)playSound("sound-hit");}tickGame();}
  $("shoot-button").addEventListener("click",shoot);
  $("game-stage").addEventListener("keydown",event=>{if((event.code==="Space"||event.key===" ")&&event.target===$("game-stage")){event.preventDefault();if(!event.repeat)shoot();}});
  $("practice-start").addEventListener("click",()=>{audioUnlocked=true;if(state.kind!=="court")return;if(roomSnapshot&&["countdown","playing"].includes(roomSnapshot.room.status)){$("lobby-notice").textContent="真人對局進行中，請先完成對局。";return;}startGame("practice",state.id,Date.now()+1000);});
  $("practice-restart").addEventListener("click",()=>{audioUnlocked=true;if(gameMode==="practice")startGame("practice",gameCourtId,Date.now()+1000);});
  $("practice-leave").addEventListener("click",()=>leavePractice());
  async function submitLocalScore(){
    if(!pendingScore||scoreSubmitting)return;
    scoreSubmitting=true;renderRoom();
    try{const p=pendingScore;const snapshot=await adapter.submit(p.roomId,p.round,p.score,p.attempts);pendingScore=null;receiveRoom(snapshot);$("shot-feedback").textContent=snapshot.room.status==="finished"?"雙方成績已結算。":"你的成績已提交，等待雙方結果。";}
    catch(error){$("lobby-notice").textContent=errorMessage(error);$("shot-feedback").textContent="成績尚未送出，請在成績截止前按重送。";}
    finally{scoreSubmitting=false;renderRoom();}
  }
  $("resubmit-score").addEventListener("click",submitLocalScore);
  function showOnlineResult(snapshot){
    $("practice-fan-result").hidden=true;
    lastResultToken=`${snapshot.room.id}:${snapshot.room.round}`;
    game=null;gameMode="online";gameCourtId=snapshot.room.court_id;gameRoomId=snapshot.room.id;gameRound=snapshot.room.round;gameFinished=true;
    const own=snapshot.players.find(p=>p.user_id===adapter.userId());
    $("game-timer").textContent="0.0";$("game-hits").textContent=own?.score===null?"?":String(own?.score??0);$("game-attempts").textContent=own?.attempts===null?"?":String(own?.attempts??0);
    const result=C.resolveScores(snapshot.players);const winner=snapshot.players.find(p=>p.user_id===result.winnerId);
    $("play-court").hidden=false;$("round-result").hidden=false;$("round-result-title").textContent=result.type==="draw"?"平手！下局再分高下。":result.type==="no-contest"?"雙方未提交，本局不計勝負。":`${winner?.display_name||"玩家"} 獲勝${result.type==="forfeit"?"（對方未提交）":""}`;
    $("round-result-content").innerHTML=`<div class="round-score-row">${snapshot.players.map(p=>`<span>${escapeHTML(p.display_name)}：${p.score===null?"未提交":`${p.score} 球`}</span>`).join("")}</div><p>本結果來自這個房間的雙方實際提交，沒有模擬玩家。由房主按「再來一局」後，雙方須重新就緒。</p>`;
    $("game-mode-label").textContent="好友 1 對 1・真人對局結果";
    $("shooting-title").textContent=`${C.getLandmark("court",snapshot.room.court_id).name}｜第 ${snapshot.room.round} 局`;
    $("shoot-button").disabled=true;$("practice-restart").hidden=true;
    $("practice-leave").hidden=true;
    stopGameTimer();pendingScore=null;
  }

  buildLandmarks();
  fanUI=globalThis.NBAFanUI.initializeFan({storage,getSelection:()=>state,getGameState:()=>state.gameState,onVisit:id=>openLandmark("nba",id),onChange:()=>{renderMapAndDirectory();renderPracticeFan();}});
  renderMapAndDirectory();renderPanel();renderPolicy();renderConnection();
  const invitation=C.parseInvite(window.location.href);
  if(invitation){openLandmark("court",invitation.courtId,false);$("invite-code").value=invitation.invite;$("lobby-notice").textContent="已定位朋友指定的球場；連線後輸入暱稱，按加入朋友房間。";}
  if(adapter.configured){syncOnline();onlineTimer=setInterval(syncOnline,2000);}
  window.addEventListener("pagehide",()=>{stopGameTimer();stopSounds();if(onlineTimer!==null){clearInterval(onlineTimer);onlineTimer=null;}});
  window.addEventListener("pageshow",event=>{if(event.persisted){if(game&&!gameFinished){gameTimer=setInterval(tickGame,50);tickGame();}if(adapter.configured&&onlineTimer===null){syncOnline();onlineTimer=setInterval(syncOnline,2000);}}});
}

if(typeof module!=="undefined"&&module.exports){module.exports={...require("./assets/island-core.js"),...require("./assets/policy-core.js")};}
else if(typeof document!=="undefined")initializeIsland();
