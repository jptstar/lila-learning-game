import {DATA, COUNT_EMOJIS, NUMBER_WORDS, NUMBER_SPEECH_WORDS} from "./data.js";
import {VoiceService} from "./voice.js";
import {shuffle, rand} from "./utils.js";
import {GAMES} from "../../games/manifest.js";

const $=s=>document.querySelector(s);
const els={
  score:$("#score"),streak:$("#streak"),progress:$("#progress"),bubble:$("#bubble"),
  question:$("#question"),subQuestion:$("#subQuestion"),visual:$("#visual"),choices:$("#choices"),
  feedback:$("#feedback"),actions:$("#discoverActions"),reward:$("#reward"),modeGrid:$("#modeGrid"),stage:$("#stage")
};

function normalizeMin(value){
  const n=Number(value);
  if(!Number.isFinite(n)||n<=1)return 1;
  return Math.max(10,Math.min(90,Math.floor(n/10)*10));
}
function normalizeMax(value){
  const n=Number(value);
  if(!Number.isFinite(n))return 20;
  if(n<=10)return 10;
  return Math.max(20,Math.min(100,Math.ceil(n/10)*10));
}

let initialMin=normalizeMin(localStorage.getItem("lilaMinNumber"));
let initialMax=normalizeMax(localStorage.getItem("lilaMaxNumber"));
if(initialMax<=initialMin){
  initialMax=Math.min(100,initialMin+10);
  if(initialMax<=initialMin){initialMin=90;initialMax=100;}
}

const savedVoiceProvider=localStorage.getItem("lilaVoiceProvider");
const initialVoiceProvider=savedVoiceProvider==="piper"?"piper":"browser";
const initialPiperEndpoint=localStorage.getItem("lilaPiperEndpoint")||"";
const initialPiperToken=localStorage.getItem("lilaPiperToken")||"";
const allowedLlmProviders=new Set(["none","chatgpt","gemini"]);
const savedLlmProvider=localStorage.getItem("lilaLlmProvider")||"none";
const initialLlmProvider=allowedLlmProviders.has(savedLlmProvider)?savedLlmProvider:"none";

const voice=new VoiceService();
const state={
  gameId:null,score:0,streak:0,questions:0,seriesAnswered:0,seriesCorrect:0,locked:false,current:null,
  sound:true,autoSpeak:true,showLower:true,minNumber:initialMin,maxNumber:initialMax,
  llmProvider:initialLlmProvider,
  voiceProvider:initialVoiceProvider,piperEndpoint:initialPiperEndpoint,piperToken:initialPiperToken,
  mistakeQueue:[],discoverIndex:0,correctChoice:null,lastCorrectPositions:{},roundHint:null,smartSubgame:null,
  roundId:0,advanceTimer:null,errorHold:false
};

function artFor(item){
  if(item.l==="Q") return `<svg viewBox="0 0 160 120" width="125" height="105" aria-label="quille"><ellipse cx="80" cy="108" rx="32" ry="6" fill="#dbe7ee"/><path d="M67 18 C67 35 59 44 57 64 C54 91 65 103 80 103 C95 103 106 91 103 64 C101 44 93 35 93 18 C93 8 87 4 80 4 C73 4 67 8 67 18Z" fill="#fff" stroke="#c8d8e3" stroke-width="3"/><rect x="64" y="38" width="32" height="8" rx="3" fill="#ef476f"/><rect x="62" y="48" width="36" height="8" rx="3" fill="#ef476f"/></svg>`;
  if(item.l==="X") return `<svg viewBox="0 0 180 120" width="145" height="100" aria-label="xylophone"><g transform="rotate(-7 90 60)"><rect x="20" y="22" width="140" height="13" rx="5" fill="#ff6b6b"/><rect x="27" y="39" width="126" height="13" rx="5" fill="#ffa94d"/><rect x="34" y="56" width="112" height="13" rx="5" fill="#ffd43b"/><rect x="42" y="73" width="96" height="13" rx="5" fill="#69db7c"/><rect x="50" y="90" width="80" height="13" rx="5" fill="#4dabf7"/></g><line x1="27" y1="103" x2="70" y2="57" stroke="#8a5a44" stroke-width="7" stroke-linecap="round"/><circle cx="24" cy="106" r="8" fill="#8b7cf6"/></svg>`;
  if(item.l==="Y") return `<svg viewBox="0 0 150 120" width="120" height="100" aria-label="yaourt"><path d="M38 35 L112 35 L104 105 L46 105Z" fill="#fff" stroke="#bfd2df" stroke-width="3"/><ellipse cx="75" cy="35" rx="40" ry="10" fill="#f5f8fa" stroke="#bfd2df" stroke-width="3"/><rect x="49" y="52" width="52" height="34" rx="9" fill="#ff8fab"/><circle cx="75" cy="69" r="10" fill="#fff"/><path d="M113 18 Q125 48 105 62" fill="none" stroke="#a0aab5" stroke-width="5" stroke-linecap="round"/><ellipse cx="116" cy="16" rx="12" ry="5" fill="#c8d2dc"/></svg>`;
  return `<span>${item.emoji}</span>`;
}

