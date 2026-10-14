import {test,expect,type Page} from '@playwright/test';
test.use({baseURL:process.env.FIT_UI_TEST_URL??'http://127.0.0.1:3001',viewport:{width:390,height:844},reducedMotion:'reduce'});
async function preview(page:Page,update=false){
 const owner={id:'11111111-1111-4111-8111-111111111111',name:'Preview',email:'preview@example.invalid'};
 let records:any[]=[];
 await page.route('**/api/**',async route=>{
  const request=route.request();const path=new URL(request.url()).pathname;
  if(path==='/api/owner')return route.fulfill({json:owner});
  if(path==='/api/sync'){
   if(request.method()==='GET')return route.fulfill({json:{records}});
   const op=request.postDataJSON();const record={id:op.entityId,userId:owner.id,entityType:op.entityType,revision:1,lastOperationId:op.operationId,deletedAt:null,payload:op.payload};records=records.filter(r=>r.id!==record.id);records.push(record);return route.fulfill({json:{record}});
  }
  return route.fulfill({status:404,json:{error:'Preview only'}});
 });
 await page.addInitScript(hasUpdate=>{
  const worker=Object.assign(new EventTarget(),{state:'installed',postMessage:(message:any)=>{if(message.type==='ACTIVATE')(window as any).updateActivated=true}});
  const registration=Object.assign(new EventTarget(),{waiting:hasUpdate?worker:null,installing:null,active:{postMessage:()=>{}}});
  const serviceWorker=Object.assign(new EventTarget(),{controller:{},register:async()=>registration,ready:Promise.resolve(registration)});
  Object.defineProperty(navigator,'serviceWorker',{value:serviceWorker,configurable:true});
 },update);
 await page.goto('/');await expect(page.locator('.today-list')).toBeVisible();
}
test('update uses bell and popup, stays out of the page, and activates on request',async({page})=>{
 await preview(page,true);
 await expect(page.getByText('A fresh FIT / VLAD is ready.',{exact:true})).toBeVisible();
 await expect(page.locator('main .pwa-notice')).toHaveCount(0);
 await page.getByRole('button',{name:'Notifications, 1 unread',exact:true}).click();
 const panel=page.locator('.notification-panel');
 await expect(panel.getByRole('button',{name:'Update now',exact:true})).toBeEnabled();
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:844});
  const box=await panel.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);
 }
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'work/notifications-update.png'});
 await panel.getByRole('button',{name:'Update now',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).updateActivated)).toBe(true);
});
test('completion celebrates once, retains a read notification, and links to progress',async({page})=>{
 await preview(page);
 await page.getByRole('button',{name:'Start workout',exact:true}).click();
 const form=page.locator('.set-card').last();
 await form.getByLabel('Weight (lb)').fill('95');await form.getByLabel('Reps',{exact:true}).fill('8');await form.getByRole('button',{name:'Save set',exact:true}).click();
 await expect(page.getByText('Set 1',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Finish workout',exact:true}).click();
 await expect(page.locator('.workout-celebration')).toBeVisible();
 await page.screenshot({path:'work/notifications-celebration.png'});
 await page.locator('.workout-celebration').getByRole('button',{name:'See your progress'}).click();
 await expect(page).toHaveURL(/\/progress$/);
 await page.getByRole('button',{name:'Notifications, 1 unread',exact:true}).click();
 await expect(page.locator('.notification-panel')).toContainText('Chest & Triceps');
 await page.screenshot({path:'work/notifications-complete.png'});
 await page.locator('.notification-panel').getByRole('link',{name:'See your progress'}).click();
 await page.reload();await expect(page.getByRole('button',{name:'Notifications',exact:true})).toBeVisible();
 await expect(page.locator('.workout-celebration')).toHaveCount(0);
 await page.goto('/workouts');await page.locator('.history-row').first().click();
 await page.getByRole('button',{name:'Save completed workout',exact:true}).click();
 await expect(page.locator('.sync-status')).toContainText('Synced');
 await expect(page.locator('.workout-celebration')).toHaveCount(0);
});
test('an update cannot interrupt an active workout',async({page})=>{
 await preview(page,true);
 await page.getByRole('button',{name:'Start workout',exact:true}).click();
 await page.getByRole('button',{name:/^Notifications/}).click();
 const panel=page.locator('.notification-panel');
 await expect(panel.getByRole('button',{name:'Update now',exact:true})).toBeDisabled();
 await expect(panel).toContainText('save it as a draft');
 expect(await page.evaluate(()=>(window as any).updateActivated)).toBeUndefined();
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Keep as draft',exact:true}).click();
 await page.getByRole('button',{name:/^Notifications/}).click();
 await expect(panel.getByRole('button',{name:'Update now',exact:true})).toBeEnabled();
});
