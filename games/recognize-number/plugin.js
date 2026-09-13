import {nearNumberDistractors} from "../../assets/js/utils.js";

export const recognizeNumberGame={
  id:"recognize-number",icon:"🔎",title:"Reconnais le nombre",description:"Écoute Lila et retrouve le bon nombre dans la plage choisie.",
  play(api){
    const min=Math.max(0,Math.min(100,api.state.minNumber??0));
    const max=Math.max(min,Math.min(100,api.state.maxNumber??10));
    const slot=api.state.gameId==="smart"?"smart-number":"recognize-number";
    const number=api.pickNumber(min,max,slot);
    const word=api.NUMBER_WORDS[number];
    const spoken=api.NUMBER_SPEECH_WORDS[number];
    const current={type:"recognize-number",number,word};api.setCurrent(current);

    api.setQuestion("Quel nombre dit Lila ?");
    api.setSubQuestion(`Écoute puis choisis le bon nombre entre ${min} et ${max}.`);
    api.setVisual(`<div class="numberCard"><div class="numberMystery">❓</div></div>`);
    const wrong=nearNumberDistractors(number,min,max,2);
    api.renderChoices([number,...wrong].map(v=>({key:v,html:String(v)})),number,{item:current,slotKey:"recognize-number"});
    api.setBubble(`Je cherche ${word}.`);api.say(`Trouve le nombre ${spoken}.`);
    api.setHint(()=>{api.highlightCorrect();api.setBubble(`Je cherche ${word}.`);api.say(`Je cherche le nombre ${spoken}.`,true);});
  }
};
