// Original project-native SVG, no external artwork or downloads.
const fs=require("node:fs"),path=require("node:path");
const S=require("./sights-core.js"),T=require("./traffic-core.js");
for(const folder of ["sights","cars"])fs.mkdirSync(path.join(__dirname,folder),{recursive:true});
for(const s of S.SIGHTS)for(const night of [false,true])fs.writeFileSync(path.join(__dirname,"sights",`${s.key}${night?"-night":""}.svg`),S.svg(s.id,night));
for(const car of T.CARS)for(const view of ["front","side","rear"])fs.writeFileSync(path.join(__dirname,"cars",`${car.id}-${view}.svg`),T.svg(car.id,view));
fs.writeFileSync(path.join(__dirname,"traffic-roads.svg"),T.roadSVG());
fs.writeFileSync(path.join(__dirname,"scenery-ground.svg"),S.groundSVG());
console.log(`Generated ${S.SIGHTS.length} landmark day/night pairs, ${T.CARS.length} cars × 3 views, ${T.ROUTES.length} separate traffic lanes.`);
