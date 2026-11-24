"use strict";
(function (root, factory) {
  const api = factory(typeof module !== "undefined" && module.exports ? require("./island-core.js") : root.NBAIsland);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NBAFan = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Island) {
  const AVATAR_KEY = "nba-policy-island:fan:v1";
  const ALBUM_KEY = "nba-policy-island:photos:v1";
  const OPTIONS = {
    skin: [["peach", "暖杏", "#efbb93"], ["sand", "小麥", "#d89b6e"], ["bronze", "古銅", "#b77750"], ["brown", "深棕", "#855234"], ["deep", "暖褐", "#593b30"]],
    hair: [["crop", "俐落短髮"], ["curls", "捲捲短髮"], ["sweep", "側分長髮"], ["braids", "辮子"], ["bun", "丸子頭"], ["shaved", "光頭"]],
    hairColor: [["ink", "墨黑", "#242730"], ["chestnut", "栗棕", "#714534"], ["honey", "蜂蜜金", "#d1a957"], ["silver", "銀灰", "#a8b4c0"], ["blue", "海島藍", "#386c9a"]],
    expression: [["smile", "微笑"], ["focus", "專注"], ["wink", "眨眼"]],
    shoes: [["white", "奶油白", "#e8e5d7"], ["gold", "日光金", "#efc35b"], ["blue", "海灣藍", "#4386bd"], ["rose", "珊瑚粉", "#d7798c"]],
    headband: [["none", "不配戴"], ["gold", "金色頭帶"], ["team", "隊色頭帶"]],
    wristband: [["none", "不配戴"], ["gold", "金色護腕"], ["team", "隊色護腕"]],
    glasses: [["none", "不配戴"], ["round", "圓框眼鏡"], ["sport", "運動眼鏡"]],
    jersey: Island.TEAMS.map(team => [team.id, team.name, team.color])
  };
  const DEFAULT_AVATAR = { nickname: "島上新秀", number: "30", skin: "sand", hair: "curls", hairColor: "ink", expression: "smile", jersey: "warriors", shoes: "white", headband: "none", wristband: "team", glasses: "none" };
  const STATIONS = [
    { teamId: "warriors", starId: "curry", starName: "史蒂芬・柯瑞", english: "Stephen Curry", number: "30", venue: "灣岸勇士球館", point: "球員通道旁", x: 68, y: 75, skin: "sand", hair: "curls", hairColor: "ink", beard: true },
    { teamId: "lakers", starId: "magic", starName: "魔術強森", english: "Magic Johnson", number: "32", venue: "紫金星光球館", point: "記分板下方", x: 67, y: 74, skin: "brown", hair: "crop", hairColor: "ink" },
    { teamId: "clippers", starId: "paul", starName: "克里斯・保羅", english: "Chris Paul", number: "3", venue: "海岸快艇球館", point: "場邊熱身區", x: 64, y: 75, skin: "bronze", hair: "shaved", hairColor: "ink", beard: true },
    { teamId: "nuggets", starId: "jokic", starName: "尼古拉・約基奇", english: "Nikola Jokic", number: "15", venue: "高地金塊球館", point: "山形看台前", x: 66, y: 74, skin: "peach", hair: "crop", hairColor: "chestnut" },
    { teamId: "mavericks", starId: "dirk", starName: "德克・諾威斯基", english: "Dirk Nowitzki", number: "41", venue: "藍色天際球館", point: "主場隊徽旁", x: 69, y: 75, skin: "peach", hair: "sweep", hairColor: "honey" },
    { teamId: "bulls", starId: "jordan", starName: "麥可・喬丹", english: "Michael Jordan", number: "23", venue: "紅色傳奇球館", point: "冠軍旗幟下", x: 65, y: 75, skin: "brown", hair: "shaved", hairColor: "ink" },
    { teamId: "celtics", starId: "bird", starName: "賴瑞・柏德", english: "Larry Bird", number: "33", venue: "綠衫經典球館", point: "木地板中線", x: 67, y: 74, skin: "peach", hair: "sweep", hairColor: "honey" },
    { teamId: "knicks", starId: "ewing", starName: "派屈克・尤因", english: "Patrick Ewing", number: "33", venue: "都會橘藍球館", point: "球員席旁", x: 68, y: 75, skin: "deep", hair: "crop", hairColor: "ink", beard: true }
  ].map(station => ({ ...station, label: "隊史球星致敬・非現役名單", illustration: `./assets/stars/${station.starId}.svg`, background: `./assets/arenas/${station.teamId}.svg` }));

  const copy = value => JSON.parse(JSON.stringify(value));
  const xml = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
  function normalizeAvatar(value = {}) {
    if (!value || typeof value !== "object") value = {};
    const avatar = { ...DEFAULT_AVATAR };
    for (const [key, options] of Object.entries(OPTIONS)) {
      if (options.some(option => option[0] === value[key])) avatar[key] = value[key];
    }
    if (typeof value.nickname === "string") avatar.nickname = Array.from(value.nickname.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[\uD800-\uDFFF]/gu, "�").trim()).slice(0, 16).join("") || DEFAULT_AVATAR.nickname;
    if (typeof value.number === "string" && /^\d{1,2}$/.test(value.number)) avatar.number = value.number;
    return avatar;
  }
  function randomAvatar(random = Math.random, nickname = DEFAULT_AVATAR.nickname) {
    const value = { nickname, number: String(Math.floor(Math.max(0, Math.min(.999999, random())) * 100)).padStart(2, "0") };
    for (const [key, options] of Object.entries(OPTIONS)) value[key] = options[Math.floor(Math.max(0, Math.min(.999999, random())) * options.length)][0];
    return normalizeAvatar(value);
  }
  function getStation(teamId) { return STATIONS.find(station => station.teamId === teamId) || null; }
  function nightAvailable(teamId, gameState) { return Boolean(getStation(teamId) && Island.gameForTeam(teamId, gameState).glowing); }
  function createPhoto(teamId, avatar, { pose = "stand", background = "day", capturedAt = new Date().toISOString() } = {}, gameState = "idle") {
    const station = getStation(teamId);
    if (!station) throw new RangeError("Unknown photo station.");
    if (!["stand", "ball"].includes(pose) || !["day", "night"].includes(background)) throw new RangeError("Unknown photo option.");
    if (background === "night" && !nightAvailable(teamId, gameState)) throw new RangeError("Night background unavailable.");
    if (!Number.isFinite(Date.parse(capturedAt))) throw new TypeError("Invalid capture date.");
    return { version: 1, teamId, starId: station.starId, avatar: normalizeAvatar(avatar), pose, background, capturedAt: new Date(capturedAt).toISOString() };
  }
  function normalizePhoto(value) {
    const station = value && getStation(value.teamId);
    if (!station || value.version !== 1 || station.starId !== value.starId || !["stand", "ball"].includes(value.pose) || !["day", "night"].includes(value.background) || typeof value.capturedAt !== "string" || !Number.isFinite(Date.parse(value.capturedAt)) || !value.avatar || typeof value.avatar !== "object") return null;
    // 收藏是歷史快照：重播夜場照片時不重新要求目前仍在 LIVE。
    return { version: 1, teamId: value.teamId, starId: value.starId, avatar: normalizeAvatar(value.avatar), pose: value.pose, background: value.background, capturedAt: new Date(value.capturedAt).toISOString() };
  }
  function createFanSession(storage) {
    let saved = normalizeAvatar(), draft, album = {};
    let storageAvailable = Boolean(storage && typeof storage.getItem === "function" && typeof storage.setItem === "function");
    function read(key) {
      let raw;
      try { raw = storage.getItem(key); } catch { storageAvailable = false;return null; }
      try { return JSON.parse(raw || "null"); } catch { return null; }
    }
    if (storageAvailable) {
        const avatarData = read(AVATAR_KEY);
        if (avatarData?.version === 1) saved = normalizeAvatar(avatarData.avatar);
        const albumData = read(ALBUM_KEY);
        if (albumData?.version === 1 && Array.isArray(albumData.photos)) {
          for (const value of albumData.photos.slice(0, 100)) { const photo = normalizePhoto(value); if (photo) album[photo.teamId] = photo; }
        }
    }
    draft = copy(saved);
    function write(key, value) { if (storageAvailable) { try { storage.setItem(key, JSON.stringify(value)); } catch { storageAvailable = false; } } }
    return {
      getState: () => ({ saved: copy(saved), draft: copy(draft), album: copy(album), collected: Object.keys(album).length, storageAvailable }),
      edit(patch) { draft = normalizeAvatar({ ...draft, ...patch }); return copy(draft); },
      randomize(random) { draft = randomAvatar(random, draft.nickname); return copy(draft); },
      reset() { draft = normalizeAvatar(); return copy(draft); },
      save() { saved = copy(draft); write(AVATAR_KEY, { version: 1, avatar: saved }); return copy(saved); },
      collect(value) { const photo = normalizePhoto(value); if (!photo) throw new TypeError("Invalid photo record."); album[photo.teamId] = copy(photo); write(ALBUM_KEY, { version: 1, photos: Object.values(album) }); return copy(photo); }
    };
  }

  function avatarBody(value, { pose = "stand", beard = false } = {}) {
    const a = normalizeAvatar(value), team = Island.TEAMS.find(item => item.id === a.jersey);
    const color = key => OPTIONS[key].find(option => option[0] === a[key])[2];
    const skin = color("skin"), hair = color("hairColor"), shoes = color("shoes"), accent = team.accent;
    const hairShapes = {
      crop: '<path d="M72 71Q72 25 120 25T168 71L154 51 84 54Z"/>',
      curls: '<path d="M72 71Q65 48 79 43Q73 24 94 27Q106 10 122 25Q142 12 150 31Q173 27 169 52L165 72 153 51 85 54Z"/>',
      sweep: '<path d="M70 90Q56 25 113 22Q174 12 174 92L155 80 152 46Q121 67 78 62L82 90Z"/>',
      braids: '<path d="M73 74Q64 24 120 24Q175 22 168 74L154 52H87Z"/><path d="M76 65v57m14-74v18m17-33v28m20-28v25m20-17v21m18 9v57" stroke-width="10" stroke-linecap="round"/>',
      bun: '<circle cx="121" cy="23" r="22"/><path d="M72 74Q68 31 120 29Q175 31 168 74L153 51 85 54Z"/>',
      shaved: ""
    };
    const eyes = a.expression === "wink" ? '<circle cx="101" cy="80" r="4"/><path d="m134 80 8-3" fill="none" stroke="#252933" stroke-width="3" stroke-linecap="round"/>' : '<circle cx="101" cy="80" r="4"/><circle cx="139" cy="80" r="4"/>';
    const mouth = a.expression === "focus" ? '<path d="M111 104h18"/>' : '<path d="M108 101q12 13 24 0"/>';
    const band = a.headband === "gold" ? "#f3c45b" : accent;
    const wrist = a.wristband === "gold" ? "#f3c45b" : accent;
    const rightArm = pose === "ball" ? '<path d="M157 150q30 2 34-34"/>' : '<path d="M157 150q28 18 24 54"/>';
    return `<g data-layer="shadow"><ellipse cx="120" cy="294" rx="67" ry="10" fill="#051321" opacity=".25"/></g>
<g data-layer="legs" stroke="${skin}" stroke-width="21" stroke-linecap="round"><path d="M100 226v45m40-45v45"/></g>
<g data-layer="shoes" fill="${shoes}" stroke="#263646" stroke-width="3"><path d="M88 266h27v21H72q0-15 16-21Z"/><path d="M126 266h27q17 5 17 21h-44Z"/><path d="M77 285h35m18 0h34" stroke="#fff7e3"/></g>
<g data-layer="arms" fill="none" stroke="${skin}" stroke-width="20" stroke-linecap="round"><path d="M83 150q-28 18-24 54"/>${rightArm}</g>
<g data-layer="uniform"><path d="m90 129 18 9h24l18-9 16 29-15 9 4 45H85l4-45-15-9Z" fill="${team.color}" stroke="#172e42" stroke-width="3"/><path d="m87 211 66 0 3 29-33 0-3-10-4 10H84Z" fill="${team.color}" stroke="#172e42" stroke-width="3"/><path d="m91 133 17 13h24l17-13M86 205h68" fill="none" stroke="${accent}" stroke-width="5"/><text x="120" y="167" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-size="13" font-weight="700">${team.abbr}</text><text x="120" y="196" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-size="27" font-weight="800">${a.number}</text></g>
<g data-layer="face"><path d="M108 116v20q12 14 24 0v-20" fill="${skin}"/><circle cx="74" cy="82" r="10" fill="${skin}"/><circle cx="166" cy="82" r="10" fill="${skin}"/><ellipse cx="120" cy="78" rx="46" ry="49" fill="${skin}" stroke="#593b3033" stroke-width="2"/><g fill="#252933">${eyes}</g><path d="m118 88-3 8h9" fill="none" stroke="#8c604a" stroke-width="2"/><g fill="none" stroke="#623e34" stroke-width="3" stroke-linecap="round">${mouth}</g>${beard ? '<path d="M91 100q7 24 29 25 23-1 29-25l-11 9-18 7-18-7Z" fill="#493731"/>' : ""}</g>
<g data-layer="hair" fill="${hair}" stroke="${hair}">${hairShapes[a.hair]}</g>
<g data-layer="accessories">${a.headband !== "none" ? `<path d="M78 63q42-12 84 0v10q-42-11-84 0Z" fill="${band}"/>` : ""}${a.wristband !== "none" ? `<path d="M50 186h20v12H50Z" fill="${wrist}"/>` : ""}${a.glasses !== "none" ? `<g fill="${a.glasses === "sport" ? "#193b5066" : "none"}" stroke="#20394e" stroke-width="3"><rect x="86" y="70" width="29" height="22" rx="${a.glasses === "round" ? 11 : 3}"/><rect x="125" y="70" width="29" height="22" rx="${a.glasses === "round" ? 11 : 3}"/><path d="M115 79h10m-39 0H75m79 0h11"/></g>` : ""}</g>
${pose === "ball" ? '<g data-layer="ball"><circle cx="192" cy="103" r="25" fill="#e9a34b" stroke="#55392f" stroke-width="3"/><path d="M168 103h48m-24-25v50m-17-43q33 18 0 36m34-36q-33 18 0 36" fill="none" stroke="#764832" stroke-width="2"/></g>' : ""}`;
  }
  function avatarSVG(avatar, options = {}) {
    const a = normalizeAvatar(avatar);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" role="img" aria-label="${xml(a.nickname)}的籃球角色"><title>${xml(a.nickname)}的分層籃球角色</title>${avatarBody(a, options)}</svg>`;
  }
  function starAvatar(station) { return normalizeAvatar({ ...DEFAULT_AVATAR, ...station, nickname: station.starName, jersey: station.teamId, expression: "smile", headband: "none", wristband: "team", shoes: "white" }); }
  function starSVG(teamId) { const station = getStation(teamId); if (!station) throw new RangeError("Unknown station."); return avatarSVG(starAvatar(station), { pose: "ball", beard: Boolean(station.beard) }).replace("</title>", `</title><desc>${xml(station.starName)}・原創 Q 版・${xml(station.label)}。非官方照片或隊徽素材。</desc>`); }
  function arenaBody(teamId, night = false) {
    const station = getStation(teamId), team = Island.TEAMS.find(item => item.id === teamId);
    if (!station) throw new RangeError("Unknown station.");
    const seats = [0, 1, 2, 3].map(row => `<path d="M35 ${180 + row * 35}Q480 ${60 + row * 35} 925 ${180 + row * 35}" fill="none" stroke="${row % 2 ? team.color : "#496477"}" stroke-width="23"/>`).join("");
    return `<rect width="960" height="640" fill="${night ? "#09142b" : "#1e3b50"}"/><path d="M0 110 170 30h620l170 80M80 0l180 130M880 0 700 130M0 110h960" fill="none" stroke="#8ba2aa" stroke-width="8"/>${seats}<rect x="372" y="70" width="216" height="88" rx="9" fill="#0a1c2e" stroke="${team.accent}" stroke-width="4"/><text x="480" y="105" fill="${team.accent}" font-family="sans-serif" font-size="18" text-anchor="middle">POLICY ISLAND</text><text x="480" y="140" fill="#f2edda" font-family="sans-serif" font-size="28" font-weight="700" text-anchor="middle">${team.abbr} HOME</text><path d="M0 340H960V640H0Z" fill="${night ? "#8c6b49" : "#c7a46d"}"/><path d="M0 398H960M0 465H960M0 533H960M0 602H960M180 340 100 640M365 340 340 640M595 340 620 640M780 340 860 640" stroke="#543d3429" stroke-width="2"/><ellipse cx="480" cy="472" rx="138" ry="69" fill="${team.color}" stroke="${team.accent}" stroke-width="5"/><text x="480" y="485" text-anchor="middle" fill="${team.accent}" font-family="sans-serif" font-size="38" font-weight="700">${team.abbr}</text><path d="M36 350h160l-42 190H10m914-190H764l42 190h144M480 340v300" fill="none" stroke="#fff1d5" stroke-width="4"/><rect x="90" y="220" width="100" height="120" rx="40" fill="#071827" stroke="${team.accent}" stroke-width="4"/><text x="140" y="275" text-anchor="middle" fill="#abc6d9" font-family="sans-serif" font-size="14">TUNNEL</text><path d="M866 155v200m-45-190h90v60h-90Z" fill="none" stroke="#c2d3d8" stroke-width="5"/><ellipse cx="866" cy="230" rx="23" ry="6" fill="none" stroke="#f3c45b" stroke-width="4"/>${night ? `<path d="M150 45 50 410h240ZM810 45 670 410h240Z" fill="${team.accent}" opacity=".13"/><g fill="#fff2c1"><circle cx="150" cy="45" r="12"/><circle cx="810" cy="45" r="12"/></g>` : '<g fill="#b9d8e0"><rect x="100" y="44" width="85" height="8" rx="4"/><rect x="775" y="44" width="85" height="8" rx="4"/></g>'}`;
  }
  function arenaSVG(teamId, night = false) { const station = getStation(teamId); if (!station) throw new RangeError("Unknown station."); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640" role="img"><title>${xml(station.venue)}・原創場館${night ? "夜場燈光" : "一般合影"}</title>${arenaBody(teamId, night)}</svg>`; }
  function photoDate(value) { return new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }); }
  function photoSVG(value) {
    const record = normalizePhoto(value); if (!record) throw new TypeError("Invalid photo.");
    const station = getStation(record.teamId), team = Island.TEAMS.find(item => item.id === record.teamId);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640" role="img"><title>${xml(record.avatar.nickname)}與${xml(station.starName)}的主場合影</title>${arenaBody(record.teamId, record.background === "night")}<svg x="210" y="176" width="240" height="320" viewBox="0 0 240 320">${avatarBody(record.avatar, { pose: record.pose })}</svg><svg x="508" y="153" width="258" height="344" viewBox="0 0 240 320">${avatarBody(starAvatar(station), { pose: "ball", beard: Boolean(station.beard) })}</svg><rect x="0" y="512" width="960" height="128" fill="#081b2e"/><path d="M30 532h8v80h-8Z" fill="${team.accent}"/><g font-family="Microsoft JhengHei, PingFang TC, sans-serif" fill="#edf4f2"><text x="60" y="548" font-size="16" fill="${team.accent}">NBA 政策島 ／ HOME COURT MEMORIES</text><text x="60" y="579" font-size="24" font-weight="700">${xml(record.avatar.nickname)} × ${xml(station.starName)}</text><text x="60" y="605" font-size="16">${xml(team.name)}・${xml(station.venue)}・${record.background === "night" ? "夜場燈光" : "一般合影"}</text><text x="900" y="548" font-size="14" text-anchor="end">${xml(photoDate(record.capturedAt))}（台灣）</text><text x="900" y="626" font-size="12" fill="#abc1d2" text-anchor="end">原創 Q 版・隊史球星致敬・非現役名單</text></g></svg>`;
  }
  function svgDataURL(svg) { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; }
  async function exportPNG(record, environment = {}) {
    const ImageType = environment.Image || globalThis.Image;
    const createCanvas = environment.createCanvas || (() => document.createElement("canvas"));
    const image = new ImageType();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error("PHOTO_IMAGE_FAILED")); image.src = svgDataURL(photoSVG(record)); });
    const canvas = createCanvas(); canvas.width = 960; canvas.height = 640;
    const context = canvas.getContext("2d"); if (!context) throw new Error("CANVAS_UNAVAILABLE");
    context.drawImage(image, 0, 0, 960, 640);
    return new Promise((resolve, reject) => { canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG_EXPORT_FAILED")), "image/png"); });
  }
  return { AVATAR_KEY, ALBUM_KEY, OPTIONS, DEFAULT_AVATAR, STATIONS, normalizeAvatar, randomAvatar, getStation, nightAvailable, createPhoto, normalizePhoto, createFanSession, avatarSVG, starSVG, arenaSVG, photoSVG, photoDate, svgDataURL, exportPNG };
});
