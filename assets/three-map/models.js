import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const LEVEL=2.2;
export const COLORS={sea:'#64afbd',deep:'#376f91',sand:'#e5d6b8',grass:'#9ab9a0',stone:'#d9ded9',road:'#7b8990',white:'#f8f3e7',wood:'#af8b64',navy:'#334958',leaf:'#579378',glass:'#7eb6cb'};
export const CITY={warriors:'海灣碼頭',lakers:'好萊塢棕櫚大道',bulls:'湖岸紅磚天際線',clippers:'洛城濱海街廓',suns:'沙漠岩丘',nuggets:'高山纜車',thunder:'平原風塔',mavericks:'重逢塔',spurs:'阿拉莫拱廊',timberwolves:'北境松林',bucks:'湖岸釀造街',raptors:'湖濱觀景塔',celtics:'波士頓鐘樓',knicks:'曼哈頓階梯高樓',sixers:'費城鐘亭',heat:'南灘救生站',nets:'布魯克林橋廓',cavaliers:'湖岸音樂亭',jazz:'紅岩拱門',rockets:'太空火箭廣場',blazers:'河港吊橋',kings:'金色河橋',grizzlies:'藍調音樂街',pelicans:'法式陽台',pistons:'汽車工業鐘樓',pacers:'賽車格旗廣場',wizards:'白柱圓頂',hawks:'南方花園塔',hornets:'蜂巢涼亭',magic:'湖畔摩天輪'};

