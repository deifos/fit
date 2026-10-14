import { database } from './db.server';
import { operationSchema,payloadSchemas,localDate,defaults,type RecordData,type EntityType } from './domain';
import type { Bindings } from './auth.server';
import {bySlug} from '../features/plan/catalog';
const tables={settings:'UserSettings',session:'WorkoutSession',exercise:'SessionExercise',set:'WorkoutSet',bodyWeight:'BodyWeightEntry'};
const models={settings:'userSettings',session:'workoutSession',exercise:'sessionExercise',set:'workoutSet',bodyWeight:'bodyWeightEntry'};
function model(db:ReturnType<typeof database>,type:EntityType):any{return (db as any)[models[type]]}
function canonical(row:any,type:EntityType):RecordData{return {id:row.id,userId:row.userId,entityType:type,revision:row.revision,lastOperationId:row.lastOperationId,deletedAt:row.deletedAt,payload:JSON.parse(row.payload)}}
export async function pull(env:Bindings,userId:string){const db=database(env.DB);return (await Promise.all((Object.keys(tables) as EntityType[]).map(async type=>(await model(db,type).findMany({where:{userId}})).map((r:any)=>canonical(r,type))))).flat()}
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
// The only native D1 mutation path. D1 batch atomically commits the revision-checked
// record and its receipt. Prisma remains the schema, auth, read and catalogue ORM.
export async function sync(env:Bindings,userId:string,input:unknown){
 const parsed=operationSchema.safeParse(input);if(!parsed.success)return response({error:'Invalid operation',details:parsed.error.flatten()},400);
 const op=parsed.data;const body=payloadSchemas[op.entityType].safeParse(op.payload);if(!body.success)return response({error:'Invalid record',details:body.error.flatten()},422);
 const p:any=body.data;const db=database(env.DB);const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(op))))).map(b=>b.toString(16).padStart(2,'0')).join('');
 const receipt=await db.syncReceipt.findUnique({where:{userId_operationId:{userId,operationId:op.operationId}}});
 if(receipt)return receipt.requestHash===hash?response(JSON.parse(receipt.resultPayload)):response({error:'Operation ID reused with different content'},400);
 const current=await model(db,op.entityType).findUnique({where:{id:op.entityId}});
 if(current&&current.userId!==userId)return response({error:'Record unavailable'},403);
 if((current?.revision??0)!==op.baseRevision)return response({error:'Conflict',record:current?canonical(current,op.entityType):null},409);
 if(current?.deletedAt&&op.action!=='restore'&&op.action!=='delete')return response({error:'Conflict: record was deleted',record:canonical(current,op.entityType)},409);
 if(op.action==='restore'&&!current?.deletedAt)return response({error:'Only a deleted record can be restored'},422);
 if(op.action==='move'&&op.entityType!=='bodyWeight')return response({error:'Only body-weight dates can be moved'},422);
 if(op.entityType==='session'&&current&&JSON.stringify(JSON.parse(current.payload).templateSnapshot)!==JSON.stringify(p.templateSnapshot))return response({error:'The original plan snapshot cannot change'},422);
 if(op.entityType==='exercise'){
  const known=bySlug[p.exerciseSnapshot.slug];
  if(!known||['loadBasis','equipmentCount','unilateral','equipment'].some(key=>(known as any)[key]!==p.exerciseSnapshot[key]))return response({error:'Invalid exercise variation'},422);
 }
 if(op.entityType==='bodyWeight'){
  const settings=await db.userSettings.findUnique({where:{userId}});const zone=settings?JSON.parse(settings.payload).timezone:defaults.timezone;
  if(p.localDate>localDate(zone))return response({error:'A body-weight date cannot be in the future'},422);
  if(current&&JSON.parse(current.payload).localDate!==p.localDate&&op.action!=='move')return response({error:'Use an explicit date move'},422);
  const existing=await db.bodyWeightEntry.findUnique({where:{userId_localDate:{userId,localDate:p.localDate}}});
  if(existing&&existing.id!==op.entityId)return response({error:'A record already exists for that date. Edit or restore it.',record:canonical(existing,'bodyWeight')},409);
 }
 if(op.entityType==='settings'){const existing=await db.userSettings.findUnique({where:{userId}});if(existing&&existing.id!==op.entityId)return response({error:'Settings already exist',record:canonical(existing,'settings')},409)}
 let parentId:string|null=null;let parentTable:string|null=null;let parent:any=null;
 if(op.entityType==='exercise'){parentId=p.sessionId;parentTable=tables.session;parent=await db.workoutSession.findUnique({where:{id:p.sessionId}})}
 if(op.entityType==='set'){parentId=p.sessionExerciseId;parentTable=tables.exercise;parent=await db.sessionExercise.findUnique({where:{id:p.sessionExerciseId}})}
 if(parentTable&&(!parent||parent.userId!==userId||parent.deletedAt))return response({error:'Parent record unavailable'},422);
 if(current&&parentId!==current.parentId)return response({error:'Cannot move a record to a different parent'},422);
 if(op.entityType==='exercise'&&current&&JSON.parse(current.payload).exerciseSnapshot.slug!==p.exerciseSnapshot.slug){if(await db.workoutSet.count({where:{parentId:op.entityId}}))return response({error:'Add a new exercise to keep recorded sets unchanged'},422)}
 if(op.entityType==='set'){
  const ex=JSON.parse(parent.payload).exerciseSnapshot;
  const session=await db.workoutSession.findUnique({where:{id:parent.parentId}});
  if(!session||session.userId!==userId||session.deletedAt)return response({error:'Parent workout unavailable'},422);
  if(p.equipmentCount!==ex.equipmentCount||(!ex.unilateral&&p.side!=='none')||(ex.unilateral&&p.side==='none'))return response({error:'Invalid equipment or side'},422);
  if(ex.loadBasis==='bodyweight'?!['bodyweight','added','assistance'].includes(p.loadBasis):p.loadBasis!==ex.loadBasis)return response({error:'Invalid load basis'},422);
  if(p.completedAt&&p.loadBasis!=='bodyweight'&&p.weightHundredths===null)return response({error:'Enter a load'},422);
  if(p.parentSetId){const main=await db.workoutSet.findUnique({where:{id:p.parentSetId}});if(!main||main.userId!==userId||main.deletedAt||main.parentId!==p.sessionExerciseId||JSON.parse(main.payload).kind!=='working')return response({error:'Invalid rest-pause parent'},422)}
 }
 if(op.entityType==='session'&&p.status==='completed'){
  const children=await db.sessionExercise.findMany({where:{parentId:op.entityId,userId,deletedAt:null}});const sets=await db.workoutSet.findMany({where:{parentId:{in:children.map(e=>e.id)},userId,deletedAt:null}});
  if(!sets.some(s=>JSON.parse(s.payload).completedAt))return response({error:'An empty workout must remain a draft'},422);
 }
 const record:RecordData={id:op.entityId,userId,entityType:op.entityType,revision:op.baseRevision+1,lastOperationId:op.operationId,deletedAt:op.action==='delete'?new Date().toISOString():null,payload:p};
 const table=tables[op.entityType];const date=p.localDate??parent?.localDate??null;const slug=p.exerciseSnapshot?.slug??parent?.exerciseSlug??null;const payload=JSON.stringify(p);
 let parentCheck=parentTable?` AND EXISTS (SELECT 1 FROM "${parentTable}" WHERE id = ? AND userId = ? AND deletedAt IS NULL)`:'';
 const parentArgs:any[]=parentTable?[parentId,userId]:[];
 if(op.entityType==='set'){parentCheck+=' AND EXISTS (SELECT 1 FROM WorkoutSession WHERE id=? AND userId=? AND deletedAt IS NULL)';parentArgs.push(parent.parentId,userId);if(p.parentSetId){parentCheck+=' AND EXISTS (SELECT 1 FROM WorkoutSet WHERE id=? AND userId=? AND deletedAt IS NULL)';parentArgs.push(p.parentSetId,userId)}}
 const write=current?env.DB.prepare(`UPDATE "${table}" SET payload=?,localDate=?,exerciseSlug=?,revision=?,lastOperationId=?,deletedAt=? WHERE id=? AND userId=? AND revision=?${parentCheck}`).bind(payload,date,slug,record.revision,op.operationId,record.deletedAt,op.entityId,userId,op.baseRevision,...parentArgs):env.DB.prepare(`INSERT INTO "${table}" (id,userId,payload,localDate,parentId,exerciseSlug,revision,lastOperationId,deletedAt) SELECT ?,?,?,?,?,?,?,?,? WHERE 1=1${parentCheck} ON CONFLICT DO NOTHING`).bind(op.entityId,userId,payload,date,parentId,slug,1,op.operationId,record.deletedAt,...parentArgs);
 const result={record};
 const saveReceipt=env.DB.prepare(`INSERT INTO SyncReceipt (id,userId,operationId,requestHash,entityId,resultRevision,resultPayload,createdAt) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM "${table}" WHERE id=? AND userId=? AND revision=? AND lastOperationId=?)`).bind(crypto.randomUUID(),userId,op.operationId,hash,op.entityId,record.revision,JSON.stringify(result),new Date().toISOString(),op.entityId,userId,record.revision,op.operationId);
 try{await env.DB.batch([write,saveReceipt])}catch{const retry=await db.syncReceipt.findUnique({where:{userId_operationId:{userId,operationId:op.operationId}}});if(retry)return retry.requestHash===hash?response(JSON.parse(retry.resultPayload)):response({error:'Operation ID reused'},400);return response({error:'Could not save. Retry this operation.'},503)}
 const saved=await db.syncReceipt.findUnique({where:{userId_operationId:{userId,operationId:op.operationId}}});
 if(saved)return response(JSON.parse(saved.resultPayload));
 const newer=await model(db,op.entityType).findUnique({where:{id:op.entityId}});return response({error:'Conflict',record:newer?canonical(newer,op.entityType):null},409);
}
