/* W12：動態購物車只在容器綁一次事件，以 closest 及 data-cart-action 委派。 */
(function(root){
  'use strict';
  function initialize({storage,config,getSelection,hasArrived,onVisit,onFocus,onAnnounce}){
    const S=root.NBAShop,A=root.NBAArchipelago,L=root.NBATeamLogo,$=id=>document.getElementById(id),session=S.createSession(storage,config),dialog=$('shop-dialog');
    const mapNodes=new Map(),drafts=new Map();let current=null,opener=null,camera=null;
    const number=n=>n.toLocaleString('zh-TW');
    function el(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
    function message(text,error=false){$('shop-message').textContent=text;$('shop-message').dataset.error=String(error);}
    function report(result,success){message(result.ok?(result.warning||success):result.message,!result.ok);refreshHeader();return result.ok;}
    function refreshHeader(){const state=session.snapshot(),count=state.cart.reduce((sum,row)=>sum+row.quantity,0);$('shop-cart-open').textContent=`購物車 ${count} 件 · ${state.ready?number(state.balance):'—'} 島幣`;$('shop-balance').textContent=state.ready?number(state.balance):'—';$('shop-grant-note').textContent=state.ready?`首次測試發放 ${number(state.initialGrant)} 島幣；重新整理不會再次發放。`:'本機購物資料暫時無法讀取，交易已暫停。';$('shop-storage-notice').textContent=state.notice;$('shop-storage-notice').hidden=!state.notice;}
    for(const shop of S.SHOPS){
      const button=el('button',undefined,'shop-point');button.id='landmark-'+shop.id;button.type='button';button.dataset.interactive='false';button.setAttribute('aria-controls','station-panel');button.setAttribute('aria-label',shop.name+'，沿步道前往店門');
      button.style.left=(shop.x-shop.width/2)/A.MAP.width*100+'%';button.style.top=(shop.y-shop.height)/A.MAP.height*100+'%';button.style.width=shop.width/A.MAP.width*100+'%';button.style.height=shop.height/A.MAP.height*100+'%';button.style.zIndex=String(Math.round(shop.y));
      for(const night of [false,true]){const img=el('img',undefined,'shop-map-art '+(night?'pixel-night':'pixel-day'));img.src=night?shop.nightAsset:shop.asset;img.alt='';img.setAttribute('aria-hidden','true');button.append(img);}button.append(el('span',shop.name,'shop-map-label'));button.addEventListener('focus',()=>onFocus(shop.id));
      const activate=()=>{if(getSelection().kind==='shop'&&getSelection().id===shop.id&&hasArrived(shop.id))openStore(shop.id,button);else onVisit(shop.id);};
      button.addEventListener('click',activate);button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();if(!event.repeat)activate();}});$('shop-layer').append(button);mapNodes.set(shop.id,button);
      const go=el('button','前往'+shop.name,'button secondary');go.type='button';go.id='shop-go-'+shop.teamId;go.addEventListener('click',()=>{if(dialog.open)dialog.close();onVisit(shop.id);});$('shop-travel-links').append(go);
    }
    function refreshEntrance(){const selected=getSelection(),shop=S.getShop(selected.id),arrived=selected.kind==='shop'&&shop&&hasArrived(shop.id);$('shop-enter').disabled=!arrived;$('shop-arrival-note').textContent=shop?(arrived?'已抵達店門。點「進入店鋪」，或在地圖店門按 Enter／空白鍵。':'請先沿主場旁步道抵達店門，再進入店鋪。'):'請先選擇一間商店。';
      for(const s of S.SHOPS){const button=mapNodes.get(s.id);button.dataset.interactive=String(Boolean(camera&&camera.level!=='island'&&camera.islandId===s.islandId));button.setAttribute('aria-label',s.name+(hasArrived(s.id)?'，已抵達，按下開啟商店':'，沿步道前往店門'));}
    }
    function products(){return current?S.PRODUCTS.filter(p=>p.shopId===current.id):[];}
    function renderProducts(){const list=products();$('shop-product').replaceChildren(...list.map(p=>{const option=el('option',p.name+' · '+number(p.price)+' 島幣');option.value=p.id;return option;}));$('shop-product').value=list[0]?.id||'';$('shop-add-quantity').value='1';$('shop-products').replaceChildren();
      for(const item of list){const card=el('article',undefined,'shop-product-card'),img=el('img');img.src=item.asset;img.alt=item.name+'的原創像素插畫';img.width=96;img.height=96;card.append(img,el('h4',item.name),el('p',number(item.price)+' 島幣'));
        const choose=el('button','選擇這項','button secondary');choose.type='button';choose.dataset.productId=item.id;card.append(choose);$('shop-products').append(card);}
    }
    function updateTotals(){const state=session.snapshot();$('shop-total').textContent=number(S.cartTotal(state.cart));$('shop-cart-empty').hidden=state.cart.length>0;$('shop-clear').disabled=!state.cart.length;refreshHeader();}
    function renderCollection(){const state=session.snapshot();$('shop-collection').replaceChildren();$('shop-collection-empty').hidden=state.collection.length>0;for(const row of state.collection){const item=S.getProduct(row.productId),card=el('li',undefined,'shop-owned-card'),img=el('img');img.src=item.asset;img.alt=item.name;img.width=64;img.height=64;card.append(img,el('strong',item.name),el('span','收藏 '+number(row.quantity)+' 件'),el('small',state.equipment[item.type]===item.id?'已裝備':'收藏中・未裝備'));$('shop-collection').append(card);}}
    function renderCart(){const list=$('shop-cart-items');list.replaceChildren();for(const row of session.snapshot().cart){const item=S.getProduct(row.productId),line=el('article',undefined,'shop-cart-row');line.dataset.productId=item.id;
      const teamLine=el('div',undefined,'team-logo-line');teamLine.append(L.create(item.teamId),el('small',S.getShop(item.shopId).teamName+' · 單價 '+number(item.price)+' 島幣'));
      line.append(el('h4',item.name),teamLine);
      const label=el('label','數量（即時更新）');label.setAttribute('for','cart-qty-'+item.id);const input=el('input');input.id='cart-qty-'+item.id;input.type='number';input.min='1';input.max=String(S.MAX_QUANTITY);input.step='1';input.inputMode='numeric';input.required=true;input.value=drafts.get(item.id)??String(row.quantity);input.dataset.productId=item.id;input.setAttribute('aria-describedby','cart-error-'+item.id);input.setAttribute('aria-invalid',String(drafts.has(item.id)));
      const subtotal=el('p','小計 '+number(item.price*row.quantity)+' 島幣','shop-subtotal');subtotal.id='cart-subtotal-'+item.id;line.append(label,input,subtotal);
      const error=el('p',drafts.has(item.id)?'數量無效，尚未更新。':'','shop-field-error');error.id='cart-error-'+item.id;line.append(error);
      for(const [action,text]of [['update','套用數量'],['remove','刪除此項']]){const button=el('button',undefined,'button secondary');button.id='cart-'+action+'-'+item.id;button.type='button';button.dataset.cartAction=action;button.dataset.productId=item.id;button.append(el('span',text));line.append(button);}list.append(line);
    }updateTotals();}
    function updateRow(id,value,explicit=false){const q=S.quantity(value),input=$('cart-qty-'+id);if(q===null){drafts.set(id,value);input?.setAttribute('aria-invalid','true');if($('cart-error-'+id))$('cart-error-'+id).textContent='請填 1–99 的正整數；本項仍保留上次有效數量。';message(S.getProduct(id).name+'的數量無效，請修改後再結帳。',true);return false;}
      const previous=session.snapshot().cart.find(r=>r.productId===id),wasInvalid=drafts.has(id);if(!previous)return false;const result=previous.quantity===q?{ok:true}:session.update(id,q);if(!result.ok){report(result,'');return false;}drafts.delete(id);input?.setAttribute('aria-invalid','false');$('cart-error-'+id).textContent='';$('cart-subtotal-'+id).textContent='小計 '+number(S.getProduct(id).price*q)+' 島幣';updateTotals();if(explicit||result.warning||wasInvalid)report(result,'商品數量已更新。');return true;
    }
    function show(){renderCart();renderCollection();refreshHeader();if(!dialog.open)dialog.showModal();$('shop-heading').focus();}
    function openStore(id,from){const shop=S.getShop(id),selected=getSelection();if(!shop||selected.kind!=='shop'||selected.id!==id||!hasArrived(id)){message('請先抵達店門再開啟商店。',true);return false;}current=shop;opener=from||$('shop-enter');$('shop-heading').textContent=shop.name;L.mount($('shop-team-logo'),shop.teamId,{variant:'heading',eager:true});$('shop-catalog').hidden=false;$('shop-layout').dataset.mode='store';renderProducts();message('兩島共用購物車。商品加入後可繼續跨橋逛店。');show();return true;}
    $('shop-cart-open').addEventListener('click',()=>{opener=$('shop-cart-open');$('shop-heading').textContent='我的共用購物車';L.mount($('shop-team-logo'),null);$('shop-catalog').hidden=true;$('shop-layout').dataset.mode='cart';message('島幣模擬結帳；收藏與裝備分開管理。');show();});
    $('shop-enter').addEventListener('click',()=>openStore(getSelection().id));$('shop-close').addEventListener('click',()=>dialog.close());$('shop-continue').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{const target=opener;opener=null;target?.focus();});
    $('shop-products').addEventListener('click',event=>{const button=event.target.closest?.('button[data-product-id]');if(!button||!$('shop-products').contains(button))return;const item=S.getProduct(button.dataset.productId);if(item?.shopId!==current?.id)return;$('shop-product').value=item.id;$('shop-add-quantity').focus();});
    $('shop-add-form').addEventListener('submit',event=>{event.preventDefault();const selected=getSelection(),item=S.getProduct($('shop-product').value);if(!current||selected.kind!=='shop'||selected.id!==current.id||!hasArrived(current.id)||item?.shopId!==current.id){message('請先到這家店的店門，重新選擇商品。',true);return;}const result=session.add(item.id,$('shop-add-quantity').value);if(report(result,'已加入 '+item.name+'；跨島後仍保留於共用購物車。')){renderCart();$('shop-add-quantity').value='1';onAnnounce('已將'+item.name+'加入共用購物車。');}});
    // 動態列只接受這個容器內的控制項，點到按鈕內 span 也能委派。
    $('shop-cart-items').addEventListener('click',event=>{const button=event.target.closest?.('button[data-cart-action]');if(!button||!$('shop-cart-items').contains(button))return;const id=button.dataset.productId;if(button.dataset.cartAction==='update')updateRow(id,$('cart-qty-'+id).value,true);else if(button.dataset.cartAction==='remove'){if(report(session.remove(id),'已刪除 '+S.getProduct(id)?.name+'。')){drafts.delete(id);renderCart();$('shop-total').focus();}}});
    const quantityChanged=event=>{const input=event.target;if(input.tagName!=='INPUT'||!$('shop-cart-items').contains(input)||!input.dataset.productId)return;updateRow(input.dataset.productId,input.value);};
    $('shop-cart-items').addEventListener('input',quantityChanged);$('shop-cart-items').addEventListener('change',quantityChanged);
    $('shop-clear').addEventListener('click',()=>{if(report(session.clear(),'購物車已清空，餘額與收藏不變。')){drafts.clear();renderCart();}});
    $('shop-checkout-form').addEventListener('submit',event=>{event.preventDefault();for(const row of session.snapshot().cart){const input=$('cart-qty-'+row.productId),q=S.quantity(input?.value);if(q===null||q!==row.quantity||drafts.has(row.productId)){message(S.getProduct(row.productId).name+'的數量尚未有效套用，請填正整數並按「套用數量」後再結帳。',true);input?.focus();return;}}
      const result=session.checkout();if(report(result,result.message)){drafts.clear();renderCart();renderCollection();$('shop-collection-heading').focus();}
    });
    refreshHeader();refreshEntrance();
    return {refreshEntrance,observeView(value){camera=value;refreshEntrance();},openStore};
  }
  root.NBAShopUI={initialize};
})(globalThis);
