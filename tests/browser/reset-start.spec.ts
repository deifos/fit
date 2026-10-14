import {loginUI} from '../../scripts/local-otp.mjs';
import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test('start date can be reset offline without changing workouts',async({page,context})=>{
 const c=JSON.parse(fs.readFileSync('work/local-credentials.json','utf8'));
 await page.clock.setFixedTime(new Date('2026-10-14T16:00:00Z'));
 await page.goto('/');
 await loginUI(page,c.email);
 await expect(page.locator('.sync-status')).toContainText('Synced');
 await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Settings',exact:true}).click();
 await context.setOffline(true);
 const snapshot=()=>page.evaluate(async()=>{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('fit-vlad');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return new Promise<string>((resolve,reject)=>{const r=db.transaction('records').objectStore('records').getAll();r.onsuccess=()=>{resolve(JSON.stringify(r.result.filter(x=>x.entityType!=='settings')));db.close()};r.onerror=()=>reject(r.error)})});
 const before=await snapshot();
 await page.getByLabel('Start date',{exact:true}).click();
 await page.locator('[data-slot=calendar] button[data-day]').filter({hasText:/^15$/}).first().click();
 await page.getByRole('button',{name:'Save start date',exact:true}).click();
 await expect(page.getByText('Start date saved on this device.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Save preferences',exact:true}).click();
 await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Today',exact:true}).click();
 await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Settings',exact:true}).click();
 await expect(page.getByLabel('Start date',{exact:true})).toContainText('Oct 15, 2026');
 await page.getByRole('button',{name:'Use today',exact:true}).click();
 await page.getByRole('button',{name:'Save start date',exact:true}).click();
 await expect(page.getByLabel('Start date',{exact:true})).toContainText('Oct 14, 2026');
 expect(await snapshot()).toBe(before);
});
