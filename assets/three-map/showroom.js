export function installShowroom(visuals,settings){
  const button=document.createElement('button');button.type='button';button.id='showroom-open';button.textContent='跑車與城市交通展示';settings.append(button);
  const dialog=document.createElement('dialog');dialog.id='showroom-dialog';dialog.className='showroom-dialog';dialog.setAttribute('aria-labelledby','showroom-title');
  const title=document.createElement('h2');title.id='showroom-title';title.textContent='海灣車庫 / 3D 展示';const intro=document.createElement('p');intro.textContent='七款跑車與兩款城市車輛。所有模型由本地 GLB 載入；勇士海灣有停車展示，灣岸與沙漠車道各有巡遊車流。';
  const close=document.createElement('button');close.id='showroom-close';close.type='button';close.textContent='回到原位置 ×';close.addEventListener('click',()=>dialog.close());const grid=document.createElement('div');grid.className='showroom-grid';dialog.append(close,title,intro,grid);document.body.append(dialog);
  let built=false;button.addEventListener('click',()=>{dialog.showModal();if(!built){built=true;for(const v of globalThis.NBAVehicles.MODELS){const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.alt=v.name+'的非像素 3D 模型';img.width=480;img.height=300;caption.textContent=v.name;figure.append(img,caption);grid.append(figure);visuals.image(img,'vehicle',v);}}close.focus();});
  return dialog;
}
