'use strict';
// 與 preview-warriors.cjs 相同的本機、明確允許才執行的畫面驗收工具。
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),{pathToFileURL}=require('node:url'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
async function main(){
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const results=[],errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);await page.selectOption('#district-select','island-warriors');
    for(const id of ['warriors','shop-warriors','meet-pier','harbor-01']){
      await page.click('#landmark-'+id);await page.waitForFunction(id=>document.getElementById('fan-map-marker').dataset.location===id,id);
      assert.equal(await page.locator('#bay-interaction').getAttribute('data-target'),id);assert(await page.locator('#station-panel').isVisible());
      results.push('mouse hit shape opens correct facility: '+id);if(id!=='harbor-01')await page.click('#station-close');
    }
    await page.click('#practice-start');await page.click('#tutorial-skip');await page.focus('#game-stage');let shots=0;
    for(let k=0;k<140&&shots<3;k++){
      const onTarget=await page.evaluate(()=>{const c=document.getElementById('aim-cursor').getBoundingClientRect(),t=document.getElementById('aim-target').getBoundingClientRect();return c.x+c.width/2>t.x+2&&c.x+c.width/2<t.right-2;});
      if(onTarget){await page.keyboard.press('Space');shots++;await page.waitForTimeout(300);}await page.waitForTimeout(25);
    }
    await page.waitForFunction(()=>!document.getElementById('round-result').hidden,{},{timeout:35000});
    assert.equal(await page.locator('#game-timer').innerText(),'0.0');assert(await page.locator('#shoot-button').isDisabled());
    const hits=Number(await page.locator('#game-hits').innerText());assert(hits>=1);
    results.push('real 30-second Tidal final: '+hits+' hits, 0.0 seconds, input disabled');
    await page.locator('#round-result').screenshot({path:'docs/warriors-bay-preview/tidal-result.png'});
    await page.click('#practice-leave');assert(await page.locator('#play-court').isHidden());assert.deepEqual(errors,[]);results.push('file:// local opening without page errors');
    fs.writeFileSync('docs/warriors-bay-preview/mouse-acceptance.json',JSON.stringify({results,errors},null,2));console.log(results.join('\n'));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