function burst(){
  const syms=["⭐","✨","🎉","🌟","💛","🎈"];
  for(let i=0;i<14;i++){
    const s=document.createElement("span");s.className="starBurst";s.textContent=syms[rand(syms.length)];
    s.style.left=(7+Math.random()*86)+"%";s.style.bottom=(4+Math.random()*26)+"%";s.style.animationDelay=(Math.random()*180)+"ms";
    els.stage.appendChild(s);setTimeout(()=>s.remove(),1200);
  }
}

function clearAdvanceTimer(){if(state.advanceTimer){clearTimeout(state.advanceTimer);state.advanceTimer=null;}}
function updateStats(){
  els.score.textContent=state.score;els.streak.textContent=state.streak;
  els.progress.style.width=(Math.min(10,state.seriesAnswered)*10)+"%";
}
function resetSeries(){
  state.seriesAnswered=0;state.seriesCorrect=0;updateStats();
}
function clearStage(){
  clearAdvanceTimer();state.locked=false;state.errorHold=false;state.correctChoice=null;state.roundHint=null;
  els.feedback.textContent="";els.visual.innerHTML="";els.choices.innerHTML="";els.actions.innerHTML="";els.subQuestion.textContent="";
}
function showReward(){
  clearAdvanceTimer();
  els.reward.classList.add("show");
  const label=state.seriesCorrect===1?"bonne réponse":"bonnes réponses";
  $("#rewardText").textContent=`Tu as terminé les 10 activités avec ${state.seriesCorrect} ${label}.`;
  voice.speak("Bravo ! Quelle belle série !",{force:true}).catch(()=>{});
}
function numberWord(value){return NUMBER_SPEECH_WORDS[Number(value)]||NUMBER_WORDS[Number(value)]||String(value);}

async function afterAnswer(ok,item,{selectedKey=null,correctKey=null,roundId=state.roundId}={}){
  state.questions++;
  state.seriesAnswered=Math.min(10,state.seriesAnswered+1);
  clearAdvanceTimer();

  if(ok){
    state.score++;state.streak++;state.seriesCorrect++;
    els.feedback.textContent="✅ Bravo !";
    els.bubble.textContent="Oui, c’est exactement ça !";burst();updateStats();
    await voice.speak("Bravo !");
    if(roundId!==state.roundId)return;
    if(state.seriesAnswered>=10){
      state.advanceTimer=setTimeout(()=>{if(roundId===state.roundId)showReward();},350);
    }else{
      state.advanceTimer=setTimeout(()=>{if(roundId===state.roundId)nextRound();},350);
    }
    return;
  }

  state.streak=0;state.errorHold=true;updateStats();
  const isNumberGame=item?.type==="count"||item?.type==="recognize-number";
  let explanation="";

  if(isNumberGame&&selectedKey!==null&&correctKey!==null){
    els.feedback.innerHTML=`<span class="feedbackWrong">❌ Tu as choisi <strong>${selectedKey}</strong>.</span> <span class="feedbackCorrect">✅ La bonne réponse est <strong>${correctKey}</strong>.</span>`;
    els.bubble.textContent=`Ce n’est pas la bonne réponse, mais ce n’est pas grave. Tu as choisi ${selectedKey}. La bonne réponse est ${correctKey}.`;
    explanation=`Ce n'est pas la bonne réponse, mais ce n'est pas grave. Tu as choisi le nombre ${numberWord(selectedKey)}. Écoute bien : ${numberWord(selectedKey)} n'est pas la bonne réponse. La bonne réponse est le nombre ${numberWord(correctKey)}. Regarde bien : le nombre que tu as choisi est en rouge, et la bonne réponse est en vert. Prends ton temps pour les comparer.`;
  }else{
    els.feedback.innerHTML=`<span class="feedbackWrong">❌ Ce n’est pas cette réponse.</span> <span class="feedbackCorrect">✅ La bonne réponse est en vert.</span>`;
    els.bubble.textContent="Ce n’est pas la bonne réponse, mais ce n’est pas grave. La réponse choisie est en rouge et la bonne réponse est en vert.";
    explanation="Ce n'est pas la bonne réponse, mais ce n'est pas grave. Regarde bien. La réponse que tu as choisie est en rouge, et la bonne réponse est en vert. Prends ton temps pour les comparer.";
  }
  if(item?.l)state.mistakeQueue.push(item);

  const continueAction=()=>{
    if(roundId!==state.roundId)return;
    if(state.seriesAnswered>=10)showReward();else nextRound();
  };
  addAction("J’ai compris, continuer ➜",continueAction);
  voice.speak(explanation).catch(e=>console.warn("Lecture de la correction interrompue",e));
}

