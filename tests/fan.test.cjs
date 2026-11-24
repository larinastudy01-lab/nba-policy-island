"use strict";
// 純 Node 資料／SVG／Canvas 協定測試，不啟動任何瀏覽器。
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const F = require("../assets/fan-core.js");
const C = require("../assets/island-core.js");
const root = path.resolve(__dirname, "..");
const date = "2026-11-24T06:30:00.000Z";
const photo = (teamId = "warriors", avatar = F.DEFAULT_AVATAR, options = {}) => F.createPhoto(teamId, avatar, { capturedAt: date, ...options });
function memory(initial = {}) { const records = new Map(Object.entries(initial));return { records, getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) }; }

test("avatar options are finite, cover eight jerseys and reject injected option values", () => {
  assert.deepEqual(F.OPTIONS.jersey.map(option => option[0]), C.TEAMS.map(team => team.id));
  const avatar = F.normalizeAvatar({ nickname: '<script>&"球迷', hair: '<image href="x"/>', skin: "#ffffff", jersey: "unknown", number: "123" });
  assert.equal(avatar.hair, F.DEFAULT_AVATAR.hair);assert.equal(avatar.skin, F.DEFAULT_AVATAR.skin);assert.equal(avatar.jersey, "warriors");assert.equal(avatar.number, "30");
  const svg = F.avatarSVG(avatar);assert.ok(svg.includes("&lt;script&gt;&amp;&quot;"));assert.doesNotMatch(svg, /<script|<image|foreignObject|onload=/i);
  assert.equal(Array.from(F.normalizeAvatar({ nickname: "球".repeat(30) }).nickname).length, 16);
  assert.doesNotThrow(() => F.svgDataURL(F.avatarSVG({ nickname: "\ud800" })));
});
test("draft preview, reset and randomize never apply until save; reload restores the saved avatar", () => {
  const storage = memory(), session = F.createFanSession(storage), original = session.getState().saved;
  session.edit({ nickname: "海灣新秀", jersey: "lakers", number: "07", glasses: "round", headband: "gold" });
  assert.deepEqual(session.getState().saved, original);assert.equal(storage.records.size, 0);
  session.save();const restored = F.createFanSession(storage).getState();
  assert.equal(restored.saved.nickname, "海灣新秀");assert.equal(restored.saved.number, "07");assert.equal(restored.saved.jersey, "lakers");
  session.randomize(() => .8);assert.deepEqual(session.getState().saved, restored.saved);
  session.reset();assert.deepEqual(session.getState().draft, F.DEFAULT_AVATAR);assert.deepEqual(session.getState().saved, restored.saved);
});
test("unavailable or quota-limited storage still supports this-page dress-up and album", () => {
  for (const storage of [null, { getItem() { throw new Error("blocked"); }, setItem() {} }, { getItem() { return null; }, setItem() { throw new Error("quota"); } }]) {
    const session = F.createFanSession(storage);session.edit({ nickname: "本次球迷" });session.save();session.collect(photo("warriors", session.getState().saved));
    assert.equal(session.getState().saved.nickname, "本次球迷");assert.equal(session.getState().collected, 1);assert.equal(session.getState().storageAvailable, false);
  }
});
test("malformed storage is isolated from valid avatar data and does not block future saves", () => {
  const storage = memory({ [F.AVATAR_KEY]: JSON.stringify({ version: 1, avatar: { nickname: "已儲存" } }), [F.ALBUM_KEY]: "bad JSON" });
  const session = F.createFanSession(storage);assert.equal(session.getState().saved.nickname, "已儲存");assert.equal(session.getState().storageAvailable, true);
  session.collect(photo());assert.equal(F.createFanSession(storage).getState().collected, 1);
});
test("8 unique star stations map to 8 existing NBA arenas and local original assets", () => {
  assert.equal(F.STATIONS.length, 8);assert.equal(new Set(F.STATIONS.map(station => station.starId)).size, 8);
  assert.deepEqual(F.STATIONS.map(station => station.teamId).sort(), C.TEAMS.map(team => team.id).sort());
  assert.equal(F.getStation("warriors").starId, "curry");assert.equal(F.getStation("harbor-01"), null);
  for (const station of F.STATIONS) {
    assert.ok(station.point && station.venue);assert.ok(station.x > 0 && station.x < 100 && station.y > 0 && station.y < 100);assert.match(station.label, /非現役名單/);
    assert.ok(station.illustration.startsWith("./assets/") && station.background.startsWith("./assets/"));
    assert.equal(fs.readFileSync(path.join(root, station.illustration), "utf8").trim(), F.starSVG(station.teamId));
    assert.equal(fs.readFileSync(path.join(root, station.background), "utf8").trim(), F.arenaSVG(station.teamId));
  }
});
test("Warriors away at Lakers permits only Lakers night lighting; general photos always work", () => {
  for (const state of C.GAME_STATES) {
    assert.equal(F.nightAvailable("warriors", state), false);assert.equal(F.nightAvailable("lakers", state), state === "live");
    assert.ok(F.createPhoto("warriors", F.DEFAULT_AVATAR, { capturedAt: date }, state));
  }
  assert.throws(() => F.createPhoto("warriors", {}, { background: "night" }, "live"), /Night background unavailable/);
  const night = F.createPhoto("lakers", {}, { background: "night", capturedAt: date }, "live");assert.equal(night.background, "night");
  assert.throws(() => F.createPhoto("lakers", {}, { background: "night" }, "final"), /Night background unavailable/);
  assert.ok(F.normalizePhoto(night));assert.ok(F.photoSVG(night).includes("夜場燈光"));
});
test("one collection per team replaces a retake, eight teams cap progress at eight", () => {
  const storage = memory(), session = F.createFanSession(storage);
  session.collect(photo());session.collect(photo("warriors", { ...F.DEFAULT_AVATAR, nickname: "重拍" }, { pose: "ball" }));
  assert.equal(session.getState().collected, 1);assert.equal(session.getState().album.warriors.avatar.nickname, "重拍");
  for (const station of F.STATIONS) session.collect(photo(station.teamId));
  assert.equal(session.getState().collected, 8);assert.equal(F.createFanSession(storage).getState().collected, 8);
});
test("collection keeps capture-time appearance, pose, background and date after dress-up", () => {
  const session = F.createFanSession(memory());session.edit({ nickname: "拍照時", jersey: "warriors", shoes: "gold" });session.save();
  const captured = photo("warriors", session.getState().saved, { pose: "ball" });session.collect(captured);const before = F.photoSVG(captured);
  captured.avatar.nickname = "外部改寫";const returned = session.getState();returned.album.warriors.avatar.nickname = "傳回值改寫";
  session.edit({ nickname: "換裝後", jersey: "bulls", shoes: "rose" });session.save();
  const saved = session.getState().album.warriors;assert.equal(saved.avatar.nickname, "拍照時");assert.equal(saved.pose, "ball");assert.equal(saved.background, "day");assert.equal(saved.capturedAt, date);assert.equal(F.photoSVG(saved), before);
});
test("invalid teams, prototype keys, star mismatches and malformed records cannot enter album", () => {
  for (const invalid of [{ ...photo(), teamId: "__proto__", starId: undefined }, { ...photo(), starId: "jordan" }, { ...photo(), pose: "script" }, { ...photo(), background: "remote" }, { ...photo(), capturedAt: "bad" }]) {
    assert.equal(F.normalizePhoto(invalid), null);assert.throws(() => F.createFanSession(null).collect(invalid), /Invalid photo/);
  }
  assert.throws(() => F.createPhoto("harbor-01", {}), /Unknown photo station/);
});
test("photo SVG embeds player, star, arena and escaped captions without external resources", () => {
  const record = photo("warriors", { ...F.DEFAULT_AVATAR, nickname: "<我>&朋友" }, { pose: "ball" });const svg = F.photoSVG(record);
  for (const text of ["&lt;我&gt;&amp;朋友", "史蒂芬・柯瑞", "金州勇士", "灣岸勇士球館", "2026", 'data-layer="uniform"', 'data-layer="ball"']) assert.ok(svg.includes(text), text);
  assert.doesNotMatch(svg, /<image|foreignObject|href=|https?:\/\/(?!www\.w3\.org)/i);
  assert.equal((svg.match(/data-layer="face"/g) || []).length, 2);
  assert.ok(F.avatarSVG(F.DEFAULT_AVATAR, { pose: "ball" }).includes('data-layer="ball"'));
  assert.ok(!F.avatarSVG(F.DEFAULT_AVATAR).includes('data-layer="ball"'));
});
test("PNG exporter sends a self-contained SVG to Canvas and requests a 960x640 PNG", async () => {
  let source, draw, outputType;
  class ImageStub { set src(value) { source = value;this.onload(); } }
  const blob = { type: "image/png" }, canvas = { getContext: () => ({ drawImage: (...args) => { draw = args; } }), toBlob: (callback, type) => { outputType = type;callback(blob); } };
  assert.equal(await F.exportPNG(photo(), { Image: ImageStub, createCanvas: () => canvas }), blob);
  assert.equal(canvas.width, 960);assert.equal(canvas.height, 640);assert.equal(outputType, "image/png");assert.deepEqual(draw.slice(1), [0, 0, 960, 640]);
  assert.ok(source.startsWith("data:image/svg+xml;charset=utf-8,"));assert.match(decodeURIComponent(source), /史蒂芬・柯瑞/);
});
test("PNG load and canvas failures reject cleanly for the UI to report", async () => {
  class BrokenImage { set src(value) { this.onerror(); } }
  await assert.rejects(F.exportPNG(photo(), { Image: BrokenImage }), /PHOTO_IMAGE_FAILED/);
  class ImageStub { set src(value) { this.onload(); } }
  await assert.rejects(F.exportPNG(photo(), { Image: ImageStub, createCanvas: () => ({ getContext: () => null }) }), /CANVAS_UNAVAILABLE/);
});
