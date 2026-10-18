// Project itinerary cards from booking records so edits/deletions cannot leave stale copies.
export function bookingEvents(b:any){
 if(b.syncItinerary===false)return [];
 const participants=Array.isArray(b.participants)?b.participants:[b.owner];
 const base={kind:'event',trip:b.trip,owner:b.owner,version:b.version,bookingId:b.id,linked:true,participants};
 if(b.type==='機票'){
  const depart=b.depart||'';const arrive=b.arrive||'';const date=depart.slice(0,10)||b.date;
  if(!date)return [];
  const details=[b.flight,`${b.from||'出發機場'} → ${b.to||'抵達機場'}`,`出發：${depart.replace('T',' ')||date+'（時間待補）'} ${b.timezoneFrom||'（時區待補）'}`,`抵達：${arrive.replace('T',' ')||'待補'} ${b.timezoneTo||'（時區待補）'}`,b.terminal].filter(Boolean).join(' · ');
  const flight={...base,id:`booking:${b.id}:flight`,name:`✈ ${b.flight||b.name} · ${b.from||''} → ${b.to||''}`,date,start:depart.slice(11,16)||'',end:'',note:details,bookingType:'flight'};
  return arrive&&arrive.slice(0,10)!==date?[flight,{...base,id:`booking:${b.id}:arrival`,name:`✈ 抵達 ${b.to||b.name}`,date:arrive.slice(0,10),start:arrive.slice(11,16),end:'',note:details,bookingType:'arrival'}]:[flight];
 }
 if(b.type==='住宿')return [b.date&&{...base,id:`booking:${b.id}:checkin`,name:`飯店入住 · ${b.name}`,date:b.date,start:b.checkInTime||'',end:'',note:b.address||'',bookingType:'checkin'},b.endDate&&{...base,id:`booking:${b.id}:checkout`,name:`飯店退房 · ${b.name}`,date:b.endDate,start:b.checkOutTime||'',end:'',note:b.address||'',bookingType:'checkout'}].filter(Boolean);
 return [];
}
