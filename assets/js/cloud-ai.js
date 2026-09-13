const $=s=>document.querySelector(s);

const LLM_DEFAULTS={openai:"gpt-5.6-luna",gemini:"gemini-3.8-flash"};
const TTS_MODELS={
  openai:["gpt-4o-mini-tts","tts-1-hd","tts-1"],
  gemini:["gemini-3.1-flash-tts-preview","gemini-2.5-flash-preview-tts","gemini-2.5-pro-preview-tts"]
};
const TTS_VOICES={
  openai:["marin","coral","nova","shimmer","alloy","ash","ballad","cedar","echo","fable","onyx","sage","verse"],
  gemini:["Achernar","Achird","Algenib","Algieba","Alnilam","Aoede","Autonoe","Callirrhoe","Charon","Despina","Enceladus","Erinome","Fenrir","Gacrux","Iapetus","Kore","Laomedeia","Leda","Orus","Puck","Pulcherrima","Rasalgethi","Sadachbia","Sadaltager","Schedar","Sulafat","Umbriel","Vindemiatrix","Zephyr","Zubenelgenubi"]
};
const TTS_DEFAULTS={
  openai:{model:"gpt-4o-mini-tts",voice:"marin",style:"Parle en français avec une voix douce, chaleureuse, très claire et naturelle, adaptée à un enfant de maternelle. Prononce soigneusement chaque mot et chaque nombre."},
  gemini:{model:"gemini-3.1-flash-tts-preview",voice:"Achernar",style:"Parle en français avec une voix douce, chaleureuse, très claire et naturelle, adaptée à un enfant de maternelle. Prononce soigneusement chaque mot et chaque nombre."}
};

function getMode(){return localStorage.getItem("lilaApiMode")||"relay";}
function getRelayUrl(){return localStorage.getItem("lilaApiRelayUrl")||"";}
function getRelayToken(){return sessionStorage.getItem("lilaApiRelayToken")||"";}
function getApiKey(provider){return sessionStorage.getItem(`lilaApiKey:${provider}`)||"";}
function getLlmProvider(){
  const value=localStorage.getItem("lilaLlmProvider")||"none";
  return ["openai","gemini"].includes(value)?value:"none";
}
function getLlmModel(provider){return localStorage.getItem(`lilaLlmModel:${provider}`)||LLM_DEFAULTS[provider]||"";}
function getTtsConfig(provider){
  const defaults=TTS_DEFAULTS[provider];
  return {
    model:localStorage.getItem(`lilaTtsModel:${provider}`)||defaults?.model||"",
    voice:localStorage.getItem(`lilaTtsVoice:${provider}`)||defaults?.voice||"",
    style:localStorage.getItem(`lilaTtsStyle:${provider}`)||defaults?.style||""
  };
}

function headersForRelay(){
  const headers={"Content-Type":"application/json"};
  const token=getRelayToken();if(token)headers.Authorization=`Bearer ${token}`;
  return headers;
}

async function relayRequest(payload,{audio=false}={}){
  const url=getRelayUrl();
  if(!url)throw new Error("Adresse du relais manquante.");
  const r=await fetch(url,{method:"POST",headers:headersForRelay(),body:JSON.stringify(payload),mode:"cors",cache:"no-store"});
  if(!r.ok)throw new Error(`Relais HTTP ${r.status}`);
  return audio?r.blob():r.json();
}

function extractOpenAiText(data){
  if(typeof data?.output_text==="string")return data.output_text;
  return (data?.output||[]).flatMap(item=>item.content||[]).filter(x=>x.type==="output_text").map(x=>x.text||"").join("\n").trim();
}
function extractGeminiText(data){
  if(typeof data?.output_text==="string")return data.output_text;
  if(typeof data?.text==="string")return data.text;
  return (data?.steps||[]).filter(s=>s.type==="model_output").flatMap(s=>s.content||[]).filter(x=>x.type==="text").map(x=>x.text||"").join("\n").trim();
}

async function generateDirect(provider,input,model){
  const key=getApiKey(provider);if(!key)throw new Error(`Clé API ${provider==="openai"?"OpenAI":"Gemini"} manquante.`);
  if(provider==="openai"){
    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
      body:JSON.stringify({model,input,store:false})
    });
    if(!r.ok){let msg="";try{msg=(await r.json())?.error?.message||"";}catch{}throw new Error(msg||`OpenAI HTTP ${r.status}`);}
    return extractOpenAiText(await r.json());
  }
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{
    method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({model,input})
  });
  if(!r.ok){let msg="";try{msg=(await r.json())?.error?.message||"";}catch{}throw new Error(msg||`Gemini HTTP ${r.status}`);}
  return extractGeminiText(await r.json());
}

