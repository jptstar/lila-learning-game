export function rand(n){ return Math.floor(Math.random()*n); }
export function sample(arr){ return arr[rand(arr.length)]; }
export function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
export function uniqueRandomInts(min,max,count,exclude=[]){
  const pool=[];
  for(let n=min;n<=max;n++) if(!exclude.includes(n)) pool.push(n);
  return shuffle(pool).slice(0,count);
}
export function nearNumberDistractors(target,min=1,max=20,count=2){
  const candidates=[];
  const preferred=[target-10,target+10,target-1,target+1,target-2,target+2,target-5,target+5];
  preferred.forEach(v=>{if(v>=min&&v<=max&&v!==target&&!candidates.includes(v))candidates.push(v)});
  for(let n=min;n<=max;n++) if(n!==target&&!candidates.includes(n)) candidates.push(n);
  return shuffle(candidates.slice(0,Math.max(count,8))).slice(0,count);
}
