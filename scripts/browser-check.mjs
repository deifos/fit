import {loginUI} from './local-otp.mjs';
import {chromium} from '@playwright/test';import fs from 'node:fs';
const browser=await chromium.launch({headless:true,channel:"msedge"});const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();page.on('pageerror',e=>console.log('PAGE ERROR',e.message));const c=JSON.parse(fs.readFileSync('work/local-credentials.json','utf8'));
await page.goto('http://127.0.0.1:3001');await loginUI(page,c.email);await page.getByRole('button',{name:'Start workout',exact:true}).waitFor();await page.screenshot({path:'work/dashboard-desktop.png',fullPage:true});console.log((await page.locator('body').innerText()).slice(0,2500));await browser.close();


