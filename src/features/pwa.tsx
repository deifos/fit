import {useEffect,useState} from 'react';
import {Button} from '../components/ui/button';
import {useWorkspace} from './workspace';
import {bySlug,templates} from './plan/catalog';
import {localDate} from '../lib/domain';
import {exportData,records} from '../lib/offline/store';
export function PwaControls(){
 const w=useWorkspace();
 const [waiting,setWaiting]=useState<ServiceWorker|null>(null),[install,setInstall]=useState<any>(null),[error,setError]=useState('');
 const active=w.records.some(r=>r.entityType==='session'&&!r.deletedAt&&r.payload.status==='active');
 useEffect(()=>{
  if(!('serviceWorker' in navigator)||import.meta.env.DEV)return;
  let stopped=false;
  const watch=(r:ServiceWorkerRegistration)=>{
   if(stopped)return;
   if(r.waiting)setWaiting(r.waiting);
   const installing=r.installing;
   installing?.addEventListener('statechange',()=>{if(installing.state==='installed'&&navigator.serviceWorker.controller)setWaiting(installing)});
  };
  navigator.serviceWorker.register('/sw.js').then(r=>{watch(r);r.addEventListener('updatefound',()=>watch(r))}).catch(()=>setError('Offline setup is incomplete. Connect and open the app again.'));
  const prompt=(e:Event)=>{e.preventDefault();setInstall(e)};
  window.addEventListener('beforeinstallprompt',prompt);
  return()=>{stopped=true;window.removeEventListener('beforeinstallprompt',prompt)};
 },[]);
 useEffect(()=>{
  if(!('serviceWorker' in navigator)||import.meta.env.DEV)return;
  const sessions=w.records.filter(x=>x.entityType==='session'&&!x.deletedAt&&x.payload.status!=='completed').map(x=>x.id);
  const slugs=w.records.filter(x=>x.entityType==='exercise'&&!x.deletedAt&&sessions.includes(x.payload.sessionId)).map(x=>x.payload.exerciseSnapshot.slug);
  const day=new Date(localDate(w.settings.timezone)+'T12:00:00Z').getUTCDay();
  const today=templates.find(t=>t.phase===w.settings.currentPhase&&t.dayIndex===w.settings.trainingDays.indexOf(day)+1);
  slugs.push(...(today?.exercises.map(e=>e.exercise.slug)??[]));
  const urls=[...new Set(slugs.map(s=>bySlug[s]?.image).filter(Boolean))];
  navigator.serviceWorker.ready.then(r=>r.active?.postMessage({type:'CACHE_ROUTINE',urls}));
 },[w.records,w.settings]);
 return <>{error&&<p role="status">{error}</p>}{install&&<div className="pwa-notice"><span>Keep your training log one tap away.</span><Button variant="outline" onClick={async()=>{await install.prompt();setInstall(null)}}>Install app</Button></div>}{waiting&&<div className="pwa-notice" role="status"><span>Update available. {active?'Finish or save this workout as a draft before updating.':'Your saved records will stay on this device.'}</span><Button disabled={active} onClick={async()=>{
  try{
   if((await records(w.owner.id)).some(r=>r.entityType==='session'&&!r.deletedAt&&r.payload.status==='active')){setError('Save the active workout as a draft first.');return}
   await exportData(w.owner.id);
   navigator.serviceWorker.addEventListener('controllerchange',()=>window.location.reload(),{once:true});
   waiting.postMessage({type:'ACTIVATE'});
  }catch{setError('The draft checkpoint failed. Keep this page open and try again.')}
 }}>Update now</Button></div>}</>;
}
