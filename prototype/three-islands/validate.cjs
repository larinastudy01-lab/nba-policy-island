'use strict';
// One reproducible terminal check; no browser, server, push or database access.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=[path.join(root,'script.js'),...walk(path.join(root,'assets')),...walk(path.join(root,'prototype/three-islands')),...walk(path.join(root,'tests'))].filter(p=>/\.(js|cjs)$/.test(p));
for(const file of files)cp.execFileSync(process.execPath,['--check',file],{cwd:root,stdio:'pipe'});
const tests=cp.execFileSync(process.execPath,['--test','--test-reporter=tap','tests/*.test.cjs'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
const staticOutput=cp.execFileSync('python',['tests/check-static.py'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
cp.execFileSync(process.execPath,[path.join(__dirname,'audit.cjs')],{cwd:root,stdio:'pipe'});
cp.execFileSync('git',['-c','safe.directory='+root,'diff','--exit-code','HEAD','--','index.html','style.css','script.js','assets','.github'],{cwd:root,stdio:'pipe'});
const count=name=>Number(tests.match(new RegExp('^# '+name+' (\\d+)','m'))?.[1]||0);
const result={recordedAt:new Date().toISOString(),environment:{node:process.version,platform:process.platform},commands:[{command:'node --check [all project JS/CJS, including prototype vendor]',passed:true,files:files.length},{command:'node --test --test-reporter=tap tests/*.test.cjs',passed:true,tests:count('tests'),pass:count('pass'),fail:count('fail'),skipped:count('skipped')},{command:'python tests/check-static.py',passed:true,output:staticOutput.trim().split(/\r?\n/)},{command:'node prototype/three-islands/audit.cjs',passed:true},{command:'git diff --exit-code HEAD -- index.html style.css script.js assets .github',passed:true,meaning:'Existing production files unchanged'}],browserOrWebGLStarted:false,remoteMutations:false,pending:['Visual desktop/mobile QA','Runtime load time/FPS/draw calls/JS heap/GPU measurements','PNG download','Published Pages path','Real two-device multiplayer'],note:'Three geometry/loader run in Node; app event checks use DOM/renderer substitutes, not a GPU benchmark.'};
fs.writeFileSync(path.join(root,'docs/three-prototype-validation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
