"use strict";
// 純本地向量產生器，不使用圖片服務或瀏覽器。
const fs=require("node:fs"),path=require("node:path"),B=require("./bay-scene.js");
for(const [file,markup] of [
  ["bay-ground.svg",B.groundSVG()],
  ["bay-lights.svg",B.lightsSVG()],
  ...["arena","pier","court"].map(part=>[`bay-foreground-${part}.svg`,B.foregroundSVG(part)])
])fs.writeFileSync(path.join(__dirname,file),markup,"utf8");
process.stdout.write("Generated 5 original bay SVG layers.\n");
