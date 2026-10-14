import fs from 'node:fs';
export const root='http://127.0.0.1:3001';
export function latestCode(){
 const log=fs.readFileSync(process.env.OTP_LOG_PATH||'work/otp-preview.log','utf8');
 const matches=[...log.matchAll(/\[FIT LOCAL OTP\] (\d{6})/g)];
 if(!matches.length)throw new Error('No local OTP found. Start preview with output redirected to work/otp-preview.log.');
 return matches.at(-1)[1];
}
export async function localSignIn(request,email){
 const headers={origin:root,'cf-connecting-ip':`192.0.2.${Math.floor(Math.random()*200)+1}`};
 const sent=await request.post(root+'/api/auth/email-otp/send-verification-otp',{headers,data:{email,type:'sign-in'}});
 if(sent.status()!==200)throw new Error(`Code request failed: ${sent.status()}`);
 const signed=await request.post(root+'/api/auth/sign-in/email-otp',{headers,data:{email,otp:latestCode()}});
 if(signed.status()!==200)throw new Error(`OTP sign-in failed: ${signed.status()}`);
 return signed;
}
export async function loginUI(page,email){
 await page.context().setExtraHTTPHeaders({'cf-connecting-ip':`192.0.${Math.floor(Math.random()*250)+1}.${Math.floor(Math.random()*250)+1}`});
 await page.getByLabel('Email',{exact:true}).fill(email);
 await page.getByRole('button',{name:'Send sign-in code',exact:true}).click();
 await page.getByLabel('Sign-in code',{exact:true}).waitFor();
 await page.getByLabel('Sign-in code',{exact:true}).fill(latestCode());
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
}
export async function fetchSignIn(email){
 const headers={'content-type':'application/json',origin:root,'cf-connecting-ip':`192.0.${Math.floor(Math.random()*250)+1}.80`};
 const sent=await fetch(root+'/api/auth/email-otp/send-verification-otp',{method:'POST',headers,body:JSON.stringify({email,type:'sign-in'})});
 if(!sent.ok)throw new Error(`Code request failed: ${sent.status}`);
 return fetch(root+'/api/auth/sign-in/email-otp',{method:'POST',headers,body:JSON.stringify({email,otp:latestCode()})});
}
