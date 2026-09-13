const $=selector=>document.querySelector(selector);

function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

function setupDecadeRanges(){
  const minSelect=$("#minNumberSelect");
  const maxSelect=$("#maxNumberSelect");
  if(!minSelect||!maxSelect)return;

  const savedMin=Number(localStorage.getItem("lilaMinNumber"));
  const savedMax=Number(localStorage.getItem("lilaMaxNumber"));

  let min=Number.isFinite(savedMin)?savedMin:1;
  let max=Number.isFinite(savedMax)?savedMax:10;

  // Les réglages se font maintenant par dizaines, pas nombre par nombre.
  min=min<=1?1:clamp(Math.floor(min/10)*10,10,90);
  max=max<=10?10:clamp(Math.ceil(max/10)*10,20,100);
  if(max<=min)max=Math.min(100,min+10);
  if(max<=min){min=90;max=100;}

  minSelect.innerHTML="";
  [1,10,20,30,40,50,60,70,80,90].forEach(value=>{
    const option=document.createElement("option");
    option.value=String(value);
    option.textContent=String(value);
    minSelect.appendChild(option);
  });

  maxSelect.innerHTML="";
  [10,20,30,40,50,60,70,80,90,100].forEach(value=>{
    const option=document.createElement("option");
    option.value=String(value);
    option.textContent=String(value);
    maxSelect.appendChild(option);
  });

  minSelect.value=String(min);
  maxSelect.value=String(max);

  // Les gestionnaires déjà installés par app.js mettent immédiatement state et localStorage à jour.
  minSelect.dispatchEvent(new Event("change"));
  maxSelect.dispatchEvent(new Event("change"));

  minSelect.addEventListener("change",()=>{
    const currentMin=Number(minSelect.value);
    const currentMax=Number(maxSelect.value);
    if(currentMax<=currentMin){
      maxSelect.value=String(Math.min(100,currentMin+10));
      maxSelect.dispatchEvent(new Event("change"));
    }
  });

  maxSelect.addEventListener("change",()=>{
    const currentMin=Number(minSelect.value);
    const currentMax=Number(maxSelect.value);
    if(currentMax<=currentMin){
      minSelect.value=String(currentMax===10?1:Math.max(10,currentMax-10));
      minSelect.dispatchEvent(new Event("change"));
    }
  });
}

function setupLlmChoice(){
  const select=$("#llmProviderSelect");
  const info=$("#llmProviderInfo");
  if(!select)return;

  const allowed=new Set(["none","chatgpt","gemini"]);
  const saved=localStorage.getItem("lilaLlmProvider")||"none";
  select.value=allowed.has(saved)?saved:"none";

  const refresh=()=>{
    const value=allowed.has(select.value)?select.value:"none";
    localStorage.setItem("lilaLlmProvider",value);
    if(!info)return;
    if(value==="chatgpt"){
      info.textContent="ChatGPT sélectionné. Les jeux actuels restent locaux ; la connexion à l’API passera par un relais sécurisé pour ne jamais exposer une clé dans le navigateur.";
    }else if(value==="gemini"){
      info.textContent="Gemini sélectionné. Les jeux actuels restent locaux ; la connexion à l’API passera par un relais sécurisé pour ne jamais exposer une clé dans le navigateur.";
    }else{
      info.textContent="Aucun LLM : tous les exercices actuels fonctionnent localement, sans IA distante.";
    }
  };

  select.addEventListener("change",refresh);
  refresh();
}

window.addEventListener("DOMContentLoaded",()=>{
  setupDecadeRanges();
  setupLlmChoice();
});
