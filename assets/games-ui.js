"use strict";
(function(root){
  const G=root.NBAGames;
  function view(state){
    const s=state.id==="allround"?state.child:state,id=s.id,playing=state.phase==="playing",e=s.elapsedMs;
    let message="",choices=null,shoot=false,arrows=false,up=false,wind=false,ranges=false,aim=false,graphic="";
    const circle=(x,y,label,color="#f3c45b")=>`<circle cx="${x}" cy="${y}" r="23" fill="${color}" stroke="#e6e8ca"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="#10283c" font-size="14">${label}</text>`;
    const hoop='<path d="M235 30h130v52H235Z" fill="#b3d6dd33" stroke="#b3d6dd" stroke-width="3"/><path d="M278 56h44v26h-44Z" fill="none" stroke="#e4d9aa"/><ellipse cx="300" cy="87" rx="30" ry="9" fill="none" stroke="#f3c45b" stroke-width="4"/>';
    const lanes=[150,300,450],labels=["左","中","右"];
    if(["shoot","five","wind","buzzer"].includes(id)){
      shoot=true;aim=id!=="wind";wind=id==="wind";ranges=id==="buzzer";
      message=id==="five"?`第 ${Math.min(5,s.progress+1)}／5 點：${["左底角","左側翼","弧頂","右側翼","右底角"][Math.min(4,s.progress)]}，投進才前進。`:id==="wind"?`第 ${Math.min(8,s.attempts+1)}／8 球｜風向 ${s.wind<0?"← 左":"右 →"}，風力 ${Math.abs(s.wind)}。向反方向調整瞄準。`:id==="buzzer"?`第 ${Math.min(6,s.slot+1)}／6 回合，還有 ${(5-s.within/1000).toFixed(1)} 秒。${s.answered[s.slot]?"已出手，等下一回合。":s.range==="near"?"近投：2 分、寬命中區":"遠投：3 分、窄命中區"}`:"30 秒內抓準時機，進一球得一分。";
      graphic=hoop+circle(id==="five"?[130,210,300,390,470][Math.min(4,s.progress)]:300,250,"你")+(wind?`<path d="M${300+s.windAim} 240 300 98" fill="none" stroke="#a4dadc" stroke-dasharray="6 7"/><text x="300" y="160" text-anchor="middle" fill="#f3c45b">風 ${s.wind} ／瞄準 ${s.windAim}</text>`:"");
    }else if(id==="dribble"){
      arrows=true;message=`第 ${Math.min(10,s.processed+1)}／10 樁，橘色障礙在${labels[s.obstacle]}道。罰秒 ${s.penalties*2} 秒。`;
      graphic=lanes.map(x=>`<path d="M${x} 50v230" stroke="#6f9d9d" stroke-dasharray="7 8"/>`).join("")+`<path d="m${lanes[s.obstacle]-22} ${60+(e%2000)/2000*140} 44 0-22-35Z" fill="#ef9b62"/>`+circle(lanes[s.lane],250,"球");
    }else if(id==="pass"){
      choices=labels.map((_,i)=>`傳給 ${i+1} 號`);message=`第 ${Math.floor(e/2000)+1} 波：找出沒有紅色防守者擋線的隊友。${s.answered[s.slot]?"本波已傳球。":"按 1／2／3 或點隊友按鈕。"}`;
      graphic=lanes.map((x,i)=>{const px=x+Math.sin(e/400+i)*18;return `<path d="M300 270 ${px} 90" stroke="${i===s.passOpen?"#9cd4bd":"#af5c65"}" stroke-dasharray="6 6"/>`+circle(px,90,i+1,"#9cd4bd")+(i!==s.passOpen?circle((300+px)/2,180,"擋","#da8790"):"");}).join("")+circle(300,270,"你");
    }else if(id==="bank"){
      const incoming=G.pick(state.seed,s.attempts,3);choices=["左反彈區","中反彈區","右反彈區"];message=`第 ${Math.min(10,s.attempts+1)}／10 題：球從${labels[incoming]}方來，選${labels[2-incoming]}反彈區。`;
      graphic='<rect x="125" y="55" width="350" height="150" rx="8" fill="#88b8c933" stroke="#c9e0df"/>'+lanes.map((x,i)=>`<rect x="${x-24}" y="92" width="48" height="68" fill="#f3c45b22" stroke="#f3c45b"/><text x="${x}" y="132" fill="#f3c45b" text-anchor="middle">${i+1}</text>`).join("")+`<path d="M${lanes[incoming]} 280 300 210" stroke="#f3c45b" stroke-width="4"/>`;
    }else if(id==="rebound"){
      arrows=true;choices=labels.map(x=>`${x}落點`);message=`第 ${Math.min(10,s.processed+1)}／10 球：${s.within<700?"等球碰框…":`球彈往${labels[s.target]}側，快卡位！`}`;
      graphic=hoop+lanes.map((x,i)=>`<ellipse cx="${x}" cy="260" rx="55" ry="20" fill="${s.lane===i?"#f3c45b44":"#88b8c922"}"/>`).join("")+circle(lanes[s.lane],235,"你")+(s.within>=700?`<path d="M300 95 ${lanes[s.target]} 205" stroke="#f3c45b" stroke-width="4" stroke-dasharray="5 8"/>`:"");
    }else if(id==="duel"){
      const attack=s.slot%2===0;choices=attack?["切左","切右","跳投"]:["守左","守右","封投"];message=`第 ${s.slot+1}／10 回合｜你是${attack?"進攻":"防守"}方。單人對手：電腦。${s.answered[s.slot]?"雙方已揭曉，等下一回合。":"選定後才揭曉。"}`;
      graphic=circle(200,200,"你")+circle(400,150,"電腦","#a4cdd8")+`<text x="300" y="70" text-anchor="middle" fill="#f3c45b" font-size="25">${s.score}：${s.pcScore}</text>`;
      if(state.onlineDuel){
        const d=state.onlineDuel,own=d.players.find(p=>p.user_id===d.ownId),attack=own?.slot===(s.slot%2===0?1:2);
        choices=attack?["切左","切右","跳投"]:["守左","守右","封投"];
        message=`好友 PK 第 ${s.slot+1}／10 回合・你是${attack?"進攻":"防守"}方。${d.turn!==s.slot?"等待回合同步。":d.submitted?"已鎖定，等待對方；招式不會提前公開。":"選定後由伺服器收齊兩人才揭曉。"}`;
        const last=d.history?.at(-1);if(last)message+=` 上回合進攻 ${last.attack===null?"逾時":last.attack+1}／防守 ${last.defense===null?"逾時":last.defense+1}：${last.scored?"得 2 分":"防守成功"}。`;
        graphic=circle(200,200,"你")+circle(400,150,"好友","#a4cdd8")+`<text x="300" y="70" text-anchor="middle" fill="#f3c45b" font-size="25">房主 ${d.scores?.[0]||0}：${d.scores?.[1]||0} 好友</text>`;
      }
    }else if(id==="memory"){
      choices=["路線 1","路線 2","路線 3"];message=s.memoryShowing?`先記住亮起順序，路線長度 ${s.sequence.length}。`:`重現 ${s.input.length}／${s.sequence.length} 步；最長完成 ${s.longest} 步。`;
      graphic=lanes.map((x,i)=>circle(x,170,i+1,s.memoryShowing&&s.sequence[s.lit]===i?"#fff2b0":"#5b8796")).join("");
    }else if(id==="relay"){
      const target=G.pick(state.seed,s.wave,s.step+20);choices=s.step<2?labels.map((x,i)=>s.step===0?`${x}空道`:`傳給 ${i+1} 號`):null;shoot=s.step===2;aim=shoot;
      message=`第 ${s.wave+1}／3 波・${["選空道","傳空檔","時機上籃"][s.step]}。${s.step<2?`${labels[target]}側亮起綠燈，選對才前進。`:"游標進入金色區出手。"}`;
      graphic=hoop+lanes.map((x,i)=>circle(x,230,i+1,i===target&&s.step<2?"#b3e1b2":"#63869a")).join("");
    }else if(id==="rhythm"){
      arrows=true;const until=(600-e%600)/1000;message=`${s.beat%2===1?"左 ←":"右 →"} 第 ${s.beat} 拍｜${Math.abs(s.beatDelta)<=140?"現在！":"跟固定節拍，左右交替"}｜${s.combo} 連擊`;
      graphic=lanes.filter((_,i)=>i!==1).map((x,i)=>circle(x,190,i===0?"←":"→",s.beatSide===(i===0?0:2)&&Math.abs(s.beatDelta)<=140?"#fff0a0":"#688ba0")).join("")+`<rect x="100" y="270" width="${400*(1-until/.6)}" height="8" fill="#f3c45b"/>`;
    }else if(id==="defense"){
      shoot=true;message=`第 ${s.slot+1} 球：${s.answered[s.slot]?"本球已起跳，等待下一球。":s.within<400?"觀察對手…":s.within<s.trueAt?"假動作，先別跳！":s.within<=s.trueAt+400?"真正出手！現在封阻！":"球已飛過，等下一球。"}`;
      graphic=hoop+circle(300,s.within>=s.trueAt&&s.within<=s.trueAt+400?150:220,"對手","#b2d3d9")+`<text x="300" y="290" fill="#f3c45b" text-anchor="middle">${s.within< s.trueAt?"觀察":"出手"}</text>`;
    }else if(id==="maze"){
      arrows=true;up=true;message=`第 ${s.level+1}／3 關・已用 ${s.steps}／12 步。到達最上排即通關，避開紅色防守者。`;
      graphic=Array.from({length:25},(_,i)=>{const x=i%5,y=Math.floor(i/5);return `<rect x="${150+x*60}" y="${20+y*56}" width="55" height="51" rx="4" fill="${y===0?"#a7dcb34d":"#507b8b33"}" stroke="#678e9c"/>`;}).join("")+s.defenders.map(d=>circle(177+d.x*60,45+d.y*56,"守","#dc8792")).join("")+circle(177+s.x*60,45+s.y*56,"你");
    }
    const locked=!playing||(id==="memory"&&s.memoryShowing)||(id==="duel"&&(state.onlineDuel?(state.onlineDuel.submitted||state.onlineDuel.turn!==s.slot):Boolean(s.answered[s.slot])))||(id==="pass"&&Boolean(s.answered[s.slot]));
    return {id,message:state.phase==="finished"?"本局已結束，請查看結果或重玩。":state.id==="allround"?`全能賽第 ${state.stage+1}／3 項｜${message}`:message,choices,locked,shoot,arrows,up,wind,ranges,aim,graphic,shootLabel:id==="defense"?"封阻":id==="relay"?"上籃":"出手",remaining:state.remainingMs};
  }
  function initialize({getState,onAction}){
    const $=id=>document.getElementById(id);
    for(let i=0;i<3;i++)$(`mini-choice-${i}`).addEventListener("click",()=>{const s=getState();onAction({type:s&&(s.id==="rebound"||s.child?.id==="rebound")?"lane":"choose",value:i});});
    for(const type of ["left","right","up","wait"])$(`mini-${type}`).addEventListener("click",()=>onAction({type}));
    for(const value of ["near","far"])$(`mini-${value}`).addEventListener("click",()=>onAction({type:"range",value}));
    $("mini-wind-aim").addEventListener("input",()=>onAction({type:"aim",value:Number($("mini-wind-aim").value)}));
    function key(event){
      if(event.repeat){if([" ","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","1","2","3"].includes(event.key)||event.code==="Space")event.preventDefault();return;}const s=getState();if(!s)return;const current=s.child||s;
      let action=null;
      if(event.code==="Space"||event.key===" ")action={type:"shoot"};
      else if(["1","2","3"].includes(event.key))action={type:current.id==="rebound"?"lane":"choose",value:Number(event.key)-1};
      else if(["ArrowLeft","ArrowRight"].includes(event.key))action=current.id==="wind"?{type:"aim",value:current.windAim+(event.key==="ArrowLeft"?-10:10)}:{type:event.key==="ArrowLeft"?"left":"right"};
      else if(event.key==="ArrowUp")action={type:"up"};else if(event.key==="ArrowDown")action={type:"wait"};else if(event.key==="2"||event.key==="3")action={type:"range",value:event.key==="2"?"near":"far"};
      if(current.id==="buzzer"&&["2","3"].includes(event.key))action={type:"range",value:event.key==="2"?"near":"far"};
      if(action){event.preventDefault();onAction(action);}
    }
    function render(state){
      if(!state)return;const v=view(state),s=state.child||state;
      $("mini-scene").hidden=false;$("shooting-graphic").setAttribute("hidden","");
      $("mini-scene").innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" role="img" aria-label="${G.getGame(s.id).name}遊戲場景"><rect width="600" height="320" rx="12" fill="#0a2639"/><path d="M45 310V22h510v288M45 160h510" fill="none" stroke="#527d8b" stroke-width="2"/>${v.graphic}</svg>`;
      if($("mini-prompt").textContent!==v.message)$("mini-prompt").textContent=v.message;
      $("mini-choices").hidden=!v.choices;
      for(let i=0;i<3;i++){const b=$(`mini-choice-${i}`);b.textContent=v.choices?.[i]||String(i+1);b.disabled=v.locked;b.setAttribute("aria-label",`${i+1}：${b.textContent}`);}
      $("mini-arrows").hidden=!v.arrows;$("mini-up").hidden=!v.up;$("mini-wait").hidden=!v.up;
      for(const t of ["left","right","up","wait"])$(`mini-${t}`).disabled=!v.arrows||state.phase!=="playing";
      $("mini-wind").hidden=!v.wind;$("mini-wind-aim").disabled=state.phase!=="playing";$("mini-wind-aim").value=String(s.windAim);
      $("mini-ranges").hidden=!v.ranges;for(const r of ["near","far"]){$(`mini-${r}`).setAttribute("aria-pressed",String(s.range===r));$(`mini-${r}`).disabled=state.phase!=="playing";}
      $("aim-meter").hidden=!v.aim;$("shoot-button").hidden=!v.shoot;$("shoot-button").disabled=!v.shoot||v.locked||(s.id==="buzzer"&&Boolean(s.answered[s.slot]))||(s.id==="defense"&&Boolean(s.answered[s.slot]));
      $("shoot-label").textContent=v.shootLabel;
      const width=s.id==="buzzer"?(s.range==="near"?.2:.08):.14;$("aim-target").style.left=`${(0.5-width)*100}%`;$("aim-target").style.width=`${width*200}%`;
      $("game-rule-tag").textContent=`上限 ${G.getGame(state.id).durationMs/1000} 秒`;
    }
    return {render,key};
  }
  root.NBAGamesUI={view,initialize};
})(typeof globalThis!=="undefined"?globalThis:this);
