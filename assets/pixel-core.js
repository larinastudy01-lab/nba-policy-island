/* 原創等距像素圖塊：整數格繪圖、2:1 投影、左上受光；無 Canvas/套件依賴。 */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.NBAPixel=api;})(globalThis,function(){
  "use strict";
  const SPEC={version:"pixel-v1",worldPixel:2,projection:[2,1],light:"north-west",shadow:[4,3],frame:[16,24],foot:[8,22],topAnchor:[4,10],topBounds:[4,10,9,7],chest:[8,13],directions:["e","se","s","sw","w","nw","n","ne"],columns:["idle","walk-0","walk-1","walk-2","walk-3"],frameMs:150,sheet:[80,192]};
  const ARENAS={warriors:"low-oval",lakers:"dome",clippers:"glass",nuggets:"sawtooth",mavericks:"steps",bulls:"brick",celtics:"dome",knicks:"glass",spurs:"low-oval",thunder:"sawtooth",suns:"steps",timberwolves:"sawtooth",bucks:"brick",sixers:"steps",heat:"glass",raptors:"brick"};
  Object.assign(ARENAS,{nets:'brick',cavaliers:'glass',jazz:'sawtooth',rockets:'low-oval',blazers:'steps',kings:'dome',grizzlies:'brick',pelicans:'steps',pistons:'sawtooth',pacers:'low-oval',wizards:'steps',hawks:'brick',hornets:'glass',magic:'dome'});
  const MODELS=["low-oval","dome","glass","sawtooth","steps","brick"];
  // 本地 80×66 球館圖格座標；總覽錨定屋頂，近景落在屋頂前緣看板。
  const ARENA_BRANDING={
    "low-oval":{roof:[40,34],sign:[56,33,12,9]},
    dome:{roof:[40,34],sign:[45,28,15,12]},
    glass:{roof:[40,34],sign:[46,25,16,12]},
    sawtooth:{roof:[40,34],sign:[42,29,14,10]},
    steps:{roof:[40,34],sign:[37,27,14,10]},
    brick:{roof:[40,34],sign:[45,29,14,10]}
  };
  const ARENA_ROOF_POINTS={knicks:[40,36],bulls:[40,36],cavaliers:[40,36],mavericks:[40,36],magic:[40,36],sixers:[40,42],pacers:[55,34],spurs:[55,34],grizzlies:[55,31],rockets:[55,34],pelicans:[55,34],heat:[55,33]};
  function arenaBranding(team){const spec=ARENA_BRANDING[ARENAS[team.id]];if(!spec)throw new RangeError('Unknown arena branding');return {roof:[...(ARENA_ROOF_POINTS[team.id]||spec.roof)],sign:[...spec.sign]};}
  const PEOPLE=["short-cap","tall-curls","backpack","ponytail","hoodie","senior","ball-fan","seated"];
  const xml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[c]);
  class Tile{
    constructor(width,height){this.width=width;this.height=height;this.pixels=Array(width*height).fill(null);}
    dot(x,y,c){x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<this.width&&y<this.height)this.pixels[y*this.width+x]=c;return this;}
    rect(x,y,w,h,c){for(let j=Math.round(y);j<Math.round(y+h);j++)for(let i=Math.round(x);i<Math.round(x+w);i++)this.dot(i,j,c);return this;}
    line(x,y,u,v,c,width=1){const steps=Math.ceil(Math.max(Math.abs(u-x),Math.abs(v-y)));for(let i=0;i<=steps;i++){const t=steps?i/steps:0;this.rect(Math.round(x+(u-x)*t)-Math.floor(width/2),Math.round(y+(v-y)*t)-Math.floor(width/2),width,width,c);}return this;}
    polygon(points,c){const top=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1])))),bottom=Math.min(this.height-1,Math.ceil(Math.max(...points.map(p=>p[1]))));for(let y=top;y<=bottom;y++){const xs=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]<=y+.5&&b[1]>y+.5)||(b[1]<=y+.5&&a[1]>y+.5))xs.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i+=2)for(let x=Math.ceil(xs[i]-.5);x<xs[i+1]-.5;x++)this.dot(x,y,c);}return this;}
    ellipse(x,y,rx,ry,c){for(let j=Math.floor(y-ry);j<=y+ry;j++)for(let i=Math.floor(x-rx);i<=x+rx;i++)if(((i-x)/rx)**2+((j-y)/ry)**2<=1)this.dot(i,j,c);return this;}
    paste(tile,x=0,y=0){for(let j=0;j<tile.height;j++)for(let i=0;i<tile.width;i++){const c=tile.pixels[j*tile.width+i];if(c)this.dot(x+i,y+j,c);}return this;}
    markup(){let result="";for(let y=0;y<this.height;y++)for(let x=0;x<this.width;){const c=this.pixels[y*this.width+x];if(!c){x++;continue;}let end=x+1;while(end<this.width&&this.pixels[y*this.width+end]===c)end++;result+=`<rect x="${x}" y="${y}" width="${end-x}" height="1" fill="${c}"/>`;x=end;}return result;}
    svg(title="像素圖塊"){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${this.height}" shape-rendering="crispEdges" role="img"><title>${xml(title)}</title>${this.markup()}</svg>`;}
  }
  function shade(c,n){return '#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(c.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');}
  function block(t,x,y,w,d,h,color){const roof=[[x,y-h],[x+w,y+d/2-h],[x+w-d,y+d-h],[x-d,y+d/2-h]];t.polygon([[x-d,y+d/2-h],[x+w-d,y+d-h],[x+w-d,y+d],[x-d,y+d/2]],shade(color,-30));t.polygon([[x+w-d,y+d-h],[x+w,y+d/2-h],[x+w,y+d/2],[x+w-d,y+d]],shade(color,-55));t.polygon(roof,color);}
  function arena(team,night=false){
    const model=ARENAS[team.id];if(!model)throw new RangeError("Unknown pixel arena");const t=new Tile(80,66),c=team.expansion?'#718c96':team.color,a=team.expansion?'#b8b9a5':team.accent,glass=night?"#f5d998":"#93c6cf",dark="#263c50";
    t.ellipse(42,48,33,12,"#24404a");t.polygon([[6,38],[39,21],[73,38],[40,55]],"#a7b3a0");t.line(9,40,40,55,"#d4c89e");
    if(model==="low-oval"){t.ellipse(40,33,32,14,shade(c,-48));t.rect(8,29,65,7,shade(c,-28));t.ellipse(40,27,32,14,a);t.ellipse(40,25,30,13,c);t.ellipse(37,22,25,10,shade(c,25));for(let x=17;x<64;x+=6)t.rect(x,34,3,7,glass);t.polygon([[50,35],[65,29],[65,40],[50,47]],glass);}
    if(model==="dome"){block(t,38,26,31,27,12,shade(c,-8));t.ellipse(40,23,29,18,a);t.ellipse(40,21,27,17,c);t.ellipse(36,15,20,10,shade(c,30));for(let x=18;x<65;x+=7)t.line(x,32,x,37,glass,2);for(let x=25;x<60;x+=8)t.line(x,7,x-5,22,shade(c,45));}
    if(model==="glass"){block(t,35,20,36,28,15,c);t.polygon([[7,20],[43,38],[43,51],[7,33]],"#5dabb4");t.polygon([[43,38],[71,24],[71,37],[43,51]],night?"#dfbf80":"#316c89");for(let x=11;x<43;x+=5)t.line(x,23+(x-11)/2,x,35+(x-11)/2,dark);t.line(7,29,43,47,glass);t.polygon([[7,17],[35,3],[71,21],[43,35]],shade(c,30));}
    if(model==="sawtooth"){block(t,35,25,36,28,12,c);for(let i=0;i<4;i++){const x=9+i*12;t.polygon([[x,22+i%2],[x+10,7+i%2],[x+21,22+i%2],[x+11,29+i%2]],i%2?shade(c,20):shade(c,40));t.line(x+10,8,x+20,22,a);}for(let i=0;i<5;i++)t.rect(17+i*8,34,3,5,glass);}
    if(model==="steps"){block(t,34,29,39,28,10,shade(c,-5));block(t,36,23,29,22,12,c);block(t,38,15,19,14,11,shade(c,30));for(let i=0;i<4;i++)t.polygon([[47+i,42+i*2],[64+i,34+i*2],[68+i,36+i*2],[51+i,45+i*2]],i%2?"#cfccb0":"#909c92");for(let x=16;x<48;x+=6)t.rect(x,36,3,5,glass);}
    if(model==="brick"){block(t,34,20,39,28,15,"#a57565");t.polygon([[6,18],[34,4],[73,23],[45,37]],c);for(let row=0;row<4;row++)for(let col=0;col<5;col++)t.line(9+col*6+(row%2?2:0),25+row*3+col*3,12+col*6+(row%2?2:0),26+row*3+col*3,"#cfaa8c");for(let i=0;i<4;i++)t.rect(19+i*7,28+i*3,3,6,glass);t.rect(50,34,4,10,dark);}
    // 每館的入口、售票窗、排隊欄和招牌有實體像素，與互動終點接近。
    t.rect(57,39,5,7,dark);t.rect(57,38,5,1,a);for(let i=0;i<3;i++)t.line(57+i*2,47+i,67+i*2,42+i,"#d5cfaf");t.rect(17,38,8,4,dark);t.rect(18,38,6,2,glass);t.line(40,49,48,53,"#718d91");t.line(40,47,40,50,"#d8cfab");t.line(48,51,48,54,"#d8cfab");
    if(team.expansion){const variant=Object.keys(ARENAS).indexOf(team.id)%4;t.rect(25,29,17,5,team.color);t.line(26,29,41,29,team.accent);t.line(69,31,69,44,'#7c8e8d');t.polygon([[69,31],[76,34],[69,36]],team.color);if(variant===0){t.rect(52,35,12,2,team.color);t.line(54,35,54,44,team.accent);t.line(63,35,63,40,team.accent);}if(variant===1){t.line(49,46,64,39,team.color,2);t.line(49,49,66,41,'#d4cbb5',2);}if(variant===2){t.rect(56,32,10,2,team.color);t.rect(57,34,2,8,'#a4b5b0');t.rect(64,34,2,6,'#a4b5b0');}if(variant===3){t.polygon([[50,37],[62,31],[68,35],[56,41]],team.color);t.line(53,40,65,34,team.accent);}}
    if(night){t.polygon([[57,44],[63,41],[73,47],[63,52]],"#c5ba86");for(let x=16;x<53;x+=8)t.rect(x,33,2,3,"#e9ce8b");}
    return t;
  }
  function court(type,night=false){
    const t=new Tile(55,64),ink="#cbd4bc",surface={harbor:"#477c8b",park:"#4e8975",roof:"#5d6f98"}[type];if(!surface)throw new RangeError("Unknown court scene");t.ellipse(28,43,25,8,"#203b48");block(t,23,27,27,21,type==="roof"?16:4,type==="roof"?"#65748e":"#819886");
    const iso=(x,y)=>[27+x-y,24+(x+y)/2];t.polygon([iso(-14,-10),iso(14,-10),iso(14,10),iso(-14,10)],surface);
    const l=(a,b)=>t.line(...iso(...a),...iso(...b),ink);l([-14,-10],[14,-10]);l([14,-10],[14,10]);l([14,10],[-14,10]);l([-14,10],[-14,-10]);l([0,-10],[0,10]);for(const s of [-1,1]){l([s*14,-4],[s*7,-4]);l([s*7,-4],[s*7,4]);l([s*7,4],[s*14,4]);}t.ellipse(27,24,4,2,ink);t.ellipse(27,24,3,1,surface);
    for(const [x,y]of [[10,19],[43,31]]){t.line(x,y,x,y-12,"#a7c4c8");t.rect(x-4,y-14,8,4,ink);t.line(x-2,y-10,x+3,y-10,"#e8bd65");}
    if(type==="harbor"){block(t,9,40,14,8,10,"#b66e5b");for(let x=3;x<15;x+=3)t.line(x,35,x,43,"#e0a17d");t.line(4,46,23,55,"#baad8e");for(let x=4;x<24;x+=5)t.line(x,44+(x-4)/2,x,48+(x-4)/2,"#c3c6a4");t.ellipse(8,51,3,2,"#e39b69");t.ellipse(8,51,1,1,"#314f61");t.rect(22,50,2,3,"#637479");}
    if(type==="park"){tree(t,7,31);tree(t,45,18);t.line(5,45,28,57,"#b7b59a",3);t.line(33,44,43,49,"#b2966d",2);t.rect(35,46,1,4,"#59665f");t.rect(42,49,1,3,"#59665f");t.rect(30,45,3,5,"#8aaab0");t.rect(29,44,5,1,ink);}
    if(type==="roof"){for(let i=0;i<5;i++){const x=5+i*10;t.line(x,36,x,45,"#a8bec2");if(i<4)t.line(x,36,x+10,41,"#a8bec2");}block(t,39,12,11,9,10,"#829397");t.rect(37,6,5,2,"#b2c4c0");t.rect(35,8,4,3,"#475969");for(let i=0;i<4;i++)t.rect(4+i*12,5-(i%2)*3,7,10+i%3,"#304b66");}
    t.line(3,25,3,10,"#8daeb6");t.rect(1,9,6,2,night?"#e1f4e8":"#95afb0");t.line(49,41,49,26,"#8daeb6");t.rect(47,25,6,2,night?"#e1f4e8":"#95afb0");if(night){t.line(7,17,12,19,"#bfd5c2");t.line(43,36,47,38,"#bfd5c2");}return t;
  }
  function tree(t,x,y){t.ellipse(x+2,y+2,7,3,"#254a47");t.rect(x,y-7,2,8,"#77634e");t.polygon([[x-6,y-8],[x+1,y-21],[x+8,y-8]],"#366753");t.polygon([[x-6,y-8],[x+1,y-21],[x+1,y-8]],"#5f9670");}
  const SKIN={peach:"#e6b590",sand:"#c9926f",bronze:"#ad7755",brown:"#805338",deep:"#593c32"},HAIR={ink:"#263341",chestnut:"#6d4938",honey:"#b99966",silver:"#b4c1bd",blue:"#4c7895"};
  function direction(dx,dy,fallback="se"){if(Math.hypot(dx,dy)<.001)return fallback;return SPEC.directions[(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];}
  function actor(value={},options={}){
    const {direction:dir="se",frame=0,walking=false,model="ball-fan",pose="stand",star=false,teamColor="#597d83",accent="#d3cfac"}=options;
    const body=new Tile(16,24),top=new Tile(16,24),skin=SKIN[value.skin]||SKIN.sand,hair=HAIR[value.hairColor]||HAIR.ink,back=["nw","n","ne"].includes(dir),left=["w","sw","nw"].includes(dir),phase=walking?[0,1,0,-1][Math.abs(frame)%4]:0,short=model==="short-cap",tall=model==="tall-curls",offset=short?2:tall?-1:0,head=4+offset,hips=(model==="seated"||options.seated)?17:18;
    const shoes={white:"#c4cfbd",gold:"#d8b876",blue:"#5488a5",rose:"#b78389"}[value.shoes]||"#c4cfbd";
    body.ellipse(8,22,6,1,"#28404a");body.rect(5,hips,3,3+phase,"#3b4c5d");body.rect(9,hips,3,3-phase,"#293b50");body.rect(4,21+Math.max(0,phase),4,1,shoes);body.rect(9,21+Math.max(0,-phase),4,1,shade(shoes,-15));if(model==="seated"||options.seated){body.rect(5,18,7,2,"#384c5d");body.rect(11,19,2,3,"#c6d0bd");}
    body.rect(5,head,7,6,skin);body.rect(4,head+2,9,3,skin);body.rect(5,head-1,7,2,hair);if(value.hair!=="shaved")body.rect(left?5:10,head,2,3,hair);if(value.hair==="curls"||tall){body.rect(4,head-1,2,2,hair);body.rect(8,head-2,3,2,hair);}if(value.hair==="bun"||model==="ponytail")body.rect(11,head-2,3,3,hair);if(value.hair==="braids")body.rect(4,head+1,1,6,hair);
    if(!back){body.dot(left?6:10,head+3,"#203240");if(dir==="s")body.dot(6,head+3,"#203240");if(dir==="e"||dir==="w")body.dot(dir==="e"?13:3,head+3,skin);body.dot(8,head+5,"#86533f");if(value.glasses&&value.glasses!=="none")body.line(5,head+2,11,head+2,"#293f52");}else{body.rect(5,head,7,4,hair);body.dot(dir==="nw"?4:dir==="ne"?12:8,head+4,skin);}
    if(walking&&frame%4===2){body.rect(4,20,4,1,"#3b4c5d");body.rect(10,20,3,1,"#c4cfbd");}
    if(value.hair==="sweep")body.rect(4,head-2,7,1,hair);
    if(dir==="nw")body.rect(4,head+1,2,4,hair);
    if(dir==="ne")body.rect(11,head+1,2,4,hair);
    if(dir==="n")body.rect(5,head+3,7,3,hair);
    if(!back&&value.expression==="focus")body.rect(7,head+5,3,1,"#794f3e");
    if(!back&&value.expression==="wink")body.rect(9,head+3,3,1,"#263341");
    const raised=pose==="ball";body.rect(3,12+offset+phase,2,4,skin);body.rect(12,raised?7:12+offset-phase,2,raised?6:4,skin);
    // 上身獨立圖層，不烘進身體。玩家只穿中性運動服，球隊衣圖留待使用者製作。
    const shirt=star?teamColor:model==="hoodie"?"#b3a684":model==="senior"?"#a49277":"#667d80";top.rect(5,10+offset,7,7-offset,shirt);top.rect(4,11+offset,9,3,shade(shirt,10));top.rect(5,16,7,1,star?accent:"#cad2c2");top.rect(left?5:10,12+offset,2,4,shade(shirt,-20));
    if(model==="hoodie"){body.rect(3,head,2,7,"#b3a684");body.rect(12,head,2,7,"#8f876d");}
    if(model==="ponytail")body.rect(12,head+2,2,7,hair);
    if(star&&!back){top.rect(7,12,3,3,accent);top.dot(8,13,teamColor);}if(model==="backpack"){(back?top:body).rect(back?5:11,10,4,7,"#ba9065");(back?top:body).rect(back?6:12,11,2,4,"#d1b083");}if(model==="hoodie")body.rect(4,head-1,9,2,"#b3a684");if(model==="short-cap"){body.rect(4,head-1,9,2,"#bda56d");body.rect(left?2:11,head+1,3,1,"#dbc58a");}if(model==="senior"){body.rect(5,head-1,7,2,"#bdc8be");body.line(14,15,14,22,"#a48b67");}
    if(value.headband&&value.headband!=="none")body.rect(5,head+1,7,1,"#d8c176");if(value.wristband&&value.wristband!=="none")body.rect(3,15,2,1,"#e0c376");
    const ball=new Tile(16,24);if(raised||model==="ball-fan"){ball.ellipse(13,raised?6:17,2,2,"#dca05b");ball.line(11,raised?6:17,15,raised?6:17,"#7e5942");}
    return {body,top,ball,dir,frame:walking?frame%4:0};
  }
  function actorMarkup(value,options={}){const a=actor(value,options);return `<g shape-rendering="crispEdges" data-direction="${xml(a.dir)}" data-frame="${a.frame}"><g data-layer="face">${a.body.markup()}</g><g data-layer="uniform" data-neutral="${!options.star}">${a.top.markup()}</g>${(options.pose==="ball"||options.model==="ball-fan")?`<g data-layer="ball">${a.ball.markup()}</g>`:""}</g>`;}
  function actorSVG(value,options={}){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 24" shape-rendering="crispEdges" role="img"><title>${xml(value.nickname||"模擬路人")}・原創像素角色</title>${actorMarkup(value,options)}</svg>`;}
  function interior(team,night=false){const t=new Tile(240,160);t.rect(0,0,240,160,night?"#17283e":"#3e5f6c");for(let i=0;i<5;i++){t.polygon([[0,28+i*10],[120,7+i*6],[240,28+i*10],[240,37+i*10],[120,16+i*6],[0,37+i*10]],i%2?team.color:"#667c87");}t.rect(94,15,53,23,"#182d40");t.rect(96,17,49,3,team.accent);t.polygon([[0,85],[120,55],[240,85],[240,160],[0,160]],night?"#927e5c":"#baab7b");for(let y=92;y<160;y+=12)t.line(0,y,240,y,"#9b895f");t.ellipse(120,117,35,18,team.color);t.ellipse(120,117,33,16,team.accent);t.ellipse(120,117,31,14,team.color);t.rect(24,65,22,23,"#203447");t.line(216,41,216,91,"#c2d2c4",2);t.rect(205,42,22,15,"#d2dfcb");t.rect(211,47,10,7,"#496c7c");t.line(211,58,222,58,"#d5b669",2);if(night){t.polygon([[30,7],[12,108],[74,106]],"#72807b");t.polygon([[209,7],[166,108],[230,106]],"#72807b");}return `<g transform="scale(4)" shape-rendering="crispEdges">${t.markup()}</g>`;}
  function tiles(){if(typeof module==="object"&&module.exports)return require("./pixel-tiles.js");return globalThis.NBAPixelTiles;}
  function scenicBackdrop(id,night=false){const entry=tiles().sights[id+(night?":night":"")];if(!entry)throw new RangeError("Unknown pixel photo backdrop");const t=new Tile(240,160);t.rect(0,0,240,160,night?"#172e49":"#92bec8");t.rect(0,75,240,85,night?"#264d62":"#477f8a");t.polygon([[0,115],[90,85],[240,120],[240,160],[0,160]],night?"#536b73":"#9ba58f");return `<g shape-rendering="crispEdges"><g transform="scale(4)">${t.markup()}</g><svg x="185" y="25" width="650" height="440" viewBox="0 0 ${entry.width} ${entry.height}">${entry.markup}</svg></g>`;}
  function encounterBackdrop(id){const entry=tiles().encounters[id];if(!entry)throw new RangeError("Unknown pixel encounter");return `<g transform="scale(4)" shape-rendering="crispEdges">${entry.markup}</g>`;}
  function arenaMarkup(team){const day=arena(team),night=arena(team,true);return `<path class="arena-halo" d="M-76-10-38-50 38-50 76-10 38 36-38 36Z"/><g transform="translate(-80 -68) scale(2)" shape-rendering="crispEdges"><g class="pixel-day">${day.markup()}</g><g class="pixel-night">${night.markup()}</g></g><text class="roof-text" y="-23">${xml(team.abbr)}</text><text class="arena-live-tag" y="10">模擬 LIVE</text><text class="landmark-label" y="55">${xml(team.shortName)}主場</text><path class="selection-ring" d="M-78-12-39-58 39-58 78-12 39 46-39 46Z"/><rect class="hit-area" x="-78" y="-65" width="156" height="124"/>`;}
  function courtMarkup(c){return `<g transform="translate(-55 -52) scale(2)" shape-rendering="crispEdges"><g class="pixel-day">${court(c.type).markup()}</g><g class="pixel-night">${court(c.type,true).markup()}</g></g><text class="landmark-label court-label" y="48">${xml(c.name)}</text><path class="selection-ring" d="M-52-8 0-42 52-8 0 39Z"/><rect class="hit-area" x="-52" y="-50" width="104" height="117"/>`;}
  return {SPEC,ARENAS,ARENA_BRANDING,arenaBranding,MODELS,PEOPLE,Tile,shade,block,tree,arena,court,direction,actor,actorMarkup,actorSVG,interior,scenicBackdrop,encounterBackdrop,arenaMarkup,courtMarkup};
});
