export function setupTouch(input){
  const active=new Map();
  window.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){document.documentElement.classList.add('touch-device');if(input.enabled)document.querySelector('#touch-controls').hidden=false;}},{passive:true});
  function sync(){input.touch.clear();if(input.enabled)active.forEach(action=>input.touch.add(action));}
  document.querySelectorAll('[data-action]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{if(!input.enabled)return;event.preventDefault();button.setPointerCapture(event.pointerId);active.set(event.pointerId,button.dataset.action);button.classList.add('pressed');sync();});
    const release=event=>{active.delete(event.pointerId);if(![...active.values()].includes(button.dataset.action))button.classList.remove('pressed');sync();};
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,release);
    button.addEventListener('contextmenu',event=>event.preventDefault());
  });
  window.addEventListener('blur',()=>{active.clear();sync();document.querySelectorAll('[data-action]').forEach(b=>b.classList.remove('pressed'));});
}