function pickLearningItem(){
  if(state.mistakeQueue.length&&Math.random()<.45)return state.mistakeQueue.shift();
  return DATA[rand(DATA.length)];
}
function arrangeOptions(options,correctKey,slotKey=state.gameId){
  const correct=options.find(o=>String(o.key)===String(correctKey));
  const wrongs=shuffle(options.filter(o=>String(o.key)!==String(correctKey)));
  if(!correct)return shuffle(options);
  let positions=Array.from({length:options.length},(_,i)=>i);
  const previous=state.lastCorrectPositions[slotKey];
  if(options.length>1&&Number.isInteger(previous))positions=positions.filter(i=>i!==previous);
  const pos=positions[rand(positions.length)];state.lastCorrectPositions[slotKey]=pos;
  const arranged=[];let wi=0;
  for(let i=0;i<options.length;i++)arranged.push(i===pos?correct:wrongs[wi++]);
  return arranged;
}
function renderChoices(options,correctKey,{item=null,slotKey=state.gameId}={}){
  els.choices.innerHTML="";
  arrangeOptions(options,correctKey,slotKey).forEach(opt=>{
    const b=document.createElement("button");b.className=`choice ${opt.className||""}`;b.innerHTML=opt.html;b.dataset.value=String(opt.key);
    if(String(opt.key)===String(correctKey))state.correctChoice=b;
    b.onclick=()=>{
      if(state.locked)return;
      state.locked=true;
      const answerRound=state.roundId;
      const ok=String(opt.key)===String(correctKey);b.classList.add(ok?"good":"bad");
      if(state.correctChoice)state.correctChoice.classList.add("good");
      afterAnswer(ok,item,{selectedKey:opt.key,correctKey,roundId:answerRound});
    };
    els.choices.appendChild(b);
  });
}
function showIllustration(item,showLabel=true){
  els.visual.innerHTML=`<div class="illustration"><div class="emoji">${artFor(item)}</div>${showLabel?`<div class="label">${item.article} ${item.word}</div>`:""}</div>`;
}
function addAction(label,onClick){const b=document.createElement("button");b.className="nextBig";b.innerHTML=label;b.onclick=onClick;els.actions.appendChild(b);return b;}

