import { openDB,type IDBPDatabase } from 'idb';
import { payloadSchemas,localDate,defaults,type Template,type EntityType,type RecordData,type Operation } from '../domain';
export type Pending=Operation&{key:string;userId:string;sequence:number;state:'pending'|'conflict'|'invalid';error?:string;server?:RecordData|null};
let dbPromise:Promise<IDBPDatabase>|undefined;
const db=()=>dbPromise??=openDB('fit-vlad',2,{upgrade(db,old){if(old<1){db.createObjectStore('records',{keyPath:'key'});db.createObjectStore('outbox',{keyPath:'key'});db.createObjectStore('meta')}if(old<2)db.createObjectStore('drafts',{keyPath:'key'})}});
export const channel=()=>typeof BroadcastChannel==='undefined'?null:new BroadcastChannel('fit-vlad');
let broadcast:BroadcastChannel|null=null;
export function changed(){window.dispatchEvent(new Event('fit-data'));broadcast??=channel();broadcast?.postMessage('changed')}
export async function identity(){return (await db()).get('meta','owner')}
export async function setIdentity(owner:{id:string;name:string;email:string}){await (await db()).put('meta',owner,'owner')}
export async function records(userId:string):Promise<RecordData[]>{return (await (await db()).getAll('records')).filter(r=>r.userId===userId).map(({key,...r})=>r)}
export async function pending(userId:string):Promise<Pending[]>{return (await (await db()).getAll('outbox')).filter(r=>r.userId===userId).sort((a,b)=>a.sequence-b.sequence)}
export async function save(userId:string,entityType:EntityType,id:string,payload:unknown,action:Operation['action']='put',expectedLastOperationId?:string){
 const valid=payloadSchemas[entityType].parse(payload);const database=await db();const tx=database.transaction(['records','outbox','meta'],'readwrite');
 const key=`${userId}:${id}`;const current=await tx.objectStore('records').get(key);if(expectedLastOperationId&&current?.lastOperationId!==expectedLastOperationId){tx.abort();await tx.done.catch(()=>{});throw new Error('This record changed in another tab. Your form is kept. Reload to compare before saving.')}const queue=(await tx.objectStore('outbox').getAll()).filter(o=>o.userId===userId&&o.entityId===id).sort((a,b)=>a.sequence-b.sequence);
 let sequence=(await tx.objectStore('meta').get('sequence')??0)+1;
 // A routine opened weeks ago has not actually started until its first saved set.
 if(entityType==='set'&&action==='put'&&(valid as any).completedAt){
  const all=(await tx.objectStore('records').getAll()).filter(r=>r.userId===userId);
  const exercise=all.find(r=>r.id===(valid as any).sessionExerciseId&&!r.deletedAt);
  const session=all.find(r=>r.id===exercise?.payload.sessionId&&!r.deletedAt&&r.entityType==='session');
  const childIds=new Set(all.filter(r=>r.entityType==='exercise'&&r.payload.sessionId===session?.id).map(r=>r.id));
  const hasSets=all.some(r=>r.entityType==='set'&&childIds.has(r.payload.sessionExerciseId)&&r.payload.completedAt);
  if(session?.payload.status==='active'&&!hasSets&&session.payload.localDate===localDate(session.payload.timezone,new Date(session.payload.startedAt))){
   const timestamp=(valid as any).completedAt;const date=localDate(session.payload.timezone,new Date(timestamp));
   if(date!==session.payload.localDate){
    const payload={...session.payload,localDate:date,startedAt:timestamp};
    const queued=(await tx.objectStore('outbox').getAll()).filter(o=>o.userId===userId&&o.entityId===session.id).sort((a,b)=>a.sequence-b.sequence);
    const operationId=crypto.randomUUID();const baseRevision=queued.length?queued.at(-1).baseRevision+1:session.revision;
    await tx.objectStore('records').put({...session,payload,lastOperationId:operationId});
    await tx.objectStore('outbox').put({key:operationId,userId,sequence:sequence++,state:'pending',operationId,entityType:'session',entityId:session.id,baseRevision,action:'put',payload,schemaVersion:1});
    const settings=all.find(r=>r.entityType==='settings'&&!r.deletedAt);
    if(all.filter(r=>r.entityType==='session'&&!r.deletedAt).length===1&&settings?.payload.planStartDate===session.payload.localDate){
     const settingsPayload={...settings.payload,planStartDate:date};const settingsOperationId=crypto.randomUUID();
     const settingsQueue=(await tx.objectStore('outbox').getAll()).filter(o=>o.userId===userId&&o.entityId===settings.id).sort((a,b)=>a.sequence-b.sequence);
     const settingsRevision=settingsQueue.length?settingsQueue.at(-1).baseRevision+1:settings.revision;
     await tx.objectStore('records').put({...settings,payload:settingsPayload,lastOperationId:settingsOperationId});
     await tx.objectStore('outbox').put({key:settingsOperationId,userId,sequence:sequence++,state:'pending',operationId:settingsOperationId,entityType:'settings',entityId:settings.id,baseRevision:settingsRevision,action:'put',payload:settingsPayload,schemaVersion:1});
    }

   }
  }
 }
 const baseRevision=queue.length?queue.at(-1).baseRevision+1:current?.revision??0;
 const operationId=crypto.randomUUID();const operation:Pending={key:operationId,userId,sequence,state:'pending',operationId,entityType,entityId:id,baseRevision,action,payload:valid,schemaVersion:1};
 await tx.objectStore('records').put({key,id,userId,entityType,revision:current?.revision??0,lastOperationId:operationId,deletedAt:action==='delete'?new Date().toISOString():null,payload:valid});
 await tx.objectStore('outbox').put(operation);await tx.objectStore('meta').put(sequence,'sequence');await tx.done;changed();
}
// One transaction creates the full routine. Concurrent tabs see the same active session.
export async function startSession(userId:string,template:Template,timezone:string){
 const database=await db();const tx=database.transaction(['records','outbox','meta'],'readwrite');
 const existing=(await tx.objectStore('records').getAll()).filter(r=>r.userId===userId);
 const active=existing.find(r=>r.userId===userId&&r.entityType==='session'&&!r.deletedAt&&r.payload.status==='active');
 if(active){await tx.done;return active.id}
 const id=crypto.randomUUID();let sequence=await tx.objectStore('meta').get('sequence')??0;
 const entries:{id:string;entityType:EntityType;payload:unknown}[]=[{id,entityType:'session',payload:{templateSnapshot:template,localDate:localDate(timezone),timezone,startedAt:new Date().toISOString(),endedAt:null,status:'active',notes:''}},...template.exercises.map((t,order)=>({id:crypto.randomUUID(),entityType:'exercise' as const,payload:{sessionId:id,exerciseSnapshot:t.exercise,order,skipped:false}}))];
 if(!existing.some(r=>r.entityType==='session'&&!r.deletedAt)){
  const current=existing.find(r=>r.entityType==='settings'&&!r.deletedAt);
  const settings=current?.payload??defaults;
  const startDate=localDate(timezone);
  const weekday=new Date(startDate+'T12:00:00Z').getUTCDay();
  const slots=settings.trainingDays.map((day:number,index:number)=>({day,index})).filter((x:{day:number})=>x.day!==0);
  let days=slots.map((x:{day:number})=>x.day);
  // Keep the selected training weekdays and place the first routine on the start day.
  if(weekday!==0&&!days.includes(weekday))days[0]=weekday;
  days.sort((a:number,b:number)=>(a-weekday+7)%7-(b-weekday+7)%7);
  const order=[...slots].sort((a:{index:number},b:{index:number})=>(a.index-(template.dayIndex-1)+5)%5-(b.index-(template.dayIndex-1)+5)%5);
  const trainingDays=[0,0,0,0,0];order.forEach((slot:{index:number},i:number)=>trainingDays[slot.index]=days[i]);
  entries.unshift({id:current?.id??crypto.randomUUID(),entityType:'settings',payload:{...settings,timezone,planStartDate:startDate,trainingDays}});
 }
 for(const entry of entries){const payload=payloadSchemas[entry.entityType].parse(entry.payload);const current=existing.find(r=>r.id===entry.id);const queued=(await tx.objectStore('outbox').getAll()).filter(o=>o.userId===userId&&o.entityId===entry.id).sort((a,b)=>a.sequence-b.sequence);const baseRevision=queued.length?queued.at(-1).baseRevision+1:current?.revision??0;const operationId=crypto.randomUUID();await tx.objectStore('records').put({...entry,payload,key:`${userId}:${entry.id}`,userId,revision:current?.revision??0,lastOperationId:operationId,deletedAt:null});await tx.objectStore('outbox').put({key:operationId,userId,sequence:++sequence,state:'pending',operationId,entityType:entry.entityType,entityId:entry.id,baseRevision,action:'put',payload,schemaVersion:1})}
 await tx.objectStore('meta').put(sequence,'sequence');await tx.done;changed();return id;
}
export async function acknowledge(op:Pending,record:RecordData){const database=await db();const tx=database.transaction(['records','outbox'],'readwrite');await tx.objectStore('outbox').delete(op.key);const later=(await tx.objectStore('outbox').getAll()).some(p=>p.userId===op.userId&&p.entityId===op.entityId);const key=`${op.userId}:${record.id}`;if(!later)await tx.objectStore('records').put({...record,key});else{const current=await tx.objectStore('records').get(key);if(current)await tx.objectStore('records').put({...current,revision:record.revision})}await tx.done;changed()}
export async function mark(op:Pending,state:Pending['state'],error:string,server?:RecordData|null){const database=await db();await database.put('outbox',{...op,state,error,server});changed()}
export async function refresh(userId:string,incoming:RecordData[]){const database=await db();const tx=database.transaction(['records','outbox'],'readwrite');const blocked=new Set((await tx.objectStore('outbox').getAll()).filter(o=>o.userId===userId).map(o=>o.entityId));for(const r of incoming)if(!blocked.has(r.id)&&r.userId===userId)await tx.objectStore('records').put({...r,key:`${userId}:${r.id}`});await tx.done;changed()}
export async function resolve(op:Pending,keepMine:boolean){const database=await db();const tx=database.transaction(['records','outbox','drafts'],'readwrite');const key=`${op.userId}:${op.entityId}`;for(const d of await tx.objectStore('drafts').getAll())if(d.key===key||d.key.startsWith(key+':'))await tx.objectStore('drafts').delete(d.key);const mine=await tx.objectStore('records').get(key);for(const p of await tx.objectStore('outbox').getAll())if(p.userId===op.userId&&p.entityId===op.entityId)await tx.objectStore('outbox').delete(p.key);if(op.server)await tx.objectStore('records').put({...op.server,key:`${op.userId}:${op.server.id}`});if(!op.server||op.server.id!==op.entityId)await tx.objectStore('records').delete(key);await tx.done;
 if(keepMine&&mine){const id=op.server?.id??op.entityId;await save(op.userId,op.entityType,id,mine.payload,mine.deletedAt?'delete':op.server?.deletedAt?'restore':op.action==='move'?'move':'put')}changed()}
