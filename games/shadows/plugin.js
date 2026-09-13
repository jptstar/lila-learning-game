function namedObject(item){return `${item.article||"un"} ${item.word}`;}

export const shadowsGame={
  id:"shadows",icon:"🌑",title:"Les ombres",description:"Observe une ombre et retrouve l’objet correspondant.",
  play(api){
    const target=api.pickLearningItem({slot:"shadow-object"});
    const wrong=api.shuffle(api.LETTER_CATALOG.filter(x=>x.word!==target.word&&x.emoji!==target.emoji)).slice(0,2);
    const current={...target,type:"shadow"};api.setCurrent(current);
    api.setQuestion("À quel objet appartient cette ombre ?");
    api.setSubQuestion("Observe la silhouette puis choisis le bon objet.");
    api.setVisual(`<div class="shapeStage"><div class="shapeTarget"><span class="shadowTarget">${target.emoji}</span></div></div>`);
    const opts=[target,...wrong].map(x=>({key:x.word,label:x.word,speech:namedObject(x),html:`<span>${x.emoji}</span>`,className:"shadowChoice"}));
    api.renderChoices(opts,target.word,{item:current,slotKey:"shadows"});
    api.setBubble("Regarde bien la forme de l’ombre.");api.say("À quel objet appartient cette ombre ?");
    api.setHint(()=>{api.highlightCorrect();api.say(`Cette ombre correspond à ${namedObject(target)}.`,true);});
  }
};
