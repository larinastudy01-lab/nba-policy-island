/* A separate fictional island. The official 30-team arrays and invitation IDs stay intact. */
(function(r){'use strict';const A=r.NBAArchipelago,E=r.NBAExplorer;if(!A||!E)return;
  const base=A.getIsland('warriors'),island={id:'island-my-franchise',teamId:'my-franchise',district:'west',theme:'bay',x:base.x-380,y:base.y+480,width:340,height:255,description:'自創球隊・虛構擴編島'};
  const point={id:'my-franchise',kind:'franchise',name:'我的城市',x:island.x-25,y:island.y-20,entrance:{x:island.x,y:island.y+45},islandId:island.id};
  const oldGet=A.getIsland,oldOwner=A.owner;A.getIsland=id=>['island-my-franchise','my-franchise'].includes(id)?island:oldGet(id);A.owner=id=>{if(id===point.id)return island;const owner=oldOwner(id);if(owner)return owner;const p=A.ROAD_NODES[id];return p?[...A.ISLANDS,island].sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]:null;};
  A.ROAD_NODES[point.id]={...point.entrance};A.ROAD_NODES['my-street']={x:island.x+100,y:island.y+45};A.ROAD_NODES['my-bridge']={x:island.x+145,y:island.y+20};A.ROAD_NODES['my-sea-west']={x:base.x-240,y:base.y+40};A.ROAD_EDGES.push({from:'my-franchise',to:'my-street',islandId:island.id},{from:'my-street',to:'my-bridge',islandId:island.id},{from:'my-bridge',to:'my-sea-west',bridge:true,fictional:true},{from:'my-sea-west',to:'pier-approach',bridge:true,fictional:true});E.registerDestination(point);
  r.NBAFranchiseWorld={island,point};
})(globalThis);
