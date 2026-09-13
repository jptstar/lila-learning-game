import {nearNumberDistractors} from "../../assets/js/utils.js";

export const recognizeNumberGame={
  id:"recognize-number",icon:"🔎",title:"Reconnais le nombre",description:"Écoute Lila et retrouve les nombres dans la plage choisie, jusqu’à 100.",
  play(api){
    const min=Math.max(1,Math.min(100,api.state.minNumber||1));
    const max=Math.max(min,Math.min(100,api.state.maxNumber||20));
    const number=min+api.rand(max-min+1);const word=api.NUMBER_WORDS[number];
    const current={type:"recognize-number",number,word};api.setCurrent(current);
    api.setQuestion("Quel nombre dit Lila ?");api.setSubQuestion(`Écoute puis choisis le bon nombre entre ${min} et ${max}.`);
    api.setVisual(`<div class="numberCard"><div class="numberMystery">❓</div></div>`);
    const wrong=nearNumberDistractors(number,min,max,2);const vals=[number,...wrong];
    api.renderChoices(vals.map(v=>({key:v,html:String(v)})),number,{item:current,slotKey:"recognize-number"});
    api.setBubble(`Je cherche ${word}.`);api.say(`Trouve le nombre ${word}.`);
    api.setHint(()=>{api.highlightCorrect();api.setBubble(`Petit indice : je cherche ${word}.`);api.say(`Je cherche le nombre ${word}.`,true)});
  }
};
