import {SHAPES,shapeSvg,shapeWithArticle} from "../../assets/js/shapes.js";

const ROTATIONS=[30,45,60,90,120,135];

export const shapeRotationGame={
  id:"shape-rotation",icon:"🔄",title:"Tourne la forme",description:"Imagine la rotation pour trouver la forme qui rentre dans le trou.",
  play(api){
    const eligible=SHAPES.filter(x=>x.id!=="circle");
    const target=api.pickUnique(eligible,"shape-rotation-target",x=>x.id);
    const wrong=api.shuffle(eligible.filter(x=>x.id!==target.id)).slice(0,2);
    const rotation=ROTATIONS[api.rand(ROTATIONS.length)];
    const current={type:"shape",name:target.name,id:target.id};api.setCurrent(current);
    const namedShape=shapeWithArticle(target);
    api.setQuestion("Quelle forme pourrait rentrer si tu la tournes ?");
    api.setSubQuestion("Imagine chaque forme en train de tourner.");
    api.setVisual(`<div class="shapeStage"><div class="shapeTarget">${shapeSvg(target,{hole:true,size:126})}</div></div>`);
    const opts=[target,...wrong].map((x,i)=>({key:x.id,label:x.name,speech:x.name,html:shapeSvg(x,{rotation:(rotation+i*35)%180,size:88})}));
    api.renderChoices(opts,target.id,{item:current,slotKey:"shape-rotation"});
    api.setBubble("Tu peux tourner les formes dans ta tête.");api.say("Quelle forme pourrait rentrer dans ce trou si tu la tournes ?");
    api.setHint(()=>{api.highlightCorrect();api.say(`Même tournée, la bonne forme reste ${namedShape}.`,true);});
  }
};