export function createKit(){
  const geometries=new Map(),materials=new Map(),textures=new Set(),pendingTextures=[];
  function geometry(key,create){if(!geometries.has(key))geometries.set(key,create());return geometries.get(key);}
  function material(color,extra={}){const key=color+JSON.stringify(extra);if(!materials.has(key)){const m=new T.MeshStandardMaterial({color,roughness:.76,metalness:.04,...extra});m.userData.window=[COLORS.glass,'#82b6c8'].includes(color);m.userData.lamp=color==='#f4e5bd';materials.set(key,m);}return materials.get(key);}
  function mesh(parent,g,color,extra={}){const m=new T.Mesh(g,material(color,extra));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(p,x,y,z,w,h,d,color,r=.15){const key=['box',w,h,d,r].join(':');const m=mesh(p,geometry(key,()=>new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3))),color);m.position.set(x,y,z);return m;}
  function ball(p,x,y,z,rx,ry,rz,color,extra={}){const m=mesh(p,geometry('sphere',()=>new T.SphereGeometry(1,32,20)),color,extra);m.position.set(x,y,z);m.scale.set(rx,ry,rz);return m;}
  function cylinder(p,x,y,z,r,h,color,top=r){const m=mesh(p,geometry('cyl:'+r+':'+top+':'+h,()=>new T.CylinderGeometry(top,r,h,24)),color);m.position.set(x,y,z);return m;}
  function line(p,a,b,width,color,height=.08){const m=box(p,(a.x+b.x)/2,a.y,(a.z+b.z)/2,Math.hypot(b.x-a.x,b.z-a.z),height,width,color,.025);m.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);return m;}
  function tube(p,points,r,color){const g=new T.TubeGeometry(new T.CatmullRomCurve3(points),Math.max(12,points.length*3),r,6,false);g.userData.transient=true;geometries.set(g.uuid,g);return mesh(p,g,color);}
  function sign(p,text,x,y,z,color='#334958',width=3){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,256,96);ctx.font='bold 46px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff7df';ctx.fillText(text,128,50,240);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.add(texture);const mat=new T.MeshBasicMaterial({map:texture});mat.userData.transient=true;materials.set(mat.uuid,mat);const m=new T.Mesh(geometry('sign',()=>new T.PlaneGeometry(1,1)),mat);m.scale.set(width,width*.375,1);m.position.set(x,y,z);m.userData.keep=true;p.add(m);return m;}
  function logo(p,team,x,y,z,size=2.3){let done;pendingTextures.push(new Promise(resolve=>done=resolve));const texture=new T.TextureLoader().load(new URL('../../prototype/three-islands/assets/team/'+team.abbr+'.png',import.meta.url).href,done,undefined,done);texture.colorSpace=T.SRGBColorSpace;textures.add(texture);const mat=new T.MeshBasicMaterial({map:texture,transparent:true,side:T.DoubleSide});mat.userData.transient=true;materials.set(mat.uuid,mat);const m=new T.Mesh(geometry('logo',()=>new T.PlaneGeometry(1,1)),mat);m.position.set(x,y,z);m.scale.setScalar(size);m.userData.keep=true;p.add(m);}
  function lamp(p,x,z,glows){cylinder(p,x,LEVEL+1.9,z,.09,3.8,'#50656a');box(p,x+.25,LEVEL+3.8,z,.7,.16,.38,'#f4e5bd',.08);const glow=new T.Mesh(geometry('lamp-glow',()=>new T.CircleGeometry(1.6,24)),new T.MeshBasicMaterial({color:'#ffdfa7',transparent:true,opacity:.2,depthWrite:false}));glow.material.userData.transient=true;materials.set(glow.material.uuid,glow.material);glow.rotation.x=-Math.PI/2;glow.position.set(x+.25,LEVEL+.15,z);glow.userData.keep=true;glow.visible=false;p.add(glow);glows.push(glow);}
  function bench(p,x,z){box(p,x,LEVEL+.55,z,1.8,.16,.55,COLORS.wood,.05);box(p,x,LEVEL+.95,z-.3,1.8,.65,.1,COLORS.wood,.05);for(const dx of [-.6,.6])box(p,x+dx,LEVEL+.25,z,.12,.5,.5,COLORS.navy,.04);}
  function palm(p,x,z,size=1){const stem=cylinder(p,x,LEVEL+2.3*size,z,.16*size,4.6*size,'#b2936f',.11*size);stem.rotation.z=-.08;for(let i=0;i<7;i++){const a=i*Math.PI*2/7,leaf=ball(p,x+Math.sin(a)*1.1*size,LEVEL+4.8*size,z+Math.cos(a)*1.1*size,.45*size,.13*size,1.65*size,'#52977f');leaf.rotation.y=a;leaf.rotation.x=.22;}}
  function merge(group){group.updateMatrixWorld(true);const buckets=new Map();for(const child of [...group.children]){if(!child.isMesh||child.userData.keep||child.userData.hit||child.material.transparent)continue;let g=child.geometry.clone().applyMatrix4(child.matrix);if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}const key=child.material.uuid;if(!buckets.has(key))buckets.set(key,{material:child.material,parts:[]});buckets.get(key).parts.push(g);group.remove(child);if(child.geometry.userData.transient){child.geometry.dispose();geometries.delete(child.geometry.uuid);}}for(const b of buckets.values()){const g=mergeGeometries(b.parts,false);b.parts.forEach(p=>p.dispose());g.userData.transient=true;geometries.set(g.uuid,g);const m=new T.Mesh(g,b.material);m.castShadow=m.receiveShadow=true;group.add(m);}}
  function disposeGroup(group){group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.isMesh&&o.geometry.userData.transient){o.geometry.dispose();geometries.delete(o.geometry.uuid);}if(o.isMesh&&o.material.userData.transient){o.material.map?.dispose();textures.delete(o.material.map);o.material.dispose();materials.delete(o.material.uuid);}});}
  function dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
  return {geometry,material,mesh,box,ball,cylinder,line,tube,sign,logo,lamp,bench,palm,merge,disposeGroup,dispose,geometries,materials,textures,pendingTextures};
}

