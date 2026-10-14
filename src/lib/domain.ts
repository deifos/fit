import { z } from 'zod';
export const dateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s,'Use a valid calendar date');
export const noteSchema=z.string().max(4000);
export const uuid=z.string().uuid();
export const basisSchema=z.enum(['total','per-implement','machine','bodyweight','added','assistance']);
export const exerciseSchema=z.object({slug:z.string().min(1).max(100),name:z.string().min(1).max(200),equipment:z.string().max(100),loadBasis:basisSchema,equipmentCount:z.number().int().min(1).max(2),unilateral:z.boolean(),instructionVersion:z.number().int().positive(),instructions:z.array(z.string().max(1000)).max(20),muscles:z.array(z.string().max(100)).max(20),image:z.string().max(300).nullable(),reviewStatus:z.string().max(100),techniqueSource:z.string().max(1000)});
export type Exercise=z.infer<typeof exerciseSchema>;
export const targetSchema=z.object({exercise:exerciseSchema,alternatives:z.array(z.string()),setMin:z.number().int().positive().max(100).nullable(),setMax:z.number().int().positive().max(100).nullable(),repMin:z.number().int().positive().max(1000).nullable(),repMax:z.number().int().positive().max(1000).nullable(),optional:z.boolean(),circuitGroup:z.string().nullable(),restSeconds:z.number().int().nonnegative().max(3600),notes:noteSchema});
export type Target=z.infer<typeof targetSchema>;
export const templateSchema=z.object({id:z.string().max(100),revision:z.number().int().positive(),phase:z.number().int().min(1).max(3),dayIndex:z.number().int().min(1).max(5),title:z.string().max(200),notes:noteSchema,exercises:z.array(targetSchema).max(50)});
export type Template=z.infer<typeof templateSchema>;
export const settingsSchema=z.object({timezone:z.string().refine(s=>{try{new Intl.DateTimeFormat('en',{timeZone:s});return true}catch{return false}},'Invalid timezone'),planStartDate:dateSchema.nullable(),currentPhase:z.number().int().min(1).max(3),trainingDays:z.array(z.number().int().min(0).max(6)).length(5).refine(a=>new Set(a.filter(d=>d!==0)).size===a.filter(d=>d!==0).length,'Choose different training days').refine(a=>a.filter(d=>d===0).length<=1,'Keep four or five training days'),weightUnit:z.literal('lb')});
export const sessionSchema=z.object({templateSnapshot:templateSchema,localDate:dateSchema,timezone:settingsSchema.shape.timezone,startedAt:z.string().datetime(),endedAt:z.string().datetime().nullable(),status:z.enum(['draft','active','completed']),notes:noteSchema});
export const sessionExerciseSchema=z.object({sessionId:uuid,exerciseSnapshot:exerciseSchema,order:z.number().int().nonnegative(),skipped:z.boolean()});
export const setSchema=z.object({sessionExerciseId:uuid,order:z.number().int().nonnegative(),kind:z.enum(['warmup','working','rest-pause']),weightHundredths:z.number().int().min(0).max(200000).nullable(),reps:z.number().int().min(1).max(1000).nullable(),side:z.enum(['both','left','right','none']),loadBasis:basisSchema,equipmentCount:z.number().int().min(1).max(2),rpe:z.number().min(1).max(10).multipleOf(.5).nullable(),notes:noteSchema,completedAt:z.string().datetime().nullable(),parentSetId:uuid.nullable()}).refine(s=>!s.completedAt||s.reps!==null,'Enter reps before completing a set').refine(s=>s.kind==='rest-pause'?s.parentSetId!==null:s.parentSetId===null,'Rest-pause segments need a parent set');
export const bodyWeightSchema=z.object({localDate:dateSchema,weightHundredths:z.number().int().min(1).max(200000),notes:noteSchema});
export const payloadSchemas={settings:settingsSchema,session:sessionSchema,exercise:sessionExerciseSchema,set:setSchema,bodyWeight:bodyWeightSchema};
export type EntityType=keyof typeof payloadSchemas;
export type RecordData={id:string;userId:string;entityType:EntityType;revision:number;lastOperationId:string;deletedAt:string|null;payload:any};
export const operationSchema=z.object({operationId:uuid,entityType:z.enum(['settings','session','exercise','set','bodyWeight']),entityId:uuid,baseRevision:z.number().int().nonnegative(),action:z.enum(['put','delete','restore','move']),payload:z.unknown(),schemaVersion:z.literal(1)}).strict();
export type Operation=z.infer<typeof operationSchema>;
export const defaults={timezone:'America/Toronto',planStartDate:null,currentPhase:1,trainingDays:[1,2,3,4,5],weightUnit:'lb'} as z.infer<typeof settingsSchema>;
export function localDate(timezone:string,date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}
export function pounds(value:string){if(!/^\d+(\.\d{1,2})?$/.test(value))throw new Error('Use pounds with no more than two decimal places');return Math.round(Number(value)*100)}
export function loadedVolume(record:RecordData,exercise:Exercise){const s=record.payload;if(record.deletedAt||!s.completedAt||s.kind==='warmup'||s.loadBasis==='bodyweight'||s.loadBasis==='assistance')return 0;return (s.weightHundredths??0)/100*s.equipmentCount*s.reps*(exercise.unilateral&&s.side==='both'?2:1)}
export function weekKey(date:string){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10)}
export function remaining(deadline:number|null,paused:number){return deadline===null?paused:Math.max(0,Math.ceil((deadline-Date.now())/1000))}
