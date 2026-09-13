function genderOf(item){return item.article==="une"?"f":item.article==="un"?"m":null;}
function startsWithVowel(word){return /^[aeiouyàâäéèêëîïôöùûüœ]/i.test(word);}

export const genderGame={
  id:"gender",icon:"🗣️",title:"Un ou une ?",description:"Choisis le bon article pour chaque image.",
  play(api){
    const candidates=api.LETTER_CATALOG.filter(x=>genderOf(x));
    const item=api.pickUnique(candidates,"gender-word",x=>x.word);
    const gender=genderOf(item);
    const useDefinite=!startsWithVowel(item.word)&&!/^h/i.test(item.word)&&Math.random()<.45;
    const correct=useDefinite?(gender==="m"?"le":"la"):(gender==="m"?"un":"une");
    const wrong=useDefinite?(correct==="le"?"la":"le"):(correct==="un"?"une":"un");
    const phrase=`${correct} ${item.word}`;
    const current={...item,type:"article",correctPhrase:phrase};api.setCurrent(current);
    api.setQuestion(`On dit « ${correct} ${item.word} » ou « ${wrong} ${item.word} » ?`);
    api.setSubQuestion("Choisis le bon article.");
    api.setVisual(`<div class="articleCard"><div class="articleEmoji">${item.emoji}</div><div class="articleWord">${item.word}</div></div>`);
    const opts=[correct,wrong].map(article=>({key:article,label:article,speech:article,html:article}));
    api.renderChoices(opts,correct,{item:current,slotKey:"gender"});
    api.setBubble(`Quel article va avec le mot ${item.word} ?`);api.say(`On dit ${correct} ${item.word} ou ${wrong} ${item.word} ?`);
    api.setHint(()=>{api.highlightCorrect();api.say(`On dit ${phrase}.`,true);});
  }
};