export function stadium(kit,parent,team,{detail=true,glows=[]}={}){
  const {box,ball,cylinder,line,logo,sign}=kit,x=team.x*.1,z=team.y*.1,y=LEVEL;
  const shape=team.id==='warriors'?'glass':team.id==='lakers'?'dome':team.id==='bulls'?'brick':['celtics','knicks','nets','pistons'].includes(team.id)?'steps':['nuggets','jazz','suns'].includes(team.id)?'sail':'oval';
  if(!detail){ball(parent,x,y+2.1,z,5.5,1.25,3.4,team.color);box(parent,x,y+.8,z,10,1.6,6,'#b7c9c9',.6);const ex=team.entrance.x*.1,ez=team.entrance.y*.1;box(parent,ex,y+1,ez-1.8,1.8,2,.35,'#6292a3',.15);logo(parent,team,ex,y+2.6,ez-1.6,1.6);return;}
  box(parent,x,y+.15,z,15,.3,11,COLORS.stone,.9);
  if(shape==='glass'||shape==='oval'){
    const wall=cylinder(parent,x,y+1.8,z,6.3,3.6,COLORS.glass);wall.scale.z=.58;wall.material=kit.material('#82b6c8',{roughness:.3,metalness:.12});
    const roof=cylinder(parent,x,y+3.9,z,6.9,.5,team.color);roof.scale.z=.62;
    const skylight=ball(parent,x-.3,y+4.2,z-.3,5.8,.45,3.25,'#c5e0e7',{roughness:.25});
    for(let i=0;i<18;i++){const a=i*Math.PI*2/18;box(parent,x+Math.sin(a)*6.35,y+1.85,z+Math.cos(a)*3.7,.12,3.4,.12,'#e1e8df',.04);}
    line(parent,new T.Vector3(x-4.8,y+4,z+3),new T.Vector3(x+4.8,y+4,z+3),.22,team.accent,.2);
  }else if(shape==='dome'){
    box(parent,x,y+1.5,z,12,3,7.6,'#d6c8dd',.7);const dome=ball(parent,x,y+3.25,z,6.8,2.2,4.3,team.color);dome.scale.y=1.7;
    for(const dx of [-4,-2,0,2,4])box(parent,x+dx,y+1.6,z+3.85,1.25,2.2,.12,COLORS.glass,.08);
    box(parent,x,y+3,z+4,12.4,.35,.8,team.accent,.15);
  }else{
    box(parent,x,y+1.8,z,12,3.6,7.6,shape==='brick'?'#bb7767':'#c7cecd',.5);
    const roof=box(parent,x,y+4,z,13,.9,8.5,team.color,.45);if(shape==='sail')roof.rotation.z=.13;
    if(shape==='steps'){box(parent,x-2,y+4.8,z-1,7,.8,5,team.accent,.3);box(parent,x-3,y+5.4,z-1.5,4,.5,3,team.color,.25);}
    for(let dx=-5;dx<=5;dx+=2)box(parent,x+dx,y+1.7,z+3.85,1.35,2,.16,COLORS.glass,.15);
    if(shape==='brick')for(let row=0;row<4;row++)for(let col=0;col<8;col++)box(parent,x-5+col*1.4+(row%2)*.3,y+.5+row*.7,z+3.97,.9,.04,.06,'#dcaa90',.02);
  }
  const ex=team.entrance.x*.1,ez=team.entrance.y*.1;
  // The entrance follows the authoritative original road endpoint.
  box(parent,ex,y+1.15,ez-1.9,2.6,2.3,.45,'#416778',.16);box(parent,ex,y+1.15,ez-1.63,.07,2.2,.08,'#e5e8d8',.02);
  for(let i=0;i<3;i++)box(parent,ex,y+.32-i*.08,ez-.9+i*.38,3.3+i*.6,.18,.6,'#d7dcd3',.06);
  box(parent,ex,y-.02,ez+1,10,.18,6,'#e4e1d4',.5);
  logo(parent,team,ex,y+3.2,ez-1.6,2.1);sign(parent,team.abbr+' ARENA',x,y+4.9,z+3.9,team.color,4);
  kit.lamp(parent,ex-4,ez+2,glows);kit.lamp(parent,ex+4,ez+2,glows);
}

export function publicCourt(kit,parent,court,{glows=[],detail=true}={}){
  const {box,line,cylinder}=kit,x=court.x*.1,z=court.y*.1,y=LEVEL+.16;
  box(parent,x,y,z,9,.25,6.5,court.type==='harbor'?'#d69472':court.type==='park'?'#78aaa0':'#7999b4',.25);
  for(const dz of [-2.9,2.9])line(parent,new T.Vector3(x-4.1,y+.14,z+dz),new T.Vector3(x+4.1,y+.14,z+dz),.08,'#fff6dd');
  for(const dx of [-4.1,4.1])line(parent,new T.Vector3(x+dx,y+.14,z-2.9),new T.Vector3(x+dx,y+.14,z+2.9),.08,'#fff6dd');
  const hx=x+2.6,hz=z-1.7;cylinder(parent,hx,y+1.7,hz,.08,3.4,'#3f5662');box(parent,hx,y+3.5,hz,1.65,.95,.12,'#f3f3e4',.08);
  const rim=new T.Mesh(kit.geometry('rim',()=>new T.TorusGeometry(.36,.045,6,20)),kit.material('#db7b48'));rim.rotation.x=Math.PI/2;rim.position.set(hx,y+3.1,hz+.6);parent.add(rim);
  for(const dz of [-1,1])line(parent,new T.Vector3(x-.2,y+.15,z+dz),new T.Vector3(hx,y+.15,z+dz),.07,'#fff6dd');line(parent,new T.Vector3(x-.2,y+.15,z-1),new T.Vector3(x-.2,y+.15,z+1),.07,'#fff6dd');
  if(detail){for(let i=0;i<8;i++)cylinder(parent,x-4+i*1.15,y+.7,z-3.3,.04,1.4,'#65898b');line(parent,new T.Vector3(x-4,y+1.4,z-3.3),new T.Vector3(x+4,y+1.4,z-3.3),.05,'#6c9394');kit.bench(parent,x+5.5,z+1);kit.lamp(parent,x-5,z-2,glows);}
}

