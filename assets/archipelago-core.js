/* One authoritative world for coastlines, entrances, bridges and preserved IDs. */
(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.NBAArchipelago=api;})(globalThis,function(){
  'use strict';
  const MAP={width:3600,height:2250};
  const ISLANDS=[
    ['warriors','west',280,500,'bay','海灣碼頭'],['lakers','west',280,850,'la','洛城大道'],
    ['clippers','west',700,850,'la','洛城創意港'],['suns','desert',700,1220,'sand','沙漠綠洲'],
    ['nuggets','highland',700,470,'rock','紅岩高地'],['timberwolves','north',1140,210,'forest','北境森林'],
    ['thunder','south',1140,780,'plains','內陸草原'],['mavericks','south',1140,1120,'city','南部街區'],
    ['spurs','south',1140,1450,'sand','石造庭院'],['bucks','lakes',1580,450,'lake','北湖林蔭'],
    ['bulls','lakes',1580,790,'lake','湖岸廣場'],['raptors','lakes',1960,205,'lake','東北湖港'],
    ['celtics','east',2760,430,'brick','紅磚市集'],['knicks','east',2760,770,'city','都市街廓'],
    ['sixers','east',2640,1100,'brick','東岸石街'],['heat','coast',2940,2100,'beach','南端海濱'],
    ['nets','east',3180,770,'brick','褐石街屋與水塔'],['cavaliers','lakes',2040,890,'lake','鋼橋河岸'],
    ['jazz','highland',700,150,'rock','鹽湖山脊'],['rockets','south',1140,1780,'city','航太廣場'],
    ['blazers','west',280,170,'forest','玫瑰與鋼橋'],['kings','west',280,1220,'bay','河港鐘樓'],
    ['grizzlies','south',1580,1450,'brick','藍調音樂街'],['pelicans','south',1580,1780,'brick','法式陽台與河船'],
    ['pistons','lakes',2040,550,'city','汽車工業街'],['pacers','lakes',1580,1120,'plains','賽道格旗廣場'],
    ['wizards','east',3060,1100,'brick','紀念碑步道'],['hawks','coast',2940,1440,'brick','鐵道紅磚街'],
    ['hornets','coast',3360,1440,'city','王冠都會亭'],['magic','coast',2940,1780,'beach','湖濱棕櫚塔']
  ].map(([teamId,district,x,y,theme,description])=>({id:'island-'+teamId,teamId,district,x,y,theme,description,width:360,height:250}));
  const getIsland=id=>ISLANDS.find(p=>p.id===id||p.teamId===id)||null;
  const CITY_SCENES={nets:['brownstone','褐石街屋與屋頂水塔'],cavaliers:['steel-river','鋼橋、河岸與工業煙囪'],jazz:['salt-peaks','鹽湖步道與雪色山脊'],rockets:['space-plaza','太空艙與航太廣場'],blazers:['rose-bridge','玫瑰花圃與鋼橋'],kings:['river-clock','河船與鐘樓'],grizzlies:['blues-street','音符店招與藍調街'],pelicans:['french-balcony','拱廊、鐵藝陽台與河船'],pistons:['motor-works','齒輪立面與汽車工坊'],pacers:['speedway','格旗與賽道廣場'],wizards:['monument-walk','石色紀念碑與步道'],hawks:['rail-brick','鐵道月台與紅磚拱門'],hornets:['crown-pavilion','王冠形都會亭與高樓'],magic:['palm-lake','棕櫚、湖面與幻想塔']};
  const COURT_OWNERS={'harbor-01':'warriors','harbor-02':'lakers','harbor-03':'suns','harbor-04':'spurs','harbor-05':'heat','park-01':'nuggets','park-02':'timberwolves','park-03':'thunder','park-04':'mavericks','park-05':'bulls','roof-01':'raptors','roof-02':'bucks','roof-03':'knicks','roof-04':'sixers','roof-05':'clippers'};
  const ENCOUNTER_OWNERS={'meet-pier':'warriors','meet-plaza':'mavericks','meet-garden':'bulls'};
  const SHOP_PLACES={'shop-warriors':['warriors',112,-48,108,-40,96,84],'shop-lakers':['lakers',112,-48,108,-40,96,84]};
  // Art bases are separate from photo entrances; the statue remains offshore.
  const SIGHT_PLACES={
    'golden-gate':['warriors',200,-20,240,180,155,-63],
    'alcatraz':['warriors',-210,-25,105,92], 'lombard':['warriors',-108,40,80,90],
    'hollywood':['lakers',-105,-45,110,68], 'griffith':['clippers',-100,-35,92,88],
    'santa-monica':['lakers',-117,76,112,90,-72,81],
    'grand-canyon':['suns',-103,-20,122,78], 'vegas':['suns',20,-50,80,90],
    'red-rocks':['nuggets',-103,-25,104,84], 'reunion':['mavericks',-100,-15,72,110],
    'alamo':['spurs',-100,-15,96,88], 'gateway-arch':['thunder',-100,-15,84,112],
    'cloud-gate':['bulls',-106,65,86,66,-65,80], 'willis':['bulls',100,-46,62,116],
    'navy-pier':['bucks',-106,54,98,110], 'liberty':['knicks',150,85,90,120,115,83],
    'brooklyn':['sixers',-100,35,126,96], 'times-square':['knicks',-105,-15,82,100],
    'faneuil':['celtics',-100,20,106,102], 'south-beach':['heat',-102,20,98,84]
  };
  const MEMORY_PLACES={
    'memory-lakers-2020':['lakers',5,105,38,98,96,64,'street-lakers'],
    'memory-bulls-1998':['bulls',110,18,120,58,48,32,'park-05'],
    'memory-warriors-2015':['warriors',-55,65,-38,78,56,48,'bay-junction'],
    'memory-knicks-1970':['knicks',-60,80,-35,94,64,48,'street-knicks'],
    'memory-raptors-2019':['raptors',110,18,120,58,48,32,'roof-01'],
    // Reserved architecture only: unpublished histories have no map hint or reader.
    'memory-reserved-cavaliers':['cavaliers',-50,95,-30,85,48,32,'street-cavaliers'],
    'memory-reserved-warriors':['warriors',-60,100,-38,92,48,32,'bay-junction'],
    'memory-reserved-jazz':['jazz',-50,95,-30,85,48,32,'street-jazz'],
    'memory-reserved-bulls':['bulls',0,102,20,94,48,32,'street-bulls']
  };
  function owner(id){return getIsland(id)||getIsland(COURT_OWNERS[id]||ENCOUNTER_OWNERS[id]||SIGHT_PLACES[id.replace(/^sight-/,'')]?.[0]||MEMORY_PLACES[id]?.[0]||SHOP_PLACES[id]?.[0]);}
  function place(kind,id){
    const island=owner(id);if(!island)throw new Error('Unknown island owner: '+id);
    let dx=-35,dy=-17,ex=28,ey=35,width,height;
    if(kind==='court'){dx=110;dy=10;ex=132;ey=57;}
    if(kind==='encounter'){dx=4;dy=95;ex=27;ey=94;}
    if(kind==='sight'){const spec=SIGHT_PLACES[id.replace(/^sight-/,'')];[,dx,dy,width,height,ex,ey]=spec;}
    if(kind==='memory'){[,dx,dy,ex,ey,width,height]=MEMORY_PLACES[id];}
    if(kind==='shop'){[,dx,dy,ex,ey,width,height]=SHOP_PLACES[id];}
    return {x:island.x+dx,y:island.y+dy,islandId:island.id,teamIslandId:island.teamId,entrance:Number.isFinite(ex)?{x:island.x+ex,y:island.y+ey}:null,...(width?{width,height}:{})};
  }
  // Stepped coast, with a shared shoreline/land test used by the generator and tests.
  function coast(island){return [[-180,-55],[-153,-91],[-74,-113],[-18,-124],[69,-106],[144,-77],[179,-35],[170,33],[138,79],[65,112],[-23,123],[-110,94],[-164,48]].map(([x,y])=>({x:island.x+x,y:island.y+y}));}
  function contains(island,point){const poly=coast(island);let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
  const ROAD_NODES={},ROAD_EDGES=[];
  const node=(id,x,y)=>{ROAD_NODES[id]={x,y};return id;};
  function edge(from,to,meta={}){ROAD_EDGES.push({from,to,bridge:false,surface:'stone',...meta});}
  const spineYs={west:[70,230,300,530,560,665,910,1280,1380],central:[210,365,620,665,840,1180,1380,1510,1840],middle:[70,270,365,510,620,850,1180,1490,1510,1840],east:[365,490,610,620,830,950,1160,1490,1840],atlantic:[365,490,620,830,1160,1500,1840,2160]};
  const spineX={west:490,central:930,middle:1370,east:1840,atlantic:2460};
  for(const [key,ys]of Object.entries(spineYs)){ys.forEach(y=>node('sea-'+key+'-'+y,spineX[key],y));ys.slice(1).forEach((y,i)=>edge('sea-'+key+'-'+ys[i],'sea-'+key+'-'+y,{bridge:true,trunk:true}));}
  edge('sea-west-665','sea-central-665',{bridge:true,trunk:true});edge('sea-central-620','sea-middle-620',{bridge:true,trunk:true});edge('sea-middle-620','sea-east-620',{bridge:true,trunk:true});
  edge('sea-east-620','sea-atlantic-620',{bridge:true,trunk:true});
  const connections={warriors:['west',560,1],lakers:['west',910,1],clippers:['west',910,-1],suns:['west',1280,-1],nuggets:['west',530,-1],timberwolves:['middle',270,1],thunder:['central',840,-1],mavericks:['central',1180,-1],spurs:['central',1510,-1],bucks:['middle',510,-1],bulls:['middle',850,-1],celtics:['atlantic',490,-1],knicks:['atlantic',830,-1],sixers:['atlantic',1160,-1],heat:['atlantic',2160,-1],cavaliers:['east',950,-1],jazz:['central',210,1],rockets:['central',1840,-1],blazers:['west',230,1],kings:['west',1280,1],grizzlies:['middle',1510,-1],pelicans:['middle',1840,-1],pistons:['east',610,-1],pacers:['middle',1180,-1],hawks:['atlantic',1500,-1],magic:['atlantic',1840,-1]};
  for(const island of ISLANDS){
    const t=island.teamId;node(t,...Object.values(place('nba',t).entrance));node('street-'+t,island.x+63,island.y+62);
    edge(t,'street-'+t,{islandId:island.id});
    if(t==='nets'){
      node('gate-nets',island.x-145,island.y+40);node('gate-east-knicks',getIsland('knicks').x+145,island.y+40);
      edge('street-nets','gate-nets',{islandId:island.id});edge('street-knicks','gate-east-knicks',{islandId:'island-knicks'});edge('gate-east-knicks','gate-nets',{bridge:true,linkId:'ny-short-bridge'});
    }else if(t==='wizards'||t==='hornets'){
      const neighbor=t==='wizards'?'sixers':'hawks',other=getIsland(neighbor);node('gate-'+t,island.x-145,island.y+40);node('gate-east-'+neighbor,other.x+145,island.y+40);
      edge('street-'+t,'gate-'+t,{islandId:island.id});edge('street-'+neighbor,'gate-east-'+neighbor,{islandId:other.id});edge('gate-east-'+neighbor,'gate-'+t,{bridge:true,linkId:neighbor+'-'+t});
    }else if(t==='raptors'){
      node('gate-'+t,island.x,island.y+105);node('bridge-'+t,island.x,365);
      edge('street-'+t,'gate-'+t,{islandId:island.id});edge('gate-'+t,'bridge-'+t,{bridge:true});edge('bridge-'+t,'sea-east-365',{bridge:true,trunk:true});
    }else{
      const [spine,y,side]=connections[t];node('gate-'+t,island.x+side*145,y);edge('street-'+t,'gate-'+t,{islandId:island.id});edge('gate-'+t,'sea-'+spine+'-'+y,{bridge:true});
    }
  }
  for(const [kind,owners]of [['court',COURT_OWNERS],['encounter',ENCOUNTER_OWNERS]])for(const [id,t]of Object.entries(owners)){const p=place(kind,id).entrance;node(id,p.x,p.y);if(id==='meet-pier')continue;edge('street-'+t,id,{surface:kind==='encounter'&&id==='meet-pier'?'wood':'stone',islandId:'island-'+t});}
  for(const key of ['santa-monica','cloud-gate','liberty']){const id='sight-'+key,p=place('sight',id).entrance;node(id,p.x,p.y);edge('street-'+owner(id).teamId,id,{surface:key==='santa-monica'?'wood':'stone',islandId:owner(id).id});}
  node('bay-junction',343,562);node('bay-shore',307,579);node('pier-approach',307,591);
  edge('warriors','bay-junction',{islandId:'island-warriors'});edge('bay-junction','bay-shore',{islandId:'island-warriors'});edge('bay-shore','pier-approach',{islandId:'island-warriors',surface:'wood'});edge('pier-approach','meet-pier',{islandId:'island-warriors',surface:'wood'});edge('meet-pier','harbor-01',{bridge:true,surface:'wood',islandId:'island-warriors'});
  // Golden Gate: the lane is north of the pedestrian side, never in the foot graph.
  node('bridge-west-walk',390,460);node('sight-golden-gate',435,437);node('bridge-east-walk',570,370);node('bay-north-walk',365,461);
  edge('warriors','bay-north-walk',{islandId:'island-warriors'});edge('bay-north-walk','bridge-west-walk',{islandId:'island-warriors'});edge('bridge-west-walk','sight-golden-gate',{bridge:true});edge('sight-golden-gate','bridge-east-walk',{bridge:true});node('nuggets-walk',600,420);edge('bridge-east-walk','nuggets-walk',{bridge:true});edge('nuggets-walk','nuggets',{islandId:'island-nuggets'});
  for(const e of ROAD_EDGES){if(e.from==='street-warriors')e.from='bay-junction';if(e.to==='street-warriors')e.to='bay-junction';}
  delete ROAD_NODES['street-warriors'];
  for(const id of Object.keys(SHOP_PLACES)){const island=owner(id),p=place('shop',id).entrance;node(id,p.x,p.y);node('shop-side-'+island.teamId,island.x+48,island.y+40);node('shop-walk-'+island.teamId,island.x+48,island.y-30);edge(island.teamId,'shop-side-'+island.teamId,{islandId:island.id,shop:true});edge('shop-side-'+island.teamId,'shop-walk-'+island.teamId,{islandId:island.id,shop:true});edge('shop-walk-'+island.teamId,id,{islandId:island.id,shop:true});}
  for(const [id,spec]of Object.entries(MEMORY_PLACES)){const p=place('memory',id).entrance;node(id,p.x,p.y);edge(spec[7],id,{islandId:owner(id).id,surface:'stone',memory:true});}
  const seenEdges=new Set();for(let n=ROAD_EDGES.length-1;n>=0;n--){const e=ROAD_EDGES[n],key=[e.from,e.to].sort().join('|');if(seenEdges.has(key))ROAD_EDGES.splice(n,1);else seenEdges.add(key);}
  const CAR_ROUTES=[{id:'bay-cruise',district:'west',speed:38,points:[{x:390,y:438},{x:570,y:348},{x:605,y:370},{x:565,y:395},{x:508,y:550},{x:508,y:665},{x:528,y:665},{x:528,y:540},{x:430,y:470}]},{id:'vegas-cruise',district:'desert',speed:32,points:[{x:550,y:1260},{x:508,y:1260},{x:508,y:1340},{x:528,y:1340},{x:528,y:1280},{x:600,y:1280},{x:755,y:1245},{x:740,y:1225}]}];
  return {MAP,ISLANDS,CITY_SCENES,COURT_OWNERS,ENCOUNTER_OWNERS,SHOP_PLACES,SIGHT_PLACES,MEMORY_PLACES,ROAD_NODES,ROAD_EDGES,CAR_ROUTES,getIsland,owner,place,coast,contains};
});
