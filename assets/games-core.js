"use strict";
(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.NBAGames=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
  // 同一種子 + 題號產生相同題目，不依賴玩家出手次數或 Math.random。
  const GAMES=[
    ["shoot","harbor-01","30 秒投籃",30000,"空白鍵／出手：白色游標進入金色區時投籃。","30 秒命中數較多者勝。"],
    ["five","harbor-02","五點巡投",60000,"空白鍵／出手：依底角、側翼到弧頂，投進才前往下一點。","完成五點者比完成時間；皆逾時先比完成點數，同點數平手。"],
    ["wind","harbor-03","逆風拋投",45000,"左右鍵或拖曳瞄準滑桿抵消風力，再按空白鍵／出手。","各投 8 球，進球多者勝；45 秒截止。"],
    ["bank","harbor-04","擦板高手",40000,"依來球方向選左、中、右反彈區（1／2／3 或點選）。","10 題成功多者勝；40 秒截止。"],
    ["buzzer","harbor-05","壓哨選點",30000,"每回合選近投 2 分或遠投 3 分，抓時機出手；每回合一球。","6 回合、每回合 5 秒，總分高者勝。"],
    ["dribble","park-01","運球繞樁",40000,"左右鍵／換道按鈕躲開橘色障礙；每 2 秒經過一樁。","20 秒跑完 10 樁，每撞一次加 2 秒；含罰秒時間較短者勝（上限 40 秒）。"],
    ["pass","park-02","空檔傳球",30000,"選三位移動隊友中傳球線沒有防守者的一位（1／2／3）。","30 秒成功傳球多者勝，每波只有一次機會。"],
    ["rebound","park-03","籃板卡位",25000,"球碰框顯示方向後，以左右鍵／位置按鈕移到左、中、右落點。","每球在落地時判定，10 球搶到較多籃板者勝。"],
    ["duel","park-04","鬥牛猜招",70000,"輪流攻守，選切左、切右、跳投或對應防法（1／2／3）。","各攻 5 回合、每回合 7 秒；未被猜中得 2 分，同分平手。單人對手為電腦。"],
    ["memory","park-05","戰術記憶",45000,"先看 1／2／3 亮起序列，播完後按相同順序重現。","先比完成的最長路線，同長比答對輪數；最多 6 輪、45 秒。"],
    ["relay","roof-01","快攻接力",60000,"每波依序選空道、傳給空檔、抓時機上籃；失誤重做當前步驟。","先完成 3 波者比完成時間；皆逾時比完成波數，同波數平手。"],
    ["rhythm","roof-02","節奏運球",30000,"跟每 0.6 秒的固定節拍交替按左、右鍵／按鈕。","準拍得分，連續準拍每 5 次加成，錯拍斷連擊；30 秒總分高者勝。"],
    ["defense","roof-03","防守反應",30000,"等真正出手才按空白鍵／封阻；假動作時起跳會失去該球機會。","每球一次起跳機會，10 球成功封阻多者勝。"],
    ["maze","roof-04","禁區通關",60000,"方向鍵／前進、橫移、等待，避開每一步會移動的防守者。","共 3 關、每關最多 12 步、總上限 60 秒；先比通關數，再比成功關卡總步數（少者勝）。"],
    ["allround","roof-05","球場全能賽",40000,"依序完成五次投籃、五次空檔傳球、五次防守反應。","各項勝者 1 場勝分，平手各 0.5；三項加總較高者勝，最長 40 秒。"]
  ].map(([id,courtId,name,durationMs,instructions,win])=>({id,courtId,name,durationMs,instructions,win}));
  const copy=value=>JSON.parse(JSON.stringify(value));
  const getGame=id=>GAMES.find(game=>game.id===id)||null;
  const forCourt=id=>GAMES.find(game=>game.courtId===id)||null;
  function randomAt(seed,index,salt=0){let x=((Number(seed)>>>0)^Math.imul(index+1,0x9e3779b1)^Math.imul(salt+1,0x85ebca6b))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);return ((x^(x>>>16))>>>0)/4294967296;}
  const pick=(seed,index,salt=0)=>Math.floor(randomAt(seed,index,salt)*3);
  const aimAt=ms=>{const t=((ms%1200)+1200)%1200/1200;return t<.5?t*2:(1-t)*2;};
  function createGame(id,{seed=1,limit=null,durationMs=null,online=false}={}){
    const config=getGame(id);if(!config)throw new RangeError("Unknown game.");
    const duration=durationMs||config.durationMs;
    let s,child=null;
    function reset(){s={phase:"ready",startsAt:null,elapsedMs:0,score:0,hits:0,attempts:0,attemptBase:0,progress:0,completed:false,finishedAt:null,lastAction:-Infinity,round:0,lane:1,windAim:0,range:"near",penalties:0,processed:0,answered:{},combo:0,longest:0,rounds:0,input:[],memoryStart:0,step:0,wave:0,level:0,x:2,y:4,steps:0,totalSteps:0,pcScore:0,choice:null,subscores:[],stage:0,feedback:"準備開始。"};child=null;return snapshot();}
    function finish(completed=false){if(s.phase==="finished")return;s.completed=completed;s.finishedAt=s.elapsedMs;s.phase="finished";}
    function sequence(){return Array.from({length:s.rounds+3},(_,i)=>pick(seed,s.rounds*10+i,9));}
    function obstacle(index){return pick(seed,index,5);}
    function defenders(){return [{x:pick(seed,s.level*40+s.steps,12)+1,y:2},{x:pick(seed,s.level*40+s.steps,13),y:1}];}
    function result(){return {gameId:id,score:s.score,hits:s.hits,attempts:s.attempts,progress:s.progress,completed:s.completed,elapsedMs:Math.round(s.finishedAt??s.elapsedMs),timeMs:Math.round((s.finishedAt??s.elapsedMs)+s.penalties*2000),longest:s.longest,rounds:s.rounds,steps:s.totalSteps,pcScore:s.pcScore,subscores:copy(s.subscores)};}
    function snapshot(){
      const e=s.elapsedMs,slotMs=id==="rebound"?2500:id==="defense"?3000:id==="duel"?7000:id==="buzzer"?5000:2000;
      const slot=Math.min(id==="duel"?9:999,Math.floor(e/slotMs)),within=e%slotMs;
      const state={...copy({...s,lastAction:0}),id,seed,durationMs:duration,remainingMs:s.phase==="finished"?0:Math.max(0,duration-e),aim:aimAt(e),result:result(),slot,within,target:pick(seed,slot,id==="bank"?3:7),obstacle:obstacle(Math.min(9,Math.floor(e/2000))),defenders:defenders(),sequence:sequence(),memoryShowing:e-s.memoryStart<sequence().length*600+400,lit:Math.floor((e-s.memoryStart)/600),trueAt:1000+Math.floor(randomAt(seed,slot,11)*700)};
      state.wind=Math.round((randomAt(seed,s.attempts,2)*140-70)/10)*10;
      state.passOpen=pick(seed,slot,7);
      state.beat=Math.max(1,Math.min(48,Math.round(e/600)));state.beatSide=state.beat%2===1?0:2;state.beatDelta=e-state.beat*600;
      if(child)state.child=child.tick(s.startsAt+e);
      return state;
    }
    function sync(now){
      if(!Number.isFinite(now))throw new TypeError("Invalid clock.");
      if(s.startsAt===null||s.phase==="finished")return snapshot();
      if(now<s.startsAt){s.phase="countdown";return snapshot();}
      s.phase="playing";s.elapsedMs=Math.max(s.elapsedMs,Math.min(duration,now-s.startsAt));const e=s.elapsedMs;
      if(id==="dribble"){
        const gates=Math.min(10,Math.floor(e/2000));while(s.processed<gates){s.attempts++;if(s.lane===obstacle(s.processed)){s.penalties++;s.feedback="碰到障礙，罰 2 秒。";}else{s.hits++;s.score++;s.feedback="成功繞樁！";}s.processed++;s.progress=s.processed;}
        if(s.processed===10){s.elapsedMs=20000;finish(true);}
      }
      if(id==="rebound"){const ended=Math.min(limit||10,Math.floor(e/2500));while(s.processed<ended){s.attempts++;if(s.lane===pick(seed,s.processed,7)){s.score++;s.hits++;s.feedback="搶到籃板！";}else s.feedback="球落在另一側。";s.processed++;}if(s.processed===(limit||10))finish(true);}
      if(id==="duel"){const ended=Math.min(10,Math.floor(e/7000));while(s.processed<ended){if(!online&&s.answered[s.processed]===undefined){const pc=pick(seed,s.processed,14);if(s.processed%2===1)s.pcScore+=2;s.answered[s.processed]={own:null,pc};}s.processed++;}s.progress=s.processed;if(s.processed===10)finish(true);}
      if(id==="rhythm"){const ended=Math.min(48,Math.floor((e-140)/600));while(s.processed<ended){s.processed++;if(!s.answered[s.processed])s.combo=0;}}
      if(id==="pass"&&limit&&Math.floor(e/2000)>=limit)finish(true);
      if(id==="defense"&&limit&&Math.floor(e/3000)>=limit)finish(true);
      if(id==="allround"&&child){while(s.stage<3){const cs=child.tick(now);s.attempts=s.attemptBase+cs.attempts;s.hits=s.subscores.reduce((a,b)=>a+b,0)+cs.score;if(cs.phase!=="finished")break;s.attemptBase=s.attempts;s.subscores.push(cs.result.score);s.stage++;if(s.stage===3){s.score=s.subscores.reduce((a,b)=>a+b,0);finish(true);break;}child=createGame(["shoot","pass","defense"][s.stage],{seed,limit:5,durationMs:s.stage===1?10000:15000});child.start(cs.startsAt+cs.result.elapsedMs);}}
      if(e>=duration)finish(false);
      return snapshot();
    }
    function advanceQuestion(success,total){s.attempts++;if(success){s.score++;s.hits++;}s.feedback=success?"成功！":"這次沒成功，再試下一題。";if(s.attempts>=total)finish(true);}
    function act(action,now){
      sync(now);if(s.phase!=="playing")return {...snapshot(),accepted:false,hit:false};
      if(typeof action==="string")action={type:action};if(!action||typeof action.type!=="string")return {...snapshot(),accepted:false,hit:false};
      const e=s.elapsedMs,v=snapshot(),before=s.score+s.hits,oldAttempts=s.attempts;
      if(id==="allround"){const changed=child.act(action,now);s.feedback=changed.feedback;s.attempts=s.attemptBase+child.tick(now).attempts;s.hits=s.subscores.reduce((a,b)=>a+b,0)+child.tick(now).score;sync(now);return {...snapshot(),accepted:changed.accepted,hit:changed.hit};}
      if(action.type==="aim"&&id==="wind"){s.windAim=Math.max(-100,Math.min(100,Number(action.value)||0));return {...snapshot(),accepted:true,hit:false};}
      if(action.type==="range"&&id==="buzzer"&&["near","far"].includes(action.value)){s.range=action.value;return {...snapshot(),accepted:true,hit:false};}
      if(e-s.lastAction<(id==="rhythm"?100:150))return {...snapshot(),accepted:false,hit:false};
      const choice=Number(action.value),validChoice=Number.isInteger(choice)&&choice>=0&&choice<=2;
      let accepted=false;
      if(["shoot","five","wind","buzzer"].includes(id)&&action.type==="shoot"&&e-s.lastAction>=500){
        if(id!=="buzzer"||!s.answered[v.slot]){
          accepted=true;s.attempts++;const width=id==="buzzer"?(s.range==="near"?.2:.08):.14;
          const hit=id==="wind"?Math.abs(s.windAim+v.wind)<=14:Math.abs(v.aim-.5)<=width;
          if(hit){s.hits++;s.score+=id==="buzzer"?(s.range==="near"?2:3):1;}
          s.feedback=hit?"命中！":"沒進，調整後再試。";
          if(id==="five"&&hit){s.progress++;if(s.progress===5)finish(true);}
          if(id==="wind"&&s.attempts===8)finish(true);
          if(id==="buzzer")s.answered[v.slot]=true;
          if(id==="shoot"&&limit&&s.attempts>=limit)finish(true);
        }
      }else if(id==="dribble"||id==="rebound"){
        if(action.type==="lane"&&validChoice){s.lane=choice;accepted=true;}
        if(action.type==="left"||action.type==="right"){s.lane=Math.max(0,Math.min(2,s.lane+(action.type==="left"?-1:1)));accepted=true;}
      }else if(id==="duel"&&!online&&action.type==="choose"&&validChoice&&!s.answered[v.slot]){
        const pc=pick(seed,v.slot,14);s.answered[v.slot]={own:choice,pc};accepted=true;s.attempts++;
        if(choice!==pc){if(v.slot%2===0){s.score+=2;s.hits++;}else s.pcScore+=2;}
        s.feedback=`你選 ${choice+1}，電腦選 ${pc+1}；${choice===pc?"防守成功":"進攻得 2 分"}。等下一回合。`;
      }else if(id==="rhythm"&&(action.type==="left"||action.type==="right")){
        const side=action.type==="left"?0:2,b=v.beat;if(!s.answered[b]&&Math.abs(v.beatDelta)<=300){accepted=true;s.attempts++;s.answered[b]=true;const hit=Math.abs(v.beatDelta)<=140&&side===v.beatSide;if(hit){s.combo++;s.hits++;s.score+=10+Math.min(10,Math.floor(s.combo/5)*2);s.feedback=`準拍！${s.combo} 連擊`;}else{s.combo=0;s.feedback="錯拍，連擊歸零。";}}
      }else if(id==="bank"&&action.type==="choose"&&validChoice){accepted=true;advanceQuestion(choice===2-pick(seed,s.attempts,3),10);
      }else if(id==="pass"&&action.type==="choose"&&validChoice&&!s.answered[v.slot]){accepted=true;s.answered[v.slot]=true;advanceQuestion(choice===v.passOpen,limit||1000);
      }else if(id==="memory"&&action.type==="choose"&&validChoice&&!v.memoryShowing){accepted=true;s.attempts++;const seq=sequence();if(choice!==seq[s.input.length]){s.feedback="路線記錯了，這次挑戰結束。";finish(false);}else{s.input.push(choice);s.feedback=`正確 ${s.input.length}／${seq.length}`;if(s.input.length===seq.length){s.rounds++;s.longest=seq.length;s.score=s.longest;s.hits++;s.input=[];s.memoryStart=e;if(s.rounds===6)finish(true);}}
      }else if(id==="relay"){
        if(s.step<2&&action.type==="choose"&&validChoice){accepted=true;s.attempts++;if(choice===pick(seed,s.wave,s.step+20)){s.step++;s.feedback="傳導成功，前往下一步。";}else s.feedback="失誤！重做這一步。";}
        else if(s.step===2&&action.type==="shoot"){accepted=true;s.attempts++;if(Math.abs(v.aim-.5)<=.14){s.wave++;s.progress=s.wave;s.score=s.wave;s.hits++;s.step=0;s.feedback="上籃命中，完成一波！";if(s.wave===3)finish(true);}else s.feedback="上籃沒進，再抓時機。";}
      }else if(id==="defense"&&action.type==="shoot"&&!s.answered[v.slot]){accepted=true;s.answered[v.slot]=true;advanceQuestion(v.within>=v.trueAt&&v.within<=v.trueAt+400,1000);s.feedback=v.within<v.trueAt?"太早起跳，被假動作騙到了。":v.within<=v.trueAt+400?"封阻成功！":"出手太晚。";
      }else if(id==="maze"&&["up","left","right","wait"].includes(action.type)){
        accepted=true;s.attempts++;let nx=s.x+(action.type==="left"?-1:action.type==="right"?1:0),ny=s.y-(action.type==="up"?1:0);s.steps++;const blocked=defenders().some(d=>d.x===nx&&d.y===ny);if(nx>=0&&nx<5&&ny>=0&&!blocked){s.x=nx;s.y=ny;s.feedback="繼續尋找通道。";}else s.feedback="路線被擋住，消耗一步。";
        if(defenders().some(d=>d.x===s.x&&d.y===s.y)){s.x=2;s.y=4;s.feedback="碰到移動防守者，回到起點。";}
        if(s.y===0){s.progress++;s.totalSteps+=s.steps;s.score=s.progress;s.hits++;s.level++;s.steps=0;s.x=2;s.y=4;s.feedback="通關！";}
        else if(s.steps>=12){s.level++;s.steps=0;s.x=2;s.y=4;s.feedback="本關步數用盡，前往下一關。";}
        if(s.level===3)finish(true);
      }
      if(accepted)s.lastAction=e;
      const output=snapshot();return {...output,accepted,hit:accepted&&(s.score+s.hits>before),attempted:s.attempts>oldAttempts};
    }
    reset();
    return {start(at){if(!Number.isFinite(at))throw new TypeError("Invalid clock.");reset();s.startsAt=at;s.phase="countdown";if(id==="allround"){child=createGame("shoot",{seed,limit:5,durationMs:15000});child.start(at);}return sync(at);},tick:sync,act,shoot:now=>act("shoot",now),reset,result};
  }
  function eventPoints(a,b){const points=[0,0];for(let i=0;i<3;i++){const c=Math.sign((a.subscores[i]||0)-(b.subscores[i]||0));points[0]+=c===0?.5:c>0?1:0;points[1]+=c===0?.5:c<0?1:0;}return points;}
  function compareResults(id,a,b){
    if(!getGame(id))throw new RangeError("Unknown game.");
    const cmp=(x,y)=>Math.sign(x-y);
    if(id==="allround"){const points=eventPoints(a,b);return cmp(points[0],points[1]);}
    if(["five","relay"].includes(id)){if(a.completed!==b.completed)return a.completed?1:-1;return a.completed?cmp(b.elapsedMs,a.elapsedMs):cmp(a.progress,b.progress);}
    if(id==="dribble")return cmp(b.timeMs,a.timeMs);
    if(id==="memory")return cmp(a.longest,b.longest)||cmp(a.rounds,b.rounds);
    if(id==="maze")return cmp(a.progress,b.progress)||cmp(b.steps,a.steps);
    return cmp(a.score,b.score);
  }
  function resolvePlayers(id,players){
    if(players.length!==2)return {type:"pending",winnerId:null};
    const submitted=players.filter(p=>p.result);
    if(!submitted.length)return {type:"no-contest",winnerId:null};
    if(submitted.length===1)return {type:"forfeit",winnerId:submitted[0].user_id};
    const c=compareResults(id,players[0].result,players[1].result);return {type:c===0?"draw":"win",winnerId:c===0?null:players[c>0?0:1].user_id};
  }
  function describeResult(id,r){if(!r)return "未提交";if(id==="dribble")return `${(r.timeMs/1000).toFixed(2)} 秒（含罰秒）`;if(id==="five"||id==="relay")return `${r.progress} ${id==="five"?"點":"波"}・${r.completed?(r.elapsedMs/1000).toFixed(2)+" 秒":"逾時"}`;if(id==="memory")return `最長 ${r.longest} 步・答對 ${r.rounds} 輪`;if(id==="maze")return `通關 ${r.progress} 關・成功關卡 ${r.steps} 步`;if(id==="allround")return `投籃 ${r.subscores[0]||0}／傳球 ${r.subscores[1]||0}／封阻 ${r.subscores[2]||0}`;return `${r.score} 分・成功 ${r.hits} 次`;}
  return {GAMES,getGame,forCourt,randomAt,pick,aimAt,createGame,compareResults,eventPoints,resolvePlayers,describeResult};
});
