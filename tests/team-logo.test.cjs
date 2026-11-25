'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../assets/island-core.js'),root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/team/logo-manifest.json'),'utf8'));
test('thirty unique teams use thirty exact transparent PNG copies while all provided originals remain intact',()=>{
  assert.equal(C.TEAMS.length,30);assert.equal(manifest.logos.length,30);
  assert.equal(new Set(C.TEAMS.map(t=>t.logo)).size,30);assert.equal(new Set(C.TEAMS.map(t=>t.logoSource)).size,30);
  assert.equal(fs.readdirSync(path.join(root,'assets/team')).filter(n=>n.endsWith('.webp')).length,30);
  for(const team of C.TEAMS){
    const entry=manifest.logos.find(row=>row.teamId===team.id);assert(entry,team.id);
    assert.equal(team.logo,`./assets/team/logos/${team.abbr}.png`);assert.equal(entry.path,team.logo);assert.equal(entry.source,team.logoSource);
    const original=fs.readFileSync(path.join(root,team.logoSource)),copy=fs.readFileSync(path.join(root,team.logo));assert.deepEqual(copy,original);
    assert.equal(copy.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(copy[25],6,'RGBA retained');
    assert.equal(copy.readUInt32BE(16),entry.width);assert.equal(copy.readUInt32BE(20),entry.height);
    assert.equal(crypto.createHash('sha256').update(copy).digest('hex'),entry.sha256);
    assert.equal(entry.alpha,true);assert.equal(entry.format,'PNG');
  }
});
test('visually audited Bulls/Cavaliers, Lakers/Clippers and Knicks/Nets keep distinct identity mappings',()=>{
  const expected={bulls:['CHI','芝加哥公牛.webp'],cavaliers:['CLE','芝加哥公牛隊.webp'],lakers:['LAL','洛杉磯湖人隊.webp'],clippers:['LAC','洛杉磯快艇隊.webp'],knicks:['NYK','紐約尼克隊.webp'],nets:['BKN','籃網.webp']};
  for(const [id,[abbr,file]] of Object.entries(expected)){const team=C.getLandmark('nba',id);assert.equal(team.abbr,abbr);assert.equal(team.logoSource,'./assets/team/'+file);assert.equal(team.logo,'./assets/team/logos/'+abbr+'.png');}
  for(const [a,b] of [['bulls','cavaliers'],['lakers','clippers'],['knicks','nets']])assert.notEqual(manifest.logos.find(t=>t.teamId===a).sha256,manifest.logos.find(t=>t.teamId===b).sha256);
});
test('every logo resolves within both a local file folder and the GitHub Pages subpath with exact case',()=>{
  const names=fs.readdirSync(path.join(root,'assets/team/logos'));
  for(const team of C.TEAMS){
    assert(names.includes(path.basename(team.logo)));
    for(const base of ['file:///project/nba-policy-island/index.html','https://larinastudy01-lab.github.io/nba-policy-island/']){
      const url=new URL(team.logo,base);assert(url.pathname.endsWith('/nba-policy-island/assets/team/logos/'+team.abbr+'.png'));
      assert.equal(url.search,'');assert.equal(url.hash,'');
    }
  }
});
