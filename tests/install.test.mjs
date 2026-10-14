import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('install manifest uses valid square PNG icons and standalone scope',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../dist/manifest.webmanifest',import.meta.url)));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.id,'./');
 for(const base of ['https://galpi.test/','https://galpi.test/galpi/'])assert.equal(new URL(manifest.start_url,base).href,base);
 for(const icon of manifest.icons){const image=fs.readFileSync(new URL('../dist/'+icon.src,import.meta.url));const size=+icon.sizes.split('x')[0];assert.equal(image.readUInt32BE(16),size);assert.equal(image.readUInt32BE(20),size)}
});
test('offline cache includes application modules and excludes authentication and private requests',async()=>{
 const listeners={},cached=[];let response;
 const context={URL,self:{location:{origin:'https://galpi.test',href:'https://galpi.test/sw.js'},addEventListener:(name,fn)=>listeners[name]=fn,clients:{claim:async()=>{}}},caches:{open:async()=>({addAll:async files=>cached.push(...files)}),match:async()=>({cached:true})},fetch:async()=>({network:true})};
 vm.runInNewContext(fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8'),context);
 await listeners.install({waitUntil:p=>p});for(const path of cached)assert.ok(fs.existsSync(new URL('../dist/'+(path==='./'?'index.html':path),import.meta.url)),path);
 const event=(url,mode='cors',method='GET')=>({request:{url,mode,method},respondWith:p=>response=p});
 listeners.fetch(event('https://identitytoolkit.googleapis.com/v1/accounts'));assert.equal(response,undefined);
 listeners.fetch(event('https://galpi.test/api/private'));assert.equal(response,undefined);
 listeners.fetch(event('https://galpi.test/','navigate'));assert.deepEqual(await response,{cached:true});
});

test('project subpath caches fonts and only removes caches belonging to its scope',async()=>{
 const listeners={},removed=[];let response;const code=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 const context={URL,self:{location:{origin:'https://galpi.test',href:'https://galpi.test/galpi/sw.js'},addEventListener:(name,fn)=>listeners[name]=fn,clients:{claim:async()=>{}}},caches:{keys:async()=>['galpi-shell-/galpi/-v0.3.0','galpi-shell-/another/-v0.3.0'],delete:async key=>removed.push(key),open:async()=>({match:async()=>({font:true})}),match:async()=>({shell:true})}};
 vm.runInNewContext(code,context);
 await listeners.activate({waitUntil:p=>p});assert.deepEqual(removed,['galpi-shell-/galpi/-v0.3.0']);
 listeners.fetch({request:{url:'https://galpi.test/galpi/fonts/KoPubWorld-Batang-Medium.woff2',method:'GET',mode:'cors'},respondWith:p=>response=p});assert.deepEqual(await response,{font:true});
 response=undefined;listeners.fetch({request:{url:'https://galpi.test/another/fonts/test.woff2',method:'GET',mode:'cors'},respondWith:p=>response=p});assert.equal(response,undefined);
});
