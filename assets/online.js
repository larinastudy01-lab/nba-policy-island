"use strict";
(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.NBAOnline=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
  function validateConfig(config={}){
    if(!config.url&&!config.publishableKey)return {valid:false,reason:"UNCONFIGURED"};
    try{
      const url=new URL(config.url);if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash||!/^\/$/.test(url.pathname))throw new Error();
      const key=String(config.publishableKey||"");
      let publicKey=key.startsWith("sb_publishable_")&&key.length>20;
      if(!publicKey&&key.split(".").length===3){const payload=key.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");publicKey=JSON.parse(atob(payload)).role==="anon";}
      if(!publicKey||key.startsWith("sb_secret_"))return {valid:false,reason:"PUBLIC_KEY_REQUIRED"};
      return {valid:true,url:url.origin,key};
    }catch{return {valid:false,reason:"INVALID_CONFIG"};}
  }
  function createSupabaseAdapter(config,options={}){
    const checked=validateConfig(config);const fetcher=options.fetch||globalThis.fetch;const storage=options.storage;let session=null;let authInFlight=null;
    const sessionKey=checked.valid?`nba-policy-island:auth:${new URL(checked.url).hostname}`:"";
    try{session=checked.valid?JSON.parse(storage?.getItem(sessionKey)||"null"):null;}catch{session=null;}
    async function request(path,body,authenticated=true){
      if(!checked.valid)throw new Error(checked.reason);
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),12000);
      try {
        const response=await fetcher(`${checked.url}${path}`,{method:"POST",signal:controller.signal,headers:{apikey:checked.key,"Content-Type":"application/json",...(authenticated?{Authorization:`Bearer ${session?.access_token||checked.key}`}:{})},body:JSON.stringify(body)});
        const data=await response.json().catch(()=>({}));
        if(!response.ok){const error=new Error(data.message||data.msg||"CONNECTION_FAILED");error.status=response.status;throw error;}
        return data;
      } finally {clearTimeout(timeout);}
    }
    async function authenticate(){
      if(!checked.valid)throw new Error(checked.reason);
      if(session?.access_token&&session?.user?.id&&session.expires_at*1000>Date.now()+60000)return session.user;
      if(authInFlight)return authInFlight;
      authInFlight=(async()=>{
        let result;
        if(session?.refresh_token){
          try{result=await request("/auth/v1/token?grant_type=refresh_token",{refresh_token:session.refresh_token},false);}catch(error){if(error.status>=400&&error.status<500)session=null;throw error;}
        }else result=await request("/auth/v1/signup",{data:{}},false);
        if(!result.access_token||!result.user?.id)throw new Error("ANONYMOUS_AUTH_REQUIRED");
        session={...result,expires_at:result.expires_at||Math.floor(Date.now()/1000)+(result.expires_in||3600)};
        try{storage?.setItem(sessionKey,JSON.stringify(session));}catch{ /* 本次頁面仍可使用該匿名身分。 */ }
        return session.user;
      })();
      try{return await authInFlight;}finally{authInFlight=null;}
    }
    async function rpc(name,args={}){await authenticate();return request(`/rest/v1/rpc/${name}`,args);}
    return {
      configured:checked.valid,reason:checked.reason||null,
      connect:authenticate,
      capabilities:()=>rpc("nba_games_capabilities"),
      userId:()=>session?.user?.id||null,
      create:(courtId,name)=>rpc("nba_create_room",{p_court:courtId,p_name:name}),
      join:(courtId,invite,name)=>rpc("nba_join_room",{p_court:courtId,p_invite:invite,p_name:name}),
      get:(roomId)=>rpc("nba_get_room",{p_room:roomId}),
      ready:(roomId,ready)=>rpc("nba_set_ready",{p_room:roomId,p_ready:ready}),
      start:(roomId)=>rpc("nba_start_match",{p_room:roomId}),
      submit:(roomId,round,score,attempts)=>rpc("nba_submit_score",{p_room:roomId,p_round:round,p_score:score,p_attempts:attempts}),
      submitResult:(roomId,round,gameId,seed,result)=>rpc("nba_submit_result",{p_room:roomId,p_round:round,p_game:gameId,p_seed:seed,p_result:result}),
      choose:(roomId,round,turn,move)=>rpc("nba_choose_move",{p_room:roomId,p_round:round,p_turn:turn,p_move:move}),
      restart:(roomId)=>rpc("nba_restart_match",{p_room:roomId}),
      leave:(roomId)=>rpc("nba_leave_room",{p_room:roomId}),
      activity:()=>rpc("nba_court_activity"),
      myRooms:(courtId)=>rpc("nba_my_rooms",{p_court:courtId})
    };
  }
  return {validateConfig,createSupabaseAdapter};
});
