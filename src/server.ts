import handler from '@tanstack/react-start/server-entry';
import { authFor, type Bindings } from './lib/auth.server';
import { database } from './lib/db.server';
import { pull,sync } from './lib/sync.server';
export default {async fetch(request:Request,env:Bindings,ctx:ExecutionContext){
 const url=new URL(request.url);
 if(url.pathname==='/api/local/provision'){
  if(env.APP_ENV!=='local'||!['127.0.0.1','localhost'].includes(url.hostname)||request.headers.get('x-setup-token')!==env.LOCAL_SETUP_TOKEN||!env.LOCAL_SETUP_TOKEN)return new Response('Not found',{status:404});
  if(request.method!=='POST')return new Response('Method not allowed',{status:405});
  const body=await request.json() as {email:string,password:string};
  const db=database(env.DB);if(await db.user.count())return Response.json({error:'An owner already exists'},{status:409});
  const cleanup=async()=>{const orphan=await db.user.findUnique({where:{email:body.email.toLowerCase()}});if(orphan&&!(await db.account.count({where:{userId:orphan.id}})))await db.user.delete({where:{id:orphan.id}})};try{const result=await authFor(env,true).api.signUpEmail({body:{...body,name:'Vlad'},asResponse:true});if(!result.ok)await cleanup();return result}catch{await cleanup();return Response.json({error:'Could not create owner'},{status:400})}
 }
 if(url.pathname.startsWith('/api/auth/')){
  // Drain the body even for rejected routes so local Worker responses complete.
  const authBody=request.method==='POST'?await request.text():undefined;
  const allowed=['/api/auth/email-otp/send-verification-otp','/api/auth/sign-in/email-otp','/api/auth/get-session','/api/auth/sign-out'];
  if(!allowed.includes(url.pathname))return new Response('Not found',{status:404});
  if(request.method==='POST'&&request.headers.get('origin')!==env.BETTER_AUTH_URL)return new Response('Invalid origin',{status:403});
  if(url.pathname.includes('email-otp')&&request.method==='POST'){
   let body:any;try{body=JSON.parse(authBody||'{}')}catch{return Response.json({error:'Invalid request'},{status:400})}
   const owner=typeof body.email==='string'&&body.email.trim().toLowerCase()===env.OWNER_EMAIL?.toLowerCase();
   if(!owner)return Response.json({error:'Unable to sign in with these details'},{status:400});
   if(url.pathname.endsWith('send-verification-otp')&&body.type!=='sign-in')return Response.json({error:'Invalid request'},{status:400});
  }
  return authFor(env).handler(authBody===undefined?request:new Request(request,{body:authBody}));
 }
 if(url.pathname==='/api/owner'){
  const auth=await authFor(env).api.getSession({headers:request.headers});
  if(!auth||auth.user.email.toLowerCase()!==env.OWNER_EMAIL?.toLowerCase())return Response.json({error:'Sign in required'},{status:401,headers:{'Cache-Control':'no-store'}});
  return Response.json({id:auth.user.id,name:auth.user.name,email:auth.user.email},{headers:{'Cache-Control':'no-store'}});
 }
 if(['/api/sync','/api/export'].includes(url.pathname)){
  const auth=await authFor(env).api.getSession({headers:request.headers});
  if(!auth||auth.user.email.toLowerCase()!==env.OWNER_EMAIL?.toLowerCase())return Response.json({error:'Sign in required'},{status:401,headers:{'Cache-Control':'no-store'}});
  if(request.method==='GET')return Response.json({schemaVersion:1,records:await pull(env,auth.user.id)},{headers:{'Cache-Control':'no-store'}});
  if(url.pathname==='/api/sync'&&request.method==='POST'){
   if(request.headers.get('origin')!==env.BETTER_AUTH_URL)return new Response('Invalid origin',{status:403});
   const text=await request.text();if(text.length>200000)return new Response('Request too large',{status:413});
   try{return await sync(env,auth.user.id,JSON.parse(text))}catch{return Response.json({error:'Invalid request'},{status:400})}
  }
  return new Response('Method not allowed',{status:405});
 }
 return handler.fetch(request);
}};

