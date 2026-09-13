export const findImageGame={
  id:"find-image",icon:"🖼️",title:"Trouve l’image",description:"Écoute un mot et choisis le bon dessin.",
  play(api){
    const item=api.pickLearningItem();api.setCurrent(item);
    api.setQuestion(`Où est ${item.article} ${item.word} ?`);api.setSubQuestion("Choisis l’image qui correspond exactement au mot.");
    api.setVisual(`<div class="illustration"><div style="font-size:76px">👀</div><div class="label">Observe les 3 dessins</div></div>`);
    const wrong=api.shuffle(api.DATA.filter(x=>x!==item)).slice(0,2);
    const opts=[item,...wrong].map(x=>({key:x.word,html:`${api.artFor(x)}<span class="choiceWord">${x.word}</span>`,className:"imageChoice"}));
    api.renderChoices(opts,item.word,{item,slotKey:"find-image"});
    api.setBubble(`Je cherche ${item.article} ${item.word}.`);api.say(`Où est ${item.article} ${item.word} ?`);
    api.setHint(()=>{api.highlightCorrect();api.setBubble("Regarde bien : la bonne image clignote doucement.")});
  }
};
