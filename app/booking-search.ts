const normalize=(value:unknown)=>typeof value==='string'?value.normalize('NFKC').toLocaleLowerCase().trim():'';
// Search only explicit fields already authorized by the API, never hidden record metadata.
export function bookingMatches(booking:any,query:string){
 const term=normalize(query);if(!term)return true;
 return ['name','flight','from','to','bookingNumber','ticketNumber','secret'].some(key=>normalize(booking[key]).includes(term));
}
