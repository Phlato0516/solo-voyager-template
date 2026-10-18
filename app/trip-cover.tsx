"use client";
import {useState} from 'react';
import {Compass} from 'lucide-react';
import {placePhotoStyle,placePhotoUrl} from './place-photo';

function TripCoverContent({data,index,preview}:{data:any,index:number,preview:boolean}){
 const [failed,setFailed]=useState(false);
 const url=preview&&typeof data.coverPreview==='string'&&data.coverPreview.startsWith('data:image/jpeg;base64,')?data.coverPreview:data.coverKey&&data.id?`/api/trip-cover/${encodeURIComponent(data.id)}?v=${encodeURIComponent(data.version||'')}`:placePhotoUrl(data.photo);
 const hasPhoto=!!url&&!failed;
 return <div className={'trip-art art-'+index%3+(hasPhoto?' trip-art-photo':'')}>
  {hasPhoto?<img className="cover-photo" src={url} alt={preview?'旅程封面裁切預覽':`${data.name||'旅程'}封面`} style={placePhotoStyle(data)} loading={preview?'eager':'lazy'} onError={()=>setFailed(true)}/>:<><span className="city-word">{data.city||'VOYAGE'}</span><Compass size={70} strokeWidth={.8}/></>}
  {data.status&&<span className="tag white">{data.status}</span>}
  {preview&&failed&&<span className="trip-cover-error" role="status">圖片無法載入，請確認圖片網址</span>}
 </div>;
}

export function TripCover({data,index=0,preview=false}:{data:any,index?:number,preview?:boolean}){
 return <TripCoverContent key={[data.photo,data.coverKey,data.coverPreview?.length,data.coverPreview?.slice(-128),data.version].join('|')} data={data} index={index} preview={preview}/>;
}
