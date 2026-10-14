import {fetchSignIn} from './local-otp.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const vars=Object.fromEntries(fs.readFileSync('.dev.vars','utf8').trim().split(/\r?\n/).map(l=>l.split('=')));
const root='http://127.0.0.1:3001';
let credentials;
if(fs.existsSync('work/local-credentials.json'))credentials=JSON.parse(fs.readFileSync('work/local-credentials.json','utf8'));else{credentials={email:vars.OWNER_EMAIL,password:randomBytes(24).toString('hex')};fs.writeFileSync('work/local-credentials.json',JSON.stringify(credentials));}
let res=await fetch(root+'/api/local/provision',{method:'POST',headers:{'content-type':'application/json','x-setup-token':vars.LOCAL_SETUP_TOKEN},body:JSON.stringify(credentials)});assert.ok([200,409].includes(res.status),await res.text());
res=await fetchSignIn(credentials.email);assert.equal(res.status,200,await res.clone().text());
const cookie=res.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');assert.ok(cookie);
res=await fetch(root+'/api/owner',{headers:{cookie}});assert.equal(res.status,200);const owner=await res.json();assert.equal(owner.email,credentials.email);
res=await fetch(root+'/api/auth/sign-up/email',{method:'POST',headers:{'content-type':'application/json',origin:root},body:JSON.stringify({...credentials,name:'No registration'})});assert.notEqual(res.status,200);
res=await fetch(root+'/api/auth/sign-out',{method:'POST',headers:{'content-type':'application/json',origin:root,cookie},body:'{}'});assert.equal(res.status,200);
res=await fetch(root+'/api/owner',{headers:{cookie}});assert.equal(res.status,401);
console.log('PASS: Prisma/D1 owner provisioning, sign-in, session read, disabled public registration, sign-out and revoked session in the local Worker.');
