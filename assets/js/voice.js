export class VoiceService{
  constructor(){
    this.lastText="";this.sound=true;this.autoSpeak=true;this.provider="browser";this.piperEndpoint="";
    this.currentResolve=null;this.currentAudio=null;
  }
  configure({sound,autoSpeak,piperEndpoint}={}){
    if(typeof sound==="boolean")this.sound=sound;
    if(typeof autoSpeak==="boolean")this.autoSpeak=autoSpeak;
    if(typeof piperEndpoint==="string")this.piperEndpoint=piperEndpoint;
  }
  async speak(text,{force=false,lang="fr-FR"}={}){
    this.lastText=text;
    if(!this.sound||(!force&&!this.autoSpeak))return false;
    this.cancel();
    if(this.provider==="piper"&&this.piperEndpoint){
      try{return await this.#speakPiper(text);}catch(e){console.warn("Piper indisponible, voix locale utilisée",e);}
    }
    return await this.#speakBrowser(text,lang);
  }
  repeat(){return this.speak(this.lastText,{force:true});}
  cancel(){
    if("speechSynthesis" in window)window.speechSynthesis.cancel();
    if(this.currentAudio){try{this.currentAudio.pause();}catch{}this.currentAudio=null;}
    if(this.currentResolve){const resolve=this.currentResolve;this.currentResolve=null;resolve(false);}
  }
  #speakBrowser(text,lang){
    if(!("speechSynthesis" in window))return Promise.resolve(false);
    return new Promise(resolve=>{
      let settled=false;
      const finish=ok=>{if(settled)return;settled=true;if(this.currentResolve===finish)this.currentResolve=null;resolve(ok);};
      this.currentResolve=finish;
      const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=.84;u.pitch=1.04;u.volume=1;
      const voices=window.speechSynthesis.getVoices();
      const v=voices.find(x=>x.lang===lang)||voices.find(x=>x.lang?.startsWith(lang.slice(0,2)));
      if(v)u.voice=v;
      u.onend=()=>finish(true);u.onerror=()=>finish(false);
      window.speechSynthesis.speak(u);
    });
  }
  async #speakPiper(text){
    const r=await fetch(this.piperEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
    if(!r.ok)throw new Error(`Piper HTTP ${r.status}`);
    const blob=await r.blob();const url=URL.createObjectURL(blob);const audio=new Audio(url);this.currentAudio=audio;
    return await new Promise(async resolve=>{
      let settled=false;
      const finish=ok=>{if(settled)return;settled=true;if(this.currentAudio===audio)this.currentAudio=null;if(this.currentResolve===finish)this.currentResolve=null;URL.revokeObjectURL(url);resolve(ok);};
      this.currentResolve=finish;audio.addEventListener("ended",()=>finish(true),{once:true});audio.addEventListener("error",()=>finish(false),{once:true});
      try{await audio.play();}catch(e){finish(false);throw e;}
    });
  }
}
