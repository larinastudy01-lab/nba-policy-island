'use strict';
// 原創像素周邊插畫與店面，無外部圖像、隊徽或字型。
const P=require('./pixel-core.js'),S=require('./shop-core.js'),fs=require('node:fs'),path=require('node:path');
function storefront(shop,night=false){const t=new P.Tile(48,42),glass=night?'#f3d296':'#8cb3bd';
  if(shop.teamId==='warriors'){
    t.ellipse(25,36,22,4,'#48615d');P.block(t,20,16,24,18,10,'#c7c5ab');t.polygon([[3,13],[20,5],[44,17],[27,25]],'#7c9eac');t.line(3,13,27,25,'#c8d5c4');
    t.polygon([[3,19],[27,31],[27,36],[3,24]],'#27598a');t.polygon([[27,31],[44,23],[44,33],[27,41]],'#506e7c');
    t.polygon([[1,18],[25,30],[29,27],[5,15]],'#f2c459');t.line(1,20,25,32,'#ffe298',2);t.line(25,30,44,21,'#e8b44f',2);
    t.polygon([[6,26],[13,29],[13,35],[6,32]],glass);t.polygon([[17,30],[24,33],[24,40],[17,37]],'#183e57');t.line(18,31,22,33,glass);t.dot(22,36,'#e6c36c');
    // 店外掛衣是場景識別道具，不更改玩家既有的服裝圖層。
    t.line(32,26,39,23,'#c9c9ac');t.polygon([[32,26],[34,25],[35,27],[37,24],[40,25],[40,28],[38,29],[38,35],[33,37],[33,30],[31,30]],'#2464b9');t.line(34,29,37,28,'#f3c45b');t.rect(35,30,2,3,'#edce70');
    t.line(18,39,25,42,'#d6d0b8',2);if(night){t.polygon([[17,38],[25,41],[30,42],[17,42]],'#d5c394');t.rect(6,23,6,1,'#ffe1a0');}return t;
  }
  t.ellipse(25,36,21,4,'#304b53');P.block(t,20,17,24,18,12,'#a1afa3');t.polygon([[3,12],[20,4],[44,16],[27,24]],'#aeb7a7');t.line(4,12,27,23,'#cfd0b5');t.polygon([[2,18],[25,29],[25,34],[2,23]],shop.color);for(let i=0;i<6;i++)t.line(4+i*4,19+i*2,4+i*4,23+i*2,i%2?shop.accent:shop.color,2);t.rect(9,18,10,5,shop.color);t.line(10,18,18,22,shop.accent);t.polygon([[27,25],[42,18],[42,29],[27,36]],glass);t.line(33,23,33,32,'#4c6973');t.rect(35,23,4,8,'#304c5d');t.rect(36,24,2,4,glass);for(let i=0;i<3;i++)t.line(32+i*2,35+i,42+i,30+i,'#c9c7aa',2);t.ellipse(18,27,3,3,shop.accent);t.line(16,26,20,29,shop.color);if(night){t.polygon([[32,36],[41,31],[48,36],[39,41]],'#c7be91');t.rect(7,16,3,1,'#ffe5a5');}return t;}
function product(item){const shop=S.getShop(item.shopId),t=new P.Tile(48,48),c=shop.color,a=shop.accent;t.ellipse(25,39,19,4,'#29434f');
  if(item.type==='cap'){t.ellipse(23,27,16,9,c);t.ellipse(22,23,13,10,c);t.polygon([[10,28],[25,31],[42,26],[40,33],[25,37]],a);t.line(23,14,23,26,'#a6b5ab');t.rect(20,20,7,5,a);}
  if(item.type==='mini-ball'){t.ellipse(24,24,16,16,a);t.line(10,16,38,32,c,2);t.line(14,37,33,11,c,2);t.line(9,25,20,22,c);t.line(20,22,26,9,c);t.line(38,15,29,25,c);t.line(29,25,28,39,c);}
  if(item.type==='scarf'){t.polygon([[7,10],[35,19],[39,29],[12,21]],c);t.polygon([[11,19],[22,23],[17,41],[7,36]],a);t.polygon([[29,20],[39,23],[38,40],[27,36]],c);for(let i=0;i<4;i++){t.line(8+i*3,35,7+i*3,41,c);t.line(28+i*3,36,28+i*3,42,a);}t.line(12,13,33,20,a,3);}
  if(item.type==='poster'){t.polygon([[8,6],[39,11],[38,39],[7,34]],'#b4b6a1');t.polygon([[10,8],[37,13],[36,36],[9,32]],c);t.ellipse(24,23,8,8,a);t.line(16,22,31,26,c);t.line(23,16,24,30,c);t.line(14,11,33,15,a,2);t.line(14,31,31,34,'#d5d8bd');}return t;
}
if(require.main===module){const dir=path.join(__dirname,'shops');fs.mkdirSync(dir,{recursive:true});for(const shop of S.SHOPS)for(const night of [false,true])fs.writeFileSync(path.join(dir,shop.id+(night?'-night':'')+'.svg'),storefront(shop,night).svg(shop.name+'・原創等距像素店鋪'));for(const item of S.PRODUCTS)fs.writeFileSync(path.join(dir,item.assetId+'.svg'),product(item).svg(item.name+'・原創像素商品'));console.log('Generated 4 storefront SVGs + 8 original product SVGs');}
module.exports={storefront,product};