export function cityFeature(kit,parent,team,detailed=false){
  const island=globalThis.NBAArchipelago.getIsland(team.id),x=island.x*.1-10,z=island.y*.1-8,y=LEVEL;const {box,ball,cylinder,palm,sign}=kit;
  const west=['warriors','clippers','blazers','kings'].includes(team.id),palms=['lakers','heat','magic','suns'].includes(team.id);
  if(palms){palm(parent,x-2,z,.8);if(detailed)palm(parent,x+3,z+3,1);}
  else if(['nuggets','jazz','suns','timberwolves'].includes(team.id)){for(let i=0;i<3;i++)ball(parent,x+i*1.6,y+.6+i*.3,z,2,1.2+i*.4,1.5,team.id==='timberwolves'?'#649784':'#c6aa90');}
  else if(team.id==='rockets'){cylinder(parent,x,y+2.4,z,.65,4.8,'#e2dfd2');const cone=new T.Mesh(kit.geometry('rocket-cone',()=>new T.ConeGeometry(.65,1.3,24)),kit.material(team.color));cone.position.set(x,y+5.4,z);parent.add(cone);for(const dx of [-.8,.8])box(parent,x+dx,y+.9,z,.4,1.5,.8,team.color,.15);}
  else if(west){for(const dx of [-2,2])cylinder(parent,x+dx,y+1.8,z,.18,3.6,'#b68665');box(parent,x,y+3.5,z,6,.3,.4,team.accent,.06);}
  else if(['spurs','pelicans','wizards','celtics','bucks'].includes(team.id)){box(parent,x,y+2,z,5,.4,3,'#d4c2aa',.2);for(const dx of [-2,-.7,.7,2])cylinder(parent,x+dx,y+1,z,.17,2,'#e7dbc7');ball(parent,x,y+2.4,z,2.2,.8,1.4,team.color);}
  else{for(let i=0;i<3;i++){const h=2+i*1.2;box(parent,x+i*2.1,y+h/2,z-i*.5,1.8,h,2.4,team.id==='bulls'?'#b07867':i%2?'#b0c4ca':'#91a8b6',.2);box(parent,x+i*2.1,y+h+.3,z-i*.5,1.3,.6,1.8,team.color,.12);}}
  if(detailed&&team.id==='lakers')sign(parent,'HOLLYWOOD',x+1,y+5,z-2,'#729285',7);
  if(detailed&&team.id==='bulls'){for(let i=0;i<3;i++)box(parent,x+4+i*2,y+3+i*.9,z-3,1.8,6+i*1.8,2,'#8197a1',.18);ball(parent,x+8,y+.8,z+4,2,.95,1.2,'#b9cfce',{roughness:.25,metalness:.25});}
}

