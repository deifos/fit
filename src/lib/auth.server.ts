import {authRateLimit} from './auth-rate-limit.server';
import {emailOTP} from 'better-auth/plugins';
import {EmailMessage} from 'cloudflare:email';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { database } from './db.server';
export interface Bindings {DB:D1Database;BETTER_AUTH_URL:string;BETTER_AUTH_SECRET:string;APP_ENV:string;OWNER_EMAIL?:string;LOCAL_SETUP_TOKEN?:string;OTP_DELIVERY?:string;EMAIL_FROM?:string;EMAIL?:{send:(message:EmailMessage)=>Promise<unknown>}}
export function authFor(env:Bindings,provision=false){return betterAuth({baseURL:env.BETTER_AUTH_URL,secret:env.BETTER_AUTH_SECRET,database:prismaAdapter(database(env.DB),{provider:'sqlite',transaction:false}),emailAndPassword:{enabled:provision,disableSignUp:!provision,minPasswordLength:12},trustedOrigins:[env.BETTER_AUTH_URL],rateLimit:{enabled:true,customStorage:authRateLimit(env.DB)},plugins:[emailOTP({disableSignUp:true,otpLength:6,expiresIn:300,allowedAttempts:3,storeOTP:'hashed',resendStrategy:'rotate',rateLimit:{window:60,max:3},async sendVerificationOTP({email,otp,type}){
 if(type!=='sign-in'||email.toLowerCase()!==env.OWNER_EMAIL?.toLowerCase())throw new Error('Email delivery unavailable');
 if(env.APP_ENV==='local'&&env.OTP_DELIVERY==='local-log'&&['127.0.0.1','localhost'].includes(new URL(env.BETTER_AUTH_URL).hostname)){
  console.log(`[FIT LOCAL OTP] ${otp}`);return;
 }
 if(!env.EMAIL||!env.EMAIL_FROM||/[\r\n]/.test(env.EMAIL_FROM+email))throw new Error('Email delivery is not configured');
 const raw=[`From: FIT / VLAD <${env.EMAIL_FROM}>`,`To: ${email}`,'Subject: Your FIT / VLAD sign-in code','MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','',`Your sign-in code is ${otp}.`,'','This code expires in 5 minutes. Do not share it.','If you did not request this code, ignore this email.'].join('\r\n');
 await env.EMAIL.send(new EmailMessage(env.EMAIL_FROM,email,raw));
 }} )],session:{expiresIn:60*60*24*14,cookieCache:{enabled:false}},advanced:{ipAddress:{ipAddressHeaders:['cf-connecting-ip']},useSecureCookies:env.APP_ENV==='production'},databaseHooks:{user:{create:{before:async(user)=>{if(!env.OWNER_EMAIL||user.email.toLowerCase()!==env.OWNER_EMAIL.toLowerCase())throw new Error('Owner identity required');return {data:{...user,emailVerified:true}}}}}}})}

