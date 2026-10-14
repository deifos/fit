import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',timeout:60000,workers:1,reporter:[['list'],['json',{outputFile:'work/browser-results.json'}]],use:{baseURL:'http://127.0.0.1:3001',headless:true,channel:'msedge',screenshot:'only-on-failure'},outputDir:'work/test-results'});
