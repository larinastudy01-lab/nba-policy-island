import * as T from 'three';
import {createKit,stadium,character,scenic,LEVEL} from './models.js';

// Same renderer and model builders, rendered to an offscreen target, never an iframe.
export function createPhotographer(renderer,assets){
  let chain=Promise.resolve(),disposed=false;const cache=new Map();
  async function render(record){
    const key=JSON.stringify(record);if(cache.has(key))return cache.get(key);if(disposed)throw Error('PHOTO_RENDERER_CLOSED');
    await new Promise(resolve=>requestAnimationFrame(resolve));
    let photoCredit='';const availableAssets=['stylized-3d-assets-v1','geographic-stylized-v2','through-ages-v1'].includes(record.artVersion)?assets:null;const F=globalThis.NBAFan,info=F.photoInfo(record),team=globalThis.NBAIsland.TEAMS.find(t=>t.id===record.teamId)||globalThis.NBAIsland.TEAMS.find(t=>t.id===record.avatar.jersey),star=F.getStar(record.starId),scene=new T.Scene(),kit=createKit(),root=new T.Group(),night=record.background==='night';const env=globalThis.NBAJourneyCore?.environment(record.era,night?'night':record.kind&&record.kind!=='home'?record.dayPhase:'day');scene.background=new T.Color(env?.sky||(night?'#304458':'#bcd7dc'));scene.add(root);scene.add(new T.HemisphereLight(env?.ambient||'#e0efff','#a9b898',env?.hemi||2.7));const light=new T.DirectionalLight(env?.sun||'#fff0cd',env?.sunIntensity||3);light.position.set(-10,25,18);scene.add(light);
    kit.box(root,0,LEVEL-.1,3,36,.2,30,record.kind==='encounter'&&record.locationId==='meet-pier'?'#b39871':'#d3d6c6',.5);
    async function model(id,size,x=0,z=0){if(!availableAssets)return null;try{const object=await availableAssets.normalized(id,size);object.position.set(x,LEVEL,z);root.add(object);return object;}catch{return null;}}
    if(record.kind==='sight'){
      const item=globalThis.NBASights.get(record.locationId);
      const imported=item.key==='golden-gate'?await model('poly-golden-gate',20,0,-1):item.key==='liberty'?await model('poly-liberty',7,0,-1):null;
      if(imported)photoCredit=item.key==='golden-gate'?'Golden Gate bridge / Steren Giannini / CC BY 3.0 / poly.pizza/m/a648BwpXx-A':'Lady Liberty / Anna M / CC BY 3.0 / poly.pizza/m/ef9Yd09Doxh';
      else if(item.key==='golden-gate'){for(const x of [-6,6])kit.box(root,x,LEVEL+3,0,.5,6,.65,'#bd6652',.12);kit.line(root,new T.Vector3(-10,LEVEL+1,0),new T.Vector3(10,LEVEL+1,0),2,'#879d9e',.2);kit.tube(root,[new T.Vector3(-10,LEVEL+1,0),new T.Vector3(-6,LEVEL+6,0),new T.Vector3(0,LEVEL+2.5,0),new T.Vector3(6,LEVEL+6,0),new T.Vector3(10,LEVEL+1,0)],.08,'#bd6652');}
      else scenic(kit,root,{...item,x:0,y:0});
    }else if(!record.kind||record.kind==='home'){const imported=team.id==='warriors'?await model('innerscene-arena',14):null;if(imported){kit.logo(root,team,0,LEVEL+2.8,5,2);kit.sign(root,team.abbr+' ARENA',0,LEVEL+4,4.8,team.color,4);}else stadium(kit,root,{...team,x:0,y:0,entrance:{x:0,y:60}},{glows:[]});}
    else if(record.locationId==='meet-pier'){for(const x of [-9,-6,-3,0,3,6,9]){kit.cylinder(root,x,LEVEL+.5,-1,.14,1,'#6d817b');}kit.line(root,new T.Vector3(-10,LEVEL+1,-1),new T.Vector3(10,LEVEL+1,-1),.1,'#78918a');kit.box(root,-6,LEVEL+.2,-3,6,.3,3,'#6aa7b4',.4);}
    else{for(const x of [-8,8]){kit.cylinder(root,x,LEVEL+1,-2,.2,2,'#8e806a');kit.ball(root,x,LEVEL+3,-2,2,2,1.7,'#70a48a');}kit.bench(root,0,-2);}
    const me=character(kit,record.avatar,{pose:record.pose});me.position.set(-2.5,LEVEL,8);root.add(me);if(star){const companion=character(kit,{...F.DEFAULT_AVATAR,...star,nickname:star.starName,jersey:star.teamId,number:star.number},{pose:'ball',star:true});companion.position.set(2.5,LEVEL,8);root.add(companion);}
    const camera=new T.OrthographicCamera(-10.5,10.5,7,-7,.1,100);camera.position.set(12,13,29);camera.lookAt(0,LEVEL+1.5,4);camera.updateMatrixWorld();
    await Promise.all(kit.pendingTextures);
    const target=new T.WebGLRenderTarget(960,640,{samples:2}),previous=renderer.getRenderTarget(),clear=new T.Color();target.texture.colorSpace=T.SRGBColorSpace;renderer.getClearColor(clear);const alpha=renderer.getClearAlpha(),pixels=new Uint8Array(960*640*4);
    try{renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,960,640,pixels);}finally{renderer.setRenderTarget(previous);renderer.setClearColor(clear,alpha);target.dispose();kit.dispose();}
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=640;const ctx=canvas.getContext('2d'),image=ctx.createImageData(960,640);for(let y=0;y<640;y++)image.data.set(pixels.subarray((639-y)*960*4,(640-y)*960*4),y*960*4);ctx.putImageData(image,0,0);ctx.fillStyle='#29495d';ctx.fillRect(0,512,960,128);ctx.fillStyle='#f2ddb0';ctx.font='17px Microsoft JhengHei, sans-serif';ctx.fillText('夢回 NBA / THROUGH THE AGES',40,545);ctx.fillStyle='#fff8e8';ctx.font='bold 24px Microsoft JhengHei, sans-serif';ctx.fillText(record.avatar.nickname+' × '+(star?.starName||info.venue),40,580,870);ctx.font='16px Microsoft JhengHei, sans-serif';ctx.fillText((info.team?.name||'島上景點')+' · '+info.venue+' · '+F.photoDate(record.capturedAt)+'（台灣）',40,611,880);
    if(photoCredit){ctx.font='11px sans-serif';ctx.fillStyle='#d6e0df';ctx.fillText(photoCredit+'; recoloured / optimized',40,634,880);}
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PHOTO_PNG_FAILED')),'image/png'));cache.set(key,blob);while(cache.size>10)cache.delete(cache.keys().next().value);return blob;
  }
  function exportPNG(record){const task=chain.then(()=>render(record));chain=task.catch(()=>{});return task;}
  return {exportPNG,dispose(){disposed=true;cache.clear();}};
}
