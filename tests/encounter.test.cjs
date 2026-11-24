"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const C = require("../assets/island-core.js"), F = require("../assets/fan-core.js");
const day = "2026-01-01", timestamp = "2026-01-01T04:30:00Z";
function memory(initial = {}) { const values = new Map(Object.entries(initial));return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; }

test("16 teams, 15 courts, 16 unique arena photo points and 3 separate encounter IDs", () => {
  assert.equal(C.TEAMS.length,16);assert.equal(C.COURTS.length,15);assert.equal(F.STATIONS.length,16);assert.equal(C.ENCOUNTERS.length,3);
  const all=[...C.TEAMS,...C.COURTS,...C.ENCOUNTERS];assert.equal(new Set(all.map(item=>item.id)).size,34);
  assert.equal(new Set(F.STATIONS.map(station=>station.id)).size,16);assert.equal(new Set(F.STATIONS.map(station=>station.arenaId)).size,16);
  for(const station of F.STATIONS){assert.equal(station.arenaId,C.getLandmark("nba",station.teamId).arenaId);assert.equal(station.historical,true);assert.match(station.label,/代表球星.*隊史/);}
  for(const item of all){assert.ok(item.x>80&&item.x<C.MAP.width-80);assert.ok(item.y>70&&item.y<C.MAP.height-70);}
  for(const place of C.ENCOUNTERS){assert.equal(C.getLandmark("court",place.id),null);assert.equal(C.getLandmark("nba",place.id),null);assert.equal(fs.readFileSync(path.join(__dirname,"..",place.background),"utf8").trim(),F.encounterSVG(place.id));}
  for(const id of ["spurs","thunder","suns","timberwolves","bucks","sixers","heat","raptors"]){const match=C.gameForTeam(id,"live");assert.ok(match.id);assert.equal(match.glowing,match.homeId===id);assert.equal(C.gameForTeam(id,"final").glowing,false);}
});
test("Taiwan date changes at UTC 16:00 independently of host timezone", () => {
  assert.equal(F.taiwanDate(Date.parse("2026-11-24T15:59:59Z")),"2026-11-24");
  assert.equal(F.taiwanDate(Date.parse("2026-11-24T16:00:00Z")),"2026-11-25");
  assert.equal(F.validDateKey("2028-02-29"),true);assert.equal(F.validDateKey("2026-02-29"),false);assert.equal(F.validDateKey("2026-11-31"),false);
  assert.throws(()=>F.dailyEncounter("bad"),/Invalid encounter date/);
});
test("same-day schedule is deterministic; every star appears once per 16 days without starvation", () => {
  assert.deepEqual(F.dailyEncounter(day),F.dailyEncounter(day));assert.deepEqual(F.dailyEncounter(day),{date:day,teamId:"warriors",starId:"curry",locationId:"meet-pier"});
  const entries=Array.from({length:48},(_,index)=>F.dailyEncounter(new Date(Date.parse(day)+index*86400000).toISOString().slice(0,10)));
  for(let start=0;start<32;start++)assert.equal(new Set(entries.slice(start,start+16).map(item=>item.starId)).size,16);
  for(let i=1;i<entries.length;i++){assert.notEqual(entries[i].starId,entries[i-1].starId);assert.notEqual(entries[i].locationId,entries[i-1].locationId);}
  for(const station of F.STATIONS){const visits=entries.filter(item=>item.starId===station.starId);assert.equal(visits.length,3);assert.equal(new Set(visits.map(item=>item.locationId)).size,3);}
});
test("test date overrides work only on file and loopback URLs; public Pages always uses today", () => {
  const now=Date.parse("2026-11-24T06:00:00Z");
  for(const base of ["file:///project/index.html","http://localhost:8000/","http://127.0.0.1:8000/"]){const config=F.encounterDateConfig(base+"?encounterDate=2026-01-01",now);assert.equal(config.date,day);assert.equal(config.isTest,true);}
  const published=F.encounterDateConfig("https://larinastudy01-lab.github.io/nba-policy-island/?encounterDate=2026-01-01",now);assert.equal(published.canTest,false);assert.equal(published.isTest,false);assert.equal(published.date,"2026-11-24");
  assert.equal(F.encounterDateConfig("file:///index.html?encounterDate=bad",now).isTest,false);
});
test("legacy v1 home album migrates without losing avatar, old content or unrelated policy progress", () => {
  const home=F.createPhoto("warriors",{...F.DEFAULT_AVATAR,nickname:"舊版球迷",number:"07"},{pose:"ball",capturedAt:timestamp});
  const storage=memory({[F.AVATAR_KEY]:JSON.stringify({version:1,avatar:home.avatar}),[F.ALBUM_KEY]:JSON.stringify({version:1,photos:[home]}),"nba-policy-island:policy-progress:v1":"untouched"});
  const session=F.createFanSession(storage);assert.deepEqual(session.getState().album.warriors,home);assert.equal(session.getState().saved.nickname,"舊版球迷");assert.equal(session.getState().encounterCollected,0);
  session.collect(F.createEncounterPhoto(F.dailyEncounter(day),home.avatar,{capturedAt:timestamp}));
  const saved=JSON.parse(storage.getItem(F.ALBUM_KEY));assert.equal(saved.version,2);assert.deepEqual(saved.photos,[home]);assert.equal(saved.encounters.length,1);assert.equal(storage.getItem("nba-policy-island:policy-progress:v1"),"untouched");
  const restored=F.createFanSession(storage).getState();assert.equal(restored.collected,1);assert.equal(restored.encounterCollected,1);assert.deepEqual(restored.album.warriors,home);
});
test("same star's home and encounter photos coexist, encounter retakes count once by star ID", () => {
  const session=F.createFanSession(memory()), encounter=F.dailyEncounter(day), home=F.createPhoto("warriors",F.DEFAULT_AVATAR,{capturedAt:timestamp});
  session.collect(home);session.collect(F.createEncounterPhoto(encounter,F.DEFAULT_AVATAR,{capturedAt:timestamp}));
  const nextVisit=F.dailyEncounter("2026-01-17");assert.equal(nextVisit.starId,"curry");assert.notEqual(nextVisit.locationId,encounter.locationId);
  session.collect(F.createEncounterPhoto(nextVisit,{...F.DEFAULT_AVATAR,nickname:"重拍偶遇"},{pose:"ball",capturedAt:"2026-01-17T04:00:00Z"}));
  const state=session.getState();assert.equal(state.collected,1);assert.equal(state.encounterCollected,1);assert.deepEqual(state.album.warriors,home);assert.equal(state.encounters.curry.locationId,nextVisit.locationId);assert.equal(state.encounters.curry.avatar.nickname,"重拍偶遇");
});
test("old encounter snapshots retain clothes, location, date and export composition after a new day", () => {
  const session=F.createFanSession(memory()), record=F.createEncounterPhoto(F.dailyEncounter(day),{...F.DEFAULT_AVATAR,nickname:"當時的我"},{pose:"ball",capturedAt:timestamp});
  session.collect(record);const original=F.photoSVG(record);session.edit({nickname:"隔天換裝",jersey:"raptors"});session.save();F.dailyEncounter("2026-01-02");record.avatar.nickname="外部修改";
  assert.equal(F.photoSVG(session.getState().encounters.curry),original);assert.match(original,/碼頭步道/);assert.match(original,/當時的我/);assert.doesNotMatch(original,/<image|foreignObject|href=/);
  const fake={...F.dailyEncounter(day),starId:"jordan"};assert.throws(()=>F.createEncounterPhoto(fake,F.DEFAULT_AVATAR),/Invalid daily encounter/);
  assert.equal(F.normalizePhoto({...session.getState().encounters.curry,locationId:"warriors"}),null);
});