const api={
  state,DATA,COUNT_EMOJIS,NUMBER_WORDS,NUMBER_SPEECH_WORDS,rand,shuffle,artFor,pickLearningItem,
  setQuestion:t=>els.question.textContent=t,setSubQuestion:t=>els.subQuestion.textContent=t,
  setBubble:t=>els.bubble.textContent=t,setVisual:html=>els.visual.innerHTML=html,
  setCurrent:v=>state.current=v,getCurrent:()=>state.current,
  say:(t,force=false)=>voice.speak(t,{force}),repeat:()=>voice.repeat(),
  renderChoices,showIllustration,addAction,next:()=>nextRound(),
  setHint:fn=>state.roundHint=fn,
  highlightCorrect(){if(state.correctChoice){state.correctChoice.classList.add("hint");setTimeout(()=>state.correctChoice?.classList.remove("hint"),2500)}},
  setSmartSubgame:g=>state.smartSubgame=g,
  getGame:id=>GAMES.find(g=>g.id===id),
  clearChoices:()=>els.choices.innerHTML="",
};

function renderHome(){
  els.modeGrid.innerHTML="";
  GAMES.forEach(game=>{
    if(game.hidden)return;
    const b=document.createElement("button");b.className="modeCard";b.dataset.game=game.id;
    b.innerHTML=`<span class="modeIcon">${game.icon}</span><span class="modeTitle">${game.title}</span><span class="modeDesc">${game.description}</span>`;
    b.onclick=()=>openGame(game.id);els.modeGrid.appendChild(b);
  });
}
function currentGame(){return GAMES.find(g=>g.id===state.gameId);}
function nextRound(){
  clearAdvanceTimer();voice.cancel();state.roundId++;els.reward.classList.remove("show");clearStage();
  const game=currentGame();if(!game)return;game.play(api);
}
function openGame(id){
  clearAdvanceTimer();voice.cancel();state.gameId=id;state.questions=0;resetSeries();
  $("#home").classList.remove("active");$("#gameScreen").classList.add("active");nextRound();
}
function goHome(){
  clearAdvanceTimer();state.roundId++;voice.cancel();resetSeries();
  $("#gameScreen").classList.remove("active");$("#home").classList.add("active");
}
function showHint(){
  if(state.errorHold)return;
  if(typeof state.roundHint==="function")return state.roundHint(api);
  const game=currentGame();if(typeof game?.hint==="function")return game.hint(api);
  api.highlightCorrect();api.setBubble("Je fais clignoter la bonne réponse. Regarde bien !");
}

$("#homeBtn").onclick=goHome;
$("#repeatBtn").onclick=()=>voice.repeat();
$("#hintBtn").onclick=showHint;
$("#rewardContinue").onclick=()=>{voice.cancel();els.reward.classList.remove("show");resetSeries();nextRound();};
$("#soundBtn").onclick=()=>{state.sound=!state.sound;voice.configure({sound:state.sound});$("#soundBtn").textContent=state.sound?"🔊":"🔇";if(!state.sound)voice.cancel();};
$("#settingsBtn").onclick=()=>$("#settings").classList.add("show");
$("#closeSettings").onclick=()=>$("#settings").classList.remove("show");
function toggle(id,key,onValue,offValue,onChange){
  const el=$(id);el.onclick=()=>{el.classList.toggle("on");state[key]=el.classList.contains("on")?onValue:offValue;if(onChange)onChange(state[key]);};
}
toggle("#autoSpeakToggle","autoSpeak",true,false,v=>voice.configure({autoSpeak:v}));
toggle("#lowerToggle","showLower",true,false);

const minNumberSelect=$("#minNumberSelect"),maxNumberSelect=$("#maxNumberSelect");
[1,10,20,30,40,50,60,70,80,90].forEach(n=>{
  const option=document.createElement("option");option.value=String(n);option.textContent=String(n);minNumberSelect.appendChild(option);
});
[10,20,30,40,50,60,70,80,90,100].forEach(n=>{
  const option=document.createElement("option");option.value=String(n);option.textContent=String(n);maxNumberSelect.appendChild(option);
});
function syncRange(changed){
  let min=normalizeMin(minNumberSelect.value);
  let max=normalizeMax(maxNumberSelect.value);
  if(max<=min){
    if(changed==="min")max=Math.min(100,min+10);
    else min=max===10?1:Math.max(10,max-10);
  }
  state.minNumber=min;state.maxNumber=max;
  minNumberSelect.value=String(min);maxNumberSelect.value=String(max);
  localStorage.setItem("lilaMinNumber",String(min));localStorage.setItem("lilaMaxNumber",String(max));
}
minNumberSelect.value=String(state.minNumber);maxNumberSelect.value=String(state.maxNumber);
minNumberSelect.onchange=()=>syncRange("min");maxNumberSelect.onchange=()=>syncRange("max");
syncRange("max");

