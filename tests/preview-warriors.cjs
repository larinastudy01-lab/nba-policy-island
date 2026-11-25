'use strict';
// 手動驗收輔助。只有明確要求畫面驗證時執行；不會包含在 node --test 中。
// PLAYWRIGHT_MODULE 指向本機已安裝套件；不下載套件、登入或存取外部服務。
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/warriors-bay-preview');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.wav':'audio/wav'};
const cache=new Map();
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),baseline=url.pathname.startsWith('/baseline/');
  const prefix=baseline?'/baseline/nba-policy-island/':'/nba-policy-island/';
  let name=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';
  if(!url.pathname.startsWith(prefix)||name.includes('..')){res.writeHead(404).end();return;}
  try{let data;if(baseline){if(!cache.has(name))cache.set(name,execFileSync('git',['-c','safe.directory='+root,'show','HEAD:'+name],{cwd:root,maxBuffer:30*1024*1024,stdio:['ignore','pipe','ignore']}));data=cache.get(name);}else data=fs.readFileSync(path.join(root,name));res.writeHead(200,{'Content-Type':mime[path.extname(name)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}
});
async function main(){
  fs.mkdirSync(out,{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-background-networking']});
  const errors=[],missing=[],results=[];
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
    await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
    async function load(baseline=false){const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))missing.push(r.url());});await page.goto(origin+(baseline?'/baseline':'')+'/nba-policy-island/');await page.selectOption('#district-select','island-warriors');await page.evaluate(()=>Promise.all([...document.querySelectorAll('#island-world img')].filter(i=>i.loading!=='lazy').map(i=>i.decode().catch(()=>{}))));await page.waitForTimeout(400);return page;}
    const before=await load(true);
    // 比較圖使用完全相同的世界框、CSS 像素與日夜狀態。
    await before.evaluate(()=>{const w=document.getElementById('island-world');w.style.transform='translate(-12.5%, -100%) scale('+3600/520+')';w.style.setProperty('--camera-scale',String(3600/520));});
    await before.locator('#island-map').screenshot({path:path.join(out,'before-day.png')});
    const noLabels='.landmark-label,.landmark-game-label,.shop-map-label,.scenic-label,.scenic-icon,#fan-map-name,#island-actor-label,.memory-hint-label,.memory-symbol,.district-label,#bay-interaction{visibility:hidden!important}';
    await before.addStyleTag({content:noLabels});await before.locator('#island-map').screenshot({path:path.join(out,'before-day-no-labels.png')});await before.close();
    const page=await load();
    await page.locator('#island-map').screenshot({path:path.join(out,'after-day.png')});
    const labelStyle=await page.addStyleTag({content:noLabels});await page.locator('#island-map').screenshot({path:path.join(out,'after-day-no-labels.png')});await labelStyle.evaluate(n=>n.remove());
    await page.click('#map-night');await page.locator('#island-map').screenshot({path:path.join(out,'after-night.png')});await page.click('#map-day');
    for(const id of ['shop-warriors','meet-pier','harbor-01','warriors']){
      await page.locator('#landmark-'+id).focus();await page.keyboard.press('Enter');
      await page.waitForFunction(id=>document.getElementById('fan-map-marker').dataset.location===id,id);
      assert.equal(await page.locator('#bay-interaction').getAttribute('data-target'),id);
      assert.equal(await page.locator('#station-panel').isVisible(),true);results.push('keyboard arrival + correct panel/prompt: '+id);
      if(id==='shop-warriors'){await page.click('#shop-enter');assert.equal(await page.locator('#shop-dialog').isVisible(),true);await page.selectOption('#shop-product','warriors-cap');await page.click('#shop-add-form button[type=submit]');assert.match(await page.locator('#shop-total').innerText(),/120/);await page.click('#shop-close');results.push('Warriors shop add to cart: 120 coins');}
      if(id==='harbor-01'){await page.click('#practice-start');await page.click('#shoot-button');await page.click('#tutorial-skip');await page.click('#shoot-button');assert.ok(Number(await page.locator('#game-attempts').innerText())>=1);await page.click('#practice-leave');results.push('Tidal tutorial, formal shot and leave');}
      if(id==='warriors'){await page.click('#policy-launch');await page.check('input[name=policy-plan][value=reserved]');await page.locator('#policy-form').evaluate(f=>f.requestSubmit());assert.match(await page.locator('#policy-result-content').innerText(),/2,400/);results.push('reserved ticket policy: 2400');}
      if(await page.locator('#station-close').isVisible())await page.click('#station-close');
    }
    // 開放動作後，在同一構圖觀察多名 NPC，而不是以測試快轉代替動畫。
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.locator('#landmark-sight-golden-gate').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.getElementById('fan-map-marker').dataset.location==='sight-golden-gate');await page.click('#station-close');
    const A=require('../assets/archipelago-core.js');
    for(const id of A.BAY.entrances){await page.locator('#landmark-'+id).focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#bay-interaction').isVisible(),false);let steps=0;
      while(await page.locator('#fan-map-marker').getAttribute('data-moving')==='true'){const p=await page.locator('#fan-map-marker').evaluate(n=>({x:Number(n.dataset.x),y:Number(n.dataset.y)}));assert(A.bayClear(p));steps++;await page.waitForTimeout(60);}
      assert(steps>0);assert.equal(await page.locator('#fan-map-marker').getAttribute('data-location'),id);await page.click('#station-close');results.push('animated clear pedestrian route + retracting prompt: '+id);
    }
    const samples=[];
    for(let n=0;n<4;n++){await page.waitForTimeout(7000);samples.push(await page.locator('#npc-layer').evaluate(()=>[...document.querySelectorAll('.sim-pedestrian:not([hidden])')].map(n=>({id:n.id,x:Number(n.dataset.x),y:Number(n.dataset.y)}))));await page.locator('#island-map').screenshot({path:path.join(out,'npc-'+n+'.png')});}
    assert.notDeepEqual(samples[0],samples.at(-1));results.push('28 seconds of concurrent NPC motion observed in 4 captures');
    await page.selectOption('#bay-fixture','home');await page.check('input[name=game-state][value=live]');assert.equal(await page.locator('#landmark-warriors').getAttribute('data-glowing'),'true');await page.click('#map-night');await page.check('input[name=game-state][value=final]');assert.equal(await page.locator('#landmark-warriors').getAttribute('data-glowing'),'false');assert.equal(await page.locator('#island-map').getAttribute('data-theme'),'night');results.push('home LIVE -> final stops glow; night remains');
    const position=await page.locator('#fan-map-marker').getAttribute('data-x');await page.click('#camera-overview');assert.equal(await page.locator('#fan-map-marker').getAttribute('data-x'),position);results.push('overview preserves player position');
    await page.setViewportSize({width:390,height:844});await page.selectOption('#district-select','island-warriors');await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('#island-map').evaluate(n=>window.scrollTo(0,Math.max(0,n.getBoundingClientRect().top+window.scrollY-document.querySelector('.explorer-controls').offsetHeight-18)));
    await page.locator('#island-map').screenshot({path:path.join(out,'after-mobile-night.png')});
    assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);results.push('no page errors or missing local assets at /nba-policy-island/');
    fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({viewport:{width:1440,height:1000},view:{x:65,y:325,width:520,height:325},baseline:execFileSync('git',['-c','safe.directory='+root,'rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),results,errors,missing,npcSamples:samples},null,2));console.log(results.join('\n'));await context.close();
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
