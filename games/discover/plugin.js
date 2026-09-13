function orderedCatalog(items){
  const letters=[...new Set(items.map(x=>x.l))];
  const groups=Object.fromEntries(letters.map(l=>[l,items.filter(x=>x.l===l)]));
  const result=[];
  for(let row=0;;row++){
    let added=false;
    for(const letter of letters){
      const item=groups[letter][row];
      if(item){result.push(item);added=true;}
    }
    if(!added)break;
  }
  return result;
}

export const discoverGame={
  id:"discover",icon:"📖",title:"Découvre",description:"Découvre les lettres avec tout le catalogue d’images.",
  play(api){
    let item;
    if(api.state.discoverMode==="random"){
      item=api.pickLearningItem({slot:"discover-random",avoidLetter:true});
    }else{
      const ordered=orderedCatalog(api.LETTER_CATALOG);
      item=ordered[api.state.discoverIndex%ordered.length];
    }
    api.setCurrent(item);
    api.setQuestion(`Découvre la lettre ${item.l}`);api.setSubQuestion("Regarde, écoute puis répète.");
    const low=api.state.showLower?`<div class="letterSmall">${item.lower}</div>`:"";
    api.setVisual(`<div class="letterCard"><div class="letterBig">${item.l}</div>${low}<div class="wordLine">${api.artFor(item)} ${item.l} comme ${item.word}</div></div>`);
    api.setBubble(`${item.l} comme ${item.word}.`);
    const spoken=item.spoken||item.l;
    const speech=`Voici la lettre ${spoken}. Le mot ${item.word} commence par la lettre ${spoken}.`;
    api.say(speech);
    api.addAction("🔊 Écouter encore",()=>api.say(speech,true));
    api.addAction(api.state.discoverMode==="random"?"Autre découverte ➜":"Objet suivant ➜",()=>{
      if(api.state.discoverMode!=="random")api.state.discoverIndex++;
      api.next();
    });
    api.setHint(()=>api.say(speech,true));
  }
};