const llmProviderSelect=$("#llmProviderSelect");
const llmProviderInfo=$("#llmProviderInfo");
function refreshLlmInfo(){
  if(state.llmProvider==="chatgpt"){
    llmProviderInfo.textContent="ChatGPT sélectionné. Le choix est mémorisé ; la connexion API sera faite via un relais sécurisé afin de ne pas exposer de clé dans le navigateur.";
  }else if(state.llmProvider==="gemini"){
    llmProviderInfo.textContent="Gemini sélectionné. Le choix est mémorisé ; la connexion API sera faite via un relais sécurisé afin de ne pas exposer de clé dans le navigateur.";
  }else{
    llmProviderInfo.textContent="Aucun LLM : les jeux actuels fonctionnent sans IA distante.";
  }
}
llmProviderSelect.value=state.llmProvider;
llmProviderSelect.onchange=()=>{
  state.llmProvider=allowedLlmProviders.has(llmProviderSelect.value)?llmProviderSelect.value:"none";
  localStorage.setItem("lilaLlmProvider",state.llmProvider);refreshLlmInfo();
};
refreshLlmInfo();

const voiceProviderSelect=$("#voiceProviderSelect");
const piperSettings=$("#piperSettings");
const piperEndpointInput=$("#piperEndpointInput");
const piperTokenInput=$("#piperTokenInput");
const piperStatus=$("#piperStatus");
const testPiperBtn=$("#testPiperBtn");

function setPiperStatus(text,kind=""){
  piperStatus.textContent=text;
  piperStatus.className=`piperStatus ${kind}`.trim();
}
function refreshPiperPanel(){
  const enabled=state.voiceProvider==="piper";
  piperSettings.hidden=!enabled;
  if(enabled&&!state.piperEndpoint)setPiperStatus("Indique l’adresse HTTPS de ton serveur Piper.","warn");
  else if(enabled)setPiperStatus("Piper sélectionné. Tu peux tester la voix.");
  else setPiperStatus("");
}
function saveVoiceSettings(){
  state.voiceProvider=voiceProviderSelect.value==="piper"?"piper":"browser";
  state.piperEndpoint=piperEndpointInput.value.trim();
  state.piperToken=piperTokenInput.value.trim();
  localStorage.setItem("lilaVoiceProvider",state.voiceProvider);
  localStorage.setItem("lilaPiperEndpoint",state.piperEndpoint);
  localStorage.setItem("lilaPiperToken",state.piperToken);
  voice.configure({provider:state.voiceProvider,piperEndpoint:state.piperEndpoint,piperToken:state.piperToken});
  refreshPiperPanel();
}

voiceProviderSelect.value=state.voiceProvider;
piperEndpointInput.value=state.piperEndpoint;
piperTokenInput.value=state.piperToken;
voiceProviderSelect.onchange=saveVoiceSettings;
piperEndpointInput.onchange=saveVoiceSettings;
piperTokenInput.onchange=saveVoiceSettings;
testPiperBtn.onclick=async()=>{
  saveVoiceSettings();
  if(!state.piperEndpoint){setPiperStatus("Adresse Piper manquante.","error");return;}
  testPiperBtn.disabled=true;setPiperStatus("Connexion à Piper…");
  try{
    await voice.testPiper("Bonjour ! Je suis Lila. La voix Piper fonctionne correctement.");
    setPiperStatus("✅ Piper fonctionne.","ok");
  }catch(e){
    console.warn(e);setPiperStatus("❌ Piper est inaccessible. Vérifie l’adresse HTTPS, le certificat, CORS et le jeton.","error");
  }finally{testPiperBtn.disabled=false;}
};

voice.configure({
  sound:state.sound,autoSpeak:state.autoSpeak,provider:state.voiceProvider,
  piperEndpoint:state.piperEndpoint,piperToken:state.piperToken
});
refreshPiperPanel();renderHome();updateStats();

if("serviceWorker" in navigator && location.protocol.startsWith("http")){navigator.serviceWorker.register("./service-worker.js").catch(console.warn);}
