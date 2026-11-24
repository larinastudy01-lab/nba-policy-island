/* W09/W11：島幣模擬商店；錢包、購物車及收藏同一份快照寫入。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./archipelago-core.js'):root.NBAArchipelago);if(typeof module==='object'&&module.exports)module.exports=api;else root.NBAShop=api;})(globalThis,function(A){
  'use strict';
  const STORAGE_KEY='nba-policy-island:shop:v1',MAX_QUANTITY=99,MAX_COINS=999999999;
  const TYPES=['cap','mini-ball','scarf','poster','jersey'];
  const SHOPS=[{id:'shop-warriors',teamId:'warriors',name:'勇士海灣周邊店',teamName:'金州勇士',color:'#2464b9',accent:'#f3c45b'},{id:'shop-lakers',teamId:'lakers',name:'湖人紫金周邊店',teamName:'洛杉磯湖人',color:'#65429a',accent:'#efc451'}].map(s=>({...s,kind:'shop',region:'球隊周邊',asset:'./assets/shops/'+s.id+'.svg',nightAsset:'./assets/shops/'+s.id+'-night.svg',...A.place('shop',s.id)}));
  const PRODUCTS=SHOPS.flatMap(s=>[['cap','球迷帽',120],['mini-ball','迷你籃球',160],['scarf','應援圍巾',180],['poster','紀念海報',100]].map(([type,name,price])=>({id:s.teamId+'-'+type,shopId:s.id,teamId:s.teamId,name:(s.teamId==='warriors'?'勇士':'湖人')+name,type,price,available:true,assetId:'merch-'+s.teamId+'-'+type,asset:'./assets/shops/merch-'+s.teamId+'-'+type+'.svg'})));
  const RESERVED_PRODUCTS=SHOPS.map(s=>({id:s.teamId+'-jersey',shopId:s.id,teamId:s.teamId,type:'jersey',assetId:'jersey-'+s.teamId+'-reserved',available:false,price:null}));
  const getShop=id=>SHOPS.find(s=>s.id===id)||null,getProduct=id=>PRODUCTS.find(p=>p.id===id)||null;
  const copy=value=>JSON.parse(JSON.stringify(value));
  const integer=(n,max=MAX_COINS)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
  function quantity(value){const text=typeof value==='number'?String(value):typeof value==='string'?value.trim():'';if(!/^\d+$/.test(text))return null;const n=Number(text);return Number.isSafeInteger(n)&&n>=1&&n<=MAX_QUANTITY?n:null;}
  function initialCoins(config={}){return integer(config.initialCoins)?config.initialCoins:1200;}
  function validate(value){if(!value||value.version!==1||!integer(value.balance)||!integer(value.initialGrant)||!integer(value.revision)||!integer(value.purchases)||!Array.isArray(value.cart)||!Array.isArray(value.collection))throw Error('Invalid shopping snapshot');
    const rows=(list,max)=>{const ids=new Set();return list.map(row=>{if(!row||!getProduct(row.productId)||ids.has(row.productId)||!Number.isSafeInteger(row.quantity)||row.quantity<1||row.quantity>max)throw Error('Invalid item');ids.add(row.productId);return {productId:row.productId,quantity:row.quantity};});};
    const cart=rows(value.cart,MAX_QUANTITY),collection=rows(value.collection,MAX_COINS),equipment={};
    if(!value.equipment||typeof value.equipment!=='object'||Array.isArray(value.equipment))throw Error('Invalid equipment');
    for(const [slot,id]of Object.entries(value.equipment)){const item=getProduct(id);if(!TYPES.includes(slot)||!item||item.type!==slot||!collection.some(row=>row.productId===id))throw Error('Invalid equipped item');equipment[slot]=id;}
    return {version:1,revision:value.revision,initialGrant:value.initialGrant,balance:value.balance,purchases:value.purchases,cart,collection,equipment};
  }
  function cartTotal(cart){return cart.reduce((sum,row)=>{const item=getProduct(row.productId),q=quantity(row.quantity);if(!item||q===null)throw Error('Invalid cart');return sum+item.price*q;},0);}
  function createSession(storage,config={}){
    let data={version:1,revision:0,initialGrant:initialCoins(config),balance:initialCoins(config),purchases:0,cart:[],collection:[],equipment:{}},lastRaw=null,ready=true,notice='';
    try{const raw=storage?.getItem(STORAGE_KEY)??null;lastRaw=raw;if(raw!==null){try{data=validate(JSON.parse(raw));}catch{ready=false;notice='本機購物資料無法讀取，已暫停交易；沒有重設或重新發放島幣。';}}
      else{if(!storage)throw Error('No storage');lastRaw=JSON.stringify(data);storage.setItem(STORAGE_KEY,lastRaw);}}
    catch{lastRaw=null;notice='本機儲存不可用；購物車暫留本頁，結帳需先能儲存資料。';}
    const fail=(code,message)=>({ok:false,code,message});
    function write(next,strict=false){if(!ready)return fail('saved-data',notice);let warning='';
      try{if(!storage)throw Error('No storage');const raw=storage.getItem(STORAGE_KEY);if(raw!==lastRaw)return fail('conflict','另一個頁面更新了購物資料。請重新整理後再操作，本頁尚未扣款或覆蓋資料。');const encoded=JSON.stringify(next);storage.setItem(STORAGE_KEY,encoded);lastRaw=encoded;notice='';}
      catch{notice='本機儲存失敗；購物車暫留本頁。交易未完成，請開啟瀏覽器儲存後再試。';if(strict)return fail('storage',notice);warning=notice;}
      data=next;return {ok:true,warning};
    }
    function edit(change){if(!ready)return fail('saved-data',notice);const next=copy(data),error=change(next);if(error)return error;if(next.revision>=MAX_COINS)return fail('limit','資料版本已達上限，無法繼續交易。');next.revision++;return write(next);}
    return {snapshot:()=>({...copy(data),ready,notice}),
      add(productId,value){const item=getProduct(productId),q=quantity(value);if(!item)return fail('product','這項商品尚未開放販售。');if(q===null)return fail('quantity','數量須為 1–99 的正整數，不接受小數、負數或科學記號。');return edit(next=>{const row=next.cart.find(r=>r.productId===productId);if(row){if(row.quantity+q>MAX_QUANTITY)return fail('quantity','同一商品的購物車數量不能超過 99 件。');row.quantity+=q;}else next.cart.push({productId,quantity:q});});},
      update(productId,value){const q=quantity(value);if(q===null)return fail('quantity','數量須為 1–99 的正整數；如需移除商品請按刪除。');return edit(next=>{const row=next.cart.find(r=>r.productId===productId);if(!row)return fail('missing','購物車找不到這項商品，請重新確認。');row.quantity=q;});},
      remove(productId){return edit(next=>{if(!next.cart.some(r=>r.productId===productId))return fail('missing','這項商品已不在購物車。');next.cart=next.cart.filter(r=>r.productId!==productId);});},
      clear(){return edit(next=>{next.cart=[];});},
      checkout(){if(!ready)return fail('saved-data',notice);if(!data.cart.length)return fail('empty','購物車是空的，請先到商店加入商品。');let total;try{total=cartTotal(data.cart);}catch{return fail('quantity','購物車含有無效的商品或數量，請修改後再結帳。');}
        if(total>data.balance)return fail('balance',`需要 ${total} 島幣，目前餘額 ${data.balance} 島幣，還差 ${total-data.balance} 島幣。商品與餘額均保留。`);
        if(data.revision>=MAX_COINS||data.purchases>=MAX_COINS)return fail('limit','交易筆數已達上限，沒有扣款。');const next=copy(data);
        for(const row of next.cart){const owned=next.collection.find(p=>p.productId===row.productId);if(owned){if(owned.quantity+row.quantity>MAX_COINS)return fail('limit','收藏數量已達上限，沒有扣款。');owned.quantity+=row.quantity;}else next.collection.push({...row});}
        const purchased=copy(next.cart);next.balance-=total;next.cart=[];next.purchases++;next.revision++;const result=write(next,true);return result.ok?{...result,total,purchased,message:`島幣模擬結帳成功，扣除 ${total} 島幣；商品已加入收藏，未自動裝備。`}:result;
      }
    };
  }
  return {STORAGE_KEY,MAX_QUANTITY,MAX_COINS,TYPES,SHOPS,PRODUCTS,RESERVED_PRODUCTS,getShop,getProduct,quantity,initialCoins,validate,cartTotal,createSession};
});
