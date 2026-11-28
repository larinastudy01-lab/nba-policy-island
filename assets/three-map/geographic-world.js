import * as T from 'three';
import {LEVEL} from './models.js';

// Natural Earth coastline and five Great Lakes: shallow relief under the archipelago,
// not an extra connected island. This gives the cartogram an honest geographic reference.
export function geographyRelief(parent,kit){
  const G=globalThis.NBAArchipelago.geo;if(!G)return {dispose(){}};
  const geometries=[];
  for(const outline of G.outlines){if(outline.points.length<5)continue;const shape=new T.Shape();outline.points.forEach((p,i)=>i?shape.lineTo(p.x*.1,-p.y*.1):shape.moveTo(p.x*.1,-p.y*.1));shape.closePath();
    const geometry=new T.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);geometries.push(geometry);
    const lake=outline.kind==='lakes',canada=outline.name==='Canada',material=new T.MeshBasicMaterial({color:lake?'#457d99':canada?'#729eac':'#76aab4',transparent:true,opacity:lake?.72:canada?.055:.25,depthWrite:false,side:T.DoubleSide});
    const mesh=new T.Mesh(geometry,material);mesh.position.y=lake?.015:-.04;parent.add(mesh);
  }
  return {dispose(){for(const g of geometries)g.dispose();}};
}

export function regionScenery(kit,parent,team,lights,detail=false){
  const A=globalThis.NBAArchipelago,i=A.getIsland(team.id),x=i.x*.1,z=i.y*.1,terrain=i.theme;
  const district=i.district;
  if(['suns','jazz','nuggets'].includes(team.id))for(let k=0;k<3;k++){
    const h=[2.6,4,2][k],g=new T.ConeGeometry(2.4,h,7,1),m=kit.mesh(parent,g,team.id==='suns'?'#c69573':'#a4b0ad');g.userData.transient=true;kit.geometries.set(g.uuid,g);m.position.set(x-11+k*3,LEVEL+h/2,z-7-k*.8);
    if(team.id==='suns'){kit.cylinder(parent,x+10+k,LEVEL+.6,z-3-k,.18,1.2,'#638c76');kit.ball(parent,x+10+k,LEVEL+1.2,z-3-k,.25,.28,.25,'#638c76');}
  }
  if(district==='lakes'||team.id==='raptors'){
    const shore=kit.ball(parent,x-10,LEVEL-.03,z+8,5,.06,2.6,'#82b7c4');shore.receiveShadow=true;
    kit.line(parent,new T.Vector3(x-14,LEVEL+.08,z+9),new T.Vector3(x-4,LEVEL+.08,z+9),.7,'#dfd8c5');
  }
  if(['heat','magic','lakers','clippers','pelicans'].includes(team.id))for(const dx of [-12,13])kit.palm(parent,x+dx,z+5,.75);
  if(['blazers','timberwolves','raptors','nuggets'].includes(team.id))for(let k=0;k<3;k++){kit.cylinder(parent,x+9+k*2,LEVEL+.7,z-6,.13,1.4,'#a58a6d');kit.ball(parent,x+9+k*2,LEVEL+2,z-6,1,1.5,.85,'#60977f');}
  if(detail){for(const dx of [-8,9]){kit.bench(parent,x+dx,z+9);kit.lamp(parent,x+dx,z+6,lights);}kit.box(parent,x,LEVEL+.035,z+6.2,5,.07,3,'#e7dcc5',.2);}
}
