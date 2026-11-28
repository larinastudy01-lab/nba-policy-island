import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Two verified, local CC0 GLBs. Shared promises and geometry, with explicit teardown.
export class AssetLibrary{
  constructor(){this.loader=new GLTFLoader();this.cache=new Map();this.loads=0;this.failures=[];}
  get(id){
    if(!['quaternius-tree','quaternius-sports-car'].includes(id))return Promise.reject(Error('Unknown model'));
    if(!this.cache.has(id)){
      this.loads++;
      const promise=this.loader.loadAsync(new URL('./assets/models/'+id+'.glb',import.meta.url).href).then(gltf=>{
        gltf.scene.traverse(o=>{if(!o.isMesh)return;const adapt=m=>new THREE.MeshLambertMaterial({name:m.name,color:m.name.toLowerCase().includes('window')?'#345469':m.color,flatShading:true,side:THREE.FrontSide});const old=Array.isArray(o.material)?o.material:[o.material];o.material=Array.isArray(o.material)?old.map(adapt):adapt(o.material);old.forEach(m=>m.dispose());o.castShadow=true;o.receiveShadow=true;o.frustumCulled=true;});
        return gltf.scene;
      }).catch(error=>{this.cache.delete(id);this.failures.push({id,message:error.message});throw error;});
      this.cache.set(id,promise);
    }
    return this.cache.get(id);
  }
  async normalized(id,size){const source=await this.get(id),copy=source.clone(true),box=new THREE.Box3().setFromObject(copy),span=box.getSize(new THREE.Vector3()),scale=size/Math.max(span.x,span.y,span.z);const wrapper=new THREE.Group();copy.scale.multiplyScalar(scale);box.setFromObject(copy);const center=box.getCenter(new THREE.Vector3());copy.position.sub(new THREE.Vector3(center.x,box.min.y,center.z));wrapper.add(copy);return wrapper;}
  async treeInstances(positions){const source=await this.normalized('quaternius-tree',5.5),group=new THREE.Group();source.updateMatrixWorld(true);source.traverse(o=>{if(!o.isMesh)return;const mesh=new THREE.InstancedMesh(o.geometry,o.material,positions.length),m=new THREE.Matrix4();positions.forEach((p,i)=>{m.makeTranslation(p.x,p.y,p.z).multiply(o.matrixWorld);mesh.setMatrixAt(i,m);});mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.sharedAsset=true;group.add(mesh);});return group;}
  async dispose(){const geometry=new Set(),materials=new Set();for(const promise of this.cache.values()){try{const root=await promise;root.traverse(o=>{if(o.isMesh){geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});}catch{}}geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.cache.clear();}
}
