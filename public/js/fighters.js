export const fighters = {
  volt:{name:'VOLT',title:'THE STORM RUNNER',color:'#b5ff46',dark:'#43612b',speed:4,power:3},
  ember:{name:'EMBER',title:'BORN FROM THE FIRE',color:'#ff7448',dark:'#713c38',speed:3,power:5},
  ghost:{name:'GHOST',title:'NOW YOU SEE ME',color:'#ad8aff',dark:'#493965',speed:5,power:2}
};
function polygon(ctx,points,fill,stroke='#111623',width=2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function limb(ctx,start,joint,end,width,color,accent){
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#090e19';ctx.lineWidth=width+6;ctx.beginPath();ctx.moveTo(...start);ctx.lineTo(...joint);ctx.lineTo(...end);ctx.stroke();
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(start[0]-3,start[1]);ctx.lineTo(joint[0]-3,joint[1]);ctx.stroke();
  ctx.fillStyle='#394051';ctx.beginPath();ctx.arc(...joint,width*.52,0,7);ctx.fill();
}
export function drawFighter(ctx,f,time,scale=1,portrait=false){
  const def=fighters[f.kind]||fighters.volt;
  const grounded=f.y>=534;const walking=f.action==='walk'&&grounded;const stride=walking?Math.sin(time*17):Math.sin(time*2.4)*.08;
  const bob=grounded?Math.sin(time*3.5)*2:0;const action=f.action;let lean=0,frontHand=[53,-110],frontElbow=[32,-130],backHand=[8,-126],backElbow=[-26,-111],frontFoot=[37,0],frontKnee=[20,-43],backFoot=[-34,-1],backKnee=[-25,-40];
  if(walking){frontFoot=[30+stride*23,0];backFoot=[-30-stride*23,0];frontKnee=[17+stride*12,-45];backKnee=[-18-stride*12,-44];frontHand=[45-stride*13,-112];backHand=[4+stride*13,-125];lean=5;}
  if(!grounded){frontFoot=[34,-24];frontKnee=[45,-61];backFoot=[-29,-35];backKnee=[-34,-68];lean=-8;}
  if(action==='punch'){const p=Math.sin(Math.min(1,f.action_time/.32)*Math.PI);frontHand=[53+p*57,-122];frontElbow=[36+p*35,-126];lean=p*12;}
  if(action==='kick'){const p=Math.sin(Math.min(1,f.action_time/.51)*Math.PI);frontFoot=[37+p*101,-p*105];frontKnee=[20+p*58,-43-p*51];frontHand=[30,-130];lean=-p*14;}
  if(action==='special'){frontHand=[70,-104];frontElbow=[37,-110];backHand=[57,-127];backElbow=[-5,-127];lean=9;}
  if(action==='block'){frontHand=[30,-151];frontElbow=[43,-120];backHand=[17,-156];backElbow=[-10,-118];lean=-8;}
  if(action==='hurt'){frontHand=[52,-88];backHand=[-24,-104];lean=-17;}
  ctx.save();ctx.translate(f.x,f.y);ctx.scale(scale,scale);if(!portrait){ctx.fillStyle='#03071099';ctx.beginPath();ctx.ellipse(0,535-f.y,54,11,0,0,7);ctx.fill();ctx.save();ctx.globalAlpha=.12;ctx.fillStyle=def.color;ctx.beginPath();ctx.ellipse(0,536-f.y,45,5,0,0,7);ctx.fill();ctx.restore();}
  ctx.scale(f.facing||1,1);ctx.translate(0,bob);if(action==='ko'){ctx.translate(-30,-17);ctx.rotate(-1.37);}
  ctx.save();ctx.translate(lean*.5,0);
  limb(ctx,[-10,-82],backKnee,backFoot,19,'#202939',def.dark);
  polygon(ctx,[[backFoot[0]-14,backFoot[1]-9],[backFoot[0]+6,backFoot[1]-9],[backFoot[0]+17,backFoot[1]+1],[backFoot[0]-15,backFoot[1]+3]],'#1a2231');
  ctx.translate(lean,-2);
  limb(ctx,[-14,-143],backElbow,backHand,16,def.dark,def.color);
  polygon(ctx,[[backHand[0]-10,backHand[1]-9],[backHand[0]+9,backHand[1]-8],[backHand[0]+12,backHand[1]+5],[backHand[0]-8,backHand[1]+9]],'#2b3342');
  polygon(ctx,[[-24,-153],[10,-157],[28,-139],[21,-103],[14,-84],[-17,-84],[-28,-114]],'#222b3b');
  polygon(ctx,[[-23,-149],[-9,-147],[-4,-121],[-15,-96],[-23,-110]],def.dark,null);
  polygon(ctx,[[-10,-148],[11,-152],[21,-136],[16,-122],[-3,-121]],'#354155');
  polygon(ctx,[[-16,-141],[-3,-136],[12,-143],[18,-136],[-2,-128]],def.color,null);
  ctx.fillStyle=def.color;ctx.fillRect(-17,-99,35,5);ctx.fillStyle='#b5c2cf';ctx.fillRect(-3,-100,9,7);
  if(f.kind==='ghost'){polygon(ctx,[[-21,-148],[-34,-132],[-35,-77],[-13,-96]],'#493965');ctx.strokeStyle=def.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-29,-137);ctx.lineTo(-30,-91);ctx.stroke();}
  ctx.restore();
  limb(ctx,[9,-86],frontKnee,frontFoot,21,'#293345',def.color);
  polygon(ctx,[[frontFoot[0]-10,frontFoot[1]-13],[frontFoot[0]+10,frontFoot[1]-11],[frontFoot[0]+23,frontFoot[1]-1],[frontFoot[0]+21,frontFoot[1]+5],[frontFoot[0]-13,frontFoot[1]+5]],'#253046');ctx.fillStyle=def.color;ctx.fillRect(frontFoot[0]-9,frontFoot[1]+1,30,3);
  ctx.translate(lean,-2);
  ctx.fillStyle='#aa8d81';ctx.fillRect(-7,-168,17,18);
  polygon(ctx,[[-21,-190],[-10,-204],[12,-202],[24,-187],[21,-168],[12,-156],[-6,-157],[-17,-169]],'#263144');
  polygon(ctx,[[-17,-187],[-7,-196],[13,-196],[19,-181],[14,-167],[-5,-166],[-14,-175]],'#ba998b');
  polygon(ctx,[[-14,-184],[19,-184],[21,-173],[15,-161],[-5,-161],[-15,-174]],'#17202e');
  ctx.save();ctx.shadowColor=def.color;ctx.shadowBlur=10;ctx.fillStyle=def.color;ctx.fillRect(1,-183,19,4);ctx.restore();
  polygon(ctx,[[-22,-189],[-16,-205],[-3,-214],[15,-208],[22,-194],[5,-198],[-5,-190]],f.kind==='ember'?'#733f35':f.kind==='ghost'?'#686081':'#c2c9bc');
  if(f.kind==='volt'){polygon(ctx,[[-17,-203],[-14,-222],[-6,-213],[0,-226],[7,-213],[17,-217],[14,-202]],'#d6e2c7');}
  if(f.kind==='ember'){polygon(ctx,[[-21,-200],[-22,-219],[-10,-210],[-8,-228],[3,-215],[17,-218],[22,-197]],'#d9784c');}
  if(f.kind==='ghost'){polygon(ctx,[[-26,-188],[-27,-206],[-11,-221],[10,-219],[26,-204],[27,-181],[14,-189],[5,-204],[-11,-200]],'#484560');}
  limb(ctx,[18,-143],frontElbow,frontHand,18,'#394659',def.color);
  polygon(ctx,[[frontHand[0]-10,frontHand[1]-11],[frontHand[0]+10,frontHand[1]-11],[frontHand[0]+14,frontHand[1]-2],[frontHand[0]+9,frontHand[1]+10],[frontHand[0]-10,frontHand[1]+9]],def.dark);
  ctx.fillStyle=def.color;ctx.fillRect(frontHand[0]-9,frontHand[1]-10,19,4);
  if(action==='special'){ctx.save();ctx.globalAlpha=.5+Math.sin(time*30)*.2;ctx.shadowColor=def.color;ctx.shadowBlur=22;ctx.fillStyle=def.color;ctx.beginPath();ctx.arc(79,-107,15+Math.sin(time*20)*4,0,7);ctx.fill();ctx.restore();}
  if(action==='block'){ctx.save();ctx.strokeStyle=def.color;ctx.globalAlpha=.6;ctx.lineWidth=2;ctx.shadowColor=def.color;ctx.shadowBlur=8;ctx.beginPath();ctx.ellipse(46,-117,14,54,0,-1.4,1.4);ctx.stroke();ctx.restore();}
  ctx.restore();
}
export function drawPortrait(canvas,kind){const ctx=canvas.getContext('2d');canvas.width=220;canvas.height=180;ctx.clearRect(0,0,220,180);const def=fighters[kind];const g=ctx.createRadialGradient(110,105,5,110,105,120);g.addColorStop(0,def.color+'25');g.addColorStop(1,def.color+'00');ctx.fillStyle=g;ctx.fillRect(0,0,220,180);ctx.save();ctx.globalAlpha=.12;ctx.fillStyle=def.color;ctx.font='900 130px sans-serif';ctx.fillText(def.name[0],5,165);ctx.restore();drawFighter(ctx,{kind,x:112,y:222,facing:1,action:'idle',action_time:0},0,.97,true);}
