import fs from 'node:fs';
import path from 'node:path';
import {test,expect} from '@playwright/test';
const bySlug=Object.fromEntries(JSON.parse(fs.readFileSync('src/features/plan/exercises.json','utf8')).map((e:any)=>[e.slug,e]));
const legs={id:'phase-1-day-3',revision:1,phase:1,dayIndex:3,title:'Legs',notes:'',exercises:[{exercise:bySlug['barbell-back-squat'],alternatives:[],setMin:1,setMax:2,repMin:6,repMax:10,optional:false,circuitGroup:null,restSeconds:180,notes:''}]};

test('November workout repairs history, totals and selected day; today follows rollover',async({page})=>{
 if(process.env.FIT_TEST_BUILT_ASSETS==='1'){
  const root=path.resolve('dist/client');
  const entry=fs.readdirSync(path.join(root,'assets')).find(name=>/^index-.*\.js$/.test(name));
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(route.request().isNavigationRequest())return route.fulfill({contentType:'text/html',body:`<!doctype html><html data-fit-offline="true"><head></head><body><script type="module" src="/assets/${entry}"></script></body></html>`});
   const file=path.resolve(root,'.'+url.pathname);
   if(file.startsWith(root+path.sep)&&fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});
   return route.fulfill({status:404,body:''});
  });
 }
 const owner={id:'11111111-1111-4111-8111-111111111111',name:'Preview',email:'preview@example.invalid'};
 const sessionId='22222222-2222-4222-8222-222222222222';
 const exerciseId='33333333-3333-4333-8333-333333333333';
 const record=(id:string,entityType:string,payload:any)=>({id,userId:owner.id,entityType,payload,revision:1,lastOperationId:crypto.randomUUID(),deletedAt:null});
 let records=[
  record(sessionId,'session',{templateSnapshot:legs,localDate:'2026-10-14',timezone:'America/Toronto',startedAt:'2026-10-14T16:00:00Z',endedAt:'2026-11-12T16:00:00Z',status:'completed',notes:''}),
  record(exerciseId,'exercise',{sessionId,exerciseSnapshot:bySlug['barbell-back-squat'],order:0,skipped:false}),
  record('44444444-4444-4444-8444-444444444444','set',{sessionExerciseId:exerciseId,order:0,kind:'working',weightHundredths:5000,reps:10,side:'none',loadBasis:'total',equipmentCount:1,rpe:null,notes:'',completedAt:'2026-11-12T15:00:00Z',parentSetId:null})
 ];
 await page.clock.install({time:new Date('2026-11-12T17:00:00Z')});
 await page.route('**/api/**',async route=>{
  const req=route.request();const path=new URL(req.url()).pathname;
  if(path==='/api/owner')return route.fulfill({json:owner});
  if(path==='/api/sync'){
   if(req.method()==='GET')return route.fulfill({json:{records}});
   const op=req.postDataJSON();const current=records.find(r=>r.id===op.entityId);
   const saved={...record(op.entityId,op.entityType,op.payload),revision:(current?.revision??0)+1,lastOperationId:op.operationId};
   records=records.filter(r=>r.id!==saved.id);records.push(saved);return route.fulfill({json:{record:saved}});
  }
  return route.fulfill({status:404,json:{}});
 });
 await page.goto('/');
 await expect(page.getByRole('button',{name:'Thursday, Nov 12: Completed',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.month-stats')).toContainText('1Workouts');
 await expect(page.locator('.month-stats')).toContainText('500');
 await expect(page.locator('.today-card')).toContainText('WORKOUT COMPLETED');
 await page.getByRole('button',{name:/Wednesday, Nov 11:/}).click();
 await expect(page.locator('.today-card')).not.toContainText('WORKOUT COMPLETED');
 await page.getByRole('button',{name:'Thursday, Nov 12: Completed',exact:true}).click();
 await expect(page.locator('.today-card')).toContainText('Legs');
 await page.locator('.today-card .history-row').click();
 await expect(page.locator('.workout-header')).toContainText('2026-11-12');
 await expect(page.getByLabel('Workout date')).toContainText('Nov 12, 2026');
 await page.goto('/workouts');
 await expect(page.locator('.history-row')).toContainText('2026-11-12');
 await page.goto('/progress');
 await expect(page.locator('.progress-summary')).toContainText('500');
 await expect(page.locator('.progress-summary')).toContainText('Completed workouts1');
 await page.goto('/plan');
 await expect(page.getByText('Leg extension',{exact:true})).toHaveCount(0);
 await page.goto('/');
 await page.clock.fastForward(24*60*60*1000);
 await expect(page.getByRole('button',{name:/Friday, Nov 13:/})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Thursday, Nov 12: Completed',exact:true}).click();
 await expect(page.locator('.today-card')).toContainText('WORKOUT COMPLETED');
});
