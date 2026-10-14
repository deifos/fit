import {Toaster} from '../components/ui/sonner';
import {App} from '../features/app';
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import styles from '../styles.css?url';
export const Route = createRootRoute({head:()=>({meta:[{charSet:'utf-8'},{name:'viewport',content:'width=device-width, initial-scale=1'},{name:'theme-color',content:'#101b1d'},{title:'FIT / VLAD'}],links:[{rel:'stylesheet',href:styles},{rel:'manifest',href:'/manifest.webmanifest'},{rel:'icon',href:'/assets/brand/icon-192.png'},{rel:'apple-touch-icon',href:'/assets/brand/apple-touch-icon.png'}]}),component:()=> <html lang="en"><head><HeadContent/></head><body><App/><Toaster theme="light" position="bottom-right" closeButton duration={4500} offset={24} mobileOffset={{bottom:88,left:16,right:16}}/><Outlet/><Scripts/></body></html>});
