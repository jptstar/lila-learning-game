export const SHAPES=[
  {id:"circle",name:"cercle",path:`<circle cx="50" cy="50" r="31"/>`},
  {id:"square",name:"carré",path:`<rect x="20" y="20" width="60" height="60" rx="4"/>`},
  {id:"triangle",name:"triangle",path:`<polygon points="50,15 84,80 16,80"/>`},
  {id:"rectangle",name:"rectangle",path:`<rect x="13" y="28" width="74" height="44" rx="4"/>`},
  {id:"oval",name:"ovale",path:`<ellipse cx="50" cy="50" rx="36" ry="25"/>`},
  {id:"diamond",name:"losange",path:`<polygon points="50,12 86,50 50,88 14,50"/>`},
  {id:"star",name:"étoile",path:`<polygon points="50,10 61,37 90,39 67,57 75,86 50,70 25,86 33,57 10,39 39,37"/>`},
  {id:"heart",name:"cœur",path:`<path d="M50 84C18 63 10 48 16 32C22 16 43 15 50 30C57 15 78 16 84 32C90 48 82 63 50 84Z"/>`},
  {id:"pentagon",name:"pentagone",path:`<polygon points="50,12 86,39 72,82 28,82 14,39"/>`},
  {id:"hexagon",name:"hexagone",path:`<polygon points="28,14 72,14 92,50 72,86 28,86 8,50"/>`}
];

export function shapeSvg(shape,{rotation=0,hole=false,size=110}={}){
  const fill=hole?"none":"currentColor";
  const stroke=hole?"currentColor":"none";
  const width=hole?5:0;
  const dash=hole?"stroke-dasharray=\"8 6\"":"";
  return `<svg class="shapeSvg ${hole?"shapeHole":""}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-label="${shape.name}" style="transform:rotate(${rotation}deg)"><g fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" ${dash}>${shape.path}</g></svg>`;
}
