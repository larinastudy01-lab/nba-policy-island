import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {MODEL_CATALOG} from './model-catalog.js';

// Only the offline-verified catalog is accepted. No user URL or runtime CDN.
export class DownloadedAssets{
  constructor(){this.loader=new GLTFLoader();this.cache=new Map();this.failures=[];this.closed=false;this.night=false;}
  get(id){
    const record=MODEL_CATALOG[id];if(!record)return Promise.reject(Error('Unknown downloaded model: '+id));
    if(this.closed)return Promise.reject(Error('Model library closed'));
    if(!this.cache.has(id))this.cache.set(id,this.loader.loadAsync(new URL(record.file,import.meta.url).href).then(gltf=>{
      gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.flatShading=false;m.roughness=.78;m.metalness=.04;if(/glass|window/i.test(m.name)){m.userData.window=true;m.emissive.set(this.night?'#d9cda9':'#000000');m.emissiveIntensity=.22;}}}});return gltf;
    }).catch(e=>{this.cache.delete(id);this.failures.push({id,message:e.message});throw e;}));
    return this.cache.get(id);
  }
  async normalized(id,size,{axis='max'}={}){
    const gltf=await this.get(id),object=cloneSkeleton(gltf.scene),wrapper=new T.Group();object.updateMatrixWorld(true);let box=new T.Box3().setFromObject(object);const span=box.getSize(new T.Vector3()),denominator=axis==='height'?span.y:Math.max(span.x,span.y,span.z);object.scale.multiplyScalar(size/Math.max(.00001,denominator));object.updateMatrixWorld(true);box.setFromObject(object);const center=box.getCenter(new T.Vector3());object.position.sub(new T.Vector3(center.x,box.min.y,center.z));wrapper.add(object);wrapper.userData={assetId:id,animations:gltf.animations,source:MODEL_CATALOG[id]};return wrapper;
  }
  play(object,pattern=/idle/i){const clip=object.userData.animations.find(c=>pattern.test(c.name));if(!clip)return null;const mixer=new T.AnimationMixer(object.children[0]);mixer.clipAction(clip).play();mixer.update(0);return mixer;}
  setNight(value){this.night=Boolean(value);for(const promise of this.cache.values())promise.then(g=>{g.scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.userData.window){m.emissive.set(this.night?'#d9cda9':'#000000');m.emissiveIntensity=.22;}});}).catch(()=>{});}
  stats(){return {cached:this.cache.size,ids:[...this.cache.keys()],failures:[...this.failures]};}
  async dispose(){this.closed=true;const geometries=new Set(),materials=new Set(),textures=new Set();for(const promise of this.cache.values()){try{const gltf=await promise;gltf.scene.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}}});}catch{}}geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());this.cache.clear();}
}
export {MODEL_CATALOG};
