export class VoiceService{
  constructor(){this.lastText="";this.sound=true;this.autoSpeak=true;this.provider="browser";this.piperEndpoint="";}
  configure({sound,autoSpeak,piperEndpoint}={}){
    if(typeof sound==="boolean")this.sound=sound;
    if(typeof autoSpeak==="boolean")this.autoSpeak=autoSpeak;
    if(typeof piperEndpoint==="string")this.piperEndpoint=piperEndpoint;
  }
  async speak(text,{force=false,lang="fr-FR"}={}){
    this.lastText=text;
    if(!this.sound||(!force&&!this.autoSpeak))return;
    // Piper est prévu comme fournisseur interchangeable. Pour GitHub Pages,
    // l'endpoint devra être en HTTPS (ou servi via le même domaine) sur iPad/Safari.
    if(this.provider==="piper"&&this.piperEndpoint){
      try{await this.#speakPiper(text);return;}catch(e){console.warn("Piper indisponible, voix locale utilisée",e);}
    }
    this.#speakBrowser(text,lang);
  }
  repeat(){return this.speak(this.lastText,{force:true});}
  cancel(){if("speechSynthesis" in window)window.speechSynthesis.cancel();}
  #speakBrowser(text,lang){
    if(!("speechSynthesis" in window))return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=.86;u.pitch=1.05;u.volume=1;
    const voices=window.speechSynthesis.getVoices();
    const v=voices.find(x=>x.lang===lang)||voices.find(x=>x.lang?.startsWith(lang.slice(0,2)));
    if(v)u.voice=v;
    window.speechSynthesis.speak(u);
  }
  async #speakPiper(text){
    const r=await fetch(this.piperEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
    if(!r.ok)throw new Error(`Piper HTTP ${r.status}`);
    const blob=await r.blob();const url=URL.createObjectURL(blob);const audio=new Audio(url);
    await audio.play();audio.addEventListener("ended",()=>URL.revokeObjectURL(url),{once:true});
  }
}
