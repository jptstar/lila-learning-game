export const DATA = [
 {l:"A",lower:"a",spoken:"a",word:"avion",emoji:"✈️",article:"un",phrase:"A comme avion"},
 {l:"B",lower:"b",spoken:"bé",word:"ballon",emoji:"🎈",article:"un",phrase:"B comme ballon"},
 {l:"C",lower:"c",spoken:"cé",word:"chat",emoji:"🐱",article:"un",phrase:"C comme chat"},
 {l:"D",lower:"d",spoken:"dé",word:"dinosaure",emoji:"🦖",article:"un",phrase:"D comme dinosaure"},
 {l:"E",lower:"e",spoken:"e",word:"étoile",emoji:"⭐",article:"une",phrase:"E comme étoile"},
 {l:"F",lower:"f",spoken:"effe",word:"fleur",emoji:"🌸",article:"une",phrase:"F comme fleur"},
 {l:"G",lower:"g",spoken:"gé",word:"girafe",emoji:"🦒",article:"une",phrase:"G comme girafe"},
 {l:"H",lower:"h",spoken:"ache",word:"hibou",emoji:"🦉",article:"un",phrase:"H comme hibou"},
 {l:"I",lower:"i",spoken:"i",word:"île",emoji:"🏝️",article:"une",phrase:"I comme île"},
 {l:"J",lower:"j",spoken:"ji",word:"jus",emoji:"🧃",article:"un",phrase:"J comme jus"},
 {l:"K",lower:"k",spoken:"ka",word:"kiwi",emoji:"🥝",article:"un",phrase:"K comme kiwi"},
 {l:"L",lower:"l",spoken:"elle",word:"lion",emoji:"🦁",article:"un",phrase:"L comme lion"},
 {l:"M",lower:"m",spoken:"emme",word:"maison",emoji:"🏠",article:"une",phrase:"M comme maison"},
 {l:"N",lower:"n",spoken:"enne",word:"nuage",emoji:"☁️",article:"un",phrase:"N comme nuage"},
 {l:"O",lower:"o",spoken:"o",word:"orange",emoji:"🍊",article:"une",phrase:"O comme orange"},
 {l:"P",lower:"p",spoken:"pé",word:"poisson",emoji:"🐟",article:"un",phrase:"P comme poisson"},
 {l:"Q",lower:"q",spoken:"ku",word:"quille",emoji:"🎳",article:"une",phrase:"Q comme quille"},
 {l:"R",lower:"r",spoken:"erre",word:"robot",emoji:"🤖",article:"un",phrase:"R comme robot"},
 {l:"S",lower:"s",spoken:"esse",word:"soleil",emoji:"☀️",article:"un",phrase:"S comme soleil"},
 {l:"T",lower:"t",spoken:"té",word:"tortue",emoji:"🐢",article:"une",phrase:"T comme tortue"},
 {l:"U",lower:"u",spoken:"u",word:"usine",emoji:"🏭",article:"une",phrase:"U comme usine"},
 {l:"V",lower:"v",spoken:"vé",word:"vélo",emoji:"🚲",article:"un",phrase:"V comme vélo"},
 {l:"W",lower:"w",spoken:"double vé",word:"wagon",emoji:"🚃",article:"un",phrase:"W comme wagon"},
 {l:"X",lower:"x",spoken:"iks",word:"xylophone",emoji:"🎶",article:"un",phrase:"X comme xylophone"},
 {l:"Y",lower:"y",spoken:"i grec",word:"yaourt",emoji:"🥣",article:"un",phrase:"Y comme yaourt"},
 {l:"Z",lower:"z",spoken:"zède",word:"zèbre",emoji:"🦓",article:"un",phrase:"Z comme zèbre"}
];

export const COUNT_EMOJIS = [
 {emoji:"🍎",name:"pommes",quantity:"de pommes"},
 {emoji:"⭐",name:"étoiles",quantity:"d’étoiles"},
 {emoji:"🐥",name:"poussins",quantity:"de poussins"},
 {emoji:"🚗",name:"voitures",quantity:"de voitures"},
 {emoji:"🍓",name:"fraises",quantity:"de fraises"},
 {emoji:"⚽",name:"ballons",quantity:"de ballons"},
 {emoji:"🌼",name:"fleurs",quantity:"de fleurs"},
 {emoji:"🦋",name:"papillons",quantity:"de papillons"}
];

export function numberToFrench(value){
  const n=Number(value);
  const small={0:"zéro",1:"un",2:"deux",3:"trois",4:"quatre",5:"cinq",6:"six",7:"sept",8:"huit",9:"neuf",10:"dix",11:"onze",12:"douze",13:"treize",14:"quatorze",15:"quinze",16:"seize"};
  if(n in small)return small[n];
  if(n<20)return `dix-${small[n-10]}`;
  if(n===100)return "cent";
  if(n<70){
    const tensNames={2:"vingt",3:"trente",4:"quarante",5:"cinquante",6:"soixante"};
    const tens=Math.floor(n/10),unit=n%10,base=tensNames[tens];
    if(unit===0)return base;
    if(unit===1)return `${base} et un`;
    return `${base}-${small[unit]}`;
  }
  if(n<80){
    if(n===71)return "soixante et onze";
    return n===70?"soixante-dix":`soixante-${numberToFrench(n-60)}`;
  }
  if(n===80)return "quatre-vingts";
  if(n<100)return `quatre-vingt-${numberToFrench(n-80)}`;
  return String(n);
}

export function numberToFrenchSpeech(value){
  return numberToFrench(value).replaceAll("-"," ").replace(/\s+/g," ").trim();
}

export const NUMBER_WORDS = Object.fromEntries(
  Array.from({length:101},(_,i)=>[i,numberToFrench(i)])
);

export const NUMBER_SPEECH_WORDS = Object.fromEntries(
  Array.from({length:101},(_,i)=>[i,numberToFrenchSpeech(i)])
);
