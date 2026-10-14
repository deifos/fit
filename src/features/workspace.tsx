import {toast} from 'sonner';
import {Motivation} from './motivation';
import { createContext,useContext,useEffect,useState,type ReactNode } from 'react';
import * as store from '../lib/offline/store';
import { synchronize,type SyncStatus } from '../lib/offline/sync';
import { defaults,type RecordData,type EntityType,type Operation } from '../lib/domain';
type Owner={id:string;name:string;email:string};
type Workspace={owner:Owner;records:RecordData[];queue:store.Pending[];settings:typeof defaults;status:SyncStatus;save:(type:EntityType,id:string,payload:unknown,action?:Operation['action'],expectedLastOperationId?:string)=>Promise<void>;sync:()=>Promise<void>;reload:()=>Promise<void>};
const Context=createContext<Workspace|null>(null);
export const useWorkspace=()=>useContext(Context)!;
export function WorkspaceProvider({children}:{children:ReactNode}){
 const [owner,setOwner]=useState<Owner|null>(null),[ready,setReady]=useState(false),[data,setData]=useState<RecordData[]>([]),[queue,setQueue]=useState<store.Pending[]>([]),[status,setStatus]=useState<SyncStatus>('Saved on phone');
 useEffect(()=>{(async()=>{try{let selected=await store.identity();try{const r=await fetch('/api/owner');if(r.ok){selected=await r.json() as Owner;await store.setIdentity(selected)}else setStatus('Needs sign-in')}catch{}if(selected){setData(await store.records(selected.id));setQueue(await store.pending(selected.id));setOwner(selected)}}finally{setReady(true)}})()},[]);
 const reload=async()=>{if(owner){setData(await store.records(owner.id));setQueue(await store.pending(owner.id))}};
 const sync=async()=>{if(owner)await synchronize(owner.id,setStatus)};
 useEffect(()=>{if(!owner)return;void reload();void sync();void navigator.storage?.persist?.();const local=()=>{void reload()};const resume=()=>{if(document.visibilityState==='visible')void sync()};window.addEventListener('fit-data',local);window.addEventListener('online',sync);document.addEventListener('visibilitychange',resume);const channel=store.channel();if(channel)channel.onmessage=()=>{void reload()};return()=>{window.removeEventListener('fit-data',local);window.removeEventListener('online',sync);document.removeEventListener('visibilitychange',resume);channel?.close()}},[owner?.id]);
 if(!ready)return <main className="connection"><h1>FIT / <em>VLAD</em></h1><p>Opening your workspace…</p></main>;
 if(!owner)return <Login onSuccess={async o=>{await store.setIdentity(o);setOwner(o)}}/>;
 const savedSettings=data.find(r=>r.userId===owner.id&&r.entityType==='settings'&&!r.deletedAt)?.payload??defaults;
 const firstWorkout=data.filter(r=>r.userId===owner.id&&r.entityType==='session'&&!r.deletedAt).sort((a,b)=>a.payload.startedAt.localeCompare(b.payload.startedAt))[0];
 const settings={...savedSettings,planStartDate:savedSettings.planStartDate??firstWorkout?.payload.localDate??null};
 return <Context.Provider value={{owner,records:data.filter(r=>r.userId===owner.id),queue:queue.filter(r=>r.userId===owner.id),settings,status,reload,sync,save:async(type,id,payload,action,expectedLastOperationId)=>{setStatus('Saving');try{await store.save(owner.id,type,id,payload,action,expectedLastOperationId);setStatus('Saved on phone');const title=action==='delete'?'Record deleted':action==='restore'?'Record restored':type==='bodyWeight'?'Body weight saved':type==='set'?'Set saved':type==='settings'?'Preferences saved':type==='session'?'Workout saved':'Exercise saved';toast.success(title,{id:'save-result',description:navigator.onLine?'Saved on this device. Syncing to the server…':'Saved on this device. Will sync when you are online.'});await reload();void sync()}catch(error){setStatus('Not saved');toast.error('Not saved',{id:'save-result',description:error instanceof Error?error.message:'Your form is still here. Try again.'});throw error}}}}>{children}</Context.Provider>
}
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Field,FieldGroup,FieldLabel} from '../components/ui/field';
export function Login({onSuccess}:{onSuccess?:(o:Owner)=>void}){
 const [email,setEmail]=useState(''),[otp,setOtp]=useState(''),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[cooldown,setCooldown]=useState(0);
 useEffect(()=>{if(!cooldown)return;const timer=setTimeout(()=>setCooldown(n=>Math.max(0,n-1)),1000);return()=>clearTimeout(timer)},[cooldown]);
 async function sendCode(){
  setBusy(true);setError('');try{
   const res=await fetch('/api/auth/email-otp/send-verification-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim().toLowerCase(),type:'sign-in'})});
   if(!res.ok)throw new Error(res.status===429?'Too many requests. Wait a minute before trying again.':'Could not send a code. Check your email address and try again.');
   setSent(true);setOtp('');setCooldown(60);toast.success('Code requested',{description:'Use the latest code. It expires in 5 minutes.'});
  }catch(err){setError(err instanceof Error?err.message:'Connect to request a code.')}finally{setBusy(false)}
 }
 async function signIn(){
  setBusy(true);setError('');try{
   const res=await fetch('/api/auth/sign-in/email-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim().toLowerCase(),otp})});
   if(!res.ok)throw new Error(res.status===429?'Too many attempts. Wait a minute and request a new code.':'The code is incorrect or expired. Try again or request a new code.');
   const result=await fetch('/api/owner');if(!result.ok)throw new Error('Owner access is required.');
   const owner=await result.json() as Owner;await store.setIdentity(owner);if(onSuccess)onSuccess(owner);else window.location.assign('/');
  }catch(err){setError(err instanceof Error?err.message:'Connect to sign in.')}finally{setBusy(false)}
 }
 return <main className="login-page"><div className="login-art"><div className="wordmark">FIT / <em>VLAD</em></div><h1>STRONGER<br/>EVERY DAY.</h1><Motivation name="login"/></div><form className="login-form" onSubmit={e=>{e.preventDefault();void(sent?signIn():sendCode())}}><span className="eyebrow">PRIVATE TRAINING LOG</span><h2>{sent?'Enter your code':'Welcome back.'}</h2><p>{sent?`Enter the six-digit code sent to ${email.trim()}.`:'Sign in with a code sent to your email. No password needed.'}</p><FieldGroup><Field><FieldLabel htmlFor="email">Email</FieldLabel><Input id="email" type="email" autoComplete="username" required value={email} disabled={sent||busy} onChange={e=>setEmail(e.target.value)}/></Field>{sent&&<Field><FieldLabel htmlFor="otp">Sign-in code</FieldLabel><Input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoFocus value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}/></Field>}</FieldGroup><Button disabled={busy} type="submit">{busy?(sent?'Signing in…':'Sending code…'):sent?'Sign in':'Send sign-in code'}</Button>{sent&&<div className="form-actions"><Button type="button" variant="outline" disabled={busy||cooldown>0} onClick={()=>void sendCode()}>{cooldown?`Resend in ${cooldown}s`:'Resend code'}</Button><Button type="button" variant="ghost" disabled={busy} onClick={()=>{setSent(false);setOtp('');setError('')}}>Change email</Button></div>}{error&&<p role="alert">{error}</p>}<p className="muted">Private owner access. Codes expire in 5 minutes. Only the latest code works.</p>{!navigator.onLine&&<p role="status">Connect to receive a code and sign in. Your saved work remains on this device.</p>}</form></main>;
}
