import {loginUI} from '../../scripts/local-otp.mjs';
import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test('first workout starts the plan today, offline, without writing server records',async({page,context})=>{
 const credentials=JSON.parse(fs.readFileSync('work/local-credentials.json','utf8'));
 await page.clock.setFixedTime(new Date('2026-10-14T16:00:00Z'));
 await page.route('**/api/sync',async route=>{if(route.request().method()==='GET')await route.fulfill({json:{records:[]}});else await route.abort()});
 await page.goto('/');
 await loginUI(page,credentials.email);
 await expect(page.locator('.sync-status')).toContainText('Synced');
 // Use an isolated browser context and remain offline after starting the fixture.
 await context.setOffline(true);
 await expect(page.locator('.week-strip button').filter({has:page.locator('strong',{hasText:/^12$/})})).toContainText('Not started');
 await expect(page.locator('.today-card')).toContainText('Day 1');
 await page.getByRole('button',{name:'Start workout',exact:true}).click();
 await expect(page).toHaveURL(/\/workouts\//);
 await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Today',exact:true}).click();
 await expect(page.locator('.week-strip button').filter({has:page.locator('strong',{hasText:/^13$/})})).toContainText('Not started');
 await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Settings',exact:true}).click();
 await expect(page.getByLabel('Start date',{exact:true})).toContainText('Oct 14, 2026');
 await expect(page.getByRole('combobox',{name:'Chest & Triceps'})).toContainText('Wednesday');
});
