/* Exactly one active renderer. Legacy image markup stays inert in a template. */
(function(root){
  'use strict';
  const $=id=>document.getElementById(id);
  function mountWorld(legacy){
    const template=$('fallback-world'),old=$('island-world');if(!template)return;
    old?.remove();
    if(legacy){$('island-map').append(template.content.cloneNode(true));return;}
    const hooks=document.createElement('div');hooks.id='island-world';hooks.hidden=true;hooks.setAttribute('aria-hidden','true');
    for(const source of template.content.querySelectorAll('[id]')){if(source.id==='island-world')continue;const node=document.createElement(source.tagName==='BUTTON'?'button':'div');node.id=source.id;hooks.append(node);}
    $('island-map').append(hooks);
  }
  async function start(initialize){
    const parameters=new URL(location.href).searchParams,forced=parameters.get('map')==='2d'||location.protocol==='file:';if(parameters.get('fallback')==='webgl')root.NBA_MAP_BOOT_ERROR='WebGL unavailable; reopened the unchanged legacy coordinate system';
    if(!forced){try{
      const module=await import('./three-map/main.js');const renderer=module.prepare();
      root.NBA_MAP_RENDERER='three';document.body.dataset.renderer='three';mountWorld(false);initialize({renderer});return;
    }catch(error){root.NBA_MAP_BOOT_ERROR=String(error.message);document.body.dataset.fallbackReason=String(error.message);}}
    root.NBAVectorArt.install();root.NBA_MAP_RENDERER='vector';document.body.dataset.renderer='vector';mountWorld(false);initialize({renderer:root.NBAVectorMapRenderer});
    if(root.NBA_MAP_BOOT_ERROR){const message=document.createElement('p');message.className='fallback-notice';message.setAttribute('role','status');message.textContent='3D 地圖暫時無法啟動，已切換平滑向量備援；玩法與本機進度繼續保留。';$('island-map-area').before(message);}
  }
  root.NBAMapBoot={start};
})(globalThis);
