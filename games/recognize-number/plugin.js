import {nearNumberDistractors} from "../../assets/js/utils.js";

export const recognizeNumberGame={
  id:"recognize-number",icon:"🔎",title:"Reconnais le nombre",description:"Écoute Lila et retrouve les chiffres de 1 à 20.",
  play(api){
    const number=1+api.rand(20);const word=api.NUMBER_WORDS[number];const current={type:"recognize-number",number,word};api.setCurrent(current);
    api.setQuestion("Quel nombre dit Lila ?");api.setSubQuestion("Écoute puis choisis le bon nombre de 1 à 20.");
    api.setVisual(`<div class="numberCard"><div class="numberMystery">❓</div></div>`);
    const wrong=nearNumberDistractors(number,1,20,2);const vals=[number,...wrong];
    api.renderChoices(vals.map(v=>({key:v,html:String(v)})),number,{item:current,slotKey:"recognize-number"});
    api.setBubble(`Je cherche ${word}.`);api.say(`Trouve le nombre ${word}.`);
    api.setHint(()=>{api.highlightCorrect();api.setBubble(`Petit indice : je cherche ${word}.`);api.say(`Je cherche le nombre ${word}.`,true)});
  }
};