export function character(kit,avatar,{star=false,pose='stand'}={}){
  const F=globalThis.NBAFan,a=F.normalizeAvatar(avatar),color=key=>F.OPTIONS[key].find(v=>v[0]===a[key])?.[2],team=globalThis.NBAIsland.TEAMS.find(t=>t.id===a.jersey),g=new T.Group();
  const {ball,box,cylinder}=kit,skin=color('skin'),hair=color('hairColor');const legs=[],arms=[];
  for(const dx of [-.31,.31]){const limb=box(g,dx,.58,0,.36,.95,.42,'#455d73',.17);legs.push(limb);ball(g,dx,.14,.15,.27,.15,.45,color('shoes'));}
  ball(g,0,1.65,0,.67,.73,.45,team.color);box(g,0,1.1,0,1.05,.45,.62,'#4f6171',.18);
  for(const dx of [-.82,.82]){const arm=box(g,dx,1.65,0,.3,.95,.33,skin,.14);arms.push(arm);if(a.wristband!=='none')box(g,dx,1.35,.02,.33,.16,.36,a.wristband==='gold'?'#dfb55b':team.color,.07);}
  ball(g,0,2.75,0,.7,.75,.63,skin);
  if(a.hair!=='shaved'){const cap=ball(g,0,3.19,-.07,.73,.34,.64,hair);if(a.hair==='sweep')cap.rotation.z=.3;if(a.hair==='bun')ball(g,.25,3.52,-.3,.3,.3,.3,hair);if(a.hair==='braids')for(const dx of [-.55,.55])box(g,dx,2.8,-.45,.18,.9,.2,hair,.09);if(a.hair==='curls')for(let i=0;i<5;i++)ball(g,(i-2)*.24,3.27,.29,.2,.17,.2,hair);}
  if(a.headband!=='none'){const band=cylinder(g,0,3.1,0,.72,.13,a.headband==='gold'?'#eac45c':team.color);band.scale.z=.9;}
  for(const dx of [-.24,.24])ball(g,dx,2.83,.57,.07,a.expression==='wink'&&dx>0?.025:.085,.05,'#263a46');
  ball(g,0,2.53,.58,.16,.035,.03,'#986b61');
  if(a.glasses!=='none')for(const dx of [-.24,.24]){const ring=new T.Mesh(kit.geometry('glasses',()=>new T.TorusGeometry(.17,.025,5,20)),kit.material('#42505b'));ring.position.set(dx,2.83,.63);g.add(ring);}
  const number=kit.sign(g,a.number,0,1.8,.45,team.color,.65);number.scale.y=.36;
  if(pose==='ball'){const basketball=ball(g,.75,2.16,.5,.37,.37,.37,'#d99550');arms[1].rotation.x=-.8;}
  g.userData={legs,arms,avatar:a};return g;
}

