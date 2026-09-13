const $=selector=>document.querySelector(selector);

const DEFAULT_MODELS={
  chatgpt:"gpt-5.6-luna",
  gemini:"gemini-3.8-flash"
};

function getProvider(){
  const value=$("#llmProviderSelect")?.value||"none";
  return ["chatgpt","gemini"].includes(value)?value:"none";
}

function providerLabel(provider){
  if(provider==="chatgpt")return "ChatGPT / OpenAI";
  if(provider==="gemini")return "Gemini / Google";
  return "LLM";
}

function setStatus(text,kind=""){
  const el=$("#llmStatus");
  if(!el)return;
  el.textContent=text;
  el.className=`llmStatus ${kind}`.trim();
}

function keyStorageName(provider){return `lilaLlmSessionKey:${provider}`;}
function modelStorageName(provider){return `lilaLlmModel:${provider}`;}

function currentConfig(){
  const provider=getProvider();
  return {
    provider,
    mode:$("#llmConnectionMode")?.value||"relay",
    apiKey:$("#llmApiKeyInput")?.value.trim()||"",
    model:$("#llmModelInput")?.value.trim()||DEFAULT_MODELS[provider]||"",
    relayUrl:$("#llmRelayUrlInput")?.value.trim()||"",
    relayToken:$("#llmRelayTokenInput")?.value.trim()||""
  };
}

function saveNonSecretConfig(){
  const cfg=currentConfig();
  if(cfg.provider==="none")return;
  localStorage.setItem("lilaLlmConnectionMode",cfg.mode);
  localStorage.setItem(modelStorageName(cfg.provider),cfg.model);
  localStorage.setItem("lilaLlmRelayUrl",cfg.relayUrl);
  // Le jeton du relais et les clés fournisseur restent uniquement dans la session du navigateur.
  sessionStorage.setItem("lilaLlmRelayToken",cfg.relayToken);
  sessionStorage.setItem(keyStorageName(cfg.provider),cfg.apiKey);
}

function refreshPanel(){
  const provider=getProvider();
  const panel=$("#llmSettings");
  const direct=$("#llmDirectSettings");
  const relay=$("#llmRelaySettings");
  const model=$("#llmModelInput");
  const key=$("#llmApiKeyInput");
  const keyLink=$("#llmKeyLink");
  const mode=$("#llmConnectionMode");
  if(!panel||!mode)return;

  panel.hidden=provider==="none";
  if(provider==="none")return;

  mode.value=localStorage.getItem("lilaLlmConnectionMode")||"relay";
  model.value=localStorage.getItem(modelStorageName(provider))||DEFAULT_MODELS[provider];
  key.value=sessionStorage.getItem(keyStorageName(provider))||"";
  $("#llmRelayUrlInput").value=localStorage.getItem("lilaLlmRelayUrl")||"";
  $("#llmRelayTokenInput").value=sessionStorage.getItem("lilaLlmRelayToken")||"";

  if(provider==="chatgpt"){
    key.placeholder="sk-… (clé OpenAI de cette session)";
    keyLink.href="https://platform.openai.com/api-keys";
    keyLink.textContent="Ouvrir les clés API OpenAI ↗";
  }else{
    key.placeholder="Clé API Gemini de cette session";
    keyLink.href="https://aistudio.google.com/app/apikey";
    keyLink.textContent="Ouvrir Google AI Studio ↗";
  }

  direct.hidden=mode.value!=="direct";
  relay.hidden=mode.value!=="relay";
  const info=$("#llmProviderInfo");
  if(info){
    info.textContent=mode.value==="relay"
      ? `${providerLabel(provider)} sélectionné. Mode recommandé : la clé fournisseur reste sur un serveur relais sécurisé.`
      : `${providerLabel(provider)} sélectionné en connexion directe. La clé n’est gardée que jusqu’à la fermeture de cet onglet.`;
  }
  setStatus("");
}

