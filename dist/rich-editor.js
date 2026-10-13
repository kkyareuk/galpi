import {cleanMarks} from './text-tools.js';
// Read only this app's editable document. Paste is handled as plain text.
export function serializeEditor(root){
 let text='',marks=[];
 const append=s=>{if(/^\n+$/.test(s)){if(!text)return;const trailing=text.match(/\n*$/)[0].length;text+='\n'.repeat(Math.max(0,Math.min(s.length,2-trailing)))}else{text+=s}};
 const boundary=()=>{if(text&&!text.endsWith('\n'))append('\n')};
 function walk(node){
  if(node.nodeType===3){append(node.nodeValue);return}
  if(node.nodeType!==1)return;
  const tag=node.tagName;
  if(node.classList.contains('dialogue-block')){boundary();append(':::dialogue '+node.dataset.person+'\n');for(const child of node.querySelector('.dialogue-body').childNodes)walk(child);boundary();append(':::\n\n');return}
  if(tag==='BR'){append(node.closest('blockquote')?'\n> ':'\n');return}
  if(tag==='HR'){boundary();append('---\n\n');return}
  if(tag==='PRE'){boundary();append('```\n'+node.textContent+'\n```\n\n');return}
  const block=['P','DIV','H1','H2','H3','H4','H5','H6','BLOCKQUOTE','LI','UL','OL'].includes(tag);
  if(block)boundary();
  const wrappers={STRONG:'**',B:'**',EM:'*',I:'*',DEL:'~~',S:'~~',CODE:'`'};
  const wrap=wrappers[tag]||'';append(wrap);
  if(/^H[1-6]$/.test(tag))append('#'.repeat(+tag[1])+' ');
  if(tag==='BLOCKQUOTE')append('> ');
  if(tag==='LI')append(node.parentElement.tagName==='OL'?(Array.from(node.parentElement.children).indexOf(node)+1)+'. ':'- ');
  if(tag==='A')append('[');
  const start=text.length;let annotation=null;
  if(node.dataset.galpi){try{annotation={start,end:start,attrs:JSON.parse(node.dataset.galpi)};marks.push(annotation)}catch{}}
  for(const child of node.childNodes)walk(child);
  const end=text.length;
  if(annotation)annotation.end=end;
  if(tag==='U')marks.push({start,end,attrs:{underline:true}});
  if(tag==='A')append(']('+(/^https?:\/\//.test(node.getAttribute('href'))?node.getAttribute('href'):'https://example.invalid')+')');
  append(wrap);
  if(block){boundary();if(['P','DIV','BLOCKQUOTE','UL','OL'].includes(tag))append('\n')}
 }
 for(const child of root.childNodes)walk(child);
 text=text.replace(/\n+$/,'');return {text,marks:cleanMarks(marks,text.length)};
}
