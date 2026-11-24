'use strict';
const fs=require('node:fs'),path=require('node:path');
const M=require('./memory-core.js'),Art=require('./memory-art.js');
const folder=path.join(__dirname,'memories');fs.mkdirSync(folder,{recursive:true});
for(const e of M.EVENTS){fs.writeFileSync(path.join(folder,e.id+'.svg'),Art.svg(e));fs.writeFileSync(path.join(folder,e.id+'-point.svg'),Art.svg(e,true));}
console.log('Generated 5 original pixel scenes and 5 map props.');
