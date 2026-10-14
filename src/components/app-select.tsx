import type {ReactNode} from 'react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectGroup,SelectItem} from './ui/select';

const emptyValue='__empty__';
export function Choice({value,children}:{value:string|number;children:ReactNode}){
  return <SelectItem value={String(value)||emptyValue}>{children}</SelectItem>;
}
export function AppSelect({value,onValueChange,children,id,required,disabled}:{value:string|number;onValueChange:(value:string)=>void;children:ReactNode;id?:string;required?:boolean;disabled?:boolean}){
  return <Select value={String(value)||emptyValue} onValueChange={value=>onValueChange(value===emptyValue?'':value)} required={required} disabled={disabled}>
    <SelectTrigger id={id} className="app-select"><SelectValue/></SelectTrigger>
    <SelectContent position="popper" align="start"><SelectGroup>{children}</SelectGroup></SelectContent>
  </Select>;
}
