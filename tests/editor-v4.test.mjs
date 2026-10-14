import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {renderManuscript,typography} from '../dist/manuscript.js';
import {serializeEditor} from '../dist/rich-editor.js';
import {selectedEffect,restoreSelection,selectionOffsets} from '../dist/editor-selection.js';
function editor(text,marks=[]){const dom=new JSDOM('<div id="editor">'+renderManuscript(text,marks,[{id:'a',name:'네리'}])+'</div>');return dom.window.document.querySelector('#editor')}
test('selecting an existing effect restores its state, including inner removal and mixed ranges',()=>{
 const root=editor('앞뒤끝',[{start:0,end:2,attrs:{effect:'neon'}},{start:1,end:2,attrs:{effect:'none'}}]);
 let range=restoreSelection(root,{start:0,end:1});assert.equal(selectedEffect(root,range),'neon');
 range=restoreSelection(root,{start:1,end:2});assert.equal(selectedEffect(root,range),'none');
 range=restoreSelection(root,{start:0,end:3});assert.equal(selectedEffect(root,range),'mixed');assert.deepEqual(selectionOffsets(root,range),{start:0,end:3});
});
test('tremble splits visible graphemes and round trips without splitting emoji or inserting spaces',()=>{
 const text='한글 👨‍👩‍👧‍👦';const root=editor(text,[{start:0,end:text.length,attrs:{effect:'tremble'}}]);assert.equal(root.querySelectorAll('.fx-letter').length,3);assert.equal(root.textContent,text);assert.equal(serializeEditor(root).text,text);assert.equal(selectedEffect(root,restoreSelection(root,{start:0,end:text.length})),'tremble');
});
test('moving and deleting dialogue preserves source and effects, ignores editor handles',()=>{
 const text='첫 문단\n\n:::dialogue a\n안녕\n:::\n\n마지막';const root=editor(text,[{start:0,end:2,attrs:{effect:'glitch'}}]);const handle=root.ownerDocument.createElement('button');handle.dataset.editorUi='handle';handle.textContent='⠿';root.firstChild.prepend(handle);const dialogue=root.querySelector('.dialogue-block');root.prepend(dialogue);let result=serializeEditor(root);assert.ok(result.text.startsWith(':::dialogue a'));assert.ok(!result.text.includes('⠿'));assert.equal(result.text.slice(result.marks[0].start,result.marks[0].end),'첫 ');dialogue.remove();result=serializeEditor(root);assert.equal(result.text,'첫 문단\n\n마지막');assert.equal(result.marks[0].attrs.effect,'glitch');
});
test('first-line indentation is shared typography with bounded settings',()=>{assert.equal(typography().indent,1);assert.equal(typography({indent:0}).indent,0);assert.equal(typography({indent:100}).indent,4)});
