export class VoiceService{
  constructor(){
    this.lastText="";
    this.sound=true;
    this.autoSpeak=true;
    this.provider="browser";
    this.piperEndpoint="";
    this.piperToken="";
    this.piperVoice="";
    this.piperSpeaker="";
    this.piperLengthScale=1.06;
    this.currentResolve=null;
    this.currentAudio=null;
    this.currentController=null;
  }

  configure({sound,autoSpeak,provider,piperEndpoint,piperToken,piperVoice,piperSpeaker,piperLengthScale}={}){
    if(typeof sound==="boolean")this.sound=sound;
    if(typeof autoSpeak==="boolean")this.autoSpeak=autoSpeak;
    if(provider==="browser"||provider==="piper")this.provider=provider;
    if(typeof piperEndpoint==="string")this.piperEndpoint=piperEndpoint.trim();
    if(typeof piperToken==="string")this.piperToken=piperToken.trim();
    if(typeof piperVoice==="string")this.piperVoice=piperVoice.trim();
    if(typeof piperSpeaker==="string")this.piperSpeaker=piperSpeaker.trim();
    if(Number.isFinite(Number(piperLengthScale)))this.piperLengthScale=Math.max(.7,Math.min(1.6,Number(piperLengthScale)));
  }

  async speak(text,{force=false,lang="fr-FR"}={}){
    this.lastText=text;
    if(!this.sound||(!force&&!this.autoSpeak))return false;
    this.cancel();

    if(this.provider==="piper"&&this.piperEndpoint){
      try{return await this.#speakPiper(text);}
      catch(e){
        if(e?.name==="AbortError")return false;
        console.warn("Piper indisponible, voix locale utilisée",e);
      }
    }
    return await this.#speakBrowser(text,lang);
  }

  repeat(){return this.speak(this.lastText,{force:true});}

  async testPiper(text="Bonjour ! Je suis Lila. La voix Piper fonctionne correctement."){
    this.cancel();
    return await this.#speakPiper(text);
  }

  cancel(){
    if("speechSynthesis" in window)window.speechSynthesis.cancel();
    if(this.currentController){try{this.currentController.abort();}catch{}this.currentController=null;}
    if(this.currentAudio){try{this.currentAudio.pause();}catch{}this.currentAudio=null;}
    if(this.currentResolve){const resolve=this.currentResolve;this.currentResolve=null;resolve(false);}
  }

  #speakBrowser(text,lang){
    if(!("speechSynthesis" in window))return Promise.resolve(false);
    return new Promise(resolve=>{
      let settled=false;
      const finish=ok=>{if(settled)return;settled=true;if(this.currentResolve===finish)this.currentResolve=null;resolve(ok);};
      this.currentResolve=finish;
      const u=new SpeechSynthesisUtterance(text);
      u.lang=lang;u.rate=.84;u.pitch=1.04;u.volume=1;
      const voices=window.speechSynthesis.getVoices();
      const langVoices=voices.filter(x=>x.lang===lang||x.lang?.startsWith(lang.slice(0,2)));
      const preferred=langVoices.find(x=>/premium|enhanced|audrey|am[eé]lie|thomas|aur[eé]lie/i.test(x.name));
      if(preferred||langVoices[0])u.voice=preferred||langVoices[0];
      u.onend=()=>finish(true);u.onerror=()=>finish(false);
      window.speechSynthesis.speak(u);
    });
  }

  #piperUrl(){
    const base=this.piperEndpoint.replace(/\/+$/g,"");
    return base.endsWith("/synthesize")?base:`${base}/synthesize`;
  }

  async #speakPiper(text){
    if(!this.piperEndpoint)throw new Error("Adresse Piper non configurée");

    const controller=new AbortController();
    this.currentController=controller;
    const payload={text,length_scale:this.piperLengthScale};
    if(this.piperVoice)payload.voice=this.piperVoice;
    if(this.piperSpeaker)payload.speaker=this.piperSpeaker;

    const headers={"Content-Type":"text/plain;charset=UTF-8"};
    if(this.piperToken)headers.Authorization=`Bearer ${this.piperToken}`;

    let r;
    try{
      r=await fetch(this.#piperUrl(),{
        method:"POST",headers,body:JSON.stringify(payload),signal:controller.signal,mode:"cors",cache:"no-store"
      });
    }finally{
      if(this.currentController===controller)this.currentController=null;
    }
    if(!r.ok)throw new Error(`Piper HTTP ${r.status}`);

    const blob=await r.blob();
    const url=URL.createObjectURL(blob);
    const audio=new Audio(url);this.currentAudio=audio;
    return await new Promise(async resolve=>{
      let settled=false;
      const finish=ok=>{
        if(settled)return;settled=true;
        if(this.currentAudio===audio)this.currentAudio=null;
        if(this.currentResolve===finish)this.currentResolve=null;
        URL.revokeObjectURL(url);resolve(ok);
      };
      this.currentResolve=finish;
      audio.addEventListener("ended",()=>finish(true),{once:true});
      audio.addEventListener("error",()=>finish(false),{once:true});
      try{await audio.play();}catch(e){finish(false);throw e;}
    });
  }
}
