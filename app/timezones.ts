export const timezones=[
 {value:'Asia/Taipei',label:'台灣（台北／桃園，UTC+8）'},
 {value:'Asia/Tokyo',label:'日本（大阪／東京／京都，UTC+9）'},
 {value:'Asia/Seoul',label:'韓國（首爾／釜山，UTC+9）'},
 {value:'Asia/Hong_Kong',label:'香港（UTC+8）'},
 {value:'Asia/Macau',label:'澳門（UTC+8）'},
 {value:'Asia/Shanghai',label:'中國（上海／北京／深圳，UTC+8）'},
 {value:'Asia/Singapore',label:'新加坡（UTC+8）'},
 {value:'Asia/Bangkok',label:'泰國（曼谷，UTC+7）'},
 {value:'Asia/Ho_Chi_Minh',label:'越南（胡志明市／河內，UTC+7）'},
 {value:'Asia/Kuala_Lumpur',label:'馬來西亞（吉隆坡，UTC+8）'},
 {value:'Asia/Manila',label:'菲律賓（馬尼拉，UTC+8）'},
 {value:'Asia/Dubai',label:'阿聯（杜拜，UTC+4）'},
 {value:'Europe/Zurich',label:'瑞士（蘇黎世，依日期採冬／夏令時間）'},
 {value:'Europe/Paris',label:'法國（巴黎，依日期採冬／夏令時間）'},
 {value:'Europe/London',label:'英國（倫敦，依日期採冬／夏令時間）'},
 {value:'Europe/Berlin',label:'德國（柏林，依日期採冬／夏令時間）'},
 {value:'America/Los_Angeles',label:'美國西岸（洛杉磯／舊金山，依日期採冬／夏令時間）'},
 {value:'America/New_York',label:'美國東岸（紐約，依日期採冬／夏令時間）'},
 {value:'Pacific/Honolulu',label:'美國（夏威夷，UTC−10）'},
 {value:'Australia/Sydney',label:'澳洲（雪梨，依日期採冬／夏令時間）'},
 {value:'Pacific/Auckland',label:'紐西蘭（奧克蘭，依日期採冬／夏令時間）'}
];
export function timezoneLabel(value:string){return timezones.find(t=>t.value===value)?.label||value;}