async function generate(input,{provider=getLlmProvider(),model=getLlmModel(provider)}={}){
  if(provider==="none")throw new Error("Aucun LLM sélectionné.");
  if(getMode()==="relay"){
    const data=await relayRequest({kind:"llm",provider,model,input});
    return data.text||data.output_text||data.output||"";
  }
  return generateDirect(provider,input,model);
}

function decodeBase64(value){
  const binary=atob(value),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}
function pcm16ToWav(pcm,sampleRate=24000){
  const buffer=new ArrayBuffer(44+pcm.length),view=new DataView(buffer),out=new Uint8Array(buffer);
  const text=(offset,value)=>{for(let i=0;i<value.length;i++)out[offset+i]=value.charCodeAt(i);};
  text(0,"RIFF");view.setUint32(4,36+pcm.length,true);text(8,"WAVE");text(12,"fmt ");view.setUint32(16,16,true);
  view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);
  view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,"data");view.setUint32(40,pcm.length,true);out.set(pcm,44);
  return new Blob([buffer],{type:"audio/wav"});
}
function findGeminiAudio(data){
  const direct=data?.output_audio?.data||data?.outputAudio?.data;
  if(direct)return direct;
  for(const step of data?.steps||[]){
    for(const content of step?.content||[]){
      if(content?.type==="audio"&&content?.data)return content.data;
    }
  }
  return "";
}

async function synthesizeDirect(provider,text,config){
  const key=getApiKey(provider);if(!key)throw new Error(`Clé API ${provider==="openai"?"OpenAI":"Gemini"} manquante.`);
  if(provider==="openai"){
    const body={model:config.model,input:text,voice:config.voice,response_format:"mp3",speed:0.92};
    if(config.model.startsWith("gpt-4o")&&config.style)body.instructions=config.style;
    const r=await fetch("https://api.openai.com/v1/audio/speech",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},body:JSON.stringify(body)
    });
    if(!r.ok){let msg="";try{msg=(await r.json())?.error?.message||"";}catch{}throw new Error(msg||`OpenAI TTS HTTP ${r.status}`);}
    return r.blob();
  }

  const prompt=config.style?`${config.style}\n\nLis exactement ce texte : ${text}`:text;
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{
    method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},
    body:JSON.stringify({model:config.model,input:prompt,response_format:{type:"audio"},generation_config:{speech_config:[{voice:config.voice}]}})
  });
  if(!r.ok){let msg="";try{msg=(await r.json())?.error?.message||"";}catch{}throw new Error(msg||`Gemini TTS HTTP ${r.status}`);}
  const data=await r.json(),audio=findGeminiAudio(data);
  if(!audio)throw new Error("Gemini n’a renvoyé aucun audio.");
  return pcm16ToWav(decodeBase64(audio));
}

async function synthesize(provider,text){
  if(!["openai","gemini"].includes(provider))throw new Error("Moteur vocal cloud inconnu.");
  const config=getTtsConfig(provider);
  if(getMode()==="relay")return relayRequest({kind:"tts",provider,text,...config},{audio:true});
  return synthesizeDirect(provider,text,config);
}

async function playBlob(blob){
  const url=URL.createObjectURL(blob),audio=new Audio(url);
  try{await audio.play();await new Promise((resolve,reject)=>{audio.onended=resolve;audio.onerror=reject;});}
  finally{URL.revokeObjectURL(url);}
}

function status(id,text,kind=""){
  const el=$(id);if(!el)return;el.textContent=text;el.className=`apiStatus ${kind}`.trim();
}
function fillSelect(select,values,current){
  select.innerHTML="";values.forEach(value=>{const o=document.createElement("option");o.value=value;o.textContent=value;select.appendChild(o);});
  select.value=values.includes(current)?current:values[0];
}

