/* 開局前試玩與正式成績分離；不寫 localStorage、不建立房間或送出結果。 */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./games-core.js"):root.NBAGames);if(typeof module==="object"&&module.exports)module.exports=api;else root.NBAPractice=api;})(globalThis,function(G){
  "use strict";
  function createTutorial(id,{seed=1}={}){
    const demo=G.createGame(id,{seed,durationMs:12000});let interactions=0;
    function strip(snapshot){const value={...snapshot,tutorial:true,score:0,hits:0,attempts:0,result:null,interactions};if(value.child)value.child=strip(value.child);return value;}
    return {start:at=>strip(demo.start(at)),tick:now=>strip(demo.tick(now)),act(action,now){const result=demo.act(action,now);if(result.accepted)interactions++;const message=!result.accepted?"目前時機尚不能操作":result.hit?"這次操作成功！":result.attempted?"這次未成功，可再試一次":"已收到操作，請觀察場景提示";return {...strip(result),feedback:`不計分試玩：${message}。正式開局會從零開始。`};}};
  }
  return {createTutorial};
});
