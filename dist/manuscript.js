import {formatText,cleanMarks} from './text-tools.js';
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeImage=value=>typeof value==='string'&&value.length<=240000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)?value:'';
export const orderedAUs=values=>[...new Set(['원작',...values.map(v=>v||'원작')])].sort((a,b)=>Number(!/^원작/.test(a))-Number(!/^원작/.test(b)));
export function typography(value={}){const n=(key,def,min,max)=>Number.isFinite(Number(value[key]))?Math.max(min,Math.min(max,Number(value[key]))):def;return {size:n('size',17,12,36),line:n('line',1.6,1,2.5),letter:n('letter',0,-2,5),paragraph:n('paragraph',.65,0,3)}}
export function normalizeImport(buffer,encoding='auto'){
 const bytes=new Uint8Array(buffer);let decoder=encoding;
 if(encoding==='auto'){decoder=bytes[0]===255&&bytes[1]===254?'utf-16le':bytes[0]===254&&bytes[1]===255?'utf-16be':'utf-8';try{new TextDecoder(decoder,{fatal:true}).decode(bytes)}catch{decoder='euc-kr'}}
 return new TextDecoder(decoder).decode(bytes).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
}
// Render source offsets directly so visual annotations survive Markdown delimiters.
// Raw HTML and executable URLs are never emitted.
export function renderManuscript(text,input=[],characters=[],markdown=true){
 const marks=cleanMarks(input,text.length);
 const leaf=(s,offset)=>{const active=marks.filter(m=>m.start<offset+s.length&&m.end>offset).map(m=>({...m,start:Math.max(0,m.start-offset),end:Math.min(s.length,m.end-offset)}));return active.length?formatText(s,active):escapeHTML(s)};
 const inline=(s,offset,depth=0)=>{
  if(depth>8)return leaf(s,offset);
  const pattern=/(`+)([^`\n]+?)\1|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(\*\*|__|~~|\*|_)(?=\S)([^\n]+?)\5/g;
  let html='',last=0,m;
  while((m=pattern.exec(s))){html+=leaf(s.slice(last,m.index),offset+last);
   if(m[1])html+='<code>'+leaf(m[2],offset+m.index+m[1].length)+'</code>';
   else if(m[3])html+='<a href="'+escapeHTML(m[4])+'" target="_blank" rel="noopener noreferrer">'+inline(m[3],offset+m.index+1,depth+1)+'</a>';
   else{const tag=m[5]==='**'||m[5]==='__'?'strong':m[5]==='~~'?'del':'em';html+='<'+tag+'>'+inline(m[6],offset+m.index+m[5].length,depth+1)+'</'+tag+'>'}
   last=pattern.lastIndex;
  }return html+leaf(s.slice(last),offset+last);
 };
 const lines=[];let pos=0;for(const value of text.split('\n')){lines.push({value,offset:pos});pos+=value.length+1}
 let out='',i=0;const content=(s,o)=>markdown?inline(s,o):leaf(s,o);
 while(i<lines.length){const {value,offset}=lines[i];
  if(!value.trim()){i++;continue}
  const dialogue=/^:::dialogue ([a-zA-Z0-9-]+)\s*$/.exec(value);
  if(dialogue){let end=i+1;while(end<lines.length&&lines[end].value!==':::')end++;if(end<lines.length){const person=characters.find(p=>p.id===dialogue[1]);const photo=safeImage(person?.photo);out+='<div class="dialogue-block" data-person="'+escapeHTML(dialogue[1])+'"><div class="dialogue-avatar" contenteditable="false">'+(photo?'<img src="'+photo+'" alt="" loading="lazy">':escapeHTML((person?.name||'?').slice(0,1)))+'</div><div class="dialogue-content"><strong class="dialogue-name" contenteditable="false">'+escapeHTML(person?.name||'인물')+'</strong><div class="dialogue-body">'+lines.slice(i+1,end).map(l=>content(l.value,l.offset)).join('<br>')+'</div></div></div>';i=end+1;continue}}
  if(markdown&&/^```/.test(value)){let end=i+1;while(end<lines.length&&!/^```/.test(lines[end].value))end++;out+='<pre><code>'+escapeHTML(lines.slice(i+1,end).map(l=>l.value).join('\n'))+'</code></pre>';i=end<lines.length?end+1:end;continue}
  const heading=markdown&&/^(#{1,6})\s+(.+)$/.exec(value);
  if(heading){out+='<h'+heading[1].length+'>'+inline(heading[2],offset+value.indexOf(heading[2]))+'</h'+heading[1].length+'>';i++;continue}
  if(markdown&&/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(value)){out+='<hr>';i++;continue}
  const list=markdown&&/^(\s*)([-+*]|\d+\.)\s+(.+)$/.exec(value);
  if(list){const numbered=/\d/.test(list[2]),tag=numbered?'ol':'ul';out+='<'+tag+'>';while(i<lines.length){const l=lines[i],m=/^(\s*)([-+*]|\d+\.)\s+(.+)$/.exec(l.value);if(!m||/\d/.test(m[2])!==numbered)break;out+='<li>'+inline(m[3],l.offset+l.value.indexOf(m[3]))+'</li>';i++}out+='</'+tag+'>';continue}
  if(markdown&&/^>\s?/.test(value)){out+='<blockquote>';while(i<lines.length&&/^>\s?/.test(lines[i].value)){const l=lines[i],s=l.value.replace(/^>\s?/,'');out+=inline(s,l.offset+l.value.length-s.length)+(i+1<lines.length&&/^>\s?/.test(lines[i+1].value)?'<br>':'');i++}out+='</blockquote>';continue}
  const paragraph=[];while(i<lines.length&&lines[i].value.trim()){const l=lines[i];if(paragraph.length&&(/^:::dialogue /.test(l.value)||markdown&&/^(#{1,6}\s|>|```|[-+*]\s|\d+\.\s|---+$)/.test(l.value)))break;paragraph.push(content(l.value,l.offset));i++}out+='<p>'+paragraph.join('<br>')+'</p>';
 }return out;
}