function refreshConnectionUi(){
  const mode=$("#apiConnectionMode").value;
  localStorage.setItem("lilaApiMode",mode);
  $("#apiRelaySettings").hidden=mode!=="relay";
  $("#apiDirectSettings").hidden=mode!=="direct";
}
function saveConnectionUi(){
  localStorage.setItem("lilaApiRelayUrl",$("#apiRelayUrl").value.trim());
  sessionStorage.setItem("lilaApiRelayToken",$("#apiRelayToken").value.trim());
  sessionStorage.setItem("lilaApiKey:openai",$("#openaiApiKey").value.trim());
  sessionStorage.setItem("lilaApiKey:gemini",$("#geminiApiKey").value.trim());
}
function refreshLlmUi(){
  const provider=$("#llmProviderSelect").value;
  localStorage.setItem("lilaLlmProvider",provider);
  const field=$("#llmModelInput");
  field.disabled=provider==="none";
  field.value=provider==="none"?"":getLlmModel(provider);
}
function saveLlmUi(){
  const provider=$("#llmProviderSelect").value;
  if(provider!=="none")localStorage.setItem(`lilaLlmModel:${provider}`,$("#llmModelInput").value.trim()||LLM_DEFAULTS[provider]);
}
function refreshVoiceUi(){
  const provider=$("#voiceProviderSelect").value;
  const cloud=["openai","gemini"].includes(provider);
  $("#cloudVoiceSettings").hidden=!cloud;
  if(!cloud)return;
  const config=getTtsConfig(provider);
  fillSelect($("#cloudVoiceModelSelect"),TTS_MODELS[provider],config.model);
  fillSelect($("#cloudVoiceNameSelect"),TTS_VOICES[provider],config.voice);
  $("#cloudVoiceStyleInput").value=config.style;
  status("#cloudVoiceStatus","");
}
function saveVoiceUi(){
  const provider=$("#voiceProviderSelect").value;if(!["openai","gemini"].includes(provider))return;
  localStorage.setItem(`lilaTtsModel:${provider}`,$("#cloudVoiceModelSelect").value);
  localStorage.setItem(`lilaTtsVoice:${provider}`,$("#cloudVoiceNameSelect").value);
  localStorage.setItem(`lilaTtsStyle:${provider}`,$("#cloudVoiceStyleInput").value.trim());
}

async function testProvider(provider){
  saveConnectionUi();
  if(getMode()==="relay"){
    const data=await relayRequest({kind:"llm",provider,model:getLlmModel(provider),input:"Réponds uniquement par OK.",test:true});
    return data.text||data.output_text||data.output||"OK";
  }
  return generateDirect(provider,"Réponds uniquement par OK.",getLlmModel(provider));
}

window.LilaCloud={generate,synthesize,getMode,getApiKey,getRelayUrl,getTtsConfig};

window.addEventListener("DOMContentLoaded",()=>{
  const mode=$("#apiConnectionMode");
  mode.value=getMode();
  $("#apiRelayUrl").value=getRelayUrl();
  $("#apiRelayToken").value=getRelayToken();
  $("#openaiApiKey").value=getApiKey("openai");
  $("#geminiApiKey").value=getApiKey("gemini");
  mode.addEventListener("change",refreshConnectionUi);
  ["#apiRelayUrl","#apiRelayToken","#openaiApiKey","#geminiApiKey"].forEach(id=>$(id).addEventListener("input",saveConnectionUi));
  refreshConnectionUi();

  const llm=$("#llmProviderSelect");llm.value=getLlmProvider();refreshLlmUi();
  llm.addEventListener("change",refreshLlmUi);$("#llmModelInput").addEventListener("change",saveLlmUi);

  for(const provider of ["openai","gemini"]){
    $(provider==="openai"?"#testOpenaiBtn":"#testGeminiBtn").addEventListener("click",async event=>{
      saveConnectionUi();event.currentTarget.disabled=true;status("#apiStatus",`Test ${provider==="openai"?"OpenAI":"Gemini"}…`);
      try{await testProvider(provider);status("#apiStatus",`✅ ${provider==="openai"?"OpenAI":"Gemini"} est connecté.`,"ok");}
      catch(e){console.warn(e);status("#apiStatus",`❌ ${e.message||"Connexion impossible."}`,"error");}
      finally{event.currentTarget.disabled=false;}
    });
  }

  $("#voiceProviderSelect").addEventListener("change",refreshVoiceUi);
  ["#cloudVoiceModelSelect","#cloudVoiceNameSelect","#cloudVoiceStyleInput"].forEach(id=>$(id).addEventListener("change",saveVoiceUi));
  $("#testCloudVoiceBtn").addEventListener("click",async event=>{
    const provider=$("#voiceProviderSelect").value;saveConnectionUi();saveVoiceUi();event.currentTarget.disabled=true;status("#cloudVoiceStatus","Génération de la voix…");
    try{const blob=await synthesize(provider,"Bonjour ! Je suis Lila. On apprend ensemble ?");await playBlob(blob);status("#cloudVoiceStatus","✅ La voix fonctionne.","ok");}
    catch(e){console.warn(e);status("#cloudVoiceStatus",`❌ ${e.message||"Voix indisponible."}`,"error");}
    finally{event.currentTarget.disabled=false;}
  });
  refreshVoiceUi();
});
