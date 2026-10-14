import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const vars=fs.readFileSync('.dev.vars','utf8');if(!/^OWNER_EMAIL=local-test@fit.invalid\r?$/m.test(vars))throw new Error('This reset is for the isolated local test identity only.');
const where="userId IN (SELECT id FROM user WHERE email='local-test@fit.invalid')";
fs.writeFileSync('work/reset-test.sql',['WorkoutSet','SessionExercise','WorkoutSession','BodyWeightEntry','UserSettings','SyncReceipt'].map(t=>`DELETE FROM ${t} WHERE ${where};`).join('\n'));
execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','fit-local','--local','--file','work/reset-test.sql'],{stdio:'inherit'});
