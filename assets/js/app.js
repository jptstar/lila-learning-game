import {DATA,COUNT_EMOJIS,NUMBER_WORDS,NUMBER_SPEECH_WORDS} from "./data.js";
import {LETTER_CATALOG} from "./letter-catalog.js";
import {VoiceService} from "./voice.js";
import {shuffle,rand} from "./utils.js";
import {GAMES} from "../../games/manifest.js";

const $=s=>document.querySelector(s);
const els={
  score:$("#score"),streak:$("#streak"),progress:$("#progress"),bubble:$("#bubble"),
  question:$("#question"),subQuestion:$("#subQuestion"),visual:$("#visual"),choices:$("#choices"),
  feedback:$("#feedback"),actions:$("#discoverActions"),reward:$("#reward"),modeGrid:$("#modeGrid"),stage:$("#stage")
};

const RANGE_VALUES=[0,10,20,30,40,50,60,70,80,90,100];
const VOICE_PROVIDERS=new Set(["browser","piper","openai","gemini"]);

function normalizeBound(value,fallback){
  const n=Number(value);
  if(!Number.isFinite(n))return fallback;
  return Math.max(0,Math.min(100,Math.round(n/10)*10));
}

let initialMin=normalizeBound(localStorage.getItem("lilaMinNumber"),0);
let initialMax=normalizeBound(localStorage.getItem("lilaMaxNumber"),10);
if(initialMax<=initialMin){
  if(initialMin<100)initialMax=initialMin+10;
  else{initialMin=90;initialMax=100;}
}

const savedVoiceProvider=localStorage.getItem("lilaVoiceProvider")||"browser";
const voice=new VoiceService();
const state={
  gameId:null,score:0,streak:0,questions:0,seriesAnswered:0,seriesCorrect:0,rewardShown:false,
  locked:false,current:null,sound:true,autoSpeak:true,showLower:true,
  minNumber:initialMin,maxNumber:initialMax,
  voiceProvider:VOICE_PROVIDERS.has(savedVoiceProvider)?savedVoiceProvider:"browser",
  piperEndpoint:localStorage.getItem("lilaPiperEndpoint")||"",
  piperToken:localStorage.getItem("lilaPiperToken")||"",
  mistakeQueue:[],discoverIndex:0,correctChoice:null,lastCorrectPositions:{},roundHint:null,smartSubgame:null,
  lastTargets:{},lastSmartGame:null,roundId:0,advanceTimer:null,errorHold:false
};

function artFor(item){return `<span>${item.emoji||"🖼️"}</span>`;}

function burst(){
  const syms=["⭐","✨","🎉","🌟","💛","🎈"];
  for(let i=0;i<14;i++){
    const s=document.createElement("span");s.className="starBurst";s.textContent=syms[rand(syms.length)];
    s.style.left=(7+Math.random()*86)+"%";s.style.bottom=(4+Math.random()*26)+"%";s.style.animationDelay=(Math.random()*180)+"ms";
    els.stage.appendChild(s);setTimeout(()=>s.remove(),1200);
  }
}

function clearAdvanceTimer(){
  if(state.advanceTimer){clearTimeout(state.advanceTimer);state.advanceTimer=null;}
}

function updateStats(){
  els.score.textContent=state.score;
  els.streak.textContent=state.streak;
  els.progress.style.width=`${Math.min(10,state.seriesAnswered)*10}%`;
}

function resetSeries(){
  state.seriesAnswered=0;
  state.seriesCorrect=0;
  state.rewardShown=false;
  updateStats();
}

function clearStage(){
  clearAdvanceTimer();
  state.locked=false;state.errorHold=false;state.correctChoice=null;state.roundHint=null;
  els.feedback.textContent="";els.visual.innerHTML="";els.choices.innerHTML="";els.actions.innerHTML="";els.subQuestion.textContent="";
}

function showReward(){
  if(state.rewardShown)return;
  state.rewardShown=true;
  clearAdvanceTimer();
  els.reward.classList.add("show");
  const label=state.seriesCorrect===1?"bonne réponse":"bonnes réponses";
  $("#rewardText").textContent=`Tu as terminé les 10 activités avec ${state.seriesCorrect} ${label}.`;
  voice.speak("Quelle belle série ! Tu as terminé les dix activités.",{force:true}).catch(()=>{});
}

