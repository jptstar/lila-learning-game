export const discoverGame={
  id:"discover",icon:"📖",title:"Découvre",description:"Une lettre, son nom, un mot et son image.",
  play(api){
    const item=api.DATA[api.state.discoverIndex%api.DATA.length];api.setCurrent(item);
    api.setQuestion(`Découvre la lettre ${item.l}`);api.setSubQuestion("Regarde, écoute puis répète.");
    const low=api.state.showLower?`<div class="letterSmall">${item.lower}</div>`:"";
    api.setVisual(`<div class="letterCard"><div class="letterBig">${item.l}</div>${low}<div class="wordLine">${api.artFor(item)} ${item.l} comme ${item.word}</div></div>`);
    api.setBubble(`${item.l} comme ${item.word}.`);
    const spoken=item.spoken||item.l;
    const speech=`Voici la lettre ${spoken}. Le mot ${item.word} commence par la lettre ${spoken}.`;
    api.say(speech);
    api.addAction("🔊 Écouter encore",()=>api.say(speech,true));
    api.addAction("Lettre suivante ➜",()=>{api.state.discoverIndex++;api.next()});
    api.setHint(()=>api.say(speech,true));
  }
};
