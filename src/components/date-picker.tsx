import {useState} from 'react';
import {CalendarDays} from 'lucide-react';
import {Button} from './ui/button';
import {Calendar} from './ui/calendar';
import {Popover,PopoverTrigger,PopoverContent} from './ui/popover';

// Calendar dates have no UTC conversion: preserve the date selected by the owner.
function parseDate(value:string){const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d,12)}
function dateValue(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
export function DatePicker({value,onValueChange,id,max,required=false}:{value:string;onValueChange:(value:string)=>void;id?:string;max?:string;required?:boolean}){
  const [open,setOpen]=useState(false);
  const selected=value?parseDate(value):undefined;
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button id={id} type="button" variant="outline" className="date-picker" aria-required={required}><CalendarDays/><span>{selected?selected.toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}):'Choose date'}</span></Button></PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="single" selected={selected} defaultMonth={selected} disabled={max?{after:parseDate(max)}:undefined} onSelect={date=>{if(date){onValueChange(dateValue(date));setOpen(false)}}} autoFocus/>
      {!required&&<div className="border-t p-2"><Button type="button" variant="ghost" className="w-full" onClick={()=>{onValueChange('');setOpen(false)}}>Clear date</Button></div>}
    </PopoverContent>
  </Popover>;
}
