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
    marker.setAttribute("aria-label", `開啟${item.name}站資訊，${gameSummary(item, item.games[state], state)}`);
    marker.title = `${item.name} · ${summary}`;
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

buildMarkers();
render();
