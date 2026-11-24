/* Only emits local drawings and source geometry. Python stdlib writes PNG/SVG. */
const fs=require('node:fs'),path=require('node:path'),P=require('./pixel-core.js'),C=require('./island-core.js'),E=require('./explorer-core.js'),S=require('./sights-core.js'),T=require('./traffic-core.js'),A=require('./archipelago-core.js'),Art=require('./archipelago-art.cjs');
const tile=(name,t)=>({name,width:t.width,height:t.height,svg:t.svg(name)}),items=[];
for(const team of C.TEAMS)for(const night of [false,true])items.push(tile(`arenas/${team.id}${night?'-night':''}`,P.arena(team,night)));
for(const id of Object.keys(A.CITY_SCENES))for(const night of [false,true])items.push(tile(`cities/${id}${night?'-night':''}`,require('./city-art.cjs').city(id,night)));
for(const type of ['harbor','park','roof'])for(const night of [false,true])items.push(tile(`courts/${type}${night?'-night':''}`,P.court(type,night)));
function sheet(model,part){const result=new P.Tile(80,192);for(let row=0;row<8;row++)for(let col=0;col<5;col++){const f=P.actor({hair:'curls'},{direction:P.SPEC.directions[row],walking:col>0,frame:Math.max(0,col-1),model});const frame=new P.Tile(16,24);if(part==='body'||part==='all')frame.paste(f.body);if(part==='top'||part==='all')frame.paste(f.top);if(part==='all'&&model==='ball-fan')frame.paste(f.ball);result.paste(frame,col*16,row*24);}return result;}
items.push(tile('player/body-sheet',sheet('ball-fan','body')),tile('player/top-neutral-sheet',sheet('ball-fan','top')));
for(const model of P.PEOPLE)items.push(tile(`people/${model}`,sheet(model,'all')));
const beam=new P.Tile(32,16);beam.polygon([[1,6],[9,5],[9,4],[17,3],[17,2],[25,1],[31,0],[31,15],[25,14],[25,13],[17,12],[17,11],[9,10],[9,9],[1,8]],'#a8ae84');beam.polygon([[1,6],[12,6],[12,5],[23,4],[23,10],[12,9],[1,8]],'#d8d5a0');items.push(tile('headlight',beam));
for(const [name,drawing] of Object.entries(Art.art()))items.push(tile(name,drawing));
for(const night of [false,true])items.push(tile('roads'+(night?'-night':''),Art.roads(night)));
items.push(tile('traffic-roads',Art.lanes()));
const props=new P.Tile(C.MAP.width/2,C.MAP.height/2),propNames=['lifering','bollard','bench','fountain','queue-rail','container','planter','lamp','crosswalk'];
function prop(kind){const t=new P.Tile(20,24);if(kind==='lifering'){t.ellipse(10,15,5,3,'#dfaa73');t.ellipse(10,15,2,1,'#385b62');t.rect(9,12,2,2,'#eee0b5');}if(kind==='bollard'){t.ellipse(10,20,5,2,'#294650');t.rect(8,13,4,7,'#778e8b');t.rect(6,12,8,2,'#acb8a8');}if(kind==='bench'){t.polygon([[2,12],[10,8],[18,12],[10,16]],'#baa379');t.line(2,9,10,13,'#d3b788',2);t.line(3,14,3,18,'#54635d');t.line(15,14,15,18,'#54635d');}if(kind==='fountain'){P.block(t,9,15,7,5,9,'#88a7a9');t.rect(8,9,5,1,'#d0d7c4');t.rect(11,7,2,2,'#adc8ca');}if(kind==='queue-rail'){t.line(2,10,17,17,'#a4b6ad',2);t.line(2,10,2,19,'#78968f');t.line(17,17,17,22,'#78968f');}if(kind==='container'){P.block(t,8,10,12,8,7,'#ae7662');for(let i=0;i<3;i++)t.line(2+i*3,10+i,2+i*3,15+i,'#d49c73');}if(kind==='planter'){P.block(t,8,18,10,7,4,'#899e8f');P.tree(t,9,15);}if(kind==='lamp'){t.line(8,22,8,4,'#698d90');t.rect(8,3,6,2,'#e3cf97');}if(kind==='crosswalk'){for(let i=0;i<4;i++)t.polygon([[2+i*3,14+i],[8+i*3,11+i],[10+i*3,12+i],[4+i*3,15+i]],'#d1d2b1');}return t;}
for(const name of propNames)items.push(tile(`props/${name}`,prop(name)));
for(const team of C.TEAMS){props.paste(prop('queue-rail'),team.x/2+14,team.y/2+10);props.paste(prop('lamp'),team.x/2-35,team.y/2+2);}
for(const c of C.COURTS){props.paste(prop(c.type==='harbor'?'lifering':c.type==='park'?'fountain':'container'),c.x/2-28,c.y/2+5);}
props.paste(prop('bench'),132,298);props.paste(prop('bollard'),126,304);props.paste(prop('crosswalk'),163,270);items.push(tile('props-world',props));
const B=require("./bay-scene.js");
const sources=[...S.SIGHTS.flatMap(s=>[false,true].map(night=>({name:`sights/${s.key}${night?'-night':''}`,path:night?s.nightAsset:s.asset,width:Math.round(s.width/2),height:Math.round(s.height/2),photo:s.photo,photoId:s.id,night}))),
 ...T.CARS.flatMap(c=>['front','side','rear'].map(v=>({name:`cars/${c.id}-${v}`,path:`assets/cars/${c.id}-${v}.svg`,width:26,height:20}))),
 ...C.ENCOUNTERS.map(p=>({name:`encounters/${p.id}`,path:p.background,width:240,height:160,encounterId:p.id}))];
console.log(JSON.stringify({spec:P.SPEC,arenaModels:P.ARENAS,people:P.PEOPLE,props:propNames,items,sources,teams:C.TEAMS,courts:C.COURTS,sights:S.SIGHTS,cars:T.advance(T.createTraffic(),0),crowd:B.PEOPLE,district:E.DISTRICTS[0],districts:E.DISTRICTS,map:C.MAP,islands:A.ISLANDS,roadNodes:E.ROAD_NODES,roadEdges:E.ROAD_EDGES}));
