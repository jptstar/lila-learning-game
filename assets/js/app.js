import {DATA, COUNT_EMOJIS, NUMBER_WORDS} from "./data.js";
import {VoiceService} from "./voice.js";
import {shuffle, rand} from "./utils.js";
import {GAMES} from "../../games/manifest.js";

const $=s=>document.querySelector(s);
const els={
  score:$("#score"),streak:$("#streak"),progress:$("#progress"),bubble:$("#bubble"),
  question:$("#question"),subQuestion:$("#subQuestion"),visual:$("#visual"),choices:$("#choices"),
  feedback:$("#feedback"),actions:$("#discoverActions"),reward:$("#reward"),modeGrid:$("#modeGrid"),stage:$("#stage")
};

const voice=new VoiceService();
const state={
  gameId:null,score:0,streak:0,correctSinceReward:0,questions:0,locked:false,current:null,
  sound:true,autoSpeak:true,showLower:true,maxNumber:10,mistakeQueue:[],discoverIndex:0,
  correctChoice:null,lastCorrectPositions:{},roundHint:null,smartSubgame:null
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

function updateStats(){
  els.score.textContent=state.score;els.streak.textContent=state.streak;
  els.progress.style.width=((state.questions%10)*10)+"%";
}
function clearStage(){
  state.locked=false;state.correctChoice=null;state.roundHint=null;els.feedback.textContent="";els.visual.innerHTML="";els.choices.innerHTML="";els.actions.innerHTML="";els.subQuestion.textContent="";
}
function showReward(){
  els.reward.classList.add("show");$("#rewardText").textContent=`Tu as réussi ${state.correctSinceReward} réponses. Lila est fière de toi !`;state.correctSinceReward=0;
}
function afterAnswer(ok,item){
  state.questions++;
  if(ok){
    state.score++;state.streak++;state.correctSinceReward++;
    els.feedback.textContent=state.streak>=3?"🌟 Bravo, quelle belle série !":"✅ Bravo !";
    els.bubble.textContent=state.streak>=3?"Tu deviens très fort !":"Oui, c’est exactement ça !";burst();
    voice.speak(state.streak>=3?"Bravo ! Quelle belle série !":"Bravo !");
  }else{
    state.streak=0;els.feedback.textContent="💡 Pas grave. Regarde bien la bonne réponse.";
    els.bubble.textContent="On apprend aussi quand on se trompe. Regarde l’indice.";
    if(item?.l)state.mistakeQueue.push(item);
    voice.speak("Pas grave. Regarde bien la bonne réponse.");
  }
  updateStats();
  if(ok&&state.correctSinceReward>=5)setTimeout(showReward,700);else setTimeout(nextRound,ok?1150:1800);
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
      if(state.locked)return;state.locked=true;
      const ok=String(opt.key)===String(correctKey);b.classList.add(ok?"good":"bad");
      if(state.correctChoice)state.correctChoice.classList.add("good");afterAnswer(ok,item);
    };
    els.choices.appendChild(b);
  });
}
function showIllustration(item,showLabel=true){
  els.visual.innerHTML=`<div class="illustration"><div class="emoji">${artFor(item)}</div>${showLabel?`<div class="label">${item.article} ${item.word}</div>`:""}</div>`;
}
function addAction(label,onClick){const b=document.createElement("button");b.className="nextBig";b.innerHTML=label;b.onclick=onClick;els.actions.appendChild(b);return b;}

const api={
  state,DATA,COUNT_EMOJIS,NUMBER_WORDS,rand,shuffle,artFor,pickLearningItem,
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
  els.reward.classList.remove("show");clearStage();
  const game=currentGame();if(!game)return;
  game.play(api);
}
function openGame(id){
  state.gameId=id;state.questions=0;els.progress.style.width="0%";
  $("#home").classList.remove("active");$("#gameScreen").classList.add("active");nextRound();
}
function goHome(){voice.cancel();$("#gameScreen").classList.remove("active");$("#home").classList.add("active");els.progress.style.width="0%";}
function showHint(){
  if(typeof state.roundHint==="function")return state.roundHint(api);
  const game=currentGame();if(typeof game?.hint==="function")return game.hint(api);
  api.highlightCorrect();api.setBubble("Je fais clignoter la bonne réponse. Regarde bien !");
}

$("#homeBtn").onclick=goHome;
$("#repeatBtn").onclick=()=>voice.repeat();
$("#hintBtn").onclick=showHint;
$("#rewardContinue").onclick=()=>{els.reward.classList.remove("show");nextRound()};
$("#soundBtn").onclick=()=>{state.sound=!state.sound;voice.configure({sound:state.sound});$("#soundBtn").textContent=state.sound?"🔊":"🔇";if(!state.sound)voice.cancel();};
$("#settingsBtn").onclick=()=>$("#settings").classList.add("show");
$("#closeSettings").onclick=()=>$("#settings").classList.remove("show");
function toggle(id,key,onValue,offValue,onChange){
  const el=$(id);el.onclick=()=>{el.classList.toggle("on");state[key]=el.classList.contains("on")?onValue:offValue;if(onChange)onChange(state[key]);};
}
toggle("#autoSpeakToggle","autoSpeak",true,false,v=>voice.configure({autoSpeak:v}));
toggle("#lowerToggle","showLower",true,false);
toggle("#tenToggle","maxNumber",10,5);

voice.configure({sound:state.sound,autoSpeak:state.autoSpeak});
renderHome();updateStats();

if("serviceWorker" in navigator && location.protocol.startsWith("http")){navigator.serviceWorker.register("./service-worker.js").catch(console.warn);}
