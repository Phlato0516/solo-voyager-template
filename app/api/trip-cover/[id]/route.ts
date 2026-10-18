import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
 const u=await getChatGPTUser();if(!u)return new Response('Unauthorized',{status:401,headers});
 const {id}=await params;
 const trip=await env.DB!.prepare("SELECT * FROM records WHERE id=? AND kind='trip'").bind(id).first() as any;
 if(!trip)return new Response('Not found',{status:404,headers});
 if(trip.owner!==u.userId){const member=await env.DB!.prepare('SELECT role FROM members WHERE trip=? AND user=?').bind(id,u.userId).first() as any;if(!member)return new Response('Forbidden',{status:403,headers});}
 const key=JSON.parse(trip.data).coverKey;if(typeof key!=='string'||!key)return new Response('Not found',{status:404,headers});
 const obj=await env.BUCKET!.get(key);
 if(!obj||obj.customMetadata?.trip!==id||obj.customMetadata?.purpose!=='trip-cover')return new Response('Not found',{status:404,headers});
 return new Response(obj.body,{headers:{...headers,'Content-Type':'image/jpeg'}});
}
