import fs from 'node:fs';import crypto from 'node:crypto';
const files=fs.readdirSync('dist/client/assets').filter(f=>/\.(js|css)$/.test(f)).map(f=>'/assets/'+f);
const version=crypto.createHash('sha256').update(files.join('|')).digest('hex').slice(0,12);
const content=`const VERSION=${JSON.stringify(version)};const CACHE='fit-shell-'+VERSION;const STATIC=${JSON.stringify([...files,'/manifest.webmanifest','/assets/brand/icon-192.png','/assets/brand/icon-512.png','/assets/brand/maskable-512.png','/assets/brand/apple-touch-icon.png','/assets/hero/gym-banner.webp'])};
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(STATIC);const shell=await fetch('/',{credentials:'omit',cache:'no-store'});if(!shell.ok)throw new Error('Shell unavailable');const html=await shell.text();const css=[...html.matchAll(/<link[^>]+rel=\"stylesheet\"[^>]*>/g)].map(x=>x[0]).join('');const entry=STATIC.find(x=>x.startsWith('/assets/index-')&&x.endsWith('.js'));if(!entry)throw new Error('Missing client entry');await cache.put('/offline-shell',new Response('<!doctype html><html lang=\"en\" data-fit-offline=\"true\"><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">'+css+'</head><body><p>Opening saved workspace…</p><script type=\"module\" src=\"'+entry+'\"></script></body></html>',{headers:{'Content-Type':'text/html'}}))})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('fit-shell-')&&name!==CACHE)await caches.delete(name);await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting();if(event.data?.type==='CACHE_ROUTINE')event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const url of event.data.urls??[])if(typeof url==='string'&&url.startsWith('/assets/exercises/')){try{if(!await cache.match(url,{ignoreVary:true}))await cache.add(url)}catch{}}})())});
self.addEventListener('fetch',event=>{const req=event.request;const url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname==='/login')return;if(req.mode==='navigate'){event.respondWith(fetch(req).catch(async()=>await (await caches.open(CACHE)).match('/offline-shell')??new Response('Connect once to open FIT / VLAD.',{headers:{'Content-Type':'text/plain'}})));return}if(STATIC.includes(url.pathname)||url.pathname.startsWith('/assets/exercises/'))event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(req,{ignoreVary:true})??fetch(req)})())});`;
fs.writeFileSync('dist/client/sw.js',content);console.log('Built service worker',version);






if(process.env.FIT_ACCEPTANCE==='1')fs.writeFileSync('dist/client/sw-acceptance.js',content.replace('const VERSION='+JSON.stringify(version),'const VERSION='+JSON.stringify(version+'-acceptance')));
