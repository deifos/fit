import 'fake-indexeddb/auto';
import {it,expect,vi} from 'vitest';
vi.stubGlobal('window',new EventTarget());vi.stubGlobal('BroadcastChannel',undefined);
import {save,pending,records,acknowledge,refresh,mark,resolve,startSession} from '../src/lib/offline/store';
import {templates} from '../src/features/plan/catalog';
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

