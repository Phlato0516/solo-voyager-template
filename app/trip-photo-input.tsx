"use client";
import {useEffect,useRef,useState} from 'react';
import {maxTripPhotoBytes} from './trip-photo-upload';

export async function prepareTripPhoto(file:File){
 if(file.size>25*1024*1024)throw Error('請選擇 25MB 以下的照片');
 if(file.type&&!file.type.startsWith('image/'))throw Error('請選擇照片檔案');
 const objectUrl=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=objectUrl;try{await image.decode()}catch{throw Error('瀏覽器無法讀取這張照片，請改選 JPG、PNG 或 WebP 圖片')}
  if(!image.naturalWidth||!image.naturalHeight)throw Error('無法讀取照片');
  const scale=Math.min(1,1920/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const context=canvas.getContext('2d');if(!context)throw Error('無法處理照片');
  context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
  let blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));
  if(blob&&blob.size>maxTripPhotoBytes)blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',.6));
  if(!blob||blob.size>maxTripPhotoBytes)throw Error('照片壓縮後仍過大，請先縮小照片再選取');
  const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('無法讀取照片'));reader.readAsDataURL(blob!)});
  return {data,type:'image/jpeg'};
 }finally{URL.revokeObjectURL(objectUrl)}
}

export function TripPhotoInput({data,onChange,disabled=false,onBusy}:{data:any,onChange:(patch:any)=>void,disabled?:boolean,onBusy:(busy:boolean)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const generation=useRef(0);
 useEffect(()=>()=>{generation.current++;onBusy(false)},[]);
 return <section className="field full trip-photo-input">
  <strong>旅程封面照片</strong>
  <label className="field"><span>從相簿或電腦上傳</span><input type="file" accept="image/*" disabled={disabled||busy} onChange={async e=>{
   const file=e.target.files?.[0];e.target.value='';if(!file)return;
   const current=++generation.current;setBusy(true);onBusy(true);setError('');
   try{const upload=await prepareTripPhoto(file);if(current===generation.current)onChange({photo:'',coverKey:'',coverUpload:upload,coverPreview:upload.data,photoFit:'cover',photoX:'50',photoY:'50'});}
   catch(error){if(current===generation.current)setError(error instanceof Error?error.message:'無法處理照片，請改選 JPG、PNG 或 WebP 圖片');}
   finally{if(current===generation.current){setBusy(false);onBusy(false)}}
  }}/></label>
  {busy&&<p role="status">正在縮小照片…</p>}
  {error&&<p role="alert" className="form-note">{error}。若手機照片無法讀取，請先轉成 JPG。</p>}
  {!busy&&data.coverUpload&&<p className="muted">照片已備妥，按「儲存」後上傳。</p>}
  {!data.coverUpload&&data.coverKey&&<p className="muted">目前使用已上傳的照片。</p>}
  <label className="field"><span>或貼上封面照片網址</span><input type="url" value={data.photo||''} disabled={disabled||busy} placeholder="https://…" onChange={e=>onChange({photo:e.target.value,coverKey:'',coverUpload:undefined,coverPreview:undefined})}/></label>
  <p className="muted">照片上限 25MB，會自動縮小至最長邊 1920 像素並轉為 JPEG 後儲存。</p>
  {(data.photo||data.coverKey||data.coverUpload)&&<button className="btn secondary" type="button" disabled={disabled||busy} onClick={()=>onChange({photo:'',coverKey:'',coverUpload:undefined,coverPreview:undefined})}>移除封面照片</button>}
 </section>;
}
