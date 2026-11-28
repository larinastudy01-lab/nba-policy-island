/* Reserved schema, not 42 invented/published historical accounts. */
(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.NBAHistoryContract=api;})(globalThis,function(){'use strict';
  const fields=['id','year','eraId','teamIds','playerIds','title','summary','sources','sceneId','courtId','memorial','verified','status'];
  const reserved=Array.from({length:42},(_,i)=>({id:'history-slot-'+String(i+1).padStart(2,'0'),year:null,eraId:null,teamIds:[],playerIds:[],title:null,summary:null,sources:[],sceneId:null,courtId:null,memorial:false,verified:false,status:'reserved'}));
  function canPublish(event){return Boolean(event?.verified&&event.status==='published'&&event.title&&event.summary&&Number.isInteger(event.year)&&event.sources?.length&&event.sources.every(s=>/^https:\/\/(?:www\.)?(?:nba\.com|[\w-]+\.nba\.com)\//.test(s.url))&&!(event.memorial&&event.courtId));}
  return {version:1,fields,reserved,canPublish};
});
