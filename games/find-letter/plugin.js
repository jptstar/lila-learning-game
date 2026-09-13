export const findLetterGame={
  id:"find-letter",icon:"🔤",title:"Trouve la lettre",description:"Regarde l’image et trouve sa première lettre.",
  play(api){
    const slot=api.state.gameId==="smart"?"smart-word":"find-letter-word";
    const item=api.pickLearningItem({slot,avoidLetter:true});api.setCurrent(item);
    api.setQuestion(`Quelle est la première lettre du mot « ${item.word} » ?`);
    api.setSubQuestion("Observe l’image puis choisis la première lettre du mot.");
    api.showIllustration(item,true);

    const wrongLetters=api.shuffle([...new Set(api.LETTER_CATALOG.map(x=>x.l).filter(l=>l!==item.l))]).slice(0,2);
    const opts=[item.l,...wrongLetters].map(l=>({key:l,html:l}));
    api.renderChoices(opts,item.l,{item,slotKey:"find-letter"});
    api.setBubble(`Quelle est la première lettre de « ${item.word} » ?`);
    api.say(`Quelle est la première lettre du mot ${item.word} ?`);
    api.setHint(()=>{
      api.highlightCorrect();
      api.setBubble(`Le mot ${item.word} commence par la lettre ${item.l}.`);
      api.say(`Le mot ${item.word} commence par la lettre ${item.spoken||item.l}.`,true);
    });
  }
};
