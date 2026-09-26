export class Particles {
  constructor(){this.items=[];this.shake=0;this.flash=0;this.reduced=false;}
  burst(event){
    if(this.reduced)return;
    const count=event.type==='block'?12:event.special?38:23;
    for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=80+Math.random()*300;this.items.push({x:event.x,y:event.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-70,life:.3+Math.random()*.3,max:.6,color:event.color||'#b5ff46',size:1+Math.random()*4});}
    this.shake=event.type==='block'?3:event.special?12:7;this.flash=event.special?.12:.05;
  }
  update(dt){this.shake=Math.max(0,this.shake-dt*35);this.flash=Math.max(0,this.flash-dt);this.items=this.items.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;return p.life>0;});}
  draw(ctx){ctx.save();ctx.globalCompositeOperation='lighter';for(const p of this.items){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size*2,p.size);}ctx.restore();if(this.flash){ctx.save();ctx.globalAlpha=this.flash;ctx.fillStyle='#f2edff';ctx.fillRect(0,0,1200,640);ctx.restore();}}
  offset(){return this.reduced?[0,0]:[(Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake];}
  clear(){this.items=[];this.shake=0;this.flash=0;}
}
export function drawProjectiles(ctx,bolts,time){for(const bolt of bolts){ctx.save();ctx.translate(bolt.x,bolt.y);ctx.scale(bolt.direction,1);ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(-65,0,20,0);g.addColorStop(0,bolt.color+'00');g.addColorStop(1,bolt.color+'cc');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-80,-3);ctx.lineTo(0,-14);ctx.lineTo(17,0);ctx.lineTo(0,14);ctx.lineTo(-80,3);ctx.closePath();ctx.fill();ctx.shadowColor=bolt.color;ctx.shadowBlur=25;ctx.fillStyle=bolt.color;ctx.beginPath();ctx.ellipse(0,0,18,11+Math.sin(time*40)*2,0,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(4,0,10,5,0,0,7);ctx.fill();ctx.restore();}}
