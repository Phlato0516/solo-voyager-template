export const countries=['台灣','日本','韓國','香港','澳門','中國','新加坡','泰國','越南','馬來西亞','美國','加拿大','英國','法國','德國','瑞士','義大利','西班牙','澳洲','紐西蘭'];
export const geoFields=['country','city','district'] as const;
export const unclassified='__unclassified__';
const value=(p:any,k:string)=>typeof p[k]==='string'?p[k].trim():'';
export function geographyLabel(p:any){return geoFields.map(k=>value(p,k)).filter(Boolean).join(' · ');}
export function geographyMatches(p:any,selection:Partial<Record<string,string>>){return geoFields.every(k=>!selection[k]||(selection[k]===unclassified?!value(p,k):value(p,k)===selection[k]));}
export function geographyOptions(places:any[],key:string,parents:Partial<Record<string,string>>={}){const pool=places.filter(p=>geographyMatches(p,parents));const counts=new Map<string,number>();for(const p of pool){const k=value(p,key)||unclassified;counts.set(k,(counts.get(k)||0)+1);}return [...counts].sort(([a],[b])=>a===unclassified?1:b===unclassified?-1:a.localeCompare(b,'zh-TW')).map(([value,count])=>({value,label:value===unclassified?'未分類':value,count}));}
export function cleanGeography(input:any){const result:Record<'country'|'city'|'district',string>={country:'',city:'',district:''};for(const k of geoFields){if(input[k]!=null&&typeof input[k]!=='string')throw Error(`${k} 必須是文字`);const v=(input[k]||'').trim();if(v.length>100)throw Error('國家、城市與區域各限 100 字');result[k]=v;}return result;}
const cityCountries:Record<string,string>={'東京':'日本','大阪':'日本','京都':'日本','福岡':'日本','札幌':'日本','名古屋':'日本','沖繩':'日本','首爾':'韓國','釜山':'韓國','仁川':'韓國','台北':'台灣','新北':'台灣','台中':'台灣','高雄':'台灣','蘇黎世':'瑞士','日內瓦':'瑞士','琉森':'瑞士','漢堡':'德國','柏林':'德國','慕尼黑':'德國','紐約':'美國','洛杉磯':'美國','舊金山':'美國','香港':'香港','澳門':'澳門','新加坡':'新加坡'};
const districts:Record<string,[string,string]>={};for(const district of ['惠比壽','恵比寿','新宿','澀谷','渋谷','銀座','秋葉原','代官山','六本木','淺草','丸之內','丸の内','池袋','中野','日本橋','品川'])districts[district]=['日本','東京'];for(const district of ['弘大','明洞','聖水','성수','龍山','鐘路','仁寺洞','江南','汝矣島'])districts[district]=['韓國','首爾'];
export function suggestGeography(p:any){const before=cleanGeography(p);const data={...before};let reason='請手動確認國家、城市與區域';const parts=before.city.split(/[／/]/).map(s=>s.trim()).filter(Boolean);const first=parts[0];const match=districts[before.city];
 if(parts.length===2&&cityCountries[first]&&(!before.country||before.country===cityCountries[first])&&!before.district){data.country=before.country||cityCountries[first];data.city=first;data.district=parts[1];reason='原城市欄包含城市與區域，建議拆開';}
 else if(match&&(!before.country||before.country===match[0])&&(!before.district||before.district===before.city)){data.country=before.country||match[0];data.city=match[1];data.district=before.district||before.city;reason='原城市欄可能填的是區域，請確認建議';}
 else if(!before.country&&cityCountries[before.city]){data.country=cityCountries[before.city];reason='依既有城市提出國家建議，請確認';}
 const changed=geoFields.some(k=>data[k]!==before[k]);return {id:p.id,version:p.version,name:p.name,before,data,reason,selected:changed};
}
