export const findLetterGame={
  id:"find-letter",icon:"🔤",title:"Trouve la lettre",description:"Regarde l’image et trouve sa première lettre.",
  play(api){
    const item=api.pickLearningItem();api.setCurrent(item);
    api.setQuestion(`Quelle lettre commence « ${item.word} » ?`);api.setSubQuestion(`Regarde ${item.article} ${item.word}, puis choisis sa première lettre.`);
    api.showIllustration(item,true);
    const wrong=api.shuffle(api.DATA.filter(x=>x.l!==item.l)).slice(0,2).map(x=>x.l);
    const opts=[item.l,...wrong].map(l=>({key:l,html:l}));api.renderChoices(opts,item.l,{item,slotKey:"find-letter"});
    api.setBubble(`${item.word} commence par quelle lettre ?`);api.say(`Quelle lettre commence le mot ${item.word} ?`);
    api.setHint(()=>{api.highlightCorrect();api.setBubble(`${item.word} commence par ${item.l}.`);api.say(`${item.word} commence par la lettre ${item.l}.`,true)});
  }
};
