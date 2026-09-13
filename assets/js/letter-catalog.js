const SPOKEN={A:"a",B:"bé",C:"cé",D:"dé",E:"e",F:"effe",G:"gé",H:"ache",I:"i",J:"ji",K:"ka",L:"elle",M:"emme",N:"enne",O:"o",P:"pé",Q:"ku",R:"erre",S:"esse",T:"té",U:"u",V:"vé",W:"double vé",X:"iks",Y:"i grec",Z:"zède"};

const GROUPS={
  A:[["abeille","🐝","une"],["avion","✈️","un"],["arbre","🌳","un"],["ananas","🍍","un"],["araignée","🕷️","une"],["arc-en-ciel","🌈","un"],["ambulance","🚑","une"],["agneau","🐑","un"],["autobus","🚌","un"]],
  B:[["ballon","🎈","un"],["banane","🍌","une"],["bateau","⛵","un"],["baleine","🐋","une"],["bébé","👶","un"],["brosse","🪥","une"],["bonbon","🍬","un"],["biscuit","🍪","un"],["botte","🥾","une"]],
  C:[["chat","🐱","un"],["chien","🐶","un"],["camion","🚚","un"],["carotte","🥕","une"],["cerise","🍒","une"],["canard","🦆","un"],["cadeau","🎁","un"],["crabe","🦀","un"],["couronne","👑","une"]],
  D:[["dinosaure","🦖","un"],["dauphin","🐬","un"],["dragon","🐉","un"],["dé","🎲","un"],["douche","🚿","une"],["dromadaire","🐪","un"],["doigt","☝️","un"],["doudou","🧸","un"],["domino","🎲","un"]],
  E:[["étoile","⭐","une"],["éléphant","🐘","un"],["escargot","🐌","un"],["échelle","🪜","une"],["écharpe","🧣","une"],["enveloppe","✉️","une"],["école","🏫","une"],["éponge","🧽","une"],["écureuil","🐿️","un"]],
  F:[["fleur","🌸","une"],["fraise","🍓","une"],["fusée","🚀","une"],["fourmi","🐜","une"],["feuille","🍃","une"],["fromage","🧀","un"],["fantôme","👻","un"],["flocon","❄️","un"],["fourchette","🍴","une"]],
  G:[["girafe","🦒","une"],["gâteau","🎂","un"],["guitare","🎸","une"],["grenouille","🐸","une"],["glace","🍦","une"],["gant","🧤","un"],["gorille","🦍","un"],["grappe","🍇","une"],["goutte","💧","une"]],
  H:[["hibou","🦉","un"],["hérisson","🦔","un"],["hélicoptère","🚁","un"],["hamburger","🍔","un"],["hippopotame","🦛","un"],["hamster","🐹","un"],["hot-dog","🌭","un"],["haricot","🫘","un"]],
  I:[["île","🏝️","une"],["igloo","🧊","un"],["insecte","🐞","un"],["imprimante","🖨️","une"],["image","🖼️","une"],["iceberg","🧊","un"],["immeuble","🏢","un"],["instrument","🎺","un"]],
  J:[["jus","🧃","un"],["jardin","🌻","un"],["jouet","🧸","un"],["jupe","👗","une"],["journal","📰","un"],["jambe","🦵","une"],["jambon","🥓","un"],["jaguar","🐆","un"]],
  K:[["kiwi","🥝","un"],["kangourou","🦘","un"],["koala","🐨","un"],["kayak","🛶","un"],["kimono","👘","un"],["ketchup","🍅","le"],["karaté","🥋","le"]],
  L:[["lion","🦁","un"],["lune","🌙","une"],["lapin","🐰","un"],["livre","📖","un"],["locomotive","🚂","une"],["lampe","💡","une"],["lézard","🦎","un"],["luge","🛷","une"],["lunettes","👓","les"]],
  M:[["maison","🏠","une"],["mouton","🐑","un"],["moto","🏍️","une"],["montagne","⛰️","une"],["melon","🍈","un"],["méduse","🪼","une"],["main","✋","une"],["marteau","🔨","un"],["montre","⌚","une"]],
  N:[["nuage","☁️","un"],["nid","🪺","un"],["nez","👃","un"],["noix","🌰","une"],["nœud","🎀","un"],["neige","❄️","la"],["nuit","🌙","la"],["ninja","🥷","un"]],
  O:[["orange","🍊","une"],["ours","🐻","un"],["œuf","🥚","un"],["oiseau","🐦","un"],["ordinateur","💻","un"],["oignon","🧅","un"],["orque","🐋","une"],["oreille","👂","une"]],
  P:[["poisson","🐟","un"],["pomme","🍎","une"],["papillon","🦋","un"],["panda","🐼","un"],["pizza","🍕","une"],["poussin","🐥","un"],["parapluie","☂️","un"],["piano","🎹","un"],["poire","🍐","une"],["pingouin","🐧","un"]],
  Q:[["quille","🎳","une"],["quiche","🥧","une"],["queue","🐒","une"],["question","❓","une"],["quatre","4️⃣","le"]],
  R:[["robot","🤖","un"],["renard","🦊","un"],["raisin","🍇","un"],["requin","🦈","un"],["rose","🌹","une"],["radio","📻","une"],["raquette","🏸","une"],["roue","🛞","une"],["rhinocéros","🦏","un"]],
  S:[["soleil","☀️","un"],["souris","🐭","une"],["serpent","🐍","un"],["sapin","🌲","un"],["singe","🐒","un"],["sandwich","🥪","un"],["seau","🪣","un"],["sucette","🍭","une"],["skateboard","🛹","un"]],
  T:[["tortue","🐢","une"],["train","🚆","un"],["tomate","🍅","une"],["tigre","🐯","un"],["tracteur","🚜","un"],["téléphone","📱","un"],["tasse","☕","une"],["tambour","🥁","un"],["tente","⛺","une"]],
  U:[["usine","🏭","une"],["univers","🌌","un"],["uniforme","👕","un"],["ustensile","🥄","un"],["ukulélé","🎸","un"]],
  V:[["vélo","🚲","un"],["voiture","🚗","une"],["vache","🐄","une"],["valise","🧳","une"],["volcan","🌋","un"],["violon","🎻","un"],["verre","🥛","un"],["voilier","⛵","un"],["veste","🧥","une"]],
  W:[["wagon","🚃","un"],["week-end","🏖️","un"],["wifi","📶","le"],["wok","🍳","un"],["water-polo","🤽","le"]],
  X:[["xylophone","🎶","un"]],
  Y:[["yaourt","🥣","un"],["yoyo","🪀","un"],["yak","🐂","un"],["yéti","👣","un"],["yoga","🧘","le"]],
  Z:[["zèbre","🦓","un"],["zoo","🦁","un"],["zéro","0️⃣","le"],["zigzag","〰️","un"],["zeste","🍋","un"]]
};

export const LETTER_CATALOG=Object.entries(GROUPS).flatMap(([l,items])=>items.map(([word,emoji,article])=>({
  l,lower:l.toLowerCase(),spoken:SPOKEN[l]||l,word,emoji,article,phrase:`${l} comme ${word}`
})));

export const LETTER_CATALOG_SIZE=LETTER_CATALOG.length;
