"use client";
import {useEffect,useRef,useState} from 'react';
import {GripVertical,LockKeyhole,Undo2} from 'lucide-react';
import {EventThumbnail} from './event-thumbnail';
import {clockMinutes,minuteClock,movableEvent,shiftedEventTime,timeConflicts,timelineLayout,timelinePixelsPerMinute as scale} from './itinerary-time';
type Move={event:any,time:{start:string,end:string},restoring?:boolean};
export function ItineraryTimeline({events,allEvents,candidates,places,editable,onMove,onEdit,canEdit,name}:{events:any[],allEvents:any[],candidates:any[],places:any[],editable:boolean,onMove:(event:any,time:{start:string,end:string})=>Promise<{version:number}>,onEdit:(event:any)=>void,canEdit:(event:any)=>boolean,name:(id:string)=>string}){
 const [detail,setDetail]=useState<any>(null);
 const conflictRef=useRef<HTMLDivElement>(null);
 const scroller=useRef<HTMLDivElement>(null),gesture=useRef<any>(null),draftRef=useRef<Move|null>(null),working=useRef(false);
 const [draft,setDraft]=useState<Move|null>(null),[pending,setPending]=useState<Move|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[undo,setUndo]=useState<{event:any,version:number}|null>(null);
 const update=(move:Move|null)=>{draftRef.current=move;setDraft(move)};
 const positioned=timelineLayout(events.map(e=>draft&&draft.event.id===e.id?{...e,...draft.time}:e)).sort((a,b)=>a.event.id.localeCompare(b.event.id));
 useEffect(()=>{const first=events.map(e=>clockMinutes(e.start)).filter((m):m is number=>m!==null);if(scroller.current)scroller.current.scrollTop=Math.max(0,(first.length?Math.min(...first)-45:8*60)*scale)},[]);
 useEffect(()=>{let frame:number;const tick=()=>{const g=gesture.current,el=scroller.current;if(g&&el&&g.moved){const rect=el.getBoundingClientRect();const delta=g.y<rect.top+45?-8:g.y>rect.bottom-45?8:0;if(delta){el.scrollTop+=delta;const time=shiftedEventTime(g.event,g.start+(g.y-g.origin+el.scrollTop-g.scroll)/scale);if(time)update({event:g.event,time});}}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return ()=>cancelAnimationFrame(frame)},[]);
 useEffect(()=>{if(!editable){gesture.current=null;draftRef.current=null;setDraft(null);setPending(null);setUndo(null)}},[editable]);
 async function commit(move:Move,restoring=false){
  if(working.current||!editable)return;working.current=true;setBusy(true);setError('');setPending(null);update(null);
  try{const result=await onMove(move.event,move.time);setUndo(restoring?null:{event:move.event,version:result.version});setMessage(`${move.event.name}已${restoring?'復原':'調整'}為 ${move.time.start}–${move.time.end}`)}catch(e){setError(e instanceof Error?e.message:'無法儲存時間，請重新載入');if(restoring)setUndo(null)}finally{working.current=false;setBusy(false)}
 }
 function propose(move:Move|null){update(null);if(!move||!move.restoring&&move.time.start===move.event.start&&move.time.end===move.event.end)return;if(timeConflicts(move.event,move.time,allEvents).length)setPending(move);else void commit(move,!!move.restoring)}
 useEffect(()=>{if(pending)conflictRef.current?.focus()},[pending]);
 const disabled=busy||!!pending;
 return <div className="itinerary-time-view">
  <div className="time-view-help"><p>{editable?'拖曳 ⠿ 把手調整時間；每格 15 分鐘，停留時長保持不變。':'可查看每日時間軸。'}{editable&&<small>把手也可用 ↑／↓ 調整、Enter 儲存、Esc 取消。</small>}</p>{undo&&editable&&<button className="btn secondary" disabled={disabled} onClick={()=>propose({event:{...undo.event,version:undo.version},time:{start:undo.event.start,end:undo.event.end},restoring:true})}><Undo2 size={15}/>復原上次移動</button>}</div>
  {error&&<div className="notice" role="alert">{error}</div>}
  <div className="time-move-status" role="status" aria-live="polite">{draft?`${draft.event.name}：${draft.time.start}–${draft.time.end}（尚未儲存）`:busy?'正在儲存時間…':message}</div>
  {pending&&<div className="time-conflict notice" ref={conflictRef} tabIndex={-1} onKeyDown={e=>{if(e.key==='Escape')setPending(null)}} role="alertdialog" aria-label="行程時間重疊"><strong>調整為 {pending.time.start}–{pending.time.end}，部分參加者已有其他安排：</strong><p>{timeConflicts(pending.event,pending.time,allEvents).map(e=>e.name).join('、')}</p><button className="btn" onClick={()=>void commit(pending,!!pending.restoring)}>仍要調整時間</button><button className="btn secondary" onClick={()=>{setPending(null);setMessage('已取消時間調整')}}>取消</button></div>}
  {detail&&<div className="notice neutral time-details"><strong>{detail.name} · {detail.start||'時間待補'}{detail.end?'–'+detail.end:''}</strong><p>{(detail.participants||[]).map(name).join('、')}</p><p>{detail.note}</p><button className="link" onClick={()=>setDetail(null)}>關閉詳細資訊</button></div>}
  <div className="time-grid-scroll" ref={scroller} tabIndex={0} aria-label="每日行程時間軸，可捲動查看全天">
   <div className="time-grid" style={{height:1440*scale}}>
    {Array.from({length:24},(_,h)=><div className="time-hour" key={h} style={{top:h*60*scale,height:60*scale}}><span>{minuteClock(h*60)}</span></div>)}
    <div className="time-grid-events">
    {positioned.map(({event:e,start,end,column,columns})=>{const canMove=editable&&movableEvent(e);return <article key={e.id} className={'time-event'+(e.linked?' time-event-linked':'')+(draft?.event.id===e.id?' time-event-moving':'')} style={{top:start*scale,height:(end-start)*scale-3,left:`${column/columns*100}%`,width:`calc(${100/columns}% - 4px)`}}>
     <div className="time-event-bar">
      {canMove?<button className="time-drag-handle" type="button" disabled={disabled} aria-label={`拖曳調整 ${e.name} 的時間`} title="拖曳，或用上下方向鍵調整時間" onPointerDown={ev=>{if(ev.button!==0||disabled||gesture.current)return;ev.preventDefault();ev.currentTarget.focus();update(null);setError('');const snapshot=events.find(x=>x.id===e.id)||e;gesture.current={event:snapshot,start:clockMinutes(snapshot.start),origin:ev.clientY,y:ev.clientY,scroll:scroller.current?.scrollTop||0,moved:false};ev.currentTarget.setPointerCapture(ev.pointerId)}} onPointerMove={ev=>{const g=gesture.current;if(!g)return;g.y=ev.clientY;if(Math.abs(g.y-g.origin)<5&&!g.moved)return;g.moved=true;const time=shiftedEventTime(g.event,g.start+(g.y-g.origin+(scroller.current?.scrollTop||0)-g.scroll)/scale);if(time)update({event:g.event,time})}} onPointerUp={ev=>{const g=gesture.current;if(!g)return;gesture.current=null;const move=g.moved?draftRef.current:null;if(ev.currentTarget.hasPointerCapture(ev.pointerId))ev.currentTarget.releasePointerCapture(ev.pointerId);propose(move)}} onPointerCancel={()=>{gesture.current=null;update(null)}} onLostPointerCapture={()=>{if(gesture.current){gesture.current=null;update(null)}}} onKeyDown={ev=>{if(ev.key==='Escape'){ev.preventDefault();gesture.current=null;update(null);setPending(null)}else if(ev.key==='Enter'&&draftRef.current?.event.id===e.id){ev.preventDefault();propose(draftRef.current)}else if(['ArrowUp','ArrowDown'].includes(ev.key)){ev.preventDefault();if(disabled)return;const current=draftRef.current?.event.id===e.id?draftRef.current:null;const snapshot=current?.event||events.find(x=>x.id===e.id)||e;const time=shiftedEventTime(snapshot,clockMinutes(current?.time.start||snapshot.start)!+(ev.key==='ArrowUp'?-15:15));if(time)update({event:snapshot,time})}}}><GripVertical size={17}/></button>:e.linked?<LockKeyhole size={13} aria-label="預訂連動，時間由預訂管理"/>:null}
      <strong>{e.start}{e.end?'–'+e.end:' · 當地時間'}</strong>
      <button className="time-event-open" type="button" onClick={()=>canEdit(e)?onEdit(e):setDetail(e)} disabled={disabled}>{canEdit(e)?'編輯':'詳細'}</button>
     </div>
     <div className="time-event-info"><EventThumbnail event={e} candidates={candidates} places={places}/><div><strong title={e.name}>{e.name}</strong><small>{e.linked?'預訂連動 · ':''}{(e.participants||[]).map(name).join('、')||'未指定參加者'}</small></div></div>
    </article>})}
    </div>
   </div>
  </div>
  {!events.length&&<p className="muted">這一天尚未安排活動，可從未排程地點加入或新增安排。</p>}
  {events.filter(e=>clockMinutes(e.start)===null).length>0&&<div className="time-unspecified"><h3>時間待補</h3>{events.filter(e=>clockMinutes(e.start)===null).map(e=><button className="btn secondary" key={e.id} onClick={()=>canEdit(e)?onEdit(e):setDetail(e)}>{e.name}</button>)}</div>}
 </div>;
}
