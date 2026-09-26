// Original 112 BPM synth pattern, generated in-browser without audio downloads.
export class Music {
  constructor(audio){this.audio=audio;this.timer=null;this.step=0;this.next=0;this.intense=false;}
  start(){if(this.timer||!this.audio.ctx||!this.audio.musicEnabled)return;this.step=0;this.next=this.audio.ctx.currentTime+.08;this.timer=setInterval(()=>this.schedule(),60);this.schedule();}
  stop(){if(this.timer)clearInterval(this.timer);this.timer=null;}
  schedule(){
    const a=this.audio;if(!a.ctx||!a.musicEnabled){this.stop();return;}if(a.ctx.state!=='running')return;
    const length=60/112/4;const bass=[55,55,65.41,55,49,49,65.41,73.42,43.65,43.65,55,65.41,49,49,73.42,65.41];
    let guard=0;while(this.next<a.ctx.currentTime+.17&&guard++<8){const delay=Math.max(0,this.next-a.ctx.currentTime),s=this.step%32;
      if(s%4===0){a.tone(125,.12,'sine',this.intense?.14:.08,32,delay);}
      if(s%8===4)a.noise(.085,this.intense?.055:.027,1000,delay);
      if(s%2===0)a.noise(.025,.016,6500,delay);
      if(s%2===0)a.tone(bass[(s/2)|0],length*1.5,'triangle',.065,null,delay);
      if(s%4===2){const notes=[220,261.63,329.63,293.66,196,261.63,220,293.66];a.tone(notes[(s/4)|0]*(this.intense?2:1),length*2.3,'sine',.035,null,delay);}
      this.step++;this.next+=length;
    }
    if(this.next<a.ctx.currentTime)this.next=a.ctx.currentTime+.05;
  }
}
