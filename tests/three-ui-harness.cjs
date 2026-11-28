'use strict';
// DOM/event substitutes only. No browser, canvas implementation or GPU is started.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{pathToFileURL}=require('node:url');
module.exports=async function harness({THREE,buildWorld,createLegacyBridge,Core,width=1000,reducedMotion=false}){
  const base=path.resolve(__dirname,'../prototype/three-islands'),nodes=new Map(),raf=new Map(),events=new Map(),records=new Map(),observers=[];let time=100,id=0,renders=0;
  class Element{
    constructor(tag='div'){this.tagName=tag.toUpperCase();this.dataset={};this.style={};this.listeners=new Map();this.attributes=new Map();this.children=[];this.hidden=false;this.disabled=false;this.value='';this.clientWidth=width;this.clientHeight=640;}
    addEventListener(type,fn){const handlers=this.listeners.get(type)||[];handlers.push(fn);this.listeners.set(type,handlers);}
    emit(type,extra={}){for(const fn of this.listeners.get(type)||[])fn({target:this,preventDefault(){},...extra});}
    click(){if(!this.disabled)this.emit('click');}setAttribute(k,v){this.attributes.set(k,String(v));}getAttribute(k){return this.attributes.get(k);}
    append(...children){this.children.push(...children);for(const child of children)if(child.id)nodes.set(child.id,child);}replaceChildren(...children){this.children=[];this.append(...children);}
    cloneNode(){return Object.assign(new Element(this.tagName),{src:this.src,alt:this.alt,width:this.width,height:this.height});}
    getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}setPointerCapture(){}scrollIntoView(){}
    showModal(){this.open=true;}close(){this.open=false;this.emit('close');}
  }
  const html=fs.readFileSync(path.join(base,'index.html'),'utf8');for(const m of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/g)){const e=new Element(m[1]);e.id=m[2];e.hidden=/\bhidden\b/.test(m[0]);nodes.set(e.id,e);}
  const get=id=>nodes.get(id),storage={getItem:k=>records.get(k)||null,setItem:(k,v)=>records.set(k,v)};
  get('game-state').value='live';get('fixture').value='away';get('quality').value='auto';get('team-search').value='';
  const document={readyState:'complete',hidden:false,body:new Element('body'),getElementById:get,createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text}),addEventListener(type,fn){const callbacks=events.get(type)||[];callbacks.push(fn);events.set(type,callbacks);}};
  class Renderer{
    constructor(){this.info={render:{calls:0,triangles:0},memory:{geometries:0,textures:0}};this.shadowMap={};}
    setPixelRatio(){}setSize(){}render(){renders++;}dispose(){this.disposed=true;}
  }
  class Library{
    constructor(){this.cache=new Map();this.failures=[];this.loads=0;}
    async treeInstances(){return new THREE.Group();}async normalized(){return new THREE.Group();}dispose(){}
  }
  const motion={matches:reducedMotion,addEventListener(type,fn){this.callback=fn;}},windowEvents=new Map(),window={localStorage:storage,addEventListener(type,fn){windowEvents.set(type,fn);}};
  const context=vm.createContext({THREE:{...THREE,WebGLRenderer:Renderer},AssetLibrary:Library,buildWorld,createLegacyBridge,console,document,window,URL,Blob,Event,devicePixelRatio:1,performance:{now:()=>time},matchMedia:()=>motion,requestAnimationFrame:fn=>{raf.set(++id,fn);return id;},cancelAnimationFrame:key=>raf.delete(key),setTimeout,clearTimeout,location:{reload(){}},IntersectionObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(){this.callback([{isIntersecting:true}]);}disconnect(){}},ResizeObserver:class{constructor(callback){this.callback=callback;}observe(){}disconnect(){}},NBA3DCore:Core,NBAArchipelago:require('../assets/archipelago-core.js'),NBAIsland:require('../assets/island-core.js'),NBAExplorer:require('../assets/explorer-core.js'),NBAFan:require('../assets/fan-core.js'),NBABay:require('../assets/bay-scene.js'),NBAPixel:require('../assets/pixel-core.js')});
  // Imported bridge reads this same substitute document, as in a single browser realm.
  globalThis.document=document;
  const source=fs.readFileSync(path.join(base,'app.js'),'utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('import.meta.url',JSON.stringify(pathToFileURL(path.join(base,'app.js')).href));
  await new vm.Script('(async()=>{'+source+'})()',{filename:'prototype-app-unit'}).runInContext(context);
  async function step(ms=16){time+=ms;const callbacks=[...raf.values()];raf.clear();for(const fn of callbacks)fn(time);await Promise.resolve();}
  return {get,storage,motion,document,raf,observers,renders:()=>renders,async settle(){await new Promise(resolve=>setImmediate(resolve));},async advance(ms){for(let t=0;t<ms;t+=16)await step(16);},hidden(value){document.hidden=value;for(const fn of events.get('visibilitychange')||[])fn();},snapshot:()=>context.NBA3DDiagnostics.snapshot(),dispose(){windowEvents.get('pagehide')?.();}};
};