function numberWord(value){return NUMBER_SPEECH_WORDS[Number(value)]||NUMBER_WORDS[Number(value)]||String(value);}

async function afterAnswer(ok,item,{selectedKey=null,correctKey=null,roundId=state.roundId}={}){
  state.questions++;
  state.seriesAnswered=Math.min(10,state.seriesAnswered+1);
  clearAdvanceTimer();

  if(ok){
    state.score++;state.streak++;state.seriesCorrect++;
    els.feedback.textContent="✅ Bravo !";
    els.bubble.textContent="Oui, c’est exactement ça !";
    burst();updateStats();

    if(state.seriesAnswered>=10){
      showReward();
      return;
    }

    await voice.speak("Bravo !");
    if(roundId!==state.roundId)return;
    state.advanceTimer=setTimeout(()=>{if(roundId===state.roundId)nextRound();},350);
    return;
  }

  state.streak=0;state.errorHold=true;updateStats();
  const isNumberGame=item?.type==="count"||item?.type==="recognize-number";
  let explanation;

  if(isNumberGame&&selectedKey!==null&&correctKey!==null){
    els.feedback.innerHTML=`<span class="feedbackWrong">❌ Tu as choisi <strong>${selectedKey}</strong>.</span> <span class="feedbackCorrect">✅ La bonne réponse est <strong>${correctKey}</strong>.</span>`;
    els.bubble.textContent=`Tu as choisi ${selectedKey}. La bonne réponse est ${correctKey}.`;
    explanation=`Ce n'est pas la bonne réponse, mais ce n'est pas grave. Tu as choisi le nombre ${numberWord(selectedKey)}. La bonne réponse est le nombre ${numberWord(correctKey)}. Le nombre choisi est en rouge et la bonne réponse est en vert.`;
  }else{
    els.feedback.innerHTML=`<span class="feedbackWrong">❌ Ce n’est pas cette réponse.</span> <span class="feedbackCorrect">✅ La bonne réponse est en vert.</span>`;
    els.bubble.textContent="Ce n’est pas la bonne réponse. Regarde la réponse verte.";
    explanation="Ce n'est pas la bonne réponse, mais ce n'est pas grave. La réponse choisie est en rouge et la bonne réponse est en vert.";
  }

  if(item?.l)state.mistakeQueue.push(item);
  addAction("J’ai compris, continuer ➜",()=>{
    if(roundId!==state.roundId)return;
    if(state.seriesAnswered>=10)showReward();else nextRound();
  });
  voice.speak(explanation).catch(()=>{});
}

function targetAllowed(item,last,avoidLetter){
  if(!last)return true;
  if(item.word===last.word)return false;
  if(avoidLetter&&item.l===last.letter)return false;
  return true;
}

function pickLearningItem({slot="letters",avoidLetter=false}={}){
  const last=state.lastTargets[slot];
  let item=null;

  if(state.mistakeQueue.length&&Math.random()<.45){
    const index=state.mistakeQueue.findIndex(candidate=>targetAllowed(candidate,last,avoidLetter));
    if(index>=0)item=state.mistakeQueue.splice(index,1)[0];
  }

  if(!item){
    const candidates=LETTER_CATALOG.filter(candidate=>targetAllowed(candidate,last,avoidLetter));
    item=candidates[rand(candidates.length)]||LETTER_CATALOG[rand(LETTER_CATALOG.length)];
  }

  state.lastTargets[slot]={word:item.word,letter:item.l};
  return item;
}

function pickNumber(min,max,slot="numbers"){
  const low=Math.max(0,Math.min(100,Number(min)));
  const high=Math.max(low,Math.min(100,Number(max)));
  const last=state.lastTargets[slot]?.number;
  const values=[];
  for(let n=low;n<=high;n++)if(n!==last)values.push(n);
  const number=values.length?values[rand(values.length)]:low;
  state.lastTargets[slot]={number};
  return number;
}

