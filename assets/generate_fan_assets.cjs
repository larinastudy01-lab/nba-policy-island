"use strict";
// 原創 SVG 向量素材產生器；只讀寫本專案，不需要套件或網路。
const fs = require("node:fs");
const path = require("node:path");
const Fan = require("./fan-core.js");
for (const folder of ["stars", "arenas"]) fs.mkdirSync(path.join(__dirname, folder), { recursive: true });
for (const station of Fan.STATIONS) {
  fs.writeFileSync(path.join(__dirname, "stars", `${station.starId}.svg`), Fan.starSVG(station.teamId) + "\n", "utf8");
  fs.writeFileSync(path.join(__dirname, "arenas", `${station.teamId}.svg`), Fan.arenaSVG(station.teamId) + "\n", "utf8");
}
console.log("Generated 8 original star illustrations and 8 arena backgrounds.");