async function testDirect(cfg){
  if(!cfg.apiKey)throw new Error("Ajoute d’abord ta clé API.");
  if(!cfg.model)throw new Error("Indique un modèle.");

  if(cfg.provider==="chatgpt"){
    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${cfg.apiKey}`},
      body:JSON.stringify({model:cfg.model,input:"Réponds uniquement par OK.",max_output_tokens:16,store:false})
    });
    if(!r.ok){
      let detail="";try{detail=(await r.json())?.error?.message||"";}catch{}
      throw new Error(detail||`OpenAI HTTP ${r.status}`);
    }
    return true;
  }

  if(cfg.provider==="gemini"){
    const r=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":cfg.apiKey},
      body:JSON.stringify({model:cfg.model,input:"Réponds uniquement par OK."})
    });
    if(!r.ok){
      let detail="";try{detail=(await r.json())?.error?.message||"";}catch{}
      throw new Error(detail||`Gemini HTTP ${r.status}`);
    }
    return true;
  }
  throw new Error("Aucun fournisseur sélectionné.");
}

async function testRelay(cfg){
  if(!cfg.relayUrl)throw new Error("Indique l’adresse HTTPS du relais.");
  const headers={"Content-Type":"application/json"};
  if(cfg.relayToken)headers.Authorization=`Bearer ${cfg.relayToken}`;
  const r=await fetch(cfg.relayUrl,{
    method:"POST",headers,
    body:JSON.stringify({provider:cfg.provider,model:cfg.model,input:"Réponds uniquement par OK.",test:true}),
    mode:"cors",cache:"no-store"
  });
  if(!r.ok)throw new Error(`Relais HTTP ${r.status}`);
  return true;
}

async function generate(input){
  const cfg=currentConfig();
  saveNonSecretConfig();
  if(cfg.provider==="none")throw new Error("Aucun LLM sélectionné.");

  if(cfg.mode==="relay"){
    if(!cfg.relayUrl)throw new Error("Relais LLM non configuré.");
    const headers={"Content-Type":"application/json"};
    if(cfg.relayToken)headers.Authorization=`Bearer ${cfg.relayToken}`;
    const r=await fetch(cfg.relayUrl,{method:"POST",headers,body:JSON.stringify({provider:cfg.provider,model:cfg.model,input}),mode:"cors",cache:"no-store"});
    if(!r.ok)throw new Error(`Relais HTTP ${r.status}`);
    const data=await r.json();
    return data.output_text||data.text||data.output||"";
  }

  if(cfg.provider==="chatgpt"){
    if(!cfg.apiKey)throw new Error("Clé OpenAI manquante.");
    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${cfg.apiKey}`},
      body:JSON.stringify({model:cfg.model,input,store:false})
    });
    if(!r.ok)throw new Error(`OpenAI HTTP ${r.status}`);
    const data=await r.json();
    return (data.output||[]).flatMap(item=>item.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n");
  }

  if(cfg.provider==="gemini"){
    if(!cfg.apiKey)throw new Error("Clé Gemini manquante.");
    const r=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":cfg.apiKey},
      body:JSON.stringify({model:cfg.model,input})
    });
    if(!r.ok)throw new Error(`Gemini HTTP ${r.status}`);
    const data=await r.json();
    return (data.steps||[]).filter(s=>s.type==="model_output").flatMap(s=>s.content||[]).filter(x=>x.type==="text").map(x=>x.text).join("\n");
  }
  return "";
}

window.LilaLLM={generate,getConfig:currentConfig};

window.addEventListener("DOMContentLoaded",()=>{
  const provider=$("#llmProviderSelect");
  const mode=$("#llmConnectionMode");
  const test=$("#testLlmBtn");
  if(!provider||!mode||!test)return;

  provider.addEventListener("change",refreshPanel);
  mode.addEventListener("change",()=>{saveNonSecretConfig();refreshPanel();});
  ["#llmApiKeyInput","#llmModelInput","#llmRelayUrlInput","#llmRelayTokenInput"].forEach(selector=>{
    $(selector)?.addEventListener("change",saveNonSecretConfig);
  });

  test.addEventListener("click",async()=>{
    saveNonSecretConfig();
    const cfg=currentConfig();
    test.disabled=true;setStatus(`Connexion à ${providerLabel(cfg.provider)}…`);
    try{
      if(cfg.mode==="relay")await testRelay(cfg);else await testDirect(cfg);
      setStatus(`✅ Connexion ${providerLabel(cfg.provider)} réussie.`,"ok");
    }catch(e){
      console.warn(e);
      const suffix=cfg.mode==="direct"&&cfg.provider==="chatgpt"?" La connexion directe depuis un navigateur peut aussi être refusée ; dans ce cas utilise le relais sécurisé.":"";
      setStatus(`❌ ${e.message||"Connexion impossible."}${suffix}`,"error");
    }finally{test.disabled=false;}
  });

  refreshPanel();
});
