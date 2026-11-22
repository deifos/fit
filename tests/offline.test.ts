import 'fake-indexeddb/auto';
import {it,expect,vi} from 'vitest';
vi.stubGlobal('window',new EventTarget());vi.stubGlobal('BroadcastChannel',undefined);
import {save,pending,records,acknowledge,refresh,mark,resolve,startSession,repairNovemberWorkout} from '../src/lib/offline/store';
import {templates,bySlug} from '../src/features/plan/catalog';
it('preserves saved history and active sessions when future routines change',async()=>{
 const owner='catalog-history';
 const updated=templates.find(t=>t.phase===1&&t.dayIndex===3)!;
 const old={...structuredClone(updated),revision:2,exercises:structuredClone(updated.exercises.filter(t=>t.exercise.slug!=='barbell-hip-thrust'))};
 const id=await startSession(owner,old,'America/Toronto');
 const exercise=(await records(owner)).find(r=>r.entityType==='exercise')!;
 await save(owner,'set',crypto.randomUUID(),{sessionExerciseId:exercise.id,order:0,kind:'working',weightHundredths:9000,reps:10,side:'none',loadBasis:'total',equipmentCount:1,rpe:null,notes:'Keep this set',completedAt:new Date().toISOString(),parentSetId:null});
 const activeRecords=await records(owner),activeQueue=await pending(owner);
 expect(await startSession(owner,updated,'America/Toronto')).toBe(id);
 expect(await records(owner)).toEqual(activeRecords);
 expect(await pending(owner)).toEqual(activeQueue);
 const session=activeRecords.find(r=>r.id===id)!;
 await save(owner,'session',id,{...session.payload,status:'completed',endedAt:new Date().toISOString()});
 const historical=await records(owner),queued=await pending(owner);
 const newId=await startSession(owner,updated,'America/Toronto');
 expect(newId).not.toBe(id);
 const after=await records(owner);
 for(const record of historical)expect(after.find(r=>r.id===record.id)).toEqual(record);
 expect((await pending(owner)).slice(0,queued.length)).toEqual(queued);
 expect(after.find(r=>r.id===newId)!.payload.templateSnapshot.revision).toBe(3);
 const hip=after.find(r=>r.entityType==='exercise'&&r.payload.sessionId===newId&&r.payload.exerciseSnapshot.slug==='barbell-hip-thrust')!;
 expect(hip.payload.exerciseSnapshot).toEqual(bySlug['barbell-hip-thrust']);
 await save(owner,'set',crypto.randomUUID(),{sessionExerciseId:hip.id,order:0,kind:'working',weightHundredths:9000,reps:10,side:'none',loadBasis:'total',equipmentCount:1,rpe:null,notes:'',completedAt:new Date().toISOString(),parentSetId:null});
 expect((await records(owner)).filter(r=>r.entityType==='set')).toHaveLength(2);
});
it('starts a complete routine once across concurrent tabs',async()=>{const ids=await Promise.all([startSession('tabs',templates[0],'America/Toronto'),startSession('tabs',templates[0],'America/Toronto')]);expect(ids[0]).toBe(ids[1]);expect((await records('tabs')).filter(r=>r.entityType==='session')).toHaveLength(1);expect((await records('tabs')).filter(r=>r.entityType==='exercise')).toHaveLength(templates[0].exercises.length);expect(await pending('tabs')).toHaveLength(templates[0].exercises.length+2)});
it('serializes same-record edits, preserves later drafts, and keeps conflicts explicit',async()=>{const owner='test-owner',id=crypto.randomUUID();const payload={localDate:'2026-10-12',weightHundredths:17000,notes:''};await save(owner,'bodyWeight',id,payload);await save(owner,'bodyWeight',id,{...payload,weightHundredths:17100});const q=await pending(owner);expect(q.map(p=>p.baseRevision)).toEqual([0,1]);const canonical={...(await records(owner))[0],revision:1,payload};await acknowledge(q[0],canonical);expect((await records(owner))[0].payload.weightHundredths).toBe(17100);await refresh(owner,[canonical]);expect((await records(owner))[0].payload.weightHundredths).toBe(17100);await mark(q[1],'conflict','Different version',{...canonical,revision:2});expect((await pending(owner))[0].state).toBe('conflict');await resolve((await pending(owner))[0],true);expect((await pending(owner))[0].baseRevision).toBe(2);expect((await pending(owner))[0].payload).toMatchObject({weightHundredths:17100});expect(await records('other-owner')).toEqual([])});

