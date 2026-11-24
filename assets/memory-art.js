/* 原創等距像素展板。Tile 與全島共用 2:1 投影、左上光源。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./pixel-core.js'):root.NBAPixel);if(typeof module==='object'&&module.exports)module.exports=api;else root.NBAMemoryArt=api;})(globalThis,function(P){
  'use strict';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function prop(event){const t=new P.Tile(event.width/2,event.height/2),w=t.width,h=t.height;
    if(event.presentation==='memorial'){
      t.ellipse(26,26,21,4,'#38494b');P.block(t,22,19,22,18,3,'#b3ae9a');P.block(t,18,8,25,4,12,'#625f78');t.line(16,2,38,13,'#d7b975');
      // 九束花，各自獨立，不閃爍、不播放音效。
      for(let i=0;i<9;i++){const x=9+i*3,y=17+Math.floor(i/3)*2;t.line(x,y,x,y+3,'#728c64');t.rect(x-1,y-1,2,2,i%2?'#e3d7ab':'#ab9bc5');}
      t.rect(21,7,2,3,'#dac88e');t.rect(26,9,2,3,'#dac88e');
    }else if(event.presentation==='scoreboard'){
      t.ellipse(14,21,12,3,'#344d50');t.rect(6,12,2,10,'#566670');t.rect(21,12,2,10,'#566670');P.block(t,5,4,21,3,2,'#d4b56c');t.rect(4,4,21,11,'#213d58');t.rect(6,5,17,2,'#e1bd65');for(let x=7;x<21;x+=4)t.rect(x,9,2,3,'#d2dbc7');
    }else if(event.presentation==='newspaper'){
      t.ellipse(16,21,13,3,'#384b50');P.block(t,13,13,15,11,7,'#788d88');P.block(t,14,7,15,10,7,'#5d7c88');t.polygon([[4,9],[20,17],[20,23],[4,15]],'#e5d6a8');t.line(6,11,17,16,'#444f57');t.line(6,13,12,16,'#75817a');t.rect(24,14,2,8,'#536575');
    }else{
      const color=event.teamId==='bulls'?'#c6535b':'#9264ac';t.polygon([[1,h-8],[w/2,2],[w-1,h-8],[w/2,h-1]],'#547f76');t.polygon([[4,h-8],[w/2,4],[w-4,h-8],[w/2,h-3]],color);t.line(6,h-8,w/2,h-4,'#e0d5ac');t.line(w/2,h-4,w-5,h-8,'#e0d5ac');t.rect(w/2-2,h/2-2,4,2,'#f4e2b3');t.line(w-4,h-9,w-4,0,'#b9c9c2');t.rect(w-8,0,8,3,'#e2dac2');t.line(w-8,4,w-4,4,'#dcac67');
    }
    return t;
  }
  function scene(event){const t=new P.Tile(192,112);t.rect(0,0,192,112,'#91b4ba');t.rect(0,56,192,56,'#647d79');t.polygon([[0,76],[94,29],[192,78],[125,112],[0,112]],'#b8b39b');for(let i=0;i<6;i++)t.line(i*28-30,86,90+i*28,26,'#d4cdb0');
    if(event.presentation==='memorial'){
      P.block(t,116,20,65,30,14,'#706b83');t.line(113,9,169,37,'#dfc36e');t.paste(prop(event),70,53);P.tree(t,37,70);P.tree(t,163,85);t.line(24,90,50,103,'#8b765c',3);
    }else if(event.presentation==='shot'){
      t.polygon([[36,72],[106,37],[176,72],[106,107]],event.teamId==='bulls'?'#a65c60':'#80678e');for(const [a,b,c,d]of [[36,72,106,37],[106,37,176,72],[176,72,106,107],[106,107,36,72],[71,55,141,90]])t.line(a,b,c,d,'#dfd4b7');t.ellipse(106,72,14,7,'#dfd4b7');t.ellipse(106,72,12,5,event.teamId==='bulls'?'#a65c60':'#80678e');t.paste(prop(event),112,39);P.block(t,25,26,37,14,22,'#976e65');for(let i=0;i<4;i++)t.rect(18+i*9,21+i*4,3,7,'#d7d3b1');
    }else if(event.presentation==='scoreboard'){
      P.block(t,106,27,69,35,24,'#4c6d9c');t.ellipse(113,16,49,17,'#d7b96f');t.ellipse(111,12,45,16,'#4f82a0');t.paste(prop(event),48,59);t.line(133,56,154,66,'#e0d8bc',4);t.rect(128,41,17,15,'#8eb0b9');
    }else{
      for(let i=0;i<3;i++){P.block(t,30+i*52,24,37,19,23+i*6,i%2?'#8c776b':'#987b68');for(let j=0;j<3;j++)t.rect(15+i*52+j*7,15+j*3,3,6,'#d5cfaa');}t.paste(prop(event),76,64);t.line(35,98,61,111,'#d5ceb2',3);
    }
    return t;
  }
  function svg(event,point=false){const tile=point?prop(event):scene(event);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tile.width} ${tile.height}" shape-rendering="crispEdges" role="img"><title>${esc(event.point)}・原創像素${point?'場景物件':'場景，非歷史影像'}</title>${tile.markup()}</svg>`;}
  return {prop,scene,svg};
});
