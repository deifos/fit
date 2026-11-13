import {useEffect,useState} from 'react';
import {localDate} from '../lib/domain';

export function useToday(timezone:string){
 const [today,setToday]=useState(()=>localDate(timezone));
 useEffect(()=>{
  const update=()=>setToday(localDate(timezone));
  update();
  const timer=setInterval(update,30000);
  window.addEventListener('focus',update);
  document.addEventListener('visibilitychange',update);
  return()=>{clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update)};
 },[timezone]);
 return today;
}
