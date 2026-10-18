export const timelinePixelsPerMinute=1.5;
export const timelineStep=15;
export function clockMinutes(value:any){if(typeof value!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))return null;const [h,m]=value.split(':').map(Number);return h*60+m;}
export function minuteClock(value:number){return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;}
export function movableEvent(event:any){const start=clockMinutes(event.start),end=clockMinutes(event.end);return !event.linked&&!event.bookingId&&!String(event.id||'').startsWith('booking:')&&start!==null&&end!==null&&end>start;}
export function shiftedEventTime(event:any,target:number){
 if(!movableEvent(event)||!Number.isFinite(target))return null;
 const duration=clockMinutes(event.end)!-clockMinutes(event.start)!;
 const latest=Math.floor((1439-duration)/timelineStep)*timelineStep;
 const start=Math.max(0,Math.min(latest,Math.round(target/timelineStep)*timelineStep));
 return {start:minuteClock(start),end:minuteClock(start+duration)};
}
export function timeConflicts(event:any,time:{start:string,end:string},events:any[]){const start=clockMinutes(time.start)!,end=clockMinutes(time.end)!;return events.filter(other=>{
 if(other.id===event.id||other.trip!==event.trip||other.date!==event.date)return false;
 const os=clockMinutes(other.start);if(os===null)return false;const oe=clockMinutes(other.end)??os+1;
 const shared=!event.participants?.length||!other.participants?.length||event.participants.some((p:string)=>other.participants.includes(p));return shared&&os<end&&oe>start;
});}
/** Allocate overlapping visual blocks into columns so short/linked cards remain readable. */
export function timelineLayout(events:any[]){
 const sorted=events.filter(e=>clockMinutes(e.start)!==null).map(event=>{const start=clockMinutes(event.start)!;const end=Math.max(start+40,clockMinutes(event.end)??start+40);return {event,start,end,column:0,columns:1}}).sort((a,b)=>a.start-b.start||a.event.id.localeCompare(b.event.id));
 let group:typeof sorted=[],ends:number[]=[];let groupEnd=-1;
 const finish=()=>{for(const item of group)item.columns=ends.length;group=[];ends=[]};
 for(const item of sorted){if(item.start>=groupEnd){finish();groupEnd=-1;}let column=ends.findIndex(end=>end<=item.start);if(column<0)column=ends.length;ends[column]=item.end;item.column=column;group.push(item);groupEnd=Math.max(groupEnd,item.end);}finish();return sorted;
}
