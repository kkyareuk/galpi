import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {renderManuscript} from '../dist/manuscript.js';
import {serializeEditor} from '../dist/rich-editor.js';
const serialize=html=>{const dom=new JSDOM('<div id="editor">'+html+'</div>');return serializeEditor(dom.window.document.querySelector('#editor'))};
test('editing a Markdown document retains headings, paragraphs and nested styles',()=>{
 const source='## 소제목\n\n**강조**하고 *기울인* 문장.\n\n마지막 문단.';
 const start=source.indexOf('문장');const html=renderManuscript(source,[{start,end:start+2,attrs:{effect:'neon',color:'#123456'}}]);
 const result=serialize(html);assert.match(result.text,/## 소제목\n/);assert.match(result.text,/\*\*강조\*\*/);assert.match(result.text,/\*기울인\*/);assert.equal(result.marks[0].attrs.effect,'neon');assert.equal(result.text.slice(result.marks[0].start,result.marks[0].end),'문장');
});
test('new inner formatting overrides prior outer formatting after reload',()=>{
 const result=serialize('<p><span data-galpi="{&quot;bold&quot;:true}">앞<span data-galpi="{&quot;bold&quot;:false,&quot;effect&quot;:&quot;tremble&quot;}">뒤</span></span></p>');
 const html=renderManuscript(result.text,result.marks);assert.match(html,/font-weight:400/);assert.equal(new JSDOM(html).window.document.querySelector('.fx-tremble').textContent,'뒤');assert.match(html,/fx-tremble/);
});
test('blank browser paragraphs do not accumulate each time the document is edited',()=>{
 const first=serialize('<p></p><p>첫 문단</p><p><br></p><p>두 번째</p><p></p>');assert.equal(first.text,'첫 문단\n\n두 번째');const second=serialize(renderManuscript(first.text,first.marks));assert.deepEqual(second,first);
});
test('dialogue serializes the editable body without inserting avatar or speaker into manuscript',()=>{
 const source=':::dialogue a\n안녕.\n다시 왔어.\n:::';const result=serialize(renderManuscript(source,[],[{id:'a',name:'네리'}]));assert.equal(result.text,source);assert.equal(result.marks.length,0);
});
test('multiline quotes keep every line inside their quote on save',()=>{
 const source='> 첫째 줄\n> 둘째 줄';assert.equal(serialize(renderManuscript(source)).text,source);
});
