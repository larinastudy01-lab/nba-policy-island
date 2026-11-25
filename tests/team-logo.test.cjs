'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../assets/island-core.js'),root=path.resolve(__dirname,'..');
const A=require('../assets/archipelago-core.js'),E=require('../assets/explorer-core.js'),P=require('../assets/pixel-core.js');
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
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
test('roof anchors belong to arena pixel frames and near signs stay clear of each front door',()=>{
  for(const team of C.TEAMS){const branding=P.arenaBranding(team),[x,y,w,h]=branding.sign,door=team.id==='warriors'?{x:36,y:40,width:10,height:9}:{x:57,y:39,width:5,height:7};
    assert(branding.roof.every(Number.isInteger));assert(branding.roof[0]>=0&&branding.roof[0]<=80);assert(branding.roof[1]>0&&branding.roof[1]<50);
    assert.deepEqual(E.arenaLogoAnchor(team),{x:team.x+branding.roof[0]*2-80,y:team.y+branding.roof[1]*2-68});
    assert.notDeepEqual(E.arenaLogoAnchor(team),{x:A.owner(team.id).x,y:A.owner(team.id).y});assert.equal(overlaps({x:x-w/2,y:y-h/2,width:w,height:h},door),false,team.id);
  }
  assert.deepEqual(P.arenaBranding(C.getLandmark('nba','clippers')).sign,[46,25,16,12]);assert.deepEqual(P.arenaBranding(C.getLandmark('nba','celtics')).sign,[45,28,15,12]);assert.deepEqual(P.arenaBranding(C.getLandmark('nba','warriors')).sign,[41,34,15,10]);
});
test('20/22px overview emblems fit nine map widths without overlapping one another, entrances or bridgeheads',()=>{
  const points=[...C.TEAMS.map(t=>t.entrance),...Object.entries(A.ROAD_NODES).filter(([id])=>id.startsWith('gate-')).map(([,p])=>p)];
  for(const width of [294,320,360,390,640,700,701,900,1400]){const size=width<=700?20:22,scale=width/E.OVERVIEW_VIEW.width,rects=C.TEAMS.map(t=>({id:t.id,...E.overviewLogoRect(t,width,size)}));
    for(const [i,rect]of rects.entries()){assert(rect.x>=0&&rect.y>=0&&rect.x+size<=width&&rect.y+size<=width/1.6,rect.id);
      for(const other of rects.slice(i+1))assert.equal(overlaps(rect,other),false,`${width}: ${rect.id}/${other.id}`);
      for(const p of points){const x=(p.x-E.OVERVIEW_VIEW.x)*scale,y=(p.y-E.OVERVIEW_VIEW.y)*scale;assert.equal(x>rect.x&&x<rect.x+size&&y>rect.y&&y<rect.y+size,false,`${width}: ${rect.id} blocks an entrance/bridgehead`);}
    }
  }
});
function segmentCrosses(a,b,r){let low=0,high=1;for(const [p,q]of [[a.x-b.x,a.x-r.x],[b.x-a.x,r.x+r.width-a.x],[a.y-b.y,a.y-r.y],[b.y-a.y,r.y+r.height-a.y]]){if(p===0){if(q<0)return false;}else{const t=q/p;if(p<0)low=Math.max(low,t);else high=Math.min(high,t);if(low>high)return false;}}return true;}
test('eight small region tags sit on open water, outside roof emblems and road segments at mobile and desktop sizes',()=>{
  for(const width of [294,320,390,700,900,1400]){const scale=width/E.OVERVIEW_VIEW.width,size=width<=700?20:22,icons=C.TEAMS.map(t=>E.overviewLogoRect(t,width,size)),tags=[];
    for(const d of E.DISTRICTS){const p=d.label,r={x:(p.x-E.OVERVIEW_VIEW.x)*scale-14,y:(p.y-E.OVERVIEW_VIEW.y)*scale-7,width:28,height:14},world={x:p.x-14/scale,y:p.y-7/scale,width:28/scale,height:14/scale};
      assert.equal(A.ISLANDS.some(i=>A.contains(i,p)),false,d.id);assert(r.x>=0&&r.y>=0&&r.x+28<=width&&r.y+14<=width/1.6,d.id);
      assert.equal(icons.some(icon=>overlaps(icon,r)),false,`${width}: ${d.id}`);assert.equal(tags.some(tag=>overlaps(tag,r)),false,d.id);tags.push(r);
      assert.equal(A.ROAD_EDGES.some(edge=>segmentCrosses(A.ROAD_NODES[edge.from],A.ROAD_NODES[edge.to],world)),false,`${width}: ${d.id} blocks road`);
    }
  }
});
