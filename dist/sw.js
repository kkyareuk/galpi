const BASE=new URL('./',self.location.href);
const PREFIX='galpi-shell-'+BASE.pathname+'-';
const CACHE=PREFIX+'v0.7.0';
const FILES=['./','./index.html','./style.css','./app.js','./appearance.js','./library-model.js','./textures/cotton.jpg','./textures/ruled.jpg','./textures/vintage.jpg','./textures/black.jpg','./editor.js','./rich-editor.js','./editor-selection.js','./text-tools.js','./manuscript.js','./manuscript-worker.js','./media.js','./install.js','./practice.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(path=>new Request(new URL(path,BASE),{cache:'reload'})))).then(()=>self.skipWaiting())));
// Activate new routing immediately, but never reload an open editor.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 // Authentication requests and private records are intentionally excluded.
 if(url.pathname.startsWith(new URL('fonts/',BASE).pathname)&&url.pathname.endsWith('.woff2')){event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(event.request);if(cached)return cached;const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response}));return}
 if(event.request.mode==='navigate'){event.respondWith(fetch(new URL('index.html',BASE),{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('offline');return response}).catch(()=>caches.open(CACHE).then(cache=>cache.match('./index.html'))));return}
 if(FILES.some(path=>new URL(path,self.location.href).pathname===url.pathname))event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('offline');return response}).catch(()=>caches.open(CACHE).then(cache=>cache.match(event.request))));
});
self.addEventListener('message',event=>{
 if(event.data?.type!=='ACTIVATE_IF_ALONE')return;
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{const own=clients.filter(c=>c.url.startsWith(BASE.href));if(own.length>1)event.source?.postMessage({type:'UPDATE_BUSY'});else return self.skipWaiting()}));
});
