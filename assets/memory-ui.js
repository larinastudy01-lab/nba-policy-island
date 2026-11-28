/* 自主閱讀，不依賽況解鎖。只有玩家按「標記已閱讀」才保存紀錄。 */
(function(root){
  'use strict';
  function initialize({storage,onNavigate,onFocus,onAnnounce}){
    const M=root.NBAMemory,A=root.NBAArchipelago,C=root.NBAIsland,L=root.NBATeamLogo,$=id=>document.getElementById(id),book=M.createBook(storage),dialog=$('memory-dialog');
    const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let camera=null,position=null,walker=null,pending=null,current=null,timer=null,shot=null,opener=null;
    const nodes=new Map(),entries=new Map();
    function el(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
    for(const event of M.ENTRANCES){
      if(!["three","vector"].includes(root.NBA_MAP_RENDERER)){const image=el('img');image.src=event.asset.replace('.svg','-point.svg');image.alt=event.point+'，原創像素場景入口';image.className='memory-prop';image.width=event.width;image.height=event.height;
      image.style.left=(event.x-event.width/2)/A.MAP.width*100+'%';image.style.top=(event.y-event.height)/A.MAP.height*100+'%';image.style.width=event.width/A.MAP.width*100+'%';image.style.zIndex=String(Math.round(event.y));$('memory-layer').append(image);}
      const hint=el('button',undefined,'memory-hint');hint.type='button';hint.id='landmark-'+event.id;hint.setAttribute('aria-label',event.point+'，前往後自主閱讀');hint.setAttribute('aria-haspopup','dialog');hint.setAttribute('aria-controls','memory-dialog');hint.dataset.visible='false';
      hint.style.left=(event.x+event.width/2+12)/A.MAP.width*100+'%';hint.style.top=(event.y-event.height/2+12)/A.MAP.height*100+'%';hint.style.zIndex=String(Math.round(event.entrance.y)+1);
      hint.append(el('span','讀','memory-symbol'),el('span',event.point,'memory-hint-label'));
      hint.addEventListener('focus',()=>onFocus(event.id));
      hint.addEventListener('click',()=>navigate(event.id,true));
      hint.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat){e.preventDefault();navigate(event.id,true);}});
      $('memory-layer').append(hint);nodes.set(event.id,hint);
    }
    for(const event of M.EVENTS){
      const row=el('li',undefined,'memory-book-entry'),team=C.TEAMS.find(t=>t.id===event.teamId);
      const teamLine=el('div',undefined,'team-logo-line');teamLine.append(L.create(team),el('small',team.shortName+'島 · '+event.season));
      row.append(teamLine,el('h3',event.title),el('p',event.form));
      const status=el('span',undefined,'memory-read-label'),review=el('button','回看','button secondary');review.type='button';review.id='memory-review-'+event.id;row.append(status);
      M.forEvent(event.id).forEach((point,i)=>{const go=el('button',M.forEvent(event.id).length>1?'前往'+C.TEAMS.find(t=>t.id===point.teamId).shortName+'島':'前往島上','button secondary');go.type='button';go.id='memory-go-'+(i===0?event.id:point.id);go.addEventListener('click',()=>{dialog.close();navigate(point.id,false);});row.append(go);});
      review.addEventListener('click',()=>{if(book.has(event.id))showEvent(event.id);});row.append(review);$('memory-book-list').append(row);entries.set(event.id,{status,review});
    }
    function refreshBook(){const count=book.snapshot().read.length;$('memory-progress').textContent=`已閱讀 ${count}／${M.EVENTS.length}`;$('memory-open').textContent=`球迷記憶簿 ${count}／${M.EVENTS.length}`;
      $('memory-storage-notice').textContent=book.notice();$('memory-storage-notice').hidden=!book.notice();
      for(const e of M.EVENTS){const read=book.has(e.id),entry=entries.get(e.id);entry.status.textContent=read?'已閱讀':'尚未閱讀';entry.review.hidden=!read;for(const p of M.forEvent(e.id)){nodes.get(p.id).dataset.read=String(read);nodes.get(p.id).setAttribute('aria-label',p.point+(read?'，已閱讀，可回看':'，前往後自主閱讀'));}}
      if(current){$('memory-mark').textContent=book.has(current.id)?'已收藏閱讀紀錄':'標記已閱讀・收進記憶簿';$('memory-mark').disabled=book.has(current.id);}
    }
    function refreshHints(){for(const e of M.ENTRANCES)nodes.get(e.id).dataset.visible=String(M.hintVisible(camera,e,position));}
    function stopShot(){if(timer!==null){clearInterval(timer);timer=null;}}
    function resetShot(){stopShot();shot=null;$('memory-manual-aim').value='0';$('memory-aim-cursor').style.left='0%';$('memory-shot-start').disabled=false;$('memory-shoot').disabled=true;$('memory-shot-feedback').textContent='可跳過，不影響閱讀紀錄。每次一球，最長 8 秒；游標在金色區間時出手。';$('memory-shot-clock').textContent='8.0';$('memory-shot-stage').dataset.result='idle';$('memory-shot-stage').dataset.bounces='0';}
    function showBook(){current=null;resetShot();$('memory-reader').hidden=true;$('memory-book').hidden=false;refreshBook();$('memory-heading').textContent='球迷記憶簿';if(!dialog.open)dialog.showModal();$('memory-heading').focus();}
    function showEvent(id){const event=M.get(id),point=M.getEntrance(id)||M.forEvent(event?.id)[0];if(!event||!point)return;current=event;resetShot();$('memory-read-notice').textContent='';$('memory-book').hidden=true;$('memory-reader').hidden=false;$('memory-heading').textContent=event.title;
      const team=C.TEAMS.find(t=>t.id===point.teamId);L.mount($('memory-team-logo'),team,{variant:'heading',eager:true});$('memory-meta').textContent=`${team.name}島 · ${event.season} 賽季 · ${event.form}`;
      $('memory-date').textContent=event.date+'（事件當地日期）';$('memory-date').setAttribute('datetime',event.date);$('memory-place').textContent=point.point;
      if(root.NBA3DVisual)root.NBA3DVisual.image($('memory-scene'),'memory',{...event,teamId:point.teamId});else $('memory-scene').src=point.asset;$('memory-scene').alt=point.point+'的原創風格化場景，非歷史影像';
      $('memory-scene-caption').textContent=event.presentation==='memorial'?'原創靜態紀念場景・九束花悼念九位罹難者。沒有動畫、音效或過關要求。':event.presentation==='newspaper'?'原創風格化場景與重新編排的展板，非歷史報紙原件或歷史影像。':'原創遊戲重現畫面，非歷史影像；島上位置不是實際比賽場地。';
      $('memory-text').replaceChildren(...event.text.map(p=>el('p',p)));$('memory-reflection').textContent=event.reflection;
      $('memory-historic-score').hidden=!event.score;$('memory-historic-score').textContent=event.score?'史實比分 · '+event.score:'';
      $('memory-sources').replaceChildren(...event.sources.map(source=>{const row=el('li'),a=el('a',source.title+' ↗');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';row.append(a);return row;}));
      $('memory-shot').hidden=event.presentation!=='shot';$('memory-static-aim').hidden=!motion?.matches;$('memory-manual-aim').value='0';refreshBook();
      if(!dialog.open)dialog.showModal();$('memory-heading').focus();
    }
    function navigate(id,read){if(!M.getEntrance(id))return;if(read)opener=nodes.get(id);pending={id,read};onNavigate(id);checkArrival();}
    function checkArrival(){if(!pending||!walker||walker.moving||walker.locationId!==pending.id)return;const target=pending;pending=null;
      onAnnounce('已抵達'+M.getEntrance(target.id).point+'，可自主閱讀。');if(target.read)showEvent(target.id);
    }
    function cancelNavigation(){pending=null;stopShot();}
    function tickShot(){if(!shot)return;const state=shot.snapshot(Date.now());$('memory-shot-clock').textContent=(state.remaining/1000).toFixed(1);if(!motion?.matches)$('memory-aim-cursor').style.left=state.aim*100+'%';
      if(state.phase==='timeout'){stopShot();$('memory-shoot').disabled=true;$('memory-shot-start').disabled=false;$('memory-shot-feedback').textContent='本次 8 秒已結束；可重試或繼續閱讀，史實比分維持不變。';$('memory-shot-stage').dataset.result='timeout';}
    }
    function startShot(){if(!dialog.open||current?.presentation!=='shot')return;resetShot();shot=M.createShot();shot.start(Date.now());$('memory-shot-start').disabled=true;$('memory-shoot').disabled=false;$('memory-shot-feedback').textContent=motion?.matches?'靜態模式：調整滑桿到金色區間，再按出手。':'金色區間為命中區；按空白鍵或出手按鈕。';$('memory-shot-stage').dataset.result='playing';timer=setInterval(tickShot,50);tickShot();$('memory-shoot').focus();}
    function shoot(){if(!dialog.open||!shot||current?.presentation!=='shot')return;const s=shot.shoot(Date.now(),motion?.matches?Number($('memory-manual-aim').value)/100:undefined);if(!s.accepted){tickShot();return;}stopShot();$('memory-shoot').disabled=true;$('memory-shot-start').disabled=false;$('memory-shot-stage').dataset.result=s.hit?'hit':'miss';$('memory-shot-stage').dataset.bounces=String(s.hit?current.bounces||0:0);$('memory-shot-feedback').textContent=(s.hit?'這次命中！':'這次未命中。')+'原創像素重現，不改寫史實，也不計入球場成績。';}
    $('memory-open').addEventListener('click',()=>{opener=$('memory-open');showBook();});$('memory-close').addEventListener('click',()=>dialog.close());$('memory-continue').addEventListener('click',()=>dialog.close());$('memory-back-book').addEventListener('click',showBook);
    $('memory-mark').addEventListener('click',()=>{if(!current)return;book.mark(current.id);refreshBook();$('memory-read-notice').textContent='已收藏閱讀紀錄，可在記憶簿回看。';});
    $('memory-shot-start').addEventListener('click',startShot);$('memory-shoot').addEventListener('click',shoot);
    $('memory-shot').addEventListener('keydown',e=>{if(e.key!==' '||e.target===$('memory-manual-aim')||e.target===$('memory-shot-start'))return;e.preventDefault();if(!e.repeat)shoot();});
    $('memory-manual-aim').addEventListener('input',()=>{$('memory-aim-cursor').style.left=$('memory-manual-aim').value+'%';});
    dialog.addEventListener('close',()=>{resetShot();current=null;$('memory-read-notice').textContent='';const target=opener;opener=null;target?.focus();});
    function pause(){if(shot?.snapshot(Date.now()).phase==='playing'){stopShot();shot.cancel();$('memory-shoot').disabled=true;$('memory-shot-start').disabled=false;$('memory-shot-feedback').textContent='已暫停並取消本次出手；回來後可重新開始。';$('memory-shot-stage').dataset.result='idle';}}
    document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',pause);
    motion?.addEventListener?.('change',()=>{pause();$('memory-static-aim').hidden=!motion.matches;});
    refreshBook();
    return {navigate,cancelNavigation,observeView(value){camera=value;refreshHints();},observePosition(p,w){position=p;walker=w;refreshHints();checkArrival();}};
  }
  root.NBAMemoryUI={initialize};
})(globalThis);
