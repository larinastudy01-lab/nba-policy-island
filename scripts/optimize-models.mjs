// Offline tooling only. Install pinned tools under node_modules/model-tools, never on the web runtime.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {NodeIO} from '../node_modules/model-tools/node_modules/@gltf-transform/core/dist/index.modern.js';
import {ALL_EXTENSIONS} from '../node_modules/model-tools/node_modules/@gltf-transform/extensions/dist/index.modern.js';
import {dedup,weld,prune,quantize,flatten,join,simplify,resample} from '../node_modules/model-tools/node_modules/@gltf-transform/functions/dist/functions.modern.js';
import {MeshoptSimplifier} from '../node_modules/model-tools/node_modules/meshoptimizer/index.module.js';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'assets/models'),sources=JSON.parse(await fs.readFile(path.join(out,'sources.json'),'utf8'));
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);await MeshoptSimplifier.ready;
const linear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const hex=s=>s.match(/\w\w/g).map(v=>linear(parseInt(v,16)/255));
const stats=doc=>{let vertices=0,triangles=0,primitives=0;for(const m of doc.getRoot().listMeshes())for(const p of m.listPrimitives()){primitives++;vertices+=p.getAttribute('POSITION')?.getCount()||0;triangles+=(p.getIndices()?.getCount()||p.getAttribute('POSITION')?.getCount()||0)/3;}return {vertices,triangles,primitives,materials:doc.getRoot().listMaterials().length,images:doc.getRoot().listTextures().length,animations:doc.getRoot().listAnimations().map(a=>a.getName()),skins:doc.getRoot().listSkins().length};};
function recolor(doc,row){
  for(const m of doc.getRoot().listMaterials()){
    const name=m.getName().toLowerCase();let rgb=m.getBaseColorFactor().slice(0,3);
    // Preserve only authored net/face alpha illustrations; omit photographic PBR maps.
    if(!/hoop_net|face_|coconut_frond/.test(name)&&!['poly-palm-tree','poly-street-straight'].includes(row.id))m.setBaseColorTexture(null);
    m.setNormalTexture(null).setOcclusionTexture(null).setMetallicRoughnessTexture(null).setEmissiveTexture(null).setRoughnessFactor(.78).setMetallicFactor(.04);
    if(row.id==='innerscene-arena'){rgb=hex(/glass/.test(name)?'93b9c9':/cladding/.test(name)?'447eb1':/bronze|louvre|painted/.test(name)?'506b7d':/paving/.test(name)?'d4d5c6':'c6cfc8');m.setAlphaMode('OPAQUE');}
    else if(row.id==='polyhaven-bench')rgb=hex('b88e65');
    else if(name==='court_wood')rgb=hex('cf9c77');
    else if(row.id==='vinish-coconut-palm')rgb=/frond/.test(name)?(name==='coconut_frond'?[1,1,1]:hex('579378')):/trunk/.test(name)?hex('a98a68'):hex('829356');
    else if(row.category==='vehicles')rgb=hex(/paint/.test(name)?'d29e6e':/glass|wind|screen/.test(name)?'638d9e':/led|lamp|light/.test(name)?'e8dcb8':/tire|rubber|gap|under|seal|black|piano/.test(name)?'354953':/seat|leather/.test(name)?'a39380':'92a6ab');
    else rgb=rgb.map(v=>Math.max(.035,Math.min(.85,v)));
    m.setBaseColorFactor([...rgb,m.getAlphaMode()==='OPAQUE'?1:m.getBaseColorFactor()[3]]);
    if(!/net|face/.test(name)&&row.category!=='characters')m.setAlphaMode('OPAQUE');
    // Different materials with the same final properties are deduplicated below.
  }
  if(row.id==='poly-animated-human'){
    const joints=doc.getRoot().listSkins()[0].listJoints().map(n=>n.getName());
    for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
      const positions=p.getAttribute('POSITION'),indices=p.getAttribute('JOINTS_0')?.getArray(),weights=p.getAttribute('WEIGHTS_0')?.getArray();if(!indices||!weights)continue;const colors=new Float32Array(positions.getCount()*4);
      for(let i=0;i<positions.getCount();i++){let slot=0;for(let k=1;k<4;k++)if(weights[i*4+k]>weights[i*4+slot])slot=k;const name=joints[indices[i*4+slot]],rgb=hex(/Head|Neck|Hand|ForeArm/.test(name)?'c99b75':/Foot|Toe/.test(name)?'e5dfcf':/Leg|Hips/.test(name)?'52697a':'5988ad');colors.set([...rgb,1],i*4);}
      p.setAttribute('COLOR_0',doc.createAccessor().setType('VEC4').setArray(colors).setBuffer(positions.getBuffer()));p.getMaterial().setBaseColorFactor([1,1,1,1]);
    }
  }
  if(row.id==='poly-golden-gate')for(const mesh of doc.getRoot().listMeshes())for(const p of [...mesh.listPrimitives()])if(['mat4','mat9'].includes(p.getMaterial()?.getName())){mesh.removePrimitive(p);p.dispose();}
}
const records=[];
for(const row of sources){
  let input=path.join(root,row.raw);
  if(row.id==='polyhaven-bench'){
    const j=JSON.parse(await fs.readFile(input,'utf8'));j.materials=[{name:'Stylized wood',pbrMetallicRoughness:{baseColorFactor:[.5,.3,.15,1],roughnessFactor:.8,metallicFactor:0}}];delete j.images;delete j.textures;delete j.samplers;for(const m of j.meshes)for(const p of m.primitives)p.material=0;
    input=path.join(root,'node_modules/model-downloads/bench-prepared.gltf');await fs.writeFile(input,JSON.stringify(j));
  }
  const doc=await io.read(input),before=stats(doc);recolor(doc,row);
  // Physical transmission would render the whole miniature world again. Use the common Standard palette.
  for(const extension of [...doc.getRoot().listExtensionsUsed()])if(/^KHR_materials_/.test(extension.extensionName))extension.dispose();
  doc.getRoot().getAsset().copyright=`${row.name} by ${row.author}; ${row.license}; ${row.source}. Modified palette and optimized by NBA Policy Island.`;
  const transforms=[dedup({propertyTypes:['Material','Texture','Accessor','Mesh']}),weld()];
  if(!before.animations.length&&!before.skins){transforms.push(flatten(),join({keepNamed:false}),simplify({simplifier:MeshoptSimplifier,ratio:row.category==='vehicles'?.3:.65,error:.0008,lockBorder:true}));}
  else transforms.push(resample());
  transforms.push(prune(),quantize({quantizePosition:14,quantizeNormal:10,quantizeTexcoord:12}),dedup());
  await doc.transform(...transforms);
  const dir=path.join(out,row.category);await fs.mkdir(dir,{recursive:true});const target=path.join(dir,row.id+'.glb');await io.write(target,doc);const bytes=await fs.readFile(target),after=stats(doc);
  records.push({...row,path:'./assets/models/'+row.category+'/'+row.id+'.glb',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),before,after,
    modification:'Stylized palette; photographic PBR maps removed; retain net/face/leaf alpha and Quaternius colour atlas; human outfit vertex colours by bone; weld/dedup/prune; static meshes joined/simplified within error 0.0008; 14-bit positions / 10-bit normals. Animations and skin bindings retained. No Draco/Meshopt runtime decoder.'});
  console.log(row.id,row.sourceBytes,'->',bytes.length,'bytes;',before.primitives,'->',after.primitives,'draw primitives;',after.animations.join(','));
}
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(records,null,2)+'\n');
const catalog=Object.fromEntries(records.map(r=>[r.id,{id:r.id,name:r.name,category:r.category,author:r.author,license:r.license,source:r.source,file:'../models/'+r.category+'/'+r.id+'.glb',bytes:r.bytes,animations:r.after.animations}]));
await fs.writeFile(path.join(root,'assets/three-map/model-catalog.js'),'// Generated by scripts/optimize-models.mjs; only verified local files.\nexport const MODEL_CATALOG='+JSON.stringify(catalog,null,2)+';\n');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const licenseURL=id=>id==='CC0-1.0'?'https://creativecommons.org/publicdomain/zero/1.0/':'https://creativecommons.org/licenses/by/'+(id==='CC-BY-3.0'?'3.0':'4.0')+'/';
await fs.writeFile(path.join(out,'credits.html'),`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NBA Policy Island — 3D Model Credits</title><link rel="stylesheet" href="./credits.css"><main><a href="../../index.html">← NBA 政策島</a><h1>3D 素材作者與授權</h1><p>以下素材已下載並優化。已改色、去除寫實貼圖、合併／精簡幾何並量化；保留人物骨架與動畫。各模型署名與來源可在此回查。</p><ul>${records.map(r=>`<li><h2>${esc(r.name)}</h2><p>作者：${esc(r.author)} · <a href="${licenseURL(r.license)}">${esc(r.license)}</a> · <a href="${esc(r.source)}">原始模型</a></p><p>取得：${r.acquired} · ${Math.round(r.bytes/1024)} KiB · ${esc(r.id)}</p></li>`).join('')}</ul><p>隊徽與各隊商標沿用原有使用者提供素材，並非 CC0。</p></main></html>`);
console.log('TOTAL',records.length,records.reduce((n,r)=>n+r.sourceBytes,0),'->',records.reduce((n,r)=>n+r.bytes,0),'bytes');
