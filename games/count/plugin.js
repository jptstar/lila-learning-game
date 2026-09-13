export const countGame={
  id:"count",icon:"🔢",title:"Compte",description:"Compte les objets jusqu’au nombre choisi dans les réglages.",
  play(api){
    const max=Math.max(3,Math.min(20,api.state.maxNumber||20));
    const count=1+api.rand(max);const obj=api.COUNT_EMOJIS[api.rand(api.COUNT_EMOJIS.length)];
    const current={type:"count",count,obj};api.setCurrent(current);
    api.setQuestion(`Combien vois-tu de ${obj.name} ?`);api.setSubQuestion(`Compte de 1 à ${max}. Tu peux les toucher du doigt une par une.`);
    api.setVisual(`<div class="countBoard">${Array.from({length:count},(_,i)=>`<span class="countItem" style="animation-delay:${i*45}ms">${obj.emoji}</span>`).join("")}</div>`);
    let vals=[count];while(vals.length<3){const v=1+api.rand(max);if(!vals.includes(v))vals.push(v)}
    api.renderChoices(vals.map(v=>({key:v,html:String(v)})),count,{item:current,slotKey:"count"});
    api.setBubble("Compte doucement : un, deux, trois…");api.say(`Combien vois-tu de ${obj.name} ?`);
    api.setHint(()=>{api.highlightCorrect();api.setBubble(`Il y en a ${api.NUMBER_WORDS[count]}.`);api.say(`Il y en a ${api.NUMBER_WORDS[count]}.`,true)});
  }
};
