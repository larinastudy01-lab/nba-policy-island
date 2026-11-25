/* Repository-native pixel tiles: 30 separate shores, one legible sea highway. */
const P=require('./pixel-core.js'),A=require('./archipelago-core.js');
const W=A.MAP.width/2,H=A.MAP.height/2;
const palettes={bay:['#97b997','#63857e'],la:['#d5c49b','#9a977c'],sand:['#d9b984','#a08561'],rock:['#adad8d','#787f72'],forest:['#93b89b','#577f75'],plains:['#b7bf8e','#7b9279'],city:['#b1bbb4','#758c88'],lake:['#a1c2ae','#658f89'],brick:['#c4b8a2','#8c8b7f'],beach:['#e2cea2','#9ea788']};
const poly=(t,points,c)=>t.polygon(points.map(p=>[p.x/2,p.y/2]),c);
function art(){
  const terrain=new P.Tile(W,H),ground=new P.Tile(W,H),scenery=new P.Tile(W,H),lights=new P.Tile(W,H),frontArena=new P.Tile(W,H),frontPier=new P.Tile(W,H),frontCourt=new P.Tile(W,H);
  terrain.rect(0,0,W,H,'#408aa2');
  for(let y=12;y<H;y+=22)for(let x=(y%44?12:0);x<W;x+=48){terrain.line(x,y,x+11,y,'#549caf');terrain.dot(x+15,y+1,'#4a93a7');}
  for(const island of A.ISLANDS){
    const c=A.coast(island),[top,wall]=palettes[island.theme],x=island.x/2,y=island.y/2;
    poly(terrain,c.map(p=>({x:p.x+13,y:p.y+18})),'#2c6a82');
    poly(terrain,c.map(p=>({x:p.x,y:p.y+12})),wall);
    poly(terrain,c.map(p=>({x:p.x,y:p.y+3})),'#e0d4ad');poly(terrain,c,top);
    for(let i=6;i<c.length-1;i++){const a=c[i],b=c[i+1];terrain.line(a.x/2,a.y/2+7,b.x/2,b.y/2+7,'#738f83');}
    if(island.teamId==='warriors'){require('./warriors-bay-art.cjs').paint({ground,lights,frontArena,frontPier,frontCourt});continue;}
    // Arena plaza is broad and kept empty; forecourt connects to the island street.
    ground.polygon([[x-54,y+4],[x-12,y-16],[x+48,y+13],[x+8,y+37]],island.theme==='city'?'#b9c2b7':'#c2c8ae');
    for(let k=0;k<4;k++)ground.line(x-37+k*12,y+12-k*2,x+6+k*9,y+34-k*2,'#a0b0a3');
    ground.line(x+14,y+17,x+31,y+25,'#e6dec1',3);ground.line(x+14,y+20,x+31,y+28,'#9fae9f',2);
    // Small shops sit behind the main street, away from the arena entrance.
    for(const [dx,dy,h]of [[55,-28,17],[70,-10,13]]){if(dx===55&&A.SHOP_PLACES['shop-'+island.teamId])continue;P.block(ground,x+dx,y+dy,15,12,h,island.theme==='brick'?'#b77c64':island.theme==='city'?'#7a95a7':'#aeb5a0');ground.line(x+dx-7,y+dy-1,x+dx+4,y+dy+4,'#6b9daa',2);lights.line(x+dx-7,y+dy-1,x+dx+4,y+dy+4,'#ffdf95',2);}
    for(const [dx,dy]of [[-67,-34],[31,-45],[70,36]]){if(['sand','beach','la'].includes(island.theme)){ground.line(x+dx,y+dy,x+dx,y+dy-16,'#8f8260',2);ground.line(x+dx,y+dy-15,x+dx-7,y+dy-19,'#668e6a',2);ground.line(x+dx,y+dy-15,x+dx+7,y+dy-17,'#80a574',2);}else P.tree(ground,x+dx,y+dy);}
    lights.ellipse(x+21,y+27,11,4,'#c3c09a');lights.line(x+15,y+23,x+31,y+31,'#ffedc7',2);
    if(['sand','rock'].includes(island.theme)){ground.polygon([[x-76,y-24],[x-71,y-42],[x-61,y-34],[x-58,y-21]],'#b58a67');ground.polygon([[x-76,y-24],[x-71,y-42],[x-67,y-23]],'#d5b087');}
    if(island.teamId==='bulls'){ground.polygon([[x-80,y+28],[x-51,y+15],[x-30,y+28],[x-60,y+43]],'#d6d6c0');for(let k=0;k<3;k++)ground.line(x-76+k*7,y+30-k*3,x-55+k*7,y+40-k*3,'#a7b9af');}
    if(island.teamId==='knicks'){for(let k=0;k<3;k++){ground.polygon([[x-67+k*7,y+29+k*3],[x-61+k*7,y+26+k*3],[x-59+k*7,y+28+k*3],[x-65+k*7,y+31+k*3]],'#ecdfb8');}P.block(ground,x-67,y-15,10,9,17,'#748fa5');}
  }
  // Coast and road geometry share the same authoritative thirty-island world.
  return {'island-map':terrain,'bay-ground':ground,'scenery-ground':scenery,'bay-lights':lights,'bay-foreground-arena':frontArena,'bay-foreground-pier':frontPier,'bay-foreground-court':frontCourt};
}
function roads(night=false){
  const t=new P.Tile(W,H);
  for(const e of A.ROAD_EDGES){const a=A.ROAD_NODES[e.from],b=A.ROAD_NODES[e.to],len=Math.hypot(b.x-a.x,b.y-a.y);if(!len)continue;
    const bay=e.islandId==='island-warriors',wide=bay?(e.surface==='wood'?16:e.memory?9:e.shop?16:24):e.trunk?11:e.bridge?8:5,deck=night?'#839c9d':e.surface==='wood'?'#c9ad7c':bay?'#ccd1c6':e.trunk?'#a4b9b8':'#c4cbb2';
    t.line(a.x/2,a.y/2+4,b.x/2,b.y/2+4,'#375d70',wide+3);t.line(a.x/2,a.y/2,b.x/2,b.y/2,deck,wide);
    if(e.bridge){for(const sign of [-1,1]){const nx=-(b.y-a.y)/len*wide/2*sign,ny=(b.x-a.x)/len*wide/2*sign;t.line(a.x/2+nx,a.y/2+ny,b.x/2+nx,b.y/2+ny,night?'#e8ce91':'#e1d7b7');}for(let d=30;d<len;d+=75){const f=d/len,x=(a.x+(b.x-a.x)*f)/2,y=(a.y+(b.y-a.y)*f)/2;t.line(x,y+3,x,y+14,'#577b82',2);}}
    for(let d=12;d<len;d+=e.trunk?22:18){const f=d/len,x=(a.x+(b.x-a.x)*f)/2,y=(a.y+(b.y-a.y)*f)/2;if(!bay)t.dot(x,y,e.trunk?'#f1d59d':'#e2d9b6');else if(e.surface==='wood')t.line(x-5,y-2,x+5,y+2,'#a58b65');else t.line(x-3,y-1,x+3,y+1,'#b3c0b6');}
    if(!bay)for(let d=25;d<len;d+=70){const f=d/len,x=(a.x+(b.x-a.x)*f)/2+5,y=(a.y+(b.y-a.y)*f)/2;t.line(x,y,x,y-8,'#57767c');t.rect(x,y-9,3,1,night?'#ffe5a2':'#cdd2b9');if(night)t.ellipse(x+1,y+2,6,2,'#b4b591');}
  }
  return t;
}
function lanes(){const t=new P.Tile(W,H);for(const r of A.CAR_ROUTES){const T=require('./traffic-core.js');const track=T.tracks.get(r.id);for(const seg of track.segments){t.line(seg.a.x/2,seg.a.y/2+3,seg.b.x/2,seg.b.y/2+3,'#3d606e',12);t.line(seg.a.x/2,seg.a.y/2,seg.b.x/2,seg.b.y/2,'#758e91',10);}for(let d=0;d<track.length;d+=24){const p=T.sample(r.id,d);t.dot(p.x/2,p.y/2,'#e5c98d');}}return t;}
module.exports={art,roads,lanes};
