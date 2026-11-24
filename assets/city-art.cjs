/* 原創城市印象圖塊，非實際建築模型或商標。共用 2:1 像素投影。 */
'use strict';
const P=require('./pixel-core.js'),A=require('./archipelago-core.js');
function city(teamId,night=false){
  const spec=A.CITY_SCENES[teamId];if(!spec)throw new RangeError('Unknown city');
  const t=new P.Tile(55,45),light=night?'#ffdfa2':'#9bb6bd',stone='#b9b9a0',dark='#465f6b';
  t.ellipse(29,39,24,5,'#36585c');t.polygon([[2,32],[27,20],[53,33],[29,44]],'#a5b49e');
  const window=(x,y)=>t.rect(x,y,3,4,light),block=(x,y,w,d,h,c)=>P.block(t,x,y,w,d,h,c);
  switch(spec[0]){
    case 'brownstone':
      for(let i=0;i<3;i++){block(9+i*12,25+i*3,11,9,18+i%2*5,'#a87e68');window(5+i*12,18+i*3);window(10+i*12,21+i*3);t.line(4+i*12,33+i*2,12+i*12,37+i*2,'#d9c2a0',2);}t.rect(38,5,8,9,'#6b7d7d');t.polygon([[36,5],[42,1],[48,5]],dark);t.line(39,14,38,22,dark);t.line(45,14,47,20,dark);break;
    case 'steel-river':
      t.polygon([[0,32],[20,23],[55,39],[37,45]],'#5d9ba5');t.line(6,29,42,33,'#b5b9a3',3);t.line(8,28,20,15,dark);t.line(20,15,33,30,dark);t.line(20,15,42,31,dark);block(29,16,14,10,10,'#a7826b');t.rect(30,4,3,13,'#927261');t.rect(38,7,4,13,'#897161');window(28,17);break;
    case 'salt-peaks':
      t.polygon([[0,27],[13,3],[25,23],[35,0],[54,30]],'#7a8f93');t.polygon([[5,18],[13,3],[18,13],[13,11],[10,17]],'#e1e3d3');t.polygon([[27,16],[35,0],[44,16],[36,12],[32,15]],'#e7e7d7');t.ellipse(27,33,21,6,'#90bfc0');t.line(7,32,41,39,'#d1d2b2',2);break;
    case 'space-plaza':
      t.polygon([[13,31],[27,5],[39,32]],'#dae0cc');t.polygon([[27,5],[39,32],[27,37]],'#9aada9');t.rect(23,15,7,5,dark);t.polygon([[13,31],[8,37],[19,33]],'#a78a75');t.polygon([[34,29],[43,37],[30,34]],'#a78a75');t.line(37,10,37,29,'#708591');t.rect(36,9,10,5,light);t.ellipse(27,39,13,3,'#c2b999');break;
    case 'rose-bridge':
      t.line(3,26,49,36,dark,3);for(let x=5;x<50;x+=11){t.line(x,25,x,15,stone);t.line(x,15,x+10,28,stone);}for(let i=0;i<6;i++){const x=8+i*7,y=35+i%2*3;t.line(x,y,x,y+4,'#567c66');t.rect(x-1,y-2,3,3,i%2?'#b98089':'#d7a5a0');}break;
    case 'river-clock':
      t.ellipse(26,37,23,6,'#6aa2a8');block(27,15,12,10,19,'#b7a07d');t.rect(25,5,6,6,'#dfd3a9');t.line(28,5,28,8,dark);t.line(28,8,31,8,dark);t.polygon([[4,32],[20,29],[28,33],[13,39]],'#d6c9a0');t.rect(12,26,6,5,'#f1dbb3');break;
    case 'blues-street':
      block(18,23,24,14,15,'#a17b6a');t.polygon([[4,27],[28,39],[38,33],[14,21]],'#687f98');t.rect(28,9,2,10,light);t.line(28,9,35,7,light,2);t.rect(34,8,2,9,light);t.ellipse(26,20,3,2,light);t.ellipse(33,18,3,2,light);window(10,16);break;
    case 'french-balcony':
      block(19,18,27,16,16,'#bda683');for(let i=0;i<4;i++){window(8+i*7,12+i*3);t.line(6+i*7,23+i*3,6+i*7,28+i*3,dark);}t.line(5,25,32,38,dark);t.line(5,22,32,35,dark);t.polygon([[5,36],[23,34],[34,39],[16,43]],'#dfc9a2');break;
    case 'motor-works':
      block(18,24,29,16,12,'#927e71');t.rect(10,17,16,8,dark);for(let i=0;i<8;i++){const angle=i*Math.PI/4;t.rect(35+Math.cos(angle)*8,16+Math.sin(angle)*8,3,3,'#b8bbae');}t.ellipse(36,17,6,6,'#b8bbae');t.ellipse(36,17,3,3,dark);t.rect(12,5,4,13,'#8a7164');window(22,26);break;
    case 'speedway':
      t.ellipse(27,29,23,10,dark);t.ellipse(27,29,16,6,'#9dad8e');t.line(13,11,13,30,stone);t.line(39,17,39,35,stone);for(let i=0;i<3;i++)for(let j=0;j<3;j++)t.rect(14+i*3,10+j*3,3,3,(i+j)%2?'#d9dbc8':dark);t.rect(40,17,9,8,'#c7cdb8');t.line(7,30,47,30,'#e1cca1');break;
    case 'monument-walk':
      t.polygon([[22,34],[25,4],[28,1],[31,6],[34,34]],'#d8d4b8');t.polygon([[28,1],[31,6],[34,34],[28,37]],'#a8b1a2');for(let i=0;i<3;i++)t.line(9+i*4,35+i*2,37+i*4,22+i*2,'#d8d1ae',2);P.tree(t,8,26);break;
    case 'rail-brick':
      block(16,23,30,16,15,'#ae806b');t.ellipse(24,23,7,9,dark);t.rect(17,24,14,8,dark);t.line(0,34,42,44,'#627c7e',2);t.line(7,31,50,41,'#8fa19a',2);for(let i=0;i<6;i++)t.line(2+i*8,35+i,7+i*8,31+i,'#bca98c');window(37,26);break;
    case 'crown-pavilion':
      block(25,22,24,18,12,'#8aa1a4');t.polygon([[7,17],[10,5],[20,13],[27,1],[35,13],[47,7],[45,24],[26,33]],'#b5b89e');t.line(15,21,37,30,dark,2);block(10,9,8,7,15,'#6e8b98');window(6,5);break;
    case 'palm-lake':
      t.ellipse(28,35,25,8,'#76adb1');block(25,20,11,10,17,'#b6b5a2');t.polygon([[15,9],[25,0],[34,9]],'#8296b0');for(const x of [7,45]){t.line(x,36,x,17,'#9b8d6a',2);t.line(x,17,x-7,13,'#7d9f7d',2);t.line(x,17,x+6,12,'#7d9f7d',2);}window(22,14);break;
    default:throw new RangeError('Unknown scene model');
  }
  if(night){t.ellipse(43,37,5,2,'#b9b491');t.rect(43,27,1,9,dark);t.rect(42,26,3,1,light);}return t;
}
module.exports={city};
