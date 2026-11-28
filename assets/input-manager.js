/* One pointer path for mouse, pen and touch; native click remains for keyboard/AT. */
(function(r){'use strict';
  function bindButton(button,action,{signal}={}){let pointerClick=false;button.addEventListener('pointerdown',e=>{if(e.button>0||button.disabled)return;e.preventDefault();pointerClick=true;button.setPointerCapture?.(e.pointerId);action(e);},{signal});button.addEventListener('pointerup',()=>{setTimeout(()=>pointerClick=false,0);},{signal});button.addEventListener('pointercancel',()=>{pointerClick=false;},{signal});button.addEventListener('click',e=>{if(pointerClick||e.detail>0)return;if(!button.disabled)action(e);},{signal});}
  function gestures(element,{pan,zoom,tap,hover,allowStart}={}){const points=new Map(),abort=new AbortController(),opts={signal:abort.signal};let distance=0,moved=false,first=null;
    const separation=()=>{const a=[...points.values()];return a.length>1?Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y):0;};
    element.addEventListener('pointerdown',e=>{if(e.button>0||allowStart&&!allowStart(e))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});element.setPointerCapture?.(e.pointerId);if(points.size===1){first={x:e.clientX,y:e.clientY,target:e.target};moved=false;}else{moved=true;distance=separation();}},opts);
    element.addEventListener('pointermove',e=>{const before=points.get(e.pointerId);if(!before){hover?.(e);return;}points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size>1){const next=separation();if(distance>0&&next>0)zoom?.(distance/next);distance=next;return;}if(first&&Math.hypot(e.clientX-first.x,e.clientY-first.y)>7)moved=true;if(moved)pan?.(e.clientX-before.x,e.clientY-before.y);},opts);
    function release(e,cancelled){const origin=first?.target,click=points.size===1&&!moved&&!cancelled&&points.has(e.pointerId);points.delete(e.pointerId);distance=separation();if(points.size===0){first=null;if(click)tap?.(e,origin);}else moved=true;}
    element.addEventListener('pointerup',e=>release(e,false),opts);element.addEventListener('pointercancel',e=>release(e,true),opts);element.addEventListener('lostpointercapture',e=>{points.delete(e.pointerId);distance=0;},opts);const clear=()=>{points.clear();distance=0;first=null;moved=false;};window.addEventListener('blur',clear,opts);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();},opts);
    return {clear,destroy(){abort.abort();clear();},get size(){return points.size;}};
  }
  r.NBAInput={bindButton,gestures};
})(globalThis);
