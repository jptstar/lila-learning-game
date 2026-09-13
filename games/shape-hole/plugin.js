import {SHAPES,shapeSvg} from "../../assets/js/shapes.js";

export const shapeHoleGame={
  id:"shape-hole",icon:"🧩",title:"La bonne forme",description:"Trouve la forme qui rentre exactement dans le trou.",
  play(api){
    const target=api.pickUnique(SHAPES,"shape-hole-target",x=>x.id);
    const wrong=api.shuffle(SHAPES.filter(x=>x.id!==target.id)).slice(0,2);
    const current={type:"shape",name:target.name,id:target.id};api.setCurrent(current);
    api.setQuestion("Quelle forme rentre dans ce trou ?");
    api.setSubQuestion("Compare les contours.");
    api.setVisual(`<div class="shapeStage"><div class="shapeTarget">${shapeSvg(target,{hole:true,size:126})}</div></div>`);
    const opts=[target,...wrong].map(x=>({key:x.id,label:x.name,speech:x.name,html:shapeSvg(x,{size:88})}));
    api.renderChoices(opts,target.id,{item:current,slotKey:"shape-hole"});
    api.setBubble("Cherche la forme qui a exactement le même contour.");api.say("Quelle forme rentre exactement dans ce trou ?");
    api.setHint(()=>{api.highlightCorrect();api.say(`Le ${target.name} rentre dans ce trou.`,true);});
  }
};
