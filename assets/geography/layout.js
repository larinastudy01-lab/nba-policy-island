/* Geographic cartogram: primary Natural Earth coordinates, then deterministic island spacing.
   Legacy 2D keeps its original coordinate system; gameplay IDs and storage keys never change. */
(function(r,f){const api=f(typeof module==='object'&&module.exports?require('./data.js'):r.NBAGeoData);if(typeof module==='object'&&module.exports)module.exports=api;else{r.NBAGeography=api;if(location.protocol!=='file:'&&new URL(location.href).searchParams.get('map')!=='2d')api.apply(r.NBAArchipelago);}})(globalThis,function(data){
  'use strict';
  const rad=Math.PI/180,p1=29.5*rad,p2=45.5*rad,n=(Math.sin(p1)+Math.sin(p2))/2,c=Math.cos(p1)**2+2*n*Math.sin(p1),rho0=Math.sqrt(c-2*n*Math.sin(38*rad))/n;
  function albers(lon,lat){const t=n*(lon+96)*rad,rho=Math.sqrt(c-2*n*Math.sin(lat*rad))/n;return {x:rho*Math.sin(t),y:rho0-rho*Math.cos(t)};}
  function project(lon,lat){const p=albers(lon,lat);return {x:2650+p.x*5100,y:1650-p.y*5100};}
  const positions=Object.fromEntries(Object.entries(data.cities).map(([id,c])=>[id,{...project(c.lon,c.lat),...c}]));
  // Adjacent city teams remain two distinct islands, not two arenas on one plot.
  positions.lakers.x-=145;positions.clippers.x+=255;positions.nets.x+=360;positions.nets.y+=35;
  const order=Object.keys(positions).sort();
  for(let pass=0;pass<240;pass++)for(let i=0;i<order.length;i++)for(let j=i+1;j<order.length;j++){
    const a=positions[order[i]],b=positions[order[j]],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx/410,dy/300);if(d>=1)continue;
    const norm=Math.max(.001,d),push=(1-norm)*.51,ux=dx||((i+j)%2?1:-1),uy=dy||1;a.x-=ux/norm*push;a.y-=uy/norm*push;b.x+=ux/norm*push;b.y+=uy/norm*push;
  }
  // Restore important compass relationships after dense-city packing. These are
  // disclosed display offsets, not changes to the retained source longitude/latitude.
  positions.knicks.x+=340;positions.nets.x+=300;positions.celtics.x+=250;positions.timberwolves.y-=222;
  // Countries are a submerged geographic guide; independently raised coasts remain separate islands.
  const outlines=data.features.map(f=>({name:f.properties.name,kind:f.properties.kind,points:f.geometry.coordinates[0].map(([lon,lat])=>project(lon,lat))}));
  function apply(A){
    if(A.geographic)return A;const old=Object.fromEntries(A.ISLANDS.map(p=>[p.teamId,{...p}])),nodes=structuredClone(A.ROAD_NODES),edges=structuredClone(A.ROAD_EDGES),oldPlace=A.place;
    const move=(id,p)=>({x:p.x+positions[id].x-old[id].x,y:p.y+positions[id].y-old[id].y});
    for(const island of A.ISLANDS)Object.assign(island,{x:positions[island.teamId].x,y:positions[island.teamId].y,geography:{...positions[island.teamId]}});
    Object.assign(A.MAP,{width:5400,height:3300});
    const delta={x:positions.warriors.x-old.warriors.x,y:positions.warriors.y-old.warriors.y};
    for(const key of ['arena','court','pier']){Object.assign(A.BAY[key],move('warriors',A.BAY[key]));Object.assign(A.BAY[key].entrance,move('warriors',A.BAY[key].entrance));}
    A.BAY.solids.forEach(p=>Object.assign(p,move('warriors',p)));A.BAY.camera.x+=delta.x;A.BAY.camera.y+=delta.y;
    const ownerFor=id=>A.owner(id)?.teamId||edges.find(e=>[e.from,e.to].includes(id)&&e.islandId)?.islandId.replace('island-','')||(/^(bay-|pier-|bridge-.*walk|nuggets-walk)/.test(id)?'warriors':null);
    for(const id of Object.keys(A.ROAD_NODES))delete A.ROAD_NODES[id];A.ROAD_EDGES.length=0;
    for(const [id,p] of Object.entries(nodes)){const own=ownerFor(id);if(own&&positions[own])A.ROAD_NODES[id]=move(own,p);}
    const edge=(from,to,meta={})=>{if(A.ROAD_NODES[from]&&A.ROAD_NODES[to]&&!A.ROAD_EDGES.some(e=>e.from===from&&e.to===to||e.from===to&&e.to===from))A.ROAD_EDGES.push({from,to,bridge:false,surface:'stone',...meta});};
    for(const e of edges)if(!e.bridge&&!e.trunk&&e.islandId)edge(e.from,e.to,e);
    const street=id=>id==='warriors'?'bay-entry':'street-'+id;
    // Minimum spanning network + important geographic short links. All raised islands are connected.
    const linked=new Set(['warriors']),links=[];
    while(linked.size<30){let best=null;for(const a of linked)for(const b of order.filter(x=>!linked.has(x))){const d=Math.hypot(positions[a].x-positions[b].x,positions[a].y-positions[b].y);if(!best||d<best.d)best={a,b,d};}links.push(best);linked.add(best.b);}
    for(const [a,b]of [['knicks','nets'],['lakers','clippers'],['warriors','kings'],['bulls','cavaliers'],['mavericks','rockets']])if(!links.some(l=>[l.a,l.b].includes(a)&&[l.a,l.b].includes(b)))links.push({a,b});
    for(const {a,b}of links){const p=positions[a],q=positions[b],dx=q.x-p.x,dy=q.y-p.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
      const g1='geo-gate-'+a+'-'+b,g2='geo-gate-'+b+'-'+a;
      A.ROAD_NODES[g1]={x:p.x+ux*153,y:p.y+uy*103};A.ROAD_NODES[g2]={x:q.x-ux*153,y:q.y-uy*103};
      edge(street(a),g1,{islandId:'island-'+a});edge(g1,g2,{bridge:true,trunk:true,linkId:[a,b].sort().join('-')});edge(g2,street(b),{islandId:'island-'+b});
    }
    const bridgeA=move('warriors',{x:390,y:460}),bridgeB={x:positions.kings.x-120,y:positions.kings.y+85};
    A.ROAD_NODES['bridge-west-walk']=bridgeA;A.ROAD_NODES['bridge-east-walk']=bridgeB;A.ROAD_NODES['sight-golden-gate']={x:(bridgeA.x+bridgeB.x)/2,y:(bridgeA.y+bridgeB.y)/2};
    edge('bay-entry','bridge-west-walk',{islandId:'island-warriors'});edge('bridge-west-walk','sight-golden-gate',{bridge:true});edge('sight-golden-gate','bridge-east-walk',{bridge:true});edge('bridge-east-walk','street-kings',{islandId:'island-kings'});
    // Keep historic node IDs used by keyboard/fallback contracts; they now live on the new graph.
    A.ROAD_NODES['bridge-raptors']={...A.ROAD_NODES['gate-raptors']};edge('bridge-raptors','street-raptors',{islandId:'island-raptors'});
    A.place=(kind,id)=>{const p=oldPlace(kind,id);if(id==='sight-golden-gate')return {...p,x:A.ROAD_NODES[id].x,y:A.ROAD_NODES[id].y,entrance:{...A.ROAD_NODES[id]}};return p;};
    // Vehicle lane is parallel to the bridge walk; closed loops have no visible teleport.
    const dx=bridgeB.x-bridgeA.x,dy=bridgeB.y-bridgeA.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
    const lane=(p,side)=>({x:p.x+nx*side,y:p.y+ny*side}),s=positions.suns;
    A.CAR_ROUTES.splice(0,A.CAR_ROUTES.length,{id:'bay-cruise',district:'west',speed:30,points:[lane(bridgeA,-32),lane(bridgeB,-32),lane(bridgeB,-63),lane(bridgeA,-63)]},{id:'vegas-cruise',district:'desert',speed:27,points:[{x:s.x-130,y:s.y+90},{x:s.x+125,y:s.y+90},{x:s.x+125,y:s.y+123},{x:s.x-130,y:s.y+123}]});
    A.geographic=true;A.geo={positions,project,outlines,delta,moveFromLegacy:move,source:data.source};return A;
  }
  return {project,albers,positions,outlines,apply};
});
