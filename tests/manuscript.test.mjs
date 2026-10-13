import test from 'node:test';
import assert from 'node:assert/strict';
import {renderManuscript,normalizeImport,safeImage,typography,orderedAUs} from '../dist/manuscript.js';
test('Markdown and source-offset effects compose without formatting delimiters',()=>{
 const source='## 제목\n\n**떨리는 문장**과 *기울임*\n\n> 인용\n\n- 하나\n- 둘';
 const start=source.indexOf('떨리는');const html=renderManuscript(source,[{start,end:start+6,attrs:{effect:'tremble'}}]);
 assert.match(html,/<h2>제목<\/h2>/);assert.match(html,/<strong><span[^>]*fx-tremble/);assert.match(html,/<em>기울임<\/em>/);assert.match(html,/<blockquote>/);assert.match(html,/<ul><li>하나<\/li><li>둘<\/li><\/ul>/);
});
test('raw HTML, unsafe links and forged avatars remain inert',()=>{
 const html=renderManuscript('<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))\n\n:::dialogue a\nhello\n:::',[],[{id:'a',name:'<script>',photo:'javascript:alert(1)'}]);
 assert.ok(!html.includes('<img'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('href="javascript:'));assert.match(html,/&lt;script&gt;/);assert.equal(safeImage('data:image/svg+xml;base64,PHN2Zz4='),'');
});
test('dialogue marker restores speaker and independent body',()=>{
 const html=renderManuscript(':::dialogue person-1\n안녕.\n**기다렸어.**\n:::',[],[{id:'person-1',name:'인물'}]);assert.match(html,/data-person="person-1"/);assert.match(html,/class="dialogue-body">안녕.<br><strong>기다렸어.<\/strong>/);
});
test('UTF8 and UTF16 imports normalize CRLF and BOM',()=>{
 assert.equal(normalizeImport(new TextEncoder().encode('\uFEFF한글\r\n원고\r끝').buffer),'한글\n원고\n끝');
 const bytes=new Uint8Array([255,254,0,172,13,0,10,0,196,179]);assert.equal(normalizeImport(bytes.buffer),'가\n도');
});
test('original universe first and typography clamped',()=>{
 assert.deepEqual(orderedAUs(['현대 AU','원작 세계관','현대 AU']),['원작','원작 세계관','현대 AU']);assert.equal(typography({size:999,line:.1,letter:99}).size,36);assert.equal(typography().line,1.6);
});
test('180k manuscript renders within a broad regression budget',()=>{
 const text=('서점 창가에서 다음 문장을 기다렸다.\n\n').repeat(8000).slice(0,180000);const start=performance.now();const html=renderManuscript(text);assert.ok(html.length>text.length);assert.ok(performance.now()-start<3000);
});
