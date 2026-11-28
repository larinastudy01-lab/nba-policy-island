import * as T from 'three';
// Original architectural interpretations. No third-party geometry/textures are used here.
export function cityLandmark(kit,parent,team,detail=false){
  const A=globalThis.NBAArchipelago,city=globalThis.NBACities.get(team.id),island=A.getIsland(team.id);if(!city)return;
  const g=new T.Group();g.position.set(island.x*.1+(team.id==='lakers'?-10.5:9.5),2.2,island.y*.1+(team.id==='lakers'?-8.5:-7.5));g.userData.cityLandmark=city.id;parent.add(g);if(team.id==='warriors'){g.userData.reusesSightId='sight-golden-gate';return g;}const props=new T.Group();props.position.y=-2.2;g.add(props);const {box,ball,cylinder,tube,sign}=kit,c=team.color,a=team.accent,stone='#ddd9c8',glass='#82b6c8',brick='#b98373';
  const b=(x,y,z,w,h,d,col=stone,r=.15)=>box(g,x,y,z,w,h,d,col,r),cy=(x,y,z,r,h,col=stone,top=r)=>cylinder(g,x,y,z,r,h,col,top),orb=(x,y,z,rx,ry,rz,col)=>ball(g,x,y,z,rx,ry,rz,col);
  function tower(h=7){b(0,h/2,0,2.2,h,2.2,glass,.25);b(0,h+.3,0,1.8,.6,1.8,stone);if(detail)for(let y=1;y<h;y+=1.1)b(0,y,1.13,1.9,.07,.05,'#dbd9b9',.02);}
  function columns(){b(0,.2,0,7,.4,4);for(const x of [-2.7,-1.35,0,1.35,2.7])cy(x,1.5,1.1,.18,2.6);b(0,2.9,0,7.4,.5,4.5);}
  function bridge(color,arch=false){b(0,.2,0,9,.3,2,'#9caaa8');for(const x of [-3,3]){b(x,2.1,0,.5,4.2,2.5,color);if(arch){cy(x,4.1,0,.4,.8,color,.08);}}for(const z of [-1,1]){tube(g,[-4,-3,-1,1,3,4].map((x,i)=>new T.Vector3(x,[1,4,1.3,1.3,4,1][i],z)),.05,color);if(detail)for(let x=-3;x<=3;x++)cy(x,1.3,z,.035,2.2,color);}}
  function mountains(snow=false){for(let i=0;i<3;i++){const h=3.5+i*.9,m=new T.Mesh(kit.geometry('city-mountain-'+h,()=>new T.ConeGeometry(2.5,h,7)),kit.material(snow?'#aaa994':'#c19777'));m.position.set((i-1)*2,h/2,-1-i*.3);g.add(m);if(snow){const peak=new T.Mesh(kit.geometry('city-snow-'+h,()=>new T.ConeGeometry(1,h*.4,7)),kit.material('#e8ebdd'));peak.position.copy(m.position).add(new T.Vector3(0,h*.31,0));g.add(peak);}}}
  function wheel(){b(0,.2,0,8,.4,4,'#b89975');for(const x of [-2,2]){const p=b(x,2.2,0,.17,4.4,.17,stone);p.rotation.z=x>0?.35:-.35;}const ring=new T.Mesh(kit.geometry('city-wheel',()=>new T.TorusGeometry(2.4,.1,8,40)),kit.material(a));ring.position.set(0,3.4,0);g.add(ring);for(let i=0;i<10;i++){const angle=i*Math.PI/5,x=Math.cos(angle)*2.4,y=3.4+Math.sin(angle)*2.4;b(x,y,0,.5,.5,.5,c);if(detail)tube(g,[new T.Vector3(0,3.4,0),new T.Vector3(x,y,0)],.025,stone);}}
  function street(french=false){for(let i=0;i<3;i++){const x=(i-1)*2.5;b(x,1.5,0,2.2,3,2.5,french?'#e7c5a4':brick);b(x,3.05,0,2.5,.3,2.8,c);b(x,1.4,1.3,1.2,1.5,.1,glass);if(french){b(x,2,1.8,2.4,.15,1.2);for(let j=0;j<4;j++)b(x-1+j*.65,2.4,2.2,.05,.8,.05,'#47656a',.01);}}}
  switch(city.model){
    case 'suspension':bridge('#bb604c');if(detail){b(1,-.3,3,10,.2,2,'#b69770');orb(-3,-.1,4,1.6,.3,.7,'#e3e9df');}break;
    case 'hollywood':mountains();if(detail)for(let i=0;i<5;i++){const star=cy(i-2,.1,3,.25,.05,a);star.rotation.y=.2;}break;
    case 'pier-wheel':b(0,.2,0,8,.4,4,'#b89975');if(detail){for(let x=-4;x<=4;x+=2)cy(x,-.4,1,.12,1.4,'#95745b');kit.palm(props,-4,1,.6);}break;
    case 'capitol':columns();orb(0,3.3,0,1.6,1.3,1.4,stone);cy(0,4.4,0,.25,.5,a);break;
    case 'desert':mountains();for(const x of [-3,3]){cy(x,1,2,.2,2,'#729780');b(x+.4,1.3,2,.9,.2,.2,'#729780');cy(x+.8,1.6,2,.15,.6,'#729780');}break;
    case 'gothic-bridge':bridge('#69948b',true);if(detail)kit.palm(props,-5,-1,.6);break;
    case 'salt-lake':orb(1,.04,2,4,.06,1.7,'#b8d4d0');mountains(true);break;
    case 'rockies':mountains(true);if(detail)for(const x of [-4,4]){cy(x,.8,2,.15,1.6,'#8d8870');orb(x,2,2,.8,1.2,.8,'#5c8b76');}break;
    case 'devon':tower(8);const top=b(0,8.7,0,1.4,1.4,1.4,glass);top.rotation.z=.35;break;
    case 'lake-city':orb(0,.05,3,4,.07,1.5,'#8dbfc6');tower(5);for(const x of [-3,3])b(x,1.7,0,1.8,3.4,2,'#b1c3bf');break;
    case 'reunion':cy(0,2.6,0,.2,5.2,'#b5bfb9');orb(0,5.7,0,1.7,1.1,1.7,'#b4cdd0');for(const dx of [-1,1])b(dx,5.8,1.2,.07,1.4,.07,a);break;
    case 'space':cy(0,2.5,0,.65,5,'#e2e5dc');const cone=new T.Mesh(kit.geometry('city-rocket',()=>new T.ConeGeometry(.65,1.5,24)),kit.material(c));cone.position.set(0,5.6,0);g.add(cone);for(const x of [-1,1]){cy(x,1.4,0,.35,2.8,stone);b(x,.5,0,.7,.7,1,c);}b(0,.1,0,6,.2,5,'#aab9b4');break;
    case 'alamo':b(0,1.2,0,6,2.4,2.6,'#d3b999');b(0,2.5,0,2.4,.6,2.6,'#d3b999');orb(0,2.9,0,1.2,.5,1.3,'#d3b999');b(0,.9,1.4,1.3,1.8,.15,'#6f7e75');orb(0,.02,3,4,.06,.6,'#79b0b5');break;
    case 'blues':street();sign(g,'BEALE',0,3.8,.3,'#324f70',4);if(detail){cy(-3,2,2,.07,2,a);orb(-3,1,2,.3,.22,.2,a);}break;
    case 'french':street(true);if(detail)kit.lamp(props,4,2,[]);break;
    case 'freedom':street();b(0,4.1,0,1.4,2.2,1.4,brick);cy(0,5.6,0,.6,1,stone,.08);orb(0,4.5,.75,.4,.4,.08,'#eee6c9');b(0,.04,3,8,.06,.35,'#b27165');break;
    case 'liberty-empire':tower(7.5);b(0,8.5,0,1.3,2,1.4,stone);cy(0,10,0,.07,1,stone);break;
    case 'brooklyn':bridge('#b89977',true);break;
    case 'liberty-bell':columns();cy(0,1.4,0,.7,1.2,'#ad956c',.3);orb(0,.8,0,.8,.18,.8,'#ad956c');b(0,2.5,0,2,.2,1,'#876c52');break;
    case 'cn':cy(0,3.2,0,.23,6.4,stone);orb(0,6.2,0,1.4,.5,1.4,glass);cy(0,8,0,.1,3,stone,.03);break;
    case 'cloud-gate':for(let i=0;i<3;i++)b((i-1)*2,2+i,0,1.6,4+i*2,1.8,'#82949c');break;
    case 'art-wings':b(0,.6,0,6,1.2,3,'#e4e5dc');for(const side of [-1,1])for(let i=0;i<5;i++){const wing=b(side*(i*.45+.8),1.5+i*.22,0,.1,2+i*.6,3.8-i*.3,'#eee9d7');wing.rotation.z=side*(.35+i*.12);}break;
    case 'motor':b(0,1,0,7,2,4,'#bdc3b5');b(0,1.5,2.1,6,1,.1,glass);for(const x of [-2,2]){orb(x,.5,3,1,.3,.55,c);for(const dx of [-.6,.6])orb(x+dx,.28,3.45,.2,.2,.15,'#40525c');}break;
    case 'speedway':{const track=new T.Mesh(kit.geometry('city-track',()=>new T.TorusGeometry(2.3,.4,8,40)),kit.material('#718287'));track.rotation.x=Math.PI/2;track.scale.y=1.5;track.position.y=.15;g.add(track);for(const x of [-2,2])b(x,1.1,-2,1.8,2.2,1.3,'#c5bba5');b(0,.2,0,2,.4,2,'#87a189');break;}
    case 'rock-hall':{const pyramid=new T.Mesh(kit.geometry('rock-pyramid',()=>new T.ConeGeometry(3.4,4,4)),kit.material(glass));pyramid.rotation.y=Math.PI/4;pyramid.position.y=2;g.add(pyramid);b(2,1.2,-1,3,2.4,3,'#d9d9cc');break;}
    case 'olympic':for(let i=0;i<5;i++){const ring=new T.Mesh(kit.geometry('olympic-ring',()=>new T.TorusGeometry(.6,.07,8,24)),kit.material(['#4e839e','#c1ac5b','#6b8f86','#68858d','#b47c6a'][i]));ring.position.set((i%3)*1.5-1.5,1.2+Math.floor(i/3)*1.1,0);g.add(ring);}orb(0,.1,2,4,.1,2,'#81ad9b');break;
    case 'nascar':b(0,1.1,0,7,2.2,3,glass);b(0,2.6,0,7.8,.6,3.5,'#b5c0b8');if(detail)for(let i=0;i<4;i++)b(i-1.5,2.9,1.8,.9,.5,.1,i%2?'#ede4cb':'#3c5664');orb(0,.5,3,1.6,.4,.65,c);break;
    case 'south-beach':for(const x of [-2,2])b(x,.9,0,.2,1.8,.2,'#b69c78');b(0,2,0,5,2,2.7,'#a9c6c5');b(0,3.15,0,5.8,.3,3.2,'#e2b5a2');b(0,1.4,1.8,5.5,.18,1);b(0,2.1,1.4,1.5,1,.1,glass);kit.palm(props,4,0,.8);break;
    case 'fantasy':for(const x of [-2,0,2]){cy(x,1.7,0,.65,3.4,x?'#c6d2d1':'#b6b4cb');const roof=new T.Mesh(kit.geometry('fantasy-roof',()=>new T.ConeGeometry(.9,1.8,24)),kit.material(c));roof.position.set(x,4.3+(x?0:1),0);g.add(roof);}orb(0,6.3,0,.4,.4,.4,a);break;
    case 'washington':columns();b(0,2.7,0,4,.4,3,stone);cy(4.4,3,0,.45,6,stone,.23);const tip=new T.Mesh(kit.geometry('monument-tip',()=>new T.ConeGeometry(.33,.6,4)),kit.material(stone));tip.position.set(4.4,6.3,0);g.add(tip);break;
  }
  if(detail){b(0,.04,4,8,.08,1.4,'#d9ddcb');kit.bench(props,-3,3.5);}
  // A single merge per material keeps every city distinct without 30 detailed city loads.
  kit.merge(props);kit.merge(g);return g;
}

