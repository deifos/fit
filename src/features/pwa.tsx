import {useCallback,useEffect,useRef,useState} from 'react';
import {Link,useNavigate} from '@tanstack/react-router';
import {Bell,Check,Download,Sparkles,Trophy,X,ArrowRight} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '../components/ui/button';
import {Popover,PopoverContent,PopoverTrigger} from '../components/ui/popover';
import {useWorkspace} from './workspace';
import {bySlug,templates} from './plan/catalog';
import {localDate} from '../lib/domain';
import {exportData,records} from '../lib/offline/store';

type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function PwaControls(){
 const w=useWorkspace();
 const navigate=useNavigate();
 const [waiting,setWaiting]=useState<ServiceWorker|null>(null);
 const [install,setInstall]=useState<InstallPrompt|null>(null);
 const [error,setError]=useState('');
 const [updating,setUpdating]=useState(false);
 const [open,setOpen]=useState(false);
 const [seen,setSeen]=useState<string[]>(()=>{try{return (()=>{const value=JSON.parse(localStorage.getItem('fit-notifications-v1:'+w.owner.id)||'[]');return Array.isArray(value)?value.filter((id:unknown)=>typeof id==='string'&&id.startsWith('workout:')):[]})()}catch{return []}});
 const active=w.records.some(r=>r.entityType==='session'&&!r.deletedAt&&r.payload.status==='active');
 const completed=w.records.filter(r=>r.entityType==='session'&&!r.deletedAt&&r.payload.status==='completed').sort((a,b)=>(b.payload.endedAt??b.payload.startedAt).localeCompare(a.payload.endedAt??a.payload.startedAt)).slice(0,10);
 const ids=[...(waiting?['update']:[]),...(install?['install']:[]),...(error?['offline-error']:[]),...completed.map(r=>'workout:'+r.id)];
 const unread=ids.filter(id=>!seen.includes(id)).length;
 const idsKey=ids.join('|');
 useEffect(()=>{if(!open)return;const next=idsKey?idsKey.split('|'):[];setSeen(next);try{localStorage.setItem('fit-notifications-v1:'+w.owner.id,JSON.stringify(next))}catch{}},[open,idsKey,w.owner.id]);
 const update=useCallback(async(worker:ServiceWorker)=>{
  setError('');
  try{
   if((await records(w.owner.id)).some(r=>r.entityType==='session'&&!r.deletedAt&&r.payload.status==='active')){
    setError('Finish your workout or save it as a draft, then update.');setOpen(true);return;
   }
   setUpdating(true);
   await exportData(w.owner.id);
   navigator.serviceWorker.addEventListener('controllerchange',()=>window.location.reload(),{once:true});
   worker.postMessage({type:'ACTIVATE'});
  }catch{setUpdating(false);setError('The update could not start. Your work is still here. Try again.');setOpen(true)}
 },[w.owner.id]);
 useEffect(()=>{
  if(!('serviceWorker' in navigator)||import.meta.env.DEV)return;
  let stopped=false;
  let registration:ServiceWorkerRegistration|undefined;
  const watched=new Map<ServiceWorker,()=>void>();
  const watch=()=>{
   if(stopped||!registration)return;
   if(registration.waiting)setWaiting(registration.waiting);
   const worker=registration.installing;
   if(worker&&!watched.has(worker)){
    const changed=()=>{if(!stopped&&worker.state==='installed'&&navigator.serviceWorker.controller)setWaiting(worker)};
    watched.set(worker,changed);worker.addEventListener('statechange',changed);
   }
  };
  navigator.serviceWorker.register('/sw.js').then(r=>{if(stopped)return;registration=r;watch();r.addEventListener('updatefound',watch)}).catch(()=>{if(!stopped)setError('Offline setup needs another try. Connect and open the app again.')});
  const prompt=(e:Event)=>{e.preventDefault();setInstall(e as InstallPrompt)};
  window.addEventListener('beforeinstallprompt',prompt);
  return()=>{stopped=true;registration?.removeEventListener('updatefound',watch);for(const [worker,callback] of watched)worker.removeEventListener('statechange',callback);window.removeEventListener('beforeinstallprompt',prompt)};
 },[]);
 const announced=useRef<ServiceWorker|null>(null);
 useEffect(()=>{
  if(!waiting||announced.current===waiting)return;
  announced.current=waiting;
  toast('A fresh FIT / VLAD is ready.',{id:'app-update',description:'Your next update is one tap away.',duration:8000,icon:<Sparkles/>,action:{label:'Update now',onClick:()=>void update(waiting)}});
 },[waiting,update]);
 useEffect(()=>{
  const celebrate=(event:Event)=>{
   const title=(event as CustomEvent<{title:string}>).detail.title;
   toast.custom(id=><div className="workout-celebration" role="status"><div className="celebration-sparks" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i} style={{'--spark':i} as React.CSSProperties}/>)}</div><Trophy className="celebration-trophy" aria-hidden="true"/><button className="celebration-close" aria-label="Dismiss workout celebration" onClick={()=>toast.dismiss(id)}><X/></button><span className="eyebrow">WORKOUT COMPLETE</span><h2>You showed up. You did it.</h2><p>{title} is saved. See what you put in today.</p><Button onClick={()=>{toast.dismiss(id);void navigate({to:'/$',params:{_splat:'progress'}})}}>See your progress <ArrowRight/></Button></div>,{id:'workout-complete',duration:7000});
  };
  window.addEventListener('fit-workout-completed',celebrate);
  return()=>window.removeEventListener('fit-workout-completed',celebrate);
 },[navigate]);
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
 return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="ghost" size="icon" className="notification-bell" aria-label={`Notifications${unread?`, ${unread} unread`:''}`}><Bell/>{unread>0&&<span className="notification-dot" aria-hidden="true">{unread>9?'9+':unread}</span>}</Button></PopoverTrigger><PopoverContent align="end" sideOffset={12} collisionPadding={12} className="notification-panel" aria-label="Notifications"><div className="notification-heading"><div><span className="eyebrow">YOUR TRAINING CORNER</span><h2>Good things add up.</h2></div><Button variant="ghost" size="icon" aria-label="Close notifications" onClick={()=>setOpen(false)}><X/></Button></div><div className="notification-feed">
 {waiting&&<article className="notification-item notification-update"><Sparkles/><div><h3>A fresh version is ready</h3><p>{active?'Finish your workout or save it as a draft before updating.':'A little upgrade for your next workout. Your saved work stays here.'}</p><Button disabled={active||updating} onClick={()=>void update(waiting)}>{updating?'Updating…':'Update now'}<Download/></Button></div></article>}
 {error&&<p className="notification-error" role="alert">{error}</p>}
 {completed.map((session,i)=><article className="notification-item" key={session.id}><span className="notification-medal"><Trophy/></span><div><small>{session.payload.localDate} · WORKOUT COMPLETE</small><h3>{i===0?'Another one in the books.':'You put in the work.'}</h3><p>{session.payload.templateSnapshot.title}</p><Link to="/$" params={{_splat:'progress'}} onClick={()=>setOpen(false)}>See your progress <ArrowRight/></Link></div></article>)}
 {install&&<article className="notification-item"><Download/><div><h3>Your gym companion, one tap away</h3><p>Add FIT / VLAD to your home screen.</p><Button variant="outline" onClick={async()=>{try{await install.prompt();await install.userChoice;setInstall(null)}catch{setError('Installation did not start. Try your browser’s install menu.')}}}>Install app</Button></div></article>}
 {!ids.length&&<div className="notification-empty"><Check/><h3>All caught up. Ready when you are.</h3><p>Your completed workouts and app updates will appear here.</p><Link to="/" onClick={()=>setOpen(false)}>Go to your workout <ArrowRight/></Link></div>}
 </div><p className="notification-footer">One workout at a time.</p></PopoverContent></Popover>;
}
