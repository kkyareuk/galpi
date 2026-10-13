import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('install manifest uses valid square PNG icons and standalone scope',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../dist/manifest.webmanifest',import.meta.url)));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');
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
