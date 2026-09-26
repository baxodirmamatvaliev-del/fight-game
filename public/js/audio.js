export class Audio {
  constructor(){this.ctx=null;this.master=null;this.volume=.65;this.muted=false;this.musicEnabled=true;this.music=null;}
  async unlock(){
    if(!this.ctx){const Constructor=window.AudioContext||window.webkitAudioContext;if(!Constructor)return;this.ctx=new Constructor();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:this.volume;this.master.connect(this.ctx.destination);}
    if(this.ctx.state==='suspended')await this.ctx.resume();
  }
  setVolume(value){this.volume=value;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:value,this.ctx.currentTime,.04);}
  setMuted(muted){this.muted=muted;this.setVolume(this.volume);}
  tone(frequency,duration=.1,type='sine',gain=.12,slide=null,when=0){
    if(!this.ctx)return;const t=this.ctx.currentTime+when;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(frequency,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+duration);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(gain,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.01);
  }
  noise(duration=.1,gain=.1,highpass=500,when=0){
    if(!this.ctx)return;const t=this.ctx.currentTime+when,buffer=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*duration),this.ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const n=this.ctx.createBufferSource(),g=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();filter.type='highpass';filter.frequency.value=highpass;n.buffer=buffer;g.gain.value=gain;n.connect(filter);filter.connect(g);g.connect(this.master);n.start(t);n.stop(t+duration);
  }
  play(type){
    if(type==='hit'){this.tone(115,.16,'sine',.3,32);this.noise(.11,.23,300);}
    if(type==='block'){this.tone(560,.09,'triangle',.13,150);this.noise(.055,.12,1800);}
    if(type==='special'){this.tone(160,.4,'sawtooth',.09,960);this.tone(80,.3,'sine',.16,300);this.noise(.3,.1,1200);}
    if(type==='fight'){this.tone(220,.17,'square',.07);this.tone(330,.22,'square',.07,null,.17);this.tone(440,.35,'square',.08,null,.35);}
    if(type==='ko'){this.tone(80,.65,'sine',.3,25);this.noise(.4,.2,100);}
    if(type==='victory'){[261.63,329.63,392,523.25].forEach((n,i)=>this.tone(n,.3,'triangle',.12,null,i*.13));}
    if(type==='select')this.tone(740,.06,'triangle',.08,980);
    if(type==='jump')this.tone(180,.12,'sine',.06,380);
  }
  suspendMusic(){this.music?.stop();}
}
