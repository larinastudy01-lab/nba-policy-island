"use strict";

// 站點、投影座標與模擬賽事集中於此。新增球隊時沿用同一資料結構。
// 地圖採 Albers 等積投影，viewBox 0 0 1000 620；座標與 assets/us-map.svg 一致。
const TOUR_DATA = {
  map: { width: 1000, height: 620 },
  initialState: "live",
  stations: [
    {
      id: "warriors",
      name: "金州勇士",
      shortName: "勇士",
      englishName: "Golden State Warriors",
      city: "舊金山・加州",
      cityEnglish: "San Francisco, CA",
      coordinates: { longitude: -122.4194, latitude: 37.7749, x: 61.1088, y: 267.3317 },
      games: {
        idle: { status: "今日無賽事", opponent: null, homeScore: null, awayScore: null, period: null, startTime: null },
        scheduled: { status: "尚未開打", opponent: "湖人", homeScore: null, awayScore: null, period: null, startTime: "11:00", timeZone: "台灣時間" },
        live: { status: "LIVE", opponent: "湖人", homeScore: 78, awayScore: 74, period: "第 3 節", startTime: null },
        final: { status: "完賽", opponent: "湖人", homeScore: 108, awayScore: 101, period: null, startTime: null }
      }
    }
  ]
};

// 本關為自訂模擬；計算與完成進度不讀取或改動 TOUR_DATA 的賽況。
const POLICY_CHALLENGE = {
  id: "warriors-ticket-allocation",
  stationId: "warriors",
  storageKey: "nba-policy-island:policy-progress:v1",
  tickets: 60,
  students: { registered: 20, budget: 30 },
  generalFans: { registered: 60, budget: 45 },
  prices: { regular: 45, student: 30, lottery: 30 },
  studentSeats: 20,
  goals: { students: 15, revenue: 2000 },
  plans: [
    { id: "regular", name: "原價售票", tradeoff: "票房最高，但原價超過學生預算，沒有學生能入場。" },
    { id: "reserved", name: "學生保留席", tradeoff: "用部分票房換取學生入場機會，仍能同時達到學生人數與收入目標。" },
    { id: "lottery", name: "全場降價抽籤", tradeoff: "所有登記者都有相同中籤機率，但收入低於目標，且單次抽籤不保證學生人數。" }
  ]
};

function calculatePolicy(planId) {
  const data = POLICY_CHALLENGE;
  const plan = data.plans.find((item) => item.id === planId);
  if (!plan) throw new RangeError("Unknown policy plan.");
  let students = 0;
  let generalFans = 0;
  let revenue = 0;
  let formula = "";
  let lotteryChance = null;

  if (planId === "regular") {
    // 本情境學生預算低於原價，原價票由負擔得起的一般球迷購買。
    students = data.students.budget >= data.prices.regular ? Math.min(data.students.registered, data.tickets) : 0;
    generalFans = data.generalFans.budget >= data.prices.regular ? Math.min(data.generalFans.registered, data.tickets - students) : 0;
    revenue = (students + generalFans) * data.prices.regular;
    formula = `${students + generalFans} 張 × ${data.prices.regular} 點 = ${revenue.toLocaleString("zh-TW")} 點`;
  } else if (planId === "reserved") {
    students = data.students.budget >= data.prices.student ? Math.min(data.studentSeats, data.students.registered, data.tickets) : 0;
    generalFans = data.generalFans.budget >= data.prices.regular ? Math.min(data.generalFans.registered, data.tickets - data.studentSeats) : 0;
    revenue = students * data.prices.student + generalFans * data.prices.regular;
    formula = `${students} 張 × ${data.prices.student} 點 ＋ ${generalFans} 張 × ${data.prices.regular} 點 = ${revenue.toLocaleString("zh-TW")} 點`;
  } else {
    const eligibleStudents = data.students.budget >= data.prices.lottery ? data.students.registered : 0;
    const eligibleFans = data.generalFans.budget >= data.prices.lottery ? data.generalFans.registered : 0;
    const pool = eligibleStudents + eligibleFans;
    const sold = Math.min(data.tickets, pool);
    lotteryChance = pool === 0 ? 0 : sold / pool;
    students = eligibleStudents * lotteryChance;
    generalFans = eligibleFans * lotteryChance;
    revenue = sold * data.prices.lottery;
    formula = `${sold} 張 × ${data.prices.lottery} 點 = ${revenue.toLocaleString("zh-TW")} 點；每人中籤機率 ${sold} ÷ ${pool} = ${lotteryChance * 100}%`;
  }

  const studentGoalMet = students >= data.goals.students;
  const revenueGoalMet = revenue >= data.goals.revenue;
  return {
    planId, name: plan.name, students, generalFans, total: students + generalFans, revenue,
    isExpected: planId === "lottery", lotteryChance, studentGoalMet, revenueGoalMet,
    passed: studentGoalMet && revenueGoalMet, formula, tradeoff: plan.tradeoff
  };
}

