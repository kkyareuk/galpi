const CACHE='galpi-shell-v0.3.0';
const FILES=['./','./index.html','./style.css','./app.js','./editor.js','./rich-editor.js','./text-tools.js','./manuscript.js','./manuscript-worker.js','./media.js','./install.js','./practice.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
// Wait until old app windows close; never reload an unsaved editor for an update.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('galpi-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 // Authentication requests and private records are intentionally excluded.
 if(url.pathname.startsWith('/fonts/')&&url.pathname.endsWith('.woff2')){event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(event.request);if(cached)return cached;const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response}));return}
 if(event.request.mode==='navigate'){event.respondWith(caches.match('./index.html').then(cached=>cached||fetch(event.request)));return}
 if(FILES.some(path=>new URL(path,self.location.href).pathname===url.pathname))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
