import { acknowledge,pending,mark,refresh } from './store';
export type SyncStatus='Saving'|'Not saved'|'Saved on phone'|'Syncing'|'Synced'|'Needs sign-in'|'Conflict'|'Could not sync';
let active:Promise<void>|null=null;let attempts=0;let timer:ReturnType<typeof setTimeout>|undefined;let requested=false;
export function synchronize(userId:string,status:(s:SyncStatus)=>void):Promise<void>{if(active){requested=true;return active}
 const run=async()=>{
 if(!navigator.onLine){status('Saved on phone');return}status('Syncing');
 try{
 const queue=await pending(userId);const blocked=new Set<string>();let trouble=false;
 for(const op of queue){const parent=(op.payload as any)?.sessionExerciseId??(op.payload as any)?.sessionId;if(blocked.has(op.entityId)||blocked.has(parent)){blocked.add(op.entityId);continue;}if(op.state!=='pending'){blocked.add(op.entityId);trouble=true;continue}
  const {key,userId:owner,sequence,state,error,server,...operation}=op;
  const res=await fetch('/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(operation)});
  if(res.status===401){status('Needs sign-in');return}const result:any=await res.json();
  if(res.status===409){await mark(op,'conflict',result.error,result.record);blocked.add(op.entityId);trouble=true;continue}
  if(res.status>=400&&res.status<500){await mark(op,'invalid',result.error);blocked.add(op.entityId);trouble=true;continue}
  if(!res.ok)throw new Error('Temporary sync failure');await acknowledge(op,result.record);
 }
 const res=await fetch('/api/sync');if(res.status===401){status('Needs sign-in');return}if(!res.ok)throw new Error('Could not refresh');await refresh(userId,(await res.json() as any).records);
 attempts=0;const left=await pending(userId);status(trouble||left.some(p=>p.state==='conflict')?'Conflict':left.some(p=>p.state==='invalid')?'Could not sync':left.length?'Saved on phone':'Synced');
 }catch{status('Could not sync');clearTimeout(timer);if(attempts<5)timer=setTimeout(()=>synchronize(userId,status),Math.min(30000,1000*2**attempts++))}
 };
 active=(navigator.locks?navigator.locks.request('fit-sync-'+userId,run):run()).finally(()=>{active=null;if(requested){requested=false;void synchronize(userId,status)}});return active;
}

