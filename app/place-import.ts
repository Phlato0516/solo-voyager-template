import {validDate} from './data-validation';
export const placeFields=['name','localName','country','city','district','type','address','map','naver','otherMap','photo','photoFit','photoX','photoY','hours','source','checked','note'];
const normalized=(v:any)=>String(v??'').normalize('NFKC').trim().toLowerCase();
const blank=(v:any)=>v==null||typeof v==='string'&&!v.trim();
export function placeKey(p:any){return ['name','country','city','district','address'].map(k=>normalized(p[k])).join('\u001f');}
export function parsePlaceImport(input:unknown){
 let payload:any=input;if(typeof input==='string'){let raw=input.replace(/^\uFEFF/,'').trim();const fence=raw.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);if(fence)raw=fence[1];try{payload=JSON.parse(raw)}catch{throw Error('內容不是有效 JSON。請使用半形雙引號，不要有多餘逗號。')}}
 let items:any=payload;if(payload&&!Array.isArray(payload)&&typeof payload==='object'){const key=['places','items','data','records'].find(k=>Array.isArray(payload[k]));items=key?payload[key]:'name' in payload?[payload]:null;}
 if(!Array.isArray(items)||!items.length)throw Error('請提供至少一筆地點的 JSON 陣列，或 places 陣列。');if(items.length>200)throw Error('一次最多匯入 200 個地點，請分批上傳。');
 const aliases:Record<string,string>={'景點':'景點','景点':'景點','attraction':'景點','餐廳':'餐廳','餐厅':'餐廳','restaurant':'餐廳','購物':'購物','购物':'購物','shopping':'購物','活動':'活動','活动':'活動','activity':'活動','咖啡廳':'咖啡廳','咖啡厅':'咖啡廳','咖啡':'咖啡廳','cafe':'咖啡廳','會合':'活動','其他':'景點'};
 const fieldAliases:Record<string,string>={localName:'jp',district:'area',photo:'image',source:'website',note:'notes'};
 return items.map((item:any,index:number)=>{const bad=(m:string):never=>{throw Error(`第 ${index+1} 筆：${m}`)};if(!item||typeof item!=='object'||Array.isArray(item))bad('地點需為物件。');const p:any={};for(const key of placeFields){if(item[key]!==undefined&&typeof item[key]!=='string')bad(`${key} 必須是文字。`);const alias=fieldAliases[key];if(alias&&item[alias]!=null&&typeof item[alias]!=='string')bad(`${alias} 必須是文字。`);p[key]=(item[key]?.trim()||item[alias]?.trim()||'');}
 const extras:string[]=[];for(const [key,label] of [['date','想去日期'],['duration','停留時間'],['reservation','預約資訊']]){const value=item[key];if(value==null||value==='')continue;if(typeof value!=='string'&&!(key==='duration'&&typeof value==='number'&&Number.isFinite(value)))bad(`${key} 欄位格式錯誤。`);const text=String(value).trim();if(text)extras.push(`${label}：${text}${key==='duration'?' 分鐘':''}`);}p.note=[p.note,...extras].filter(Boolean).join('\n');
 if(p.photoFit&&!['cover','contain'].includes(p.photoFit))bad('photoFit 須為 cover 或 contain。');for(const k of ['photoX','photoY'])if(p[k]&&(!Number.isFinite(Number(p[k]))||Number(p[k])<0||Number(p[k])>100))bad(`${k} 須為 0～100 的文字數值。`);for(const k of ['country','city','district'])if(p[k].length>100)bad(`${k} 最多 100 字。`);if(!p.name)bad('缺少 name（地點名稱）。');p.type=p.type?aliases[p.type.toLowerCase()]:'景點';if(!p.type)bad('type 請填景點、餐廳、購物、活動或咖啡廳。');for(const k of ['map','naver','otherMap','photo','source'])if(p[k]){try{const url=new URL(p[k]);if(!['http:','https:'].includes(url.protocol))bad(`${k} 須為 http／https 網址。`)}catch{bad(`${k} 不是有效網址。`)}}if(p.checked&&!validDate(p.checked))bad('checked 須為 YYYY-MM-DD 日期。');if(JSON.stringify(p).length>100000)bad('單筆地點資料太大。');return p;});
}
export function planPlaceImport(items:any[],existing:any[],fillEmpty=false){
 const staged=existing.map(p=>({...p}));const added:any[]=[];const updates=new Map<string,{id:string,fields:Record<string,string>}>();const decisions:{status:string,fields:string[]}[]=[];
 for(const p of items){let matches=staged.filter(q=>placeKey(q)===placeKey(p));if(fillEmpty&&!matches.length)matches=staged.filter(q=>normalized(q.name)===normalized(p.name)&&['country','city','district','address'].every(k=>blank(q[k])||blank(p[k])||normalized(q[k])===normalized(p[k])));
 if(matches.length>1){decisions.push({status:'ambiguous',fields:[]});continue;}
 const target=matches[0];if(!target){const fresh={...p};staged.push(fresh);added.push(fresh);decisions.push({status:'add',fields:[]});continue;}
 if(!fillEmpty){decisions.push({status:'skip',fields:[]});continue;}
 const fields=placeFields.filter(k=>blank(target[k])&&!blank(p[k]));for(const k of fields)target[k]=p[k];
 if(!fields.length){decisions.push({status:'skip',fields:[]});continue;}
 if(target.id){const update:{id:string,fields:Record<string,string>}=updates.get(target.id)||{id:target.id,fields:{}};for(const k of fields)update.fields[k]=p[k];updates.set(target.id,update);}
 decisions.push({status:target.id?'fill':'merge',fields});
 }
 return {added,updates:[...updates.values()],decisions,skipped:decisions.filter(d=>['skip','ambiguous','merge'].includes(d.status)).length};
}
