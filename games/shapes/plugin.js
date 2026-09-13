import {SHAPES,shapeSvg,shapeWithArticle} from "../../assets/js/shapes.js";

export const shapesGame={
  id:"shapes",icon:"🔷",title:"Les formes",description:"Écoute le nom d’une forme et retrouve-la.",
  play(api){
    const target=api.pickUnique(SHAPES,"shape-basic",x=>x.id);
    const wrong=api.shuffle(SHAPES.filter(x=>x.id!==target.id)).slice(0,2);
    const current={type:"shape",name:target.name,id:target.id};api.setCurrent(current);
    const namedShape=shapeWithArticle(target);
    api.setQuestion(`Trouve ${namedShape}.`);
    api.setSubQuestion("Choisis la bonne forme.");
    api.setVisual(`<div class="shapeStage"><div class="shapeTarget" style="font-size:76px">👀</div></div>`);
    const opts=[target,...wrong].map(x=>({key:x.id,label:x.name,speech:shapeWithArticle(x),html:shapeSvg(x,{size:92})}));
    api.renderChoices(opts,target.id,{item:current,slotKey:"shapes"});
    api.setBubble(`Je cherche ${namedShape}.`);api.say(`Trouve ${namedShape}.`);
    api.setHint(()=>{api.highlightCorrect();api.say(`La bonne forme est ${namedShape}.`,true);});
  }
};
