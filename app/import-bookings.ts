import {validDate,validLocalTime,validateBookingFields} from './data-validation';
// Accept common JSON packaging without inventing missing travel details.
export function parseBookingImport(text:string){
 let raw=text.replace(/^\uFEFF/,'').trim();
 const fenced=raw.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);if(fenced)raw=fenced[1];
 let payload:any;try{payload=JSON.parse(raw)}catch{throw Error('檔案內容不是有效 JSON。請確認使用半形雙引號、沒有多餘逗號，且不是 PDF 或網頁檔。')}
 let items:any=payload;
 if(payload&&typeof payload==='object'&&!Array.isArray(payload)){
  const keys=['bookings','items','records','data'];const key=keys.find(k=>Array.isArray(payload[k]));
  if(key)items=payload[key];else if('name' in payload||'type' in payload)items=[payload];else throw Error('找不到預訂清單。請使用 JSON 陣列 [ {...} ]，或放在 bookings 陣列中。');
 }
 if(!Array.isArray(items))throw Error('最外層需為預訂陣列 [ {...} ]。');
 if(!items.length)throw Error('檔案內沒有預訂資料。');if(items.length>50)throw Error('一次最多匯入 50 筆，請拆成多個檔案。');
 return items.map((item:any,index:number)=>{
  const bad=(message:string):never=>{throw Error(`第 ${index+1} 筆${typeof item?.name==='string'?'「'+item.name+'」':''}：${message}`)};
  if(!item||typeof item!=='object'||Array.isArray(item))bad('需為一筆預訂物件。');
  const d={...item};if(typeof d.name!=='string'||!d.name.trim())bad('缺少 name（預訂名稱）。');d.name=d.name.trim();
  const t=typeof d.type==='string'?d.type.trim().toLowerCase():'';
  const types:Record<string,string>={'機票':'機票','机票':'機票','flight':'機票','住宿':'住宿','酒店':'住宿','飯店':'住宿','hotel':'住宿','accommodation':'住宿'};
  d.type=types[t];if(!d.type)bad('type 須為「機票」或「住宿」（也接受 flight／hotel）。');
  if(d.type==='機票'){
   for(const key of ['depart','arrive']){
    if(typeof d[key]!=='string'||!d[key].trim())bad(`缺少 ${key}（${key==='depart'?'出發':'抵達'}當地日期時間）。`);
    d[key]=d[key].trim().replace(' ','T').replace(/:00$/,(match:string,offset:number)=>offset===16?'':match);
    if(!validLocalTime(d[key]))bad(`${key} 格式需為 2026-10-22T09:00；請使用當地時間，不加 Z 或 UTC 位移。`);
   }
   for(const key of ['timezoneFrom','timezoneTo']){
    if(typeof d[key]!=='string'||!d[key].trim())bad(`缺少 ${key}（時區）。台灣填 Asia/Taipei，韓國填 Asia/Seoul。`);
    d[key]=d[key].trim();try{new Intl.DateTimeFormat('en',{timeZone:d[key]}).format()}catch{bad(`${key}「${d[key]}」不是有效時區；日本填 Asia/Tokyo，韓國填 Asia/Seoul。`)}
   }
   d.date=d.depart.slice(0,10);d.endDate=d.arrive.slice(0,10);
  }else{
   for(const key of ['date','endDate'])if(!validDate(d[key]))bad(`${key}（${key==='date'?'入住':'退房'}日期）需為 2026-10-22 格式。`);
   if(d.endDate<d.date)bad('退房日期不能早於入住日期。');
  }
  // Uploaded files cannot supply record identity or synthetic linkage.
  for(const key of ['id','owner','version','trip','kind','bookingId','linked','timezoneFromCustom','timezoneToCustom'])delete d[key];
  for(const key of ['attachment','receipt','file','creationOrder'])delete d[key];
  try{validateBookingFields(d)}catch(e:any){bad(e.message)}
  return d;
 });
}
