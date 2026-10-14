import {loginUI} from '../../scripts/local-otp.mjs';
import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test('navigation preserves the workspace without another loading screen',async({page})=>{
 const credentials=JSON.parse(fs.readFileSync('work/local-credentials.json','utf8'));
 let ownerRequests=0;
 page.on('request',r=>{if(new URL(r.url()).pathname==='/api/owner')ownerRequests++});
 await page.goto('/');
 await loginUI(page,credentials.email);
 await expect(page.locator('.app-shell')).toBeVisible();
 await expect(page.locator('.sync-status')).toContainText('Synced');
 const initialRequests=ownerRequests;
 await page.evaluate(()=>{
  (window as any).originalShell=document.querySelector('.app-shell');
  (window as any).loadingAppeared=false;
  new MutationObserver(()=>{if(document.querySelector('.connection'))(window as any).loadingAppeared=true}).observe(document.body,{subtree:true,childList:true});
 });
 for(const name of ['Workouts','Today','Plan','Today','Progress','Today']){
  await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name,exact:true}).click();
  await expect(page).toHaveURL(name==='Today'?/\/$/:new RegExp('/'+name.toLowerCase()+'$'));
  expect(await page.evaluate(()=>(window as any).originalShell===document.querySelector('.app-shell'))).toBe(true);
 }
 expect(await page.evaluate(()=>(window as any).loadingAppeared)).toBe(false);
 expect(ownerRequests).toBe(initialRequests);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 await page.reload();
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await page.context().setOffline(true);
 await page.reload();
 await expect(page.locator('.app-shell')).toBeVisible();
 await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Workouts',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Workout history',exact:true})).toBeVisible();
});