function arrangeOptions(options,correctKey,slotKey=state.gameId){
  const correct=options.find(o=>String(o.key)===String(correctKey));
  const wrongs=shuffle(options.filter(o=>String(o.key)!==String(correctKey)));
  if(!correct)return shuffle(options);

  let positions=Array.from({length:options.length},(_,i)=>i);
  const previous=state.lastCorrectPositions[slotKey];
  if(options.length>1&&Number.isInteger(previous))positions=positions.filter(i=>i!==previous);
  const pos=positions[rand(positions.length)];
  state.lastCorrectPositions[slotKey]=pos;

  const arranged=[];let wi=0;
  for(let i=0;i<options.length;i++)arranged.push(i===pos?correct:wrongs[wi++]);
  return arranged;
}

function renderChoices(options,correctKey,{item=null,slotKey=state.gameId}={}){
  els.choices.innerHTML="";
  arrangeOptions(options,correctKey,slotKey).forEach(opt=>{
    const b=document.createElement("button");
    b.className=`choice ${opt.className||""}`;
    b.innerHTML=opt.html;
    b.dataset.value=String(opt.key);
    if(String(opt.key)===String(correctKey))state.correctChoice=b;
    b.onclick=()=>{
      if(state.locked)return;
      state.locked=true;
      const answerRound=state.roundId;
      const ok=String(opt.key)===String(correctKey);
      b.classList.add(ok?"good":"bad");
      if(state.correctChoice)state.correctChoice.classList.add("good");
      afterAnswer(ok,item,{selectedKey:opt.key,correctKey,roundId:answerRound});
    };
    els.choices.appendChild(b);
  });
}

function showIllustration(item,showLabel=true){
  els.visual.innerHTML=`<div class="illustration"><div class="emoji">${artFor(item)}</div>${showLabel?`<div class="label">${item.word}</div>`:""}</div>`;
}

function addAction(label,onClick){
  const b=document.createElement("button");b.className="nextBig";b.innerHTML=label;b.onclick=onClick;els.actions.appendChild(b);return b;
}

const api={
  state,DATA,LETTER_CATALOG,COUNT_EMOJIS,NUMBER_WORDS,NUMBER_SPEECH_WORDS,rand,shuffle,artFor,
  pickLearningItem,pickNumber,
  setQuestion:t=>els.question.textContent=t,setSubQuestion:t=>els.subQuestion.textContent=t,
  setBubble:t=>els.bubble.textContent=t,setVisual:html=>els.visual.innerHTML=html,
  setCurrent:v=>state.current=v,getCurrent:()=>state.current,
  say:(t,force=false)=>voice.speak(t,{force}),repeat:()=>voice.repeat(),
  renderChoices,showIllustration,addAction,next:()=>nextRound(),
  setHint:fn=>state.roundHint=fn,
  highlightCorrect(){
    if(state.correctChoice){state.correctChoice.classList.add("hint");setTimeout(()=>state.correctChoice?.classList.remove("hint"),2500);}
  },
  setSmartSubgame:g=>state.smartSubgame=g,
  getGame:id=>GAMES.find(g=>g.id===id),
  clearChoices:()=>els.choices.innerHTML="",
  generateWithLlm:input=>window.LilaCloud?.generate(input)??Promise.reject(new Error("LLM non configuré"))
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
  const game=currentGame();if(game)game.play(api);
}

