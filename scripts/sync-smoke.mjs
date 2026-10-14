import {fetchSignIn} from './local-otp.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const root='http://127.0.0.1:3001',credentials=JSON.parse(fs.readFileSync('work/local-credentials.json','utf8'));
let r=await fetchSignIn(credentials.email);assert.equal(r.status,200);const cookie=r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');const headers={cookie,origin:root,'Content-Type':'application/json'};
r=await fetch(root+'/api/sync',{headers});assert.equal(r.status,200);
const op={operationId:crypto.randomUUID(),entityType:'bodyWeight',entityId:crypto.randomUUID(),baseRevision:0,action:'put',schemaVersion:1,payload:{localDate:'2000-01-01',weightHundredths:17025,notes:'Automated local test'}};
async function send(body){const r=await fetch(root+'/api/sync',{method:'POST',headers,body:JSON.stringify(body)});return {status:r.status,body:await r.json()}}
let first=await send(op);assert.equal(first.status,200,JSON.stringify(first));let retry=await send(op);assert.deepEqual(retry,first);
assert.equal((await send({...op,payload:{...op.payload,weightHundredths:18000}})).status,400);
const edit={...op,operationId:crypto.randomUUID(),baseRevision:1,payload:{...op.payload,notes:'Device A'}};assert.equal((await send(edit)).status,200);
assert.equal((await send({...edit,operationId:crypto.randomUUID(),payload:{...op.payload,notes:'Device B'}})).status,409);
assert.equal((await send({...edit,operationId:crypto.randomUUID(),baseRevision:2,action:'delete'})).status,200);
assert.equal((await send({...edit,operationId:crypto.randomUUID(),baseRevision:2})).status,409);
assert.equal((await fetch(root+'/api/export')).status,401);
console.log('PASS: duplicate receipt, changed-content rejection, conflicting edits, tombstone and unauthorized export.');
