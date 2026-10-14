import {loginUI} from '../../scripts/local-otp.mjs';
import {test,expect} from '@playwright/test';
import fs from 'node:fs';
test.use({reducedMotion:'reduce'});

test('shadcn controls and responsive sidebar work without saving records',async({page})=>{
 const credentials=JSON.parse(fs.readFileSync('work/local-credentials.json','utf8'));
 await page.goto('/');
 await loginUI(page,credentials.email);
 await expect(page.locator('.app-shell')).toBeVisible();
 await page.setViewportSize({width:1440,height:1000});
 await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
 await expect(page.locator('[data-slot=sidebar][data-state=collapsed]')).toBeVisible();
 await page.reload();
 await expect(page.getByRole('button',{name:'Expand sidebar',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Expand sidebar',exact:true}).click();
 await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Workouts',exact:true}).click();
 await page.getByRole('combobox',{name:'Exercise'}).click();
 await page.getByRole('option',{name:'Barbell curl',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Exercise'})).toContainText('Barbell curl');
 await page.getByRole('button',{name:'Date',exact:true}).click();
 await expect(page.locator('[data-slot=calendar]')).toBeVisible();
 await page.locator('[data-slot=calendar] button[data-day]').filter({hasText:/^10$/}).first().click();
 await expect(page.getByRole('button',{name:'Date',exact:true})).toContainText('10');
 await expect(page.locator('[data-slot=calendar]')).not.toBeVisible();
 await page.screenshot({path:'work/controls-desktop.png'});
 for(const width of [768,390]){
  await page.setViewportSize({width,height:900});
  if(width===390){
   await page.getByRole('button',{name:'Open navigation',exact:true}).click();
   await expect(page.getByRole('dialog',{name:'Sidebar',exact:true})).toBeVisible();
   await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Settings',exact:true}).click();
   await expect(page.getByRole('dialog',{name:'Sidebar',exact:true})).not.toBeVisible();
   await page.getByLabel('Current phase',{exact:true}).click();
   await page.keyboard.press('Escape');
   await page.getByLabel('Start date',{exact:true}).click();
   await expect(page.locator('[data-slot=calendar]')).toBeVisible();
   await page.screenshot({path:'work/controls-phone-calendar.png'});
   await page.keyboard.press('Escape');
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await expect(page.locator('input[type=date]')).toHaveCount(0);
});

