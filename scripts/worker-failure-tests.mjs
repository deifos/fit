import {fetchSignIn} from './local-otp.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root='http://127.0.0.1:3001';
const vars=Object.fromEntries(fs.readFileSync('.dev.vars','utf8').trim().split(/\r?\n/).map(l=>l.split('=')));
const credentials=JSON.parse(fs.readFileSync('work/local-credentials.json','utf8'));
assert.equal(vars.OWNER_EMAIL,'local-test@fit.invalid');assert.equal(credentials.email,vars.OWNER_EMAIL);
function sql(statement){fs.writeFileSync('work/failure-test.sql',statement);return JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','fit-local','--local','--file','work/failure-test.sql','--json'],{encoding:'utf8'}))}
async function login(){const r=await fetchSignIn(credentials.email);assert.equal(r.status,200);return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')}
let cookie=await login();
const op={operationId:crypto.randomUUID(),entityType:'bodyWeight',entityId:crypto.randomUUID(),baseRevision:0,action:'put',schemaVersion:1,payload:{localDate:'1999-01-01',weightHundredths:17025,notes:'Local failure test'}};
const send=()=>fetch(root+'/api/sync',{method:'POST',headers:{cookie,origin:root,'content-type':'application/json'},body:JSON.stringify(op)});
sql('CREATE TRIGGER test_receipt_failure BEFORE INSERT ON SyncReceipt BEGIN SELECT RAISE(ABORT, \'test receipt failure\'); END;');
try{assert.equal((await send()).status,503);const all=await (await fetch(root+'/api/export',{headers:{cookie}})).json();assert.ok(!all.records.some(r=>r.id===op.entityId));}finally{sql('DROP TRIGGER IF EXISTS test_receipt_failure;')}
assert.equal((await send()).status,200);assert.equal((await send()).status,200);
sql("UPDATE session SET expiresAt=0 WHERE userId IN (SELECT id FROM user WHERE email='local-test@fit.invalid');");
assert.equal((await fetch(root+'/api/owner',{headers:{cookie}})).status,401);
// These tables and this identity contain test data only. The guard above is mandatory.
for(const table of ['WorkoutSet','SessionExercise','WorkoutSession','BodyWeightEntry','UserSettings','SyncReceipt'])sql(`DELETE FROM ${table} WHERE userId IN (SELECT id FROM user WHERE email='local-test@fit.invalid');`);
sql("DELETE FROM user WHERE email='local-test@fit.invalid'; CREATE TRIGGER test_account_failure BEFORE INSERT ON account BEGIN SELECT RAISE(ABORT, 'test account failure'); END;");
const provision=()=>fetch(root+'/api/local/provision',{method:'POST',headers:{'content-type':'application/json','x-setup-token':vars.LOCAL_SETUP_TOKEN},body:JSON.stringify(credentials)});
try{assert.notEqual((await provision()).status,200);assert.equal(sql("SELECT count(*) AS count FROM user WHERE email='local-test@fit.invalid';")[0].results[0].count,0)}finally{sql('DROP TRIGGER IF EXISTS test_account_failure;')}
assert.equal((await provision()).status,200);await login();
console.log('PASS: atomic D1 rollback at receipt failure, retry, real session expiry, partial auth failure cleanup, supported reprovision and sign-in.');
