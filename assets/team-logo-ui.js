/* 隊伍資料是唯一圖源；圖片失敗時保留同尺寸縮寫，不改路網、互動或儲存資料。 */
(function(root){
  'use strict';
  function create(value,{variant='small',eager=false}={}){
    const team=typeof value==='string'?root.NBAIsland.TEAMS.find(t=>t.id===value):value;
    const frame=document.createElement('span');frame.className='team-logo team-logo--'+variant;
    frame.dataset.teamId=team?.id||'';frame.dataset.loaded='false';frame.setAttribute('aria-hidden','true');
    const fallback=document.createElement('span');fallback.className='team-logo-fallback';fallback.textContent=team?.abbr||'NBA';frame.append(fallback);
    const source=variant==='map'?(team?.logoMark||team?.logo):team?.logo;
    if(source){
      const image=document.createElement('img');image.alt='';image.setAttribute('aria-hidden','true');
      image.width=48;image.height=48;image.decoding='async';image.loading=eager?'eager':'lazy';image.draggable=false;
      image.addEventListener('load',()=>{image.hidden=false;fallback.hidden=true;frame.dataset.loaded='true';});
      image.addEventListener('error',()=>{image.hidden=true;fallback.hidden=false;frame.dataset.loaded='false';});
      frame.append(image);image.src=source;
    }
    return frame;
  }
  function mount(container,team,options){container.replaceChildren(...(team?[create(team,options)]:[]));container.hidden=!team;}
  root.NBATeamLogo={create,mount};
})(globalThis);
