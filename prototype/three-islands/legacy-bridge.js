/* Opens the unmodified production app, using only its existing UI actions. */
export function createLegacyBridge({onOpen,onClose,onError}){
  const dialog=document.getElementById('legacy-dialog'),frame=document.getElementById('legacy-frame'),status=document.getElementById('legacy-status');
  let token=0,timeout=null,disposed=false,settleWait=null;
  const abort=()=>{token++;if(timeout!==null){clearTimeout(timeout);timeout=null;}settleWait?.();settleWait=null;};
  async function open(kind,id,action='open'){
    const command=globalThis.NBA3DCore.legacyCommand(kind,id,action);abort();const current=token;
    document.getElementById('legacy-title').textContent=kind==='fan'?'我的球迷':kind==='cart'?'共用購物車':globalThis.NBA3DCore.getDestination(id)?.name||'原版功能';
    status.textContent='正在開啟原有功能，完成後回到相同的 3D 位置。';dialog.showModal();onOpen();
    frame.onload=async()=>{
      if(current!==token||disposed)return;
      try{
        const doc=frame.contentDocument;
        if(command.select){const select=doc.getElementById(command.select);if(!select)throw Error('找不到原有入口 '+command.select);select.click();
          const started=performance.now();await new Promise((resolve,reject)=>{settleWait=resolve;const wait=()=>{if(current!==token)return resolve();if(doc.getElementById('fan-map-marker')?.dataset.location===id)return resolve();if(performance.now()-started>12000)return reject(Error('原版角色尚未抵達，請使用原版清單繼續'));timeout=setTimeout(wait,60);};wait();});settleWait=null;
        }
        if(current!==token)return;
        // Keep simulation controls consistent, without touching the original state model.
        const state=document.getElementById('game-state').value,radio=doc.querySelector('input[name="game-state"][value="'+state+'"]');if(radio){radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));}
        const fixture=doc.getElementById('bay-fixture');if(fixture){fixture.value=document.getElementById('fixture').value;fixture.dispatchEvent(new Event('change',{bubbles:true}));}
        if(command.click){const button=doc.getElementById(command.click);if(!button)throw Error('找不到原有操作 '+command.click);button.click();}
        const target=doc.getElementById(kind==='fan'?'fan-dialog':kind==='cart'||kind==='shop'?'shop-dialog':'station-panel');target?.scrollIntoView({block:'start'});
        status.textContent='正在使用原版介面與同一份本機資料。關閉此面板，3D 角色與鏡頭維持原位。';
      }catch(error){status.textContent=error.message+'；可在下方原版頁面操作。';onError?.(error);}
    };
    frame.src=new URL('../../index.html',import.meta.url).href;
  }
  function close(){abort();frame.onload=null;frame.src='about:blank';onClose();}
  document.getElementById('legacy-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',close);
  return {open,isOpen:()=>dialog.open,dispose(){disposed=true;abort();frame.onload=null;frame.src='about:blank';}};
}