export function franchiseBase(kit,parent){const data=globalThis.NBAFranchiseWorld;if(!data)return null;const g=new T.Group(),i=data.island,y=2.2;g.position.set(i.x*.1,y,i.y*.1);parent.add(g);const {box,ball,cylinder}=kit;
  ball(g,0,-1.1,0,17,1.2,12,'#b8bea6');ball(g,0,-.35,0,16,.6,11.5,'#9ab9a0');box(g,0,-.02,4,28,.15,3,'#d7dbc9');box(g,10,-.02,4,3,.15,9,'#d7dbc9');
  const court={x:(i.x-45),y:(i.y-10),type:'park'};const cx=-4.5,z=-1;box(g,cx,.1,z,10,.2,7,'#b58d68');box(g,cx,.23,z,9.5,.025,6.5,'#608f93');for(const dx of [-4.6,4.6])box(g,cx+dx,.26,z,.06,.03,6.3,'#ece4c9',.01);for(const dz of [-3.1,3.1])box(g,cx,.26,z+dz,9.2,.03,.06,'#ece4c9',.01);cylinder(g,cx,.26,z,1.2,.035,'#e8d5b4');box(g,cx,1.9,z-3.4,.1,3.8,.1,'#496975');box(g,cx,3.5,z-3.3,1.5,.9,.12,'#cadcda');
  box(g,6,1.8,-4,5,3.6,5,'#e1d4ba',.4);box(g,6,3.8,-4,5.6,.5,5.6,'#658d99',.35);box(g,6,1.6,-1.4,2.7,2.3,.15,'#82b6c8');box(g,-9,1.2,7,5,2.4,3.5,'#d0cab4',.3);box(g,-9,2.5,7,5.4,.3,3.9,'#91afb0');box(g,3,1.8,7,.2,3.6,.2,'#556d74');
  const rim=new T.Mesh(kit.geometry('custom-hoop-rim',()=>new T.TorusGeometry(.32,.045,8,28)),kit.material('#d69b53'));rim.rotation.x=Math.PI/2;rim.position.set(cx,3.12,z-2.85);g.add(rim);const net=new T.Mesh(kit.geometry('custom-hoop-net',()=>new T.CylinderGeometry(.3,.18,.5,8,1,true)),new T.MeshBasicMaterial({color:'#f2eddf',wireframe:true}));net.position.set(cx,2.86,z-2.85);net.material.userData.transient=true;kit.materials.set(net.material.uuid,net.material);g.add(net);
  const board=kit.sign(g,'MY TEAM',3,3.1,7,'#2d5366',4);g.userData.board=board;g.userData.refresh=()=>{const s=globalThis.NBAFranchiseUI?.state();if(!s?.team)return;const old=g.userData.custom;if(old){old.removeFromParent();kit.disposeGroup(old);}const t=s.team,sg=new T.Group();g.add(sg);g.userData.custom=sg;kit.sign(sg,t.abbr+' / '+t.name,3,3.1,7.08,t.primary,5);box(sg,cx,.27,z,9.3,.02,6.3,t.primary);const texture=new T.TextureLoader().load('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(globalThis.NBAFranchise.logoSVG(t)),()=>globalThis.dispatchEvent?.(new Event('nba:franchise-render')));texture.colorSpace=T.SRGBColorSpace;kit.textures.add(texture);const material=new T.MeshBasicMaterial({map:texture,transparent:true});material.userData.transient=true;kit.materials.set(material.uuid,material);const emblem=new T.Mesh(kit.geometry('custom-emblem',()=>new T.PlaneGeometry(2,2)),material);emblem.position.set(6,3,-1.35);emblem.userData.keep=true;sg.add(emblem);for(const dz of [-3.05,3.05])box(sg,cx,.31,z+dz,9.1,.03,.055,'#f3e8cb',.01);for(const dx of [-4.55,4.55])box(sg,cx+dx,.31,z,.055,.03,6.1,'#f3e8cb',.01);for(const dx of [-1.5,1.5])box(sg,cx+dx,.31,z-1.7,.05,.03,2.7,'#f3e8cb',.01);box(sg,cx,.31,z-.35,3,.03,.05,'#f3e8cb',.01);const arc=new T.Mesh(kit.geometry('custom-court-arc',()=>new T.TorusGeometry(1.5,.03,6,40)),kit.material('#f3e8cb'));arc.rotation.x=Math.PI/2;arc.position.set(cx,.31,z-.35);sg.add(arc);box(sg,cx,3.52,z-3.18,.6,.45,.05,'#e8c078',.02);board.visible=false;};g.userData.refresh();return g;}
