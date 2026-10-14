import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {IDBFactory} from 'fake-indexeddb';
import * as appearance from '../dist/appearance.js';
import * as text from '../dist/text-tools.js';
import * as manuscript from '../dist/manuscript.js';
import * as model from '../dist/library-model.js';
import {stepper} from '../dist/editor.js';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function boot(hash='library'){
 const dom=new JSDOM(fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),{url:'https://galpi.test/#'+hash,runScripts:'outside-only'}),w=dom.window;
 const idb=new IDBFactory();const db=await new Promise(resolve=>{const r=idb.open('galpi-library',2);r.onupgradeneeded=()=>{r.result.createObjectStore('books',{keyPath:'key'});r.result.createObjectStore('fonts')};r.onsuccess=()=>resolve(r.result)});
 await new Promise(resolve=>{const t=db.transaction('books','readwrite');t.objectStore('books').put({key:'owner:b',owner:'owner',book:{id:'b',title:'저장된 소설',au:'원작',couple:'크로네리',updated:1,chapters:[{id:'c',title:'1화',text:'기기에 보관된 본문',updated:1}]}});t.oncomplete=resolve});db.close();w.localStorage.setItem('galpi-last-owner','owner');
 let authCallback,resolveRemote;const remote=new Promise(resolve=>resolveRemote=resolve);
 const fakeAuth={signOut:async()=>authCallback(null),getAuth:()=>({currentUser:null}),onAuthStateChanged:(_auth,cb)=>authCallback=cb};
 const fakeStore={getFirestore:()=>({}),collection:(_db,...path)=>path.join('/'),getDocs:()=>remote,doc:()=>({}),setDoc:async()=>{}};
 Object.assign(w,text,manuscript,model,{indexedDB:idb,structuredClone,scrollTo:()=>{},requestAnimationFrame:fn=>fn(),setupInstall:()=>{},checkForUpdate:()=>{},stepper,bindSteppers:()=>{},setTypography:()=>{},manuscriptJob:async({text})=>'<p>'+text+'</p>',applyPaper:p=>appearance.applyPaper(p,w.document),applyMotion:p=>appearance.applyMotion(p,w.document),normalizeAppearance:appearance.normalizeAppearance,paperPicker:appearance.paperPicker,bindPaperPicker:appearance.bindPaperPicker,__loadFirebase:async path=>path.includes('firebase-app')?{initializeApp:()=>({})}:path.includes('firebase-auth')?fakeAuth:fakeStore});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'').replaceAll('import(base+','__loadFirebase(base+');
 await w.eval('(async()=>{'+source+'})()');for(let n=0;n<10&&!authCallback;n++)await tick();
 return {w,dom,auth:async user=>{authCallback(user);for(let n=0;n<5;n++)await tick()},remote:async()=>{resolveRemote({docs:[]});for(let n=0;n<8;n++)await tick()}};
}
test('cached account library appears before auth and remains readable when signed out',async()=>{
 const {w,dom,auth}=await boot();assert.match(w.document.querySelector('#app').textContent,/저장된 소설/);
 w.document.querySelector('#new-series').click();assert.match(w.document.querySelector('#modal').textContent,/글을 쓰려면 로그인/);
 await auth(null);assert.match(w.document.querySelector('#app').textContent,/저장된 소설/);assert.equal(w.localStorage.getItem('galpi-last-owner'),'owner');assert.ok(!w.document.querySelector('#app').inert);dom.window.close();
});
test('slow cloud fetch never locks reader or replaces the displayed chapter after auth restores',async()=>{
 const {w,dom,auth,remote}=await boot('read/b/c');const reader=w.document.querySelector('.reader');assert.match(reader.textContent,/기기에 보관된 본문/);
 await auth({uid:'owner',displayName:'작성자'});assert.equal(w.document.querySelector('.reader'),reader);assert.ok(!w.document.querySelector('#app').inert);
 await remote();assert.equal(w.document.querySelector('.reader'),reader);dom.window.close();
});
test('authenticated writing does not wait for cloud manuscript downloads',async()=>{
 const {w,dom,auth}=await boot();await auth({uid:'owner',displayName:'작성자'});w.document.querySelector('#new-series').click();const form=w.document.querySelector('#series-form');assert.ok(form);form.elements.title.value='로그인 후 새 글';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));for(let n=0;n<10;n++)await tick();assert.match(w.document.querySelector('#app').textContent,/로그인 후 새 글/,JSON.stringify({toast:w.document.querySelector('#toast').textContent,hash:w.location.hash,form:[...new w.FormData(form)]}));assert.match(w.location.hash,/#series\//);dom.window.close();
});


test('explicit logout stops reopening the account library without deleting its saved records',async()=>{
 const {w,dom,auth}=await boot();await auth({uid:'owner',displayName:'작성자'});
 w.document.querySelector('#settings').click();w.document.querySelector('#google-action').click();for(let n=0;n<10;n++)await tick();
 assert.equal(w.localStorage.getItem('galpi-last-owner'),null);assert.doesNotMatch(w.document.querySelector('#app').textContent,/저장된 소설/);
 await auth({uid:'owner',displayName:'작성자'});assert.match(w.document.querySelector('#app').textContent,/저장된 소설/);dom.window.close();
});
test('switching Google accounts cannot carry the previous account library into the new account',async()=>{
 const {w,dom,auth,remote}=await boot();await auth({uid:'owner',displayName:'첫 계정'});await auth({uid:'another',displayName:'다른 계정'});await remote();
 assert.equal(w.localStorage.getItem('galpi-last-owner'),'another');assert.doesNotMatch(w.document.querySelector('#app').textContent,/저장된 소설/);dom.window.close();
});
