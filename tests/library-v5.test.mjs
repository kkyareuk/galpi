import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import fs from 'node:fs';
import {normalizeAppearance,applyPaper,paperPicker,bindPaperPicker,PAPERS} from '../dist/appearance.js';
import {liveChapters,groupedSeries,cleanCollection} from '../dist/library-model.js';
test('legacy night settings cannot unexpectedly darken reading; only explicit black paper does',()=>{
 const doc=new JSDOM('<body class="dark"></body>').window.document;const prefs={dark:true,theme:'night'};
 applyPaper(prefs,doc);assert.equal(prefs.paper,'cotton');assert.equal(doc.body.dataset.theme,'white');assert.equal(doc.body.classList.contains('dark'),false);assert.equal(doc.documentElement.style.colorScheme,'only light');
 prefs.paper='black';applyPaper(prefs,doc);assert.equal(doc.body.dataset.theme,'night');prefs.paper='ruled';applyPaper(prefs,doc);assert.equal(doc.body.classList.contains('dark'),false);assert.match(doc.body.style.getPropertyValue('--paper-texture'),/ruled.jpg/);
});
test('photo picker changes its preview and retains handlers after repeated choices',()=>{
 const doc=new JSDOM(paperPicker('cotton')).window.document,prefs={paper:'cotton'};let calls=0;bindPaperPicker(doc,prefs,()=>calls++);
 for(const name of ['vintage','black','plain','ruled']){doc.querySelector(`[data-paper-choice="${name}"]`).click();assert.equal(prefs.paper,name);assert.equal(doc.querySelector(`[data-paper-choice="${name}"]`).getAttribute('aria-pressed'),'true')}
 assert.equal(calls,4);for(const p of Object.values(PAPERS).filter(p=>p.image))assert.ok(fs.statSync(new URL('../dist/textures/'+p.image+'.jpg',import.meta.url)).size>1000);
});
test('chapter trash preserves source and adult label through backup and restoration',()=>{
 const book={chapters:[{id:'a',adult:true,text:'보관할 원고'},{id:'b',text:'둘'}]};book.chapters[0].deleted=true;
 const restored=JSON.parse(JSON.stringify(book));assert.deepEqual(liveChapters(restored).map(c=>c.id),['b']);assert.equal(restored.chapters[0].text,'보관할 원고');restored.chapters[0].deleted=false;assert.equal(liveChapters(restored)[0].adult,true);assert.equal(liveChapters(restored).length,2);
});
test('series collections follow part order without changing source series order',()=>{
 const books=[{id:'b',collection:{id:'g',title:'3부작',order:2}},{id:'a',collection:{id:'g',title:'3부작',order:0}},{id:'c',collection:{id:'g',title:'3부작',order:1}},{id:'solo'}];assert.deepEqual(groupedSeries(books)[0].books.map(b=>b.id),['a','c','b']);assert.equal(books[0].id,'b');books[0].collection=null;assert.equal(groupedSeries(books)[0].books.length,2);assert.equal(cleanCollection({id:2}),null);assert.equal(cleanCollection({id:'g',title:'t',order:-3}).order,0);
});
