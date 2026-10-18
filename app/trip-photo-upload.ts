export const maxTripPhotoBytes=1_500_000;
/** Accept only the JPEG produced by the photo picker; never trust a MIME label alone. */
export function parseTripCoverUpload(input:any){
 if(!input||typeof input!=='object'||input.type!=='image/jpeg'||typeof input.data!=='string'||input.data.length>2_000_100)throw Error('封面需為 1.5MB 以下的 JPEG 圖片');
 const match=/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.data);
 if(!match||match[1].length%4!==0)throw Error('封面圖片格式不正確');
 const bytes=Uint8Array.from(atob(match[1]),c=>c.charCodeAt(0));
 if(bytes.length>maxTripPhotoBytes||bytes.length<4||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)throw Error('封面圖片格式或大小不正確');
 return bytes;
}
