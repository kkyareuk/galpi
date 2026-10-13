import test from 'node:test';
import assert from 'node:assert/strict';
import {formatText,remapMarks,clearMarks,cleanMarks,lineCount} from '../dist/text-tools.js';
test('annotation shifts after insertion before selected Korean text',()=>{
 const m=[{start:3,end:5,attrs:{effect:'tremble'}}];
 assert.deepEqual(remapMarks(m,'안녕 세계','오늘 안녕 세계'),[{start:6,end:8,attrs:{effect:'tremble'}}]);
});
test('deleting selected text removes effects, overlapping deletion shrinks',()=>{
 const m=[{start:2,end:5,attrs:{bold:true}}];
 assert.deepEqual(remapMarks(m,'abcdef','abf'),[]);
 assert.deepEqual(remapMarks(m,'abcdef','abef'),[{start:2,end:3,attrs:{bold:true}}]);
});
test('clear formatting splits range and preserves unaffected text',()=>{
 assert.deepEqual(clearMarks([{start:0,end:10,attrs:{bold:true}}],3,7),[{start:0,end:3,attrs:{bold:true}},{start:7,end:10,attrs:{bold:true}}]);
});
test('imported markup and malicious attributes are never rendered as HTML',()=>{
 const rendered=formatText('<img src=x onerror=alert(1)>',[{start:0,end:4,attrs:{font:'" onclick="x',color:'red;position:fixed',effect:'tremble" onload="x'}}]);
 assert(!rendered.includes('<img'));assert(!rendered.includes('position:fixed'));assert(!rendered.includes('onclick'));assert(rendered.includes('&lt;img'));
});
test('overlapping style ranges compose and font choices persist',()=>{
 const html=formatText('가나다',[{start:0,end:2,attrs:{bold:true}},{start:1,end:3,attrs:{effect:'tremble',font:'hand'}}]);
 assert(html.includes('font-weight:700'));assert(html.includes('fx-tremble'));assert(html.includes('Nanum Pen Script'));
});
test('untrusted ranges clamped and blank lines excluded',()=>{
 assert.deepEqual(cleanMarks([{start:-10,end:99,attrs:{size:500,color:'#123456'}}],3),[{start:0,end:3,attrs:{color:'#123456'}}]);
 assert.equal(lineCount('첫 줄\n\n  \n둘째 줄\r\n셋째 줄'),3);
});
