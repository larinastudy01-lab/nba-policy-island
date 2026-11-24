"use strict";
// 原創 SVG 向量素材產生器；只讀寫本專案，不需要套件或網路。
const fs = require("node:fs");
const path = require("node:path");
const Fan = require("./fan-core.js");
for (const folder of ["stars", "arenas", "encounters"]) fs.mkdirSync(path.join(__dirname, folder), { recursive: true });
for (const station of Fan.STATIONS) {
  fs.writeFileSync(path.join(__dirname, "stars", `${station.starId}.svg`), Fan.starSVG(station.teamId) + "\n", "utf8");
  fs.writeFileSync(path.join(__dirname, "arenas", `${station.teamId}.svg`), Fan.arenaSVG(station.teamId) + "\n", "utf8");
}
const Island = require("./island-core.js");
for (const place of Island.ENCOUNTERS) fs.writeFileSync(path.join(__dirname, "encounters", `${place.id}.svg`), Fan.encounterSVG(place.id) + "\n", "utf8");
console.log(`Generated ${Fan.STATIONS.length} stars, ${Fan.STATIONS.length} arenas and ${Island.ENCOUNTERS.length} encounter backgrounds.`);
