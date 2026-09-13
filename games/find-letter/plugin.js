export const findLetterGame={
  id:"find-letter",icon:"🔤",title:"Trouve la lettre",description:"Regarde l’image et trouve sa première lettre.",
  play(api){
    const item=api.pickLearningItem();api.setCurrent(item);
    api.setQuestion(`Quelle est la première lettre du mot « ${item.word} » ?`);
    api.setSubQuestion(`Regarde ${item.article} ${item.word}, puis choisis la première lettre de son nom.`);
    api.showIllustration(item,true);
    const wrong=api.shuffle(api.DATA.filter(x=>x.l!==item.l)).slice(0,2).map(x=>x.l);
    const opts=[item.l,...wrong].map(l=>({key:l,html:l}));api.renderChoices(opts,item.l,{item,slotKey:"find-letter"});
    api.setBubble(`Quelle est la première lettre de « ${item.word} » ?`);
    api.say(`Quelle est la première lettre du mot ${item.word} ?`);
    api.setHint(()=>{
      const spoken=item.spoken||item.l;
      api.highlightCorrect();
      api.setBubble(`Le mot ${item.word} commence par la lettre ${item.l}.`);
      api.say(`Le mot ${item.word} commence par la lettre ${spoken}.`,true);
    });
  }
};