// storage 由呼叫端提供，可在終端機測試，亦能處理儲存權限被拒絕的環境。
// 完成代表已確認一項決策；是否達成兩項目標由 calculatePolicy 分開判定。
function createPolicySession(storage) {
  let selectedPlan = "regular";
  let result = null;
  let completedPlanId = null;
  let comparisonVisible = false;
  let storageAvailable = Boolean(storage && typeof storage.getItem === "function" && typeof storage.setItem === "function");
  let raw = null;
  if (storageAvailable) {
    try { raw = storage.getItem(POLICY_CHALLENGE.storageKey); }
    catch { storageAvailable = false; }
  }
  try {
    const saved = JSON.parse(raw);
    if (saved && saved.version === 1 && saved.challengeId === POLICY_CHALLENGE.id && saved.stationId === POLICY_CHALLENGE.stationId && saved.completed === true && POLICY_CHALLENGE.plans.some((plan) => plan.id === saved.planId)) {
      selectedPlan = saved.planId;
      completedPlanId = saved.planId;
      result = calculatePolicy(saved.planId);
      comparisonVisible = true;
    }
  } catch { /* 無效或舊版紀錄不影響關卡運行。 */ }

  return {
    getState() {
      return { selectedPlan, result: result ? { ...result } : null, completedPlanId, comparisonVisible, storageAvailable };
    },
    selectPlan(planId) {
      if (!POLICY_CHALLENGE.plans.some((plan) => plan.id === planId)) throw new RangeError("Unknown policy plan.");
      if (selectedPlan !== planId) {
        selectedPlan = planId;
        result = null;
      }
    },
    simulate() {
      result = calculatePolicy(selectedPlan);
      comparisonVisible = true;
      return { ...result };
    },
    retry() {
      result = null;
    },
    confirm() {
      if (!result || result.planId !== selectedPlan) return false;
      completedPlanId = selectedPlan;
      if (storageAvailable) {
        try {
          storage.setItem(POLICY_CHALLENGE.storageKey, JSON.stringify({
            version: 1, challengeId: POLICY_CHALLENGE.id, stationId: POLICY_CHALLENGE.stationId,
            completed: true, planId: completedPlanId
          }));
        } catch { storageAvailable = false; }
      }
      return true;
    }
  };
}

