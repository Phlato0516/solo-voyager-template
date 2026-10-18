"use client";
import {CalendarDays,Coffee,Hotel,MapPin,Plane,ShoppingBag,Utensils} from 'lucide-react';
import {PlaceCover} from './place-cover';
import {placePhotoUrl} from './place-photo';
// Resolve explicit IDs only: repeated names in different cities must not share a cover.
export function eventPlace(event:any,candidates:any[],places:any[]=[]){
 if(!event.placeId)return null;
 const candidate=candidates.find(p=>p.id===event.placeId&&p.trip===event.trip);
 if(candidate)return candidate;
 return places.find(p=>p.id===event.placeId)||null;
}
export function EventThumbnail({event,candidates,places=[]}:{event:any,candidates:any[],places?:any[]}){
 const place=eventPlace(event,candidates,places);
 const bookingType=event.bookingType;
 const Icon=bookingType==='flight'||bookingType==='arrival'?Plane:bookingType==='checkin'||bookingType==='checkout'?Hotel:place?.type==='餐廳'?Utensils:place?.type==='咖啡廳'?Coffee:place?.type==='購物'?ShoppingBag:place?.type==='活動'?CalendarDays:place?MapPin:CalendarDays;
 return <div className="event-thumbnail">{placePhotoUrl(place?.photo)?<PlaceCover data={{...place,type:''}} placeholder=""/>:<div className="event-thumbnail-placeholder" role="img" aria-label={bookingType?'交通或住宿行程':place?.type||'自訂行程'}><Icon size={26} strokeWidth={1.6}/></div>}</div>;
}
