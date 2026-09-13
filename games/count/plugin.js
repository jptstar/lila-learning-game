let activeBoard=null;
let activeCount=0;
let resizeTimer=null;

function fitCountBoard(board,count){
  if(!board||!board.isConnected||count<=0)return;

  const rect=board.getBoundingClientRect();
  const styles=getComputedStyle(board);
  const padX=parseFloat(styles.paddingLeft||0)+parseFloat(styles.paddingRight||0);
  const padY=parseFloat(styles.paddingTop||0)+parseFloat(styles.paddingBottom||0);
  const width=Math.max(1,rect.width-padX);
  const height=Math.max(1,rect.height-padY);
  const gap=count<=20?10:count<=50?7:4;

  let best={cols:1,rows:count,cell:0};
  const maxCols=Math.min(count,14);
  for(let cols=1;cols<=maxCols;cols++){
    const rows=Math.ceil(count/cols);
    if(rows>14)continue;
    const cellW=(width-gap*(cols-1))/cols;
    const cellH=(height-gap*(rows-1))/rows;
    const cell=Math.min(cellW,cellH);
    if(cell>best.cell)best={cols,rows,cell};
  }

  const fontSize=Math.max(17,Math.min(82,Math.floor(best.cell*.82)));
  board.style.setProperty("--count-cols",String(best.cols));
  board.style.setProperty("--count-rows",String(best.rows));
  board.style.setProperty("--count-gap",`${gap}px`);
  board.style.setProperty("--count-size",`${fontSize}px`);
}

if(typeof window!=="undefined"){
  window.addEventListener("resize",()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      if(activeBoard?.isConnected)fitCountBoard(activeBoard,activeCount);
    },80);
  },{passive:true});
}

export const countGame={
  id:"count",icon:"🔢",title:"Compte",description:"Compte les objets dans la plage choisie, jusqu’à 100.",
  play(api){
    const min=Math.max(0,Math.min(100,api.state.minNumber??0));
    const max=Math.max(min,Math.min(100,api.state.maxNumber??10));
    const slot=api.state.gameId==="smart"?"smart-number":"count-number";
    const count=api.pickNumber(min,max,slot);
    const obj=api.COUNT_EMOJIS[api.rand(api.COUNT_EMOJIS.length)];
    const current={type:"count",count,obj};api.setCurrent(current);
    const question=`Combien ${obj.quantity} vois-tu ?`;
    api.setQuestion(question);
    api.setSubQuestion(`Choisis un nombre entre ${min} et ${max}.`);

    if(count===0){
      api.setVisual(`<div class="countBoard countAdaptive countEmpty"><div>Aucun objet</div></div>`);
      activeBoard=null;activeCount=0;
    }else{
      api.setVisual(`<div class="countBoard countAdaptive" aria-label="${count} ${obj.name}">${Array.from({length:count},(_,i)=>`<span class="countItem" style="animation-delay:${Math.min(i*14,360)}ms">${obj.emoji}</span>`).join("")}</div>`);
      const board=document.querySelector(".countBoard.countAdaptive");
      activeBoard=board;activeCount=count;
      requestAnimationFrame(()=>fitCountBoard(board,count));
      setTimeout(()=>fitCountBoard(board,count),120);
    }

    const vals=[count];
    const pool=[];for(let n=min;n<=max;n++)if(n!==count)pool.push(n);
    while(vals.length<3&&pool.length){const idx=api.rand(pool.length);vals.push(pool.splice(idx,1)[0]);}
    api.renderChoices(vals.map(v=>({key:v,html:String(v)})),count,{item:current,slotKey:"count"});
    api.setBubble("Compte doucement, sans te presser.");api.say(question);
    api.setHint(()=>{
      api.highlightCorrect();
      api.setBubble(`La bonne réponse est ${api.NUMBER_WORDS[count]}.`);
      api.say(`La bonne réponse est ${api.NUMBER_SPEECH_WORDS[count]}.`,true);
    });
  }
};