function openGame(id){
  clearAdvanceTimer();voice.cancel();state.gameId=id;state.questions=0;state.lastTargets={};state.lastSmartGame=null;resetSeries();
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
$("#soundBtn").onclick=()=>{
  state.sound=!state.sound;voice.configure({sound:state.sound});$("#soundBtn").textContent=state.sound?"🔊":"🔇";if(!state.sound)voice.cancel();
};
$("#settingsBtn").onclick=()=>$("#settings").classList.add("show");
$("#closeSettings").onclick=()=>$("#settings").classList.remove("show");

function toggle(id,key,onValue,offValue,onChange){
  const el=$(id);el.onclick=()=>{el.classList.toggle("on");state[key]=el.classList.contains("on")?onValue:offValue;if(onChange)onChange(state[key]);};
}
toggle("#autoSpeakToggle","autoSpeak",true,false,v=>voice.configure({autoSpeak:v}));
toggle("#lowerToggle","showLower",true,false);

const minNumberSelect=$("#minNumberSelect"),maxNumberSelect=$("#maxNumberSelect");
RANGE_VALUES.forEach(n=>{
  for(const select of [minNumberSelect,maxNumberSelect]){
    const option=document.createElement("option");option.value=String(n);option.textContent=String(n);select.appendChild(option);
  }
});

function refreshRangeOptions(){
  const min=Number(minNumberSelect.value),max=Number(maxNumberSelect.value);
  [...minNumberSelect.options].forEach(o=>o.disabled=Number(o.value)>=max);
  [...maxNumberSelect.options].forEach(o=>o.disabled=Number(o.value)<=min);
}

function syncRange(changed){
  let min=normalizeBound(minNumberSelect.value,0);
  let max=normalizeBound(maxNumberSelect.value,10);
  if(max<=min){
    if(changed==="min"){
      if(min<100)max=min+10;else{min=90;max=100;}
    }else{
      if(max>0)min=max-10;else{min=0;max=10;}
    }
  }
  state.minNumber=min;state.maxNumber=max;
  minNumberSelect.value=String(min);maxNumberSelect.value=String(max);
  localStorage.setItem("lilaMinNumber",String(min));localStorage.setItem("lilaMaxNumber",String(max));
  refreshRangeOptions();
}
minNumberSelect.value=String(state.minNumber);maxNumberSelect.value=String(state.maxNumber);
minNumberSelect.onchange=()=>syncRange("min");maxNumberSelect.onchange=()=>syncRange("max");syncRange("max");

const voiceProviderSelect=$("#voiceProviderSelect");
const piperSettings=$("#piperSettings");
const piperEndpointInput=$("#piperEndpointInput");
const piperTokenInput=$("#piperTokenInput");
const piperStatus=$("#piperStatus");
const testPiperBtn=$("#testPiperBtn");

function setPiperStatus(text,kind=""){
  piperStatus.textContent=text;piperStatus.className=`piperStatus ${kind}`.trim();
}
function refreshPiperPanel(){
  const enabled=state.voiceProvider==="piper";piperSettings.hidden=!enabled;
  if(enabled&&!state.piperEndpoint)setPiperStatus("Indique l’adresse HTTPS de Piper.","warn");
  else setPiperStatus("");
}
function saveVoiceSettings(){
  state.voiceProvider=VOICE_PROVIDERS.has(voiceProviderSelect.value)?voiceProviderSelect.value:"browser";
  state.piperEndpoint=piperEndpointInput.value.trim();state.piperToken=piperTokenInput.value.trim();
  localStorage.setItem("lilaVoiceProvider",state.voiceProvider);
  localStorage.setItem("lilaPiperEndpoint",state.piperEndpoint);
  localStorage.setItem("lilaPiperToken",state.piperToken);
  voice.configure({provider:state.voiceProvider,piperEndpoint:state.piperEndpoint,piperToken:state.piperToken});
  refreshPiperPanel();
}

voiceProviderSelect.value=state.voiceProvider;
piperEndpointInput.value=state.piperEndpoint;piperTokenInput.value=state.piperToken;
voiceProviderSelect.onchange=saveVoiceSettings;
piperEndpointInput.onchange=saveVoiceSettings;piperTokenInput.onchange=saveVoiceSettings;
testPiperBtn.onclick=async()=>{
  saveVoiceSettings();
  if(!state.piperEndpoint){setPiperStatus("Adresse Piper manquante.","error");return;}
  testPiperBtn.disabled=true;setPiperStatus("Connexion à Piper…");
  try{await voice.testPiper("Bonjour ! Je suis Lila.");setPiperStatus("✅ Piper fonctionne.","ok");}
  catch(e){console.warn(e);setPiperStatus("❌ Piper est inaccessible.","error");}
  finally{testPiperBtn.disabled=false;}
};

voice.configure({sound:state.sound,autoSpeak:state.autoSpeak,provider:state.voiceProvider,piperEndpoint:state.piperEndpoint,piperToken:state.piperToken});
refreshPiperPanel();renderHome();updateStats();
window.LilaApp={state,voice};

if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./service-worker.js").catch(console.warn);
