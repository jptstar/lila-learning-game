export const findImageGame={
  id:"find-image",icon:"🖼️",title:"Trouve l’image",description:"Écoute un mot et choisis le bon dessin.",
  play(api){
    const slot=api.state.gameId==="smart"?"smart-word":"find-image-word";
    const item=api.pickLearningItem({slot});api.setCurrent(item);
    api.setQuestion(`Trouve l’image qui correspond au mot « ${item.word} ».`);
    api.setSubQuestion("Observe les trois dessins puis choisis le bon.");
    api.setVisual(`<div class="illustration"><div style="font-size:76px">👀</div><div class="label">Observe les 3 dessins</div></div>`);

    const wrong=api.shuffle(api.LETTER_CATALOG.filter(x=>x.word!==item.word&&x.emoji!==item.emoji)).slice(0,2);
    const opts=[item,...wrong].map(x=>({key:x.word,html:`${api.artFor(x)}<span class="choiceWord">${x.word}</span>`,className:"imageChoice"}));
    api.renderChoices(opts,item.word,{item,slotKey:"find-image"});
    api.setBubble(`Je cherche le mot « ${item.word} ».`);
    api.say(`Trouve l'image qui correspond au mot ${item.word}.`);
    api.setHint(()=>{api.highlightCorrect();api.setBubble(`Le bon dessin correspond au mot « ${item.word} ».`);});
  }
};
