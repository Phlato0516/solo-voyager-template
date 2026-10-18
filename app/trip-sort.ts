export function sortTrips(trips:any[],today:string,mode='departure'){
 const group=(t:any)=>t.status==='已封存'?3:t.status==='已完成'?2:t.status==='旅行中'||t.start<=today&&t.end>=today?0:t.start>today?1:2;
 return [...trips].sort((a,b)=>{
  if(mode==='created')return (b.creationOrder||0)-(a.creationOrder||0)||String(a.id).localeCompare(String(b.id));
  const ga=group(a),gb=group(b);if(ga!==gb)return ga-gb;
  const cmp=String(a.start||'').localeCompare(String(b.start||''));
  return (ga>=2?-cmp:cmp)||(b.creationOrder||0)-(a.creationOrder||0)||String(a.id).localeCompare(String(b.id));
 });
}