function draftKey(userId:string,id:string){let tab='default';if(typeof sessionStorage!=='undefined'){tab=sessionStorage.getItem('fit-tab')??crypto.randomUUID();sessionStorage.setItem('fit-tab',tab)}return `${userId}:${id}:${tab}`}
export async function setDraft(userId:string,id:string,value:unknown){await (await db()).put('drafts',{key:draftKey(userId,id),userId,value})}
export async function getDraft(userId:string,id:string){return (await (await db()).get('drafts',draftKey(userId,id)))?.value}
export async function clearOwner(userId:string){const database=await db();const tx=database.transaction(['records','outbox','drafts','meta'],'readwrite');for(const name of ['records','outbox','drafts'])for(const row of await tx.objectStore(name).getAll())if(row.userId===userId)await tx.objectStore(name).delete(row.key);await tx.objectStore('meta').delete('owner');await tx.done;changed()}
export async function exportData(userId:string){return {schemaVersion:1,exportedAt:new Date().toISOString(),records:await records(userId),pending:await pending(userId),drafts:(await (await db()).getAll('drafts')).filter(r=>r.userId===userId)}}

// Owner-requested correction: only the October placeholder Legs session with
// exclusively November 12 set evidence qualifies. Never infer dates from today.
export async function repairNovemberWorkout(userId:string){
 const all=await records(userId);
 const sessions=all.filter(r=>r.entityType==='session'&&!r.deletedAt);
 let repaired=false;
 for(const session of sessions){
  if(session.payload.localDate!=='2026-10-14'||session.payload.templateSnapshot.dayIndex!==3)continue;
  const childIds=new Set(all.filter(r=>r.entityType==='exercise'&&!r.deletedAt&&r.payload.sessionId===session.id).map(r=>r.id));
  const sets=all.filter(r=>r.entityType==='set'&&!r.deletedAt&&childIds.has(r.payload.sessionExerciseId)&&r.payload.completedAt);
  if(!sets.length||sets.some(r=>localDate(session.payload.timezone,new Date(r.payload.completedAt))!=='2026-11-12'))continue;
  await save(userId,'session',session.id,{...session.payload,localDate:'2026-11-12'},'put',session.lastOperationId);
  repaired=true;
  const settings=all.find(r=>r.entityType==='settings'&&!r.deletedAt);
  if(sessions.length===1&&settings?.payload.planStartDate==='2026-10-14')
   await save(userId,'settings',settings.id,{...settings.payload,planStartDate:'2026-11-12'},'put',settings.lastOperationId);
 }
 return repaired;
}
