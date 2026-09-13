const LETTERS=[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

function fontFor(style){
  return style==="cursive"?'"Snell Roundhand","Segoe Script","Brush Script MT",cursive':'"Arial Rounded MT Bold","Trebuchet MS",sans-serif';
}

function guideMarks(letter,style){
  if(style==="cursive")return [{x:78,y:245,t:"① →"},{x:185,y:105,t:"② ↘"}];
  if("OCGQ".includes(letter))return [{x:235,y:90,t:"① ↙"},{x:105,y:205,t:"② ↘"}];
  if("BPRD".includes(letter))return [{x:105,y:75,t:"① ↓"},{x:155,y:100,t:"② ↘"}];
  if("AEFMHNKTXYZVW".includes(letter))return [{x:115,y:75,t:"① ↓"},{x:220,y:100,t:"② ↘"}];
  return [{x:125,y:75,t:"① ↓"},{x:205,y:150,t:"② →"}];
}

export const tracingGame={
  id:"tracing",icon:"✍️",title:"J’écris",description:"Repasse les lettres avec ton doigt en suivant le modèle.",
  play(api){
    const letter=api.pickUnique(LETTERS,"trace-letter",x=>x);
    api.setCurrent({type:"trace",letter});
    api.setQuestion(`Écris la lettre ${letter}.`);
    api.setSubQuestion("Choisis le style puis repasse doucement sur la lettre.");
    api.setBubble("Suis les traits et les petites flèches sans trop déborder.");
    api.say(`Repasse la lettre ${letter} avec ton doigt.`);

    api.setVisual(`<div class="tracePanel">
      <div class="traceToolbar">
        <select id="traceCase" aria-label="Majuscule ou minuscule"><option value="upper">Majuscule</option><option value="lower">Minuscule</option></select>
        <select id="traceStyle" aria-label="Style d’écriture"><option value="script">Script</option><option value="cursive">Attaché</option></select>
      </div>
      <div class="traceCanvasWrap"><canvas id="traceCanvas" class="traceCanvas" width="360" height="360"></canvas></div>
      <div class="traceHint">Commence près du repère ① puis suis les flèches.</div>
      <div id="traceStatus" class="traceStatus"></div>
      <div class="traceActions"><button id="traceClear">🧽 Effacer</button><button id="traceCheck" class="primary">✓ Vérifier</button><button id="traceNext">Lettre suivante ➜</button></div>
    </div>`);

    const canvas=document.querySelector("#traceCanvas");
    const ctx=canvas.getContext("2d");
    const mask=document.createElement("canvas");mask.width=360;mask.height=360;const mctx=mask.getContext("2d",{willReadFrequently:true});
    const caseSelect=document.querySelector("#traceCase"),styleSelect=document.querySelector("#traceStyle"),status=document.querySelector("#traceStatus");
    let drawing=false,last=null,totalPoints=0,outsidePoints=0,pathLength=0;

    function currentGlyph(){return caseSelect.value==="lower"?letter.toLowerCase():letter;}
    function drawTemplate(){
      const glyph=currentGlyph(),style=styleSelect.value,font=fontFor(style);
      ctx.clearRect(0,0,360,360);mctx.clearRect(0,0,360,360);
      const size=style==="cursive"?235:245;
      for(const c of [ctx,mctx]){
        c.save();c.font=`${size}px ${font}`;c.textAlign="center";c.textBaseline="middle";
        if(c===ctx){c.fillStyle="#e8eef4";c.strokeStyle="#cbd9e5";c.lineWidth=3;}else{c.fillStyle="#000";c.strokeStyle="#000";c.lineWidth=22;}
        c.fillText(glyph,180,190);c.strokeText(glyph,180,190);c.restore();
      }
      ctx.save();ctx.font="700 17px sans-serif";ctx.fillStyle="rgba(61,94,124,.55)";
      guideMarks(letter,style).forEach(mark=>ctx.fillText(mark.t,mark.x,mark.y));ctx.restore();
      totalPoints=0;outsidePoints=0;pathLength=0;last=null;status.textContent="";status.className="traceStatus";
    }

    function pos(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*360/r.width,y:(event.clientY-r.top)*360/r.height};}
    function inside(x,y){
      const px=Math.max(0,Math.min(359,Math.round(x))),py=Math.max(0,Math.min(359,Math.round(y)));
      const data=mctx.getImageData(Math.max(0,px-5),Math.max(0,py-5),Math.min(11,360-Math.max(0,px-5)),Math.min(11,360-Math.max(0,py-5))).data;
      for(let i=3;i<data.length;i+=4)if(data[i]>20)return true;
      return false;
    }
    function begin(event){drawing=true;canvas.setPointerCapture?.(event.pointerId);last=pos(event);event.preventDefault();}
    function move(event){
      if(!drawing)return;const p=pos(event);event.preventDefault();
      ctx.save();ctx.strokeStyle="#6c63ff";ctx.lineWidth=17;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.restore();
      const dx=p.x-last.x,dy=p.y-last.y;pathLength+=Math.hypot(dx,dy);totalPoints++;if(!inside(p.x,p.y))outsidePoints++;last=p;
    }
    function end(){drawing=false;last=null;}

    canvas.addEventListener("pointerdown",begin);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",end);canvas.addEventListener("pointercancel",end);
    caseSelect.addEventListener("change",drawTemplate);styleSelect.addEventListener("change",drawTemplate);
    document.querySelector("#traceClear").onclick=drawTemplate;
    document.querySelector("#traceNext").onclick=()=>api.next();
    document.querySelector("#traceCheck").onclick=()=>{
      const outsideRatio=totalPoints?outsidePoints/totalPoints:1;
      const ok=totalPoints>=18&&pathLength>=180&&outsideRatio<=.30;
      if(ok){status.textContent="✅ Très bien, ton tracé suit la lettre !";status.className="traceStatus ok";api.say("Très bien ! Ton tracé suit la lettre.",true);}
      else{status.textContent="↩️ Essaie encore en restant davantage sur le modèle.";status.className="traceStatus error";api.say("Essaie encore doucement en restant sur la lettre.",true);}
    };
    api.setHint(()=>api.say("Commence au repère numéro un, puis suis les flèches et le trait gris.",true));
    drawTemplate();
  }
};
