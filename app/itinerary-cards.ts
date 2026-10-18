import {clockMinutes,movableEvent,shiftedEventTime} from './itinerary-time';
export const plannerViews=['cards','timeline','classic'] as const;
export type PlannerView=typeof plannerViews[number];
export function plannerView(value:any):PlannerView{return plannerViews.includes(value)?value:'cards';}
export function orderedItinerary(events:any[]){return [...events].sort((a,b)=>(clockMinutes(a.start)??1440)-(clockMinutes(b.start)??1440)||String(a.id).localeCompare(String(b.id)));}
/** Only propose a new time for the selected card. No other event is rewritten. */
export function insertionTime(event:any,beforeId:string|null,events:any[]){
 if(!movableEvent(event))return null;
 if(beforeId===event.id)return {start:event.start,end:event.end};
 const original=orderedItinerary(events).filter(e=>clockMinutes(e.start)!==null);
 const source=original.findIndex(e=>e.id===event.id);if(source<0)return null;
 const others=original.filter(e=>e.id!==event.id),index=beforeId===null?others.length:others.findIndex(e=>e.id===beforeId);if(index<0)return null;
 if(index===source)return {start:event.start,end:event.end};
 const previous=others[index-1],next=others[index],duration=clockMinutes(event.end)!-clockMinutes(event.start)!;
 let target:number;
 if(previous){const previousStart=clockMinutes(previous.start)!;const earliest=Math.ceil((previousStart+1)/15)*15;const afterPrevious=Math.ceil((clockMinutes(previous.end)??previousStart+30)/15)*15;
  if(next){const latest=Math.floor((clockMinutes(next.start)!-1)/15)*15;if(earliest>latest)return null;target=afterPrevious<=latest?afterPrevious:earliest;}
  else target=Math.max(earliest,afterPrevious);
 }else if(next)target=Math.floor((clockMinutes(next.start)!-duration)/15)*15;else return {start:event.start,end:event.end};
 if(target<0||target+duration>1439)return null;
 return shiftedEventTime(event,target);
}

export function pointerInsertionTarget(sourceId:string,x:number,y:number,bounds:{left:number,right:number,top:number,bottom:number},rows:{id:string,top:number,bottom:number}[]):string|null|undefined{
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<bounds.left-30||x>bounds.right+30||y<bounds.top-40||y>bounds.bottom+40)return undefined;
 const targets=rows.filter(row=>row.id!==sourceId);if(!targets.length)return undefined;
 return targets.find(row=>y<(row.top+row.bottom)/2)?.id??null;
}
