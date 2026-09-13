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
      api.setVisual(`<div class="countBoard"><div style="font-size:clamp(28px,7vw,54px);font-weight:950">Aucun objet</div></div>`);
    }else{
      const size=count<=20?56:count<=40?42:count<=70?32:26;
      const gap=count<=20?12:count<=50?7:4;
      api.setVisual(`<div class="countBoard" style="gap:${gap}px;padding:${count>50?14:22}px">${Array.from({length:count},(_,i)=>`<span class="countItem" style="font-size:${size}px;animation-delay:${Math.min(i*18,420)}ms">${obj.emoji}</span>`).join("")}</div>`);
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
