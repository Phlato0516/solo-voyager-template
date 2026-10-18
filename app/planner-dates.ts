import {validDate} from './data-validation';
export type DateMode='scheduled'|'all';
export function plannerDates(trip:any,events:any[]){
 const scheduled=[...new Set<string>(events.map(e=>e.date).filter(validDate))].sort();
 const all=new Set<string>(scheduled);
 if(validDate(trip?.start)&&validDate(trip?.end)&&trip.start<=trip.end){const cursor=new Date(trip.start+'T12:00:00Z');for(let i=0;i<366;i++){const d=cursor.toISOString().slice(0,10);if(d>trip.end)break;all.add(d);cursor.setUTCDate(cursor.getUTCDate()+1);}}
 return {scheduled,all:[...all].sort()};
}
export function selectedPlannerDate(current:string,dates:string[]){return dates.includes(current)?current:dates.find(d=>d>=current)||dates[0]||'';}
export function nextTripDate(current:string,trip:any){if(!validDate(current)||!validDate(trip?.start)||!validDate(trip?.end))return '';const next=new Date(current+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);const d=next.toISOString().slice(0,10);return d>=trip.start&&d<=trip.end?d:'';}