export function scenic(kit,p,item){
  const x=item.x*.1,z=item.y*.1,y=LEVEL,{box,ball,cylinder,tube,sign}=kit,key=item.key;
  if(key==='golden-gate')return; // Full bridge is built on the real Bay vehicle lane.
  if(key==='alcatraz'){ball(p,x,y-.1,z,2.8,.55,1.8,'#b2b3a6');box(p,x,y+.9,z,3.8,1.8,1.8,'#d2c7a8',.12);for(const dx of [-1.3,-.5,.5,1.3])box(p,x+dx,y+1,z+.94,.25,.55,.04,'#748a89',.03);box(p,x-1.4,y+2,z-.2,.65,.7,.8,'#acae9e',.06);return;}
  if(key==='lombard'){box(p,x,y+.1,z,4,.3,3.8,'#8cab95',.2);const points=[];for(let i=0;i<=30;i++){const t=i/30;points.push(new T.Vector3(x+Math.sin(t*Math.PI*6)*1.25,y+.35+t*.7,z-1.7+t*3.4));}tube(p,points,.23,'#e9dfc6');for(const dx of [-2,2])box(p,x+dx,y+.65,z,.9,1.3,1.8,'#c4aa94',.12);return;}
  if(key==='hollywood'){sign(p,'HOLLYWOOD',x,y+2,z,'#8caa8e',5);return;}
  if(key==='griffith'){box(p,x,y+.7,z,4.5,1.4,2.5,'#e9ddc7',.18);for(const dx of [-1.5,0,1.5]){cylinder(p,x+dx,y+1.8,z,.65,1,'#d2d4be');ball(p,x+dx,y+2.3,z,.72,.55,.7,'#8aaba6');}return;}
  if(['santa-monica','navy-pier'].includes(key)){box(p,x,y+.1,z,5.5,.25,3.4,'#bc9872',.08);const ring=new T.Mesh(kit.geometry('ferris-wheel',()=>new T.TorusGeometry(1.5,.09,8,40)),kit.material('#f0e3b9'));ring.position.set(x,y+2.5,z);p.add(ring);for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(p,x+Math.cos(a)*1.5,y+2.5+Math.sin(a)*1.5,z,.23,.3,.3,i%2?'#78aeb4':'#d89b82');kit.line(p,new T.Vector3(x,y+2.5,z),new T.Vector3(x+Math.cos(a)*1.5,y+2.5+Math.sin(a)*1.5,z),.04,'#e9e3c9');}for(const dx of [-.6,.6])box(p,x+dx,y+1,z,.12,2,.15,'#83a4a8',.04);return;}
  if(['grand-canyon','red-rocks'].includes(key)){for(let i=0;i<4;i++){const h=.7+i*.35;box(p,x+(i-1.5)*1.1,y+h/2,z+(i%2)*.5,1.5,h,2.8,['#c68f73','#d4a080','#b97e65','#d7ad8a'][i],.3);}return;}
  if(key==='vegas'){cylinder(p,x,y+1.5,z,.12,3,'#b4c3ba');const board=box(p,x,y+2.7,z,3.8,1.6,.2,'#f1e6c3',.35);sign(p,'LAS VEGAS',x,y+2.75,z+.13,'#dba98a',3.1);return;}
  if(key==='reunion'){cylinder(p,x,y+2.2,z,.2,4.4,'#b9c8c5');ball(p,x,y+4.5,z,1.1,1.1,1.1,'#d4dfd9');return;}
  if(key==='alamo'||key==='faneuil'){box(p,x,y+.8,z,4,1.6,2.4,key==='alamo'?'#dacdb5':'#b87967',.15);box(p,x,y+1.8,z-.2,2,.7,1.7,'#ddd0b9',.3);for(const dx of [-1,0,1])box(p,x+dx,y+.6,z+1.25,.35,.8,.1,'#758987',.1);if(key==='faneuil'){box(p,x,y+2.7,z,.6,1.1,.7,'#ddd7c5',.12);ball(p,x,y+3.4,z,.35,.4,.35,'#a5baae');}return;}
  if(key==='gateway-arch'){const pts=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI;pts.push(new T.Vector3(x+Math.cos(a)*2.2,y+Math.sin(a)*4,z));}tube(p,pts,.2,'#c6d5d1');return;}
  if(key==='cloud-gate'){const bean=ball(p,x,y+.75,z,2.2,.9,1.3,'#b5cbd0',{roughness:.18,metalness:.2});bean.rotation.z=.12;for(const dx of [-1.5,1.5])ball(p,x+dx,y+.4,z,.55,.5,.7,'#a8c2c8',{roughness:.2,metalness:.2});return;}
  if(key==='willis'){for(let i=0;i<3;i++)box(p,x+(i-1)*.8,y+(4+i*.8)/2,z,.9,4+i*.8,1.3,'#647d8a',.1);cylinder(p,x,y+5.6,z,.04,1.1,'#cad4c8');return;}
  if(key==='liberty'){box(p,x,y+.6,z,2.3,1.2,2.2,'#d2c2a8',.2);cylinder(p,x,y+2,z,.5,1.8,'#7fa69a',.28);ball(p,x,y+3.2,z,.43,.47,.4,'#8ab6a5');kit.line(p,new T.Vector3(x+.3,y+2.6,z),new T.Vector3(x+1,y+3.9,z),.22,'#83ad9d',.25);ball(p,x+1,y+4.2,z,.18,.35,.18,'#e5c47c');return;}
  if(key==='brooklyn'){for(const dx of [-1.8,1.8])box(p,x+dx,y+1.6,z,.65,3.2,1,'#b5a38c',.12);kit.line(p,new T.Vector3(x-3,y+.6,z),new T.Vector3(x+3,y+.6,z),1,'#aab5b0',.2);tube(p,[new T.Vector3(x-2.7,y+.8,z),new T.Vector3(x-1.8,y+3,z),new T.Vector3(x,y+1.3,z),new T.Vector3(x+1.8,y+3,z),new T.Vector3(x+2.7,y+.8,z)],.04,'#d9d3b7');return;}
  if(key==='times-square'){for(let i=0;i<3;i++){box(p,x+(i-1)*1.4,y+1.8+i*.3,z+(i%2)*.6,1.2,3.6+i*.6,1.5,'#8fa7b2',.12);box(p,x+(i-1)*1.4,y+1.7,z+.9+(i%2)*.6,1,1.2,.1,['#dbab87','#88bcc0','#bb99b7'][i],.05);}return;}
  if(key==='south-beach'){for(const dx of [-1.1,1.1])cylinder(p,x+dx,y+.5,z,.08,1,'#ae9270');box(p,x,y+1.6,z,2.8,1.3,2,'#8fbbbc',.18);box(p,x,y+2.4,z,3.3,.25,2.5,'#d79c8c',.12);return;}
  box(p,x,y+.7,z,2.2,1.4,1.8,'#a5bdb9',.3);
}