it('anchors a new routine to its actual first start and queues settings atomically',async()=>{
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-14T16:00:00Z'));
 try{
  await save('start-date','settings','preferences',{timezone:'America/Toronto',planStartDate:null,currentPhase:1,trainingDays:[1,2,3,4,5],weightUnit:'lb'});
  await startSession('start-date',templates[0],'America/Toronto');
  const settings=(await records('start-date')).find(r=>r.entityType==='settings')!;
  expect(settings.payload.planStartDate).toBe('2026-10-14');
  expect(settings.payload.trainingDays).toEqual([3,4,5,1,2]);
  expect((await pending('start-date')).filter(r=>r.entityType==='settings').map(r=>r.baseRevision)).toEqual([0,1]);
  vi.setSystemTime(new Date('2026-10-15T16:00:00Z'));
  await startSession('start-date',templates[0],'America/Toronto');
  expect((await records('start-date')).find(r=>r.entityType==='settings')!.payload.planStartDate).toBe('2026-10-14');
 }finally{vi.useRealTimers()}
});


it('dates an empty resumed routine when its first set is actually logged',async()=>{
 vi.useFakeTimers({toFake:['Date']});
 try{
  vi.setSystemTime(new Date('2026-10-14T16:00:00Z'));
  const owner='resumed-date';const id=await startSession(owner,templates[2],'America/Toronto');
  const exercise=(await records(owner)).find(r=>r.entityType==='exercise')!;
  vi.setSystemTime(new Date('2026-11-12T15:00:00Z'));
  const set={sessionExerciseId:exercise.id,order:0,kind:'working',weightHundredths:5000,reps:10,side:'none',loadBasis:'total',equipmentCount:1,rpe:null,notes:'',completedAt:new Date().toISOString(),parentSetId:null};
  await save(owner,'set',crypto.randomUUID(),set);
  expect((await records(owner)).find(r=>r.id===id)!.payload.localDate).toBe('2026-11-12');
  const queue=await pending(owner);expect(queue.at(-3)?.entityType).toBe('session');expect(queue.at(-2)?.entityType).toBe('settings');expect((await records(owner)).find(r=>r.entityType==='settings')!.payload.planStartDate).toBe('2026-11-12');expect(queue.at(-1)?.entityType).toBe('set');
  vi.setSystemTime(new Date('2026-11-13T15:00:00Z'));
  await save(owner,'set',crypto.randomUUID(),{...set,order:1,completedAt:new Date().toISOString()});
  expect((await records(owner)).find(r=>r.id===id)!.payload.localDate).toBe('2026-11-12');
 }finally{vi.useRealTimers()}
});

it('repairs only the reported placeholder with November 12 evidence, once',async()=>{
 const owner='november-repair';const id=await startSession(owner,templates[2],'America/Toronto');
 const initial=await records(owner);const session=initial.find(r=>r.id===id)!;const exercise=initial.find(r=>r.entityType==='exercise')!;
 const set={sessionExerciseId:exercise.id,order:0,kind:'working',weightHundredths:5000,reps:10,side:'none',loadBasis:'total',equipmentCount:1,rpe:null,notes:'',completedAt:'2026-11-12T15:00:00Z',parentSetId:null};
 await save(owner,'set',crypto.randomUUID(),set);
 await save(owner,'session',id,{...session.payload,status:'completed',localDate:'2026-10-14',endedAt:'2026-11-12T16:00:00Z'});
 expect(await repairNovemberWorkout(owner)).toBe(true);
 expect((await records(owner)).find(r=>r.id===id)!.payload).toMatchObject({status:'completed',localDate:'2026-11-12'});
 expect(await repairNovemberWorkout(owner)).toBe(false);
 await save(owner,'session',id,{...session.payload,status:'completed',localDate:'2026-10-14',endedAt:'2026-11-12T16:00:00Z'});
 await save(owner,'set',crypto.randomUUID(),{...set,completedAt:'2026-10-14T15:00:00Z'});
 expect(await repairNovemberWorkout(owner)).toBe(false);
});