function initializeApp() {
  let storage = null;
  try { storage = window.localStorage; } catch { /* 本機或隱私模式可能限制儲存。 */ }
  const policySession = createPolicySession(storage);
  const uiState = { stationId: "warriors", gameState: TOUR_DATA.initialState, cardOpen: true };
  const elements = {
    markers: document.querySelector("#station-markers"),
    scoreboard: document.querySelector("#map-scoreboard"),
    card: document.querySelector("#station-card"),
    placeholder: document.querySelector("#station-placeholder"),
    stationGame: document.querySelector("#station-game"),
    stationTitle: document.querySelector("#station-title"),
    stationEnglish: document.querySelector("#station-english"),
    stationCity: document.querySelector("#station-city"),
    announcement: document.querySelector("#game-announcement"),
    closeButton: document.querySelector("#close-station"),
    openButton: document.querySelector("#open-station"),
    controls: document.querySelectorAll('input[name="game-state"]')
  };

  const basketballSVG = '<svg class="basketball" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21.5"/><path fill="none" d="M2.5 24h43M24 2.5v43M9 8q30 16 0 32M39 8Q9 24 39 40"/></svg>';

  // 模板只使用本地設定；轉義文字，方便之後替換資料來源。
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function currentStation() {
    return TOUR_DATA.stations.find((station) => station.id === uiState.stationId);
  }

  function gameSummary(station, game, state) {
    if (state === "idle") return `${station.shortName}站｜今日無賽事`;
    if (state === "scheduled") return `${station.shortName} vs ${game.opponent}｜${game.startTime} 開打（${game.timeZone}）`;
    const score = `${station.shortName} ${game.homeScore}：${game.awayScore} ${game.opponent}`;
    return state === "live" ? `LIVE｜${score}｜${game.period}｜模擬` : `完賽｜${score}｜模擬`;
  }

  function statusHTML(game) {
    return `<span class="status-dot" aria-hidden="true"></span>${escapeHTML(game.status)}<span class="demo-tag">模擬</span>`;
  }

  function scoreboardHTML(station, game, state) {
    const period = state === "live" ? game.period : state === "final" ? "最終比分" : "勇士站";
    const top = `<div class="scoreboard-top"><span class="scoreboard-status">${statusHTML(game)}</span><span class="scoreboard-period">${escapeHTML(period)}</span></div>`;
    if (state === "idle") return `${top}<div class="scoreboard-idle">今日無賽事</div><div class="scoreboard-footer">灣區熱情，持續在線。</div>`;
    const isScheduled = state === "scheduled";
    const match = `<div class="scoreboard-match"><div class="score-team"><span class="score-team-name">${escapeHTML(station.shortName)}</span>${isScheduled ? "" : `<strong>${game.homeScore}</strong>`}</div><span class="score-colon">${isScheduled ? "VS" : "："}</span><div class="score-team"><span class="score-team-name">${escapeHTML(game.opponent)}</span>${isScheduled ? "" : `<strong>${game.awayScore}</strong>`}</div></div>`;
    const caption = isScheduled ? `${game.startTime} 開打（${game.timeZone}）` : state === "live" ? "灣區主場 · 比賽進行中" : "比賽結束 · 最終比分";
    return `${top}${match}<div class="scoreboard-footer">${escapeHTML(caption)}</div>`;
  }

  function stationGameHTML(station, game, state) {
    const round = state === "live" ? game.period : state === "final" ? "FINAL" : "模擬情境";
    const top = `<div class="game-state-row"><span class="game-status">${statusHTML(game)}</span><span class="game-round">${escapeHTML(round)}</span></div>`;
    if (state === "idle") return `${top}<p class="detail-message">今天，先逛逛灣區。</p><p class="detail-caption idle-caption">勇士今日沒有安排賽事。<br>切換下方情境，體驗不同的球場狀態。</p>`;
    const isScheduled = state === "scheduled";
    const match = `<div class="detail-match"><div class="detail-team"><span>金州勇士</span><strong>${isScheduled ? "GSW" : game.homeScore}</strong></div><span class="detail-separator">${isScheduled ? "VS" : "："}</span><div class="detail-team"><span>${escapeHTML(game.opponent)}</span><strong>${isScheduled ? "LAL" : game.awayScore}</strong></div></div>`;
    const caption = isScheduled ? `<p class="detail-time">${game.startTime} 開打（${game.timeZone}）</p>` : `<p class="detail-caption">${state === "live" ? "比賽進行中 · 本地模擬比分" : "比賽結束 · 最終比分保留"}</p>`;
    return `${top}${match}${caption}`;
  }

  function selectStation(stationId, moveFocus = true) {
    uiState.stationId = stationId;
    uiState.cardOpen = true;
    render();
    if (moveFocus) elements.stationTitle.focus({ preventScroll: true });
  }

  function buildMarkers() {
    TOUR_DATA.stations.forEach((station) => {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "station-marker";
      marker.id = `marker-${station.id}`;
      marker.style.left = `${station.coordinates.x / TOUR_DATA.map.width * 100}%`;
      marker.style.top = `${station.coordinates.y / TOUR_DATA.map.height * 100}%`;
      marker.setAttribute("aria-controls", "station-card");
      marker.innerHTML = `${basketballSVG}<span class="marker-label" aria-hidden="true">${escapeHTML(station.shortName)}站<small>SAN FRANCISCO</small></span>`;
      const completeBadge = document.createElement("span");
      completeBadge.className = "marker-complete";
      completeBadge.textContent = "✓";
      completeBadge.hidden = true;
      completeBadge.setAttribute("aria-hidden", "true");
      marker.append(completeBadge);
      // 原生 button 自帶滑鼠、觸控、Enter、Space 啟用行為。
      marker.addEventListener("click", () => selectStation(station.id));
      elements.markers.append(marker);
    });
  }

  // 地圖記分牌、資訊卡、無障礙標籤皆讀取同一筆 game，一次更新。
  function render() {
    const station = currentStation();
    const state = uiState.gameState;
    const game = station.games[state];
    const summary = gameSummary(station, game, state);

    TOUR_DATA.stations.forEach((item) => {
      const marker = document.querySelector(`#marker-${item.id}`);
      marker.dataset.state = state;
      marker.setAttribute("aria-expanded", String(uiState.cardOpen && item.id === station.id));
    });

    elements.scoreboard.dataset.state = state;
    elements.scoreboard.setAttribute("aria-label", `模擬賽事：${summary}`);
    elements.scoreboard.innerHTML = scoreboardHTML(station, game, state);
    elements.stationGame.dataset.state = state;
    elements.stationGame.innerHTML = stationGameHTML(station, game, state);
    elements.stationTitle.firstChild.textContent = station.name;
    elements.stationEnglish.textContent = station.englishName.toUpperCase();
    elements.stationCity.textContent = station.city;
    document.querySelector(".city-english").textContent = station.cityEnglish;
    elements.card.hidden = !uiState.cardOpen;
    elements.placeholder.hidden = uiState.cardOpen;
    elements.controls.forEach((input) => { input.checked = input.value === state; });
    renderPolicyProgress();
  }

  elements.controls.forEach((input) => {
    input.addEventListener("change", (event) => {
      const nextState = event.target.value;
      if (!Object.prototype.hasOwnProperty.call(currentStation().games, nextState)) return;
      uiState.gameState = nextState;
      render();
      elements.announcement.textContent = `模擬賽事已切換：${gameSummary(currentStation(), currentStation().games[nextState], nextState)}`;
    });
  });

  function closeStation() {
    uiState.cardOpen = false;
    render();
    document.querySelector(`#marker-${uiState.stationId}`).focus({ preventScroll: true });
  }

  elements.closeButton.addEventListener("click", closeStation);
  elements.openButton.addEventListener("click", () => selectStation(uiState.stationId));
  elements.card.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeStation();
    }
  });

  const policyElements = {
    form: document.querySelector("#policy-form"),
    options: document.querySelectorAll('input[name="policy-plan"]'),
    results: document.querySelector("#policy-results"),
    resultTitle: document.querySelector("#policy-result-title"),
    resultContent: document.querySelector("#policy-result-content"),
    confirm: document.querySelector("#confirm-policy"),
    retry: document.querySelector("#retry-policy"),
    comparison: document.querySelector("#policy-comparison"),
    comparisonCards: document.querySelector("#policy-comparison-cards"),
    completion: document.querySelector("#policy-completion-message"),
    storageMessage: document.querySelector("#policy-storage-message"),
    hint: document.querySelector("#policy-trial-hint"),
    announcement: document.querySelector("#policy-announcement"),
    mapProgress: document.querySelector("#map-policy-progress"),
    stationStatus: document.querySelector("#station-policy-status")
  };

  function number(value) {
    return value.toLocaleString("zh-TW", { maximumFractionDigits: 2 });
  }

  function goalResultsHTML(result) {
    const studentVerdict = result.studentGoalMet ? (result.isExpected ? "期望值達到，單次不保證" : "通過") : "未通過";
    return `<ul class="policy-goal-results"><li data-met="${result.studentGoalMet}">${result.studentGoalMet ? "✓" : "✕"} 學生至少 ${POLICY_CHALLENGE.goals.students} 人：${studentVerdict}</li><li data-met="${result.revenueGoalMet}">${result.revenueGoalMet ? "✓" : "✕"} 收入至少 ${number(POLICY_CHALLENGE.goals.revenue)} 點：${result.revenueGoalMet ? "通過" : "未通過"}</li></ul>`;
  }

  function policyResultHTML(result) {
    const expected = result.isExpected ? "（期望值）" : "";
    const prefix = result.isExpected ? '<span class="expected-prefix">平均</span>' : "";
    const expectedNote = result.isExpected ? `<p class="policy-expected-note">這是入場期望值，不是一次隨機抽籤的結果。學生 ${POLICY_CHALLENGE.students.registered} × ${number(result.lotteryChance * 100)}% = ${number(result.students)} 人，一般球迷 ${POLICY_CHALLENGE.generalFans.registered} × ${number(result.lotteryChance * 100)}% = ${number(result.generalFans)} 人；單次學生人數可能高於或低於 ${number(result.students)} 人。總共仍售出 ${number(result.total)} 張票，收入固定 ${number(result.revenue)} 點。</p>` : "";
    return `<p class="policy-outcome" data-passed="${result.passed}">${result.passed ? "✓ 兩項目標皆通過" : "✕ 尚未同時達到兩項目標"}</p><dl class="policy-metrics"><div><dt>學生入場${expected}</dt><dd>${prefix}${number(result.students)}<span>人</span></dd></div><div><dt>一般球迷入場${expected}</dt><dd>${prefix}${number(result.generalFans)}<span>人</span></dd></div><div><dt>總入場人數</dt><dd>${number(result.total)}<span>人</span></dd></div><div><dt>票房收入</dt><dd>${number(result.revenue)}<span>點</span></dd></div></dl>${goalResultsHTML(result)}<p class="policy-calculation">計算：${escapeHTML(result.formula)}</p><p class="policy-tradeoff">取捨：${escapeHTML(result.tradeoff)}</p>${expectedNote}`;
  }

  function comparisonHTML(selectedPlan) {
    return POLICY_CHALLENGE.plans.map((plan) => {
      const result = calculatePolicy(plan.id);
      const average = result.isExpected ? "平均 " : "";
      const expected = result.isExpected ? "（期望值）" : "";
      return `<article class="comparison-card" data-current="${plan.id === selectedPlan}"><h4>${escapeHTML(plan.name)}${plan.id === selectedPlan ? '<span class="comparison-current">目前選擇</span>' : ""}</h4><dl><div><dt>學生${expected}</dt><dd>${average}${number(result.students)} 人</dd></div><div><dt>一般球迷${expected}</dt><dd>${average}${number(result.generalFans)} 人</dd></div><div><dt>總入場</dt><dd>${number(result.total)} 人</dd></div><div><dt>票房</dt><dd>${number(result.revenue)} 點</dd></div></dl>${goalResultsHTML(result)}<p class="comparison-verdict" data-passed="${result.passed}">${result.passed ? "兩項目標皆通過" : "未同時達到兩項目標"}</p><p class="policy-tradeoff">${escapeHTML(result.tradeoff)}</p></article>`;
    }).join("");
  }

  function renderPolicyProgress() {
    const state = policySession.getState();
    const completed = state.completedPlanId !== null;
    policyElements.mapProgress.textContent = `已完成 ${completed ? 1 : 0}／1 個政策挑戰`;
    policyElements.mapProgress.dataset.completed = String(completed);
    policyElements.stationStatus.textContent = completed ? "✓ 政策挑戰・已完成" : "政策挑戰・尚未完成";
    policyElements.stationStatus.dataset.completed = String(completed);
    TOUR_DATA.stations.forEach((station) => {
      const marker = document.querySelector(`#marker-${station.id}`);
      const stationCompleted = completed && station.id === POLICY_CHALLENGE.stationId;
      marker.dataset.policyCompleted = String(stationCompleted);
      marker.querySelector(".marker-complete").hidden = !stationCompleted;
      const summary = gameSummary(station, station.games[uiState.gameState], uiState.gameState);
      const progress = stationCompleted ? "，政策挑戰已完成" : "，政策挑戰尚未完成";
      marker.setAttribute("aria-label", `開啟${station.name}站資訊，${summary}${progress}`);
      marker.title = `${station.name} · ${summary}${progress}`;
    });
  }

  function renderPolicy() {
    const state = policySession.getState();
    policyElements.options.forEach((input) => { input.checked = input.value === state.selectedPlan; });
    policyElements.results.hidden = !state.result;
    if (state.result) {
      policyElements.resultTitle.textContent = `${state.result.name}｜試算結果`;
      policyElements.resultContent.innerHTML = policyResultHTML(state.result);
    } else {
      policyElements.resultContent.innerHTML = "";
    }
    const alreadyConfirmed = Boolean(state.result && state.completedPlanId === state.result.planId);
    policyElements.confirm.disabled = !state.result || alreadyConfirmed;
    policyElements.confirm.textContent = alreadyConfirmed ? "此決策已確認" : "確認決策";
    policyElements.comparison.hidden = !state.comparisonVisible;
    if (state.comparisonVisible) policyElements.comparisonCards.innerHTML = comparisonHTML(state.selectedPlan);
    const selectedName = POLICY_CHALLENGE.plans.find((plan) => plan.id === state.selectedPlan).name;
    policyElements.hint.textContent = state.result ? "可比較三方案後確認決策，或重新試算。" : `已選擇「${selectedName}」，請按「試算」查看結果。`;
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
    selected.focus();
  });

  buildMarkers();
  render();
  renderPolicy();
}

// 維持一般 script 載入，file:// 與 GitHub Pages 子路徑皆不需模組伺服器。
// Node 僅匯出純計算與狀態，執行終端機測試時不初始化 DOM。
if (typeof module !== "undefined" && module.exports) {
  module.exports = { TOUR_DATA, POLICY_CHALLENGE, calculatePolicy, createPolicySession };
}
if (typeof document !== "undefined") initializeApp();
