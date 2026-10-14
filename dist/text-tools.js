export const FONT_PRESETS = {
  kopub: {name:'KoPubWorld 바탕',family:'"KoPubWorld Batang", "Nanum Myeongjo", serif'},
  kopubdotum: {name:'KoPubWorld 돋움',family:'"KoPubWorld Dotum", "Nanum Gothic", sans-serif'},
  serif: {name:'나눔명조', family:'"Nanum Myeongjo", Georgia, serif'},
  sans: {name:'나눔고딕', family:'"Nanum Gothic", sans-serif'},
  batang: {name:'고운바탕', family:'"Gowun Batang", serif'},
  hand: {name:'손글씨', family:'"Nanum Pen Script", cursive'},
  mono: {name:'고정폭', family:'"D2Coding", Consolas, monospace'},
  custom: {name:'내 폰트', family:'"GalpiCustom", "Nanum Myeongjo", serif'}
};
export const EFFECTS = {none:'효과 없음', tremble:'부들부들', float:'둥실둥실', pulse:'숨쉬기', fade:'희미하게', neon:'네온사인', glow:'은은한 빛', glitch:'글리치'};
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function cleanMarks(input,length){
  if(!Array.isArray(input))return [];
  return input.slice(0,400).flatMap(m=>{
    if(!m || typeof m!=='object')return [];
    const start=Math.max(0,Math.min(length,Math.trunc(Number(m.start))));
    const end=Math.max(0,Math.min(length,Math.trunc(Number(m.end))));
    if(!Number.isFinite(start)||!Number.isFinite(end)||start>=end)return [];
    const attrs={};
    for(const k of ['bold','italic','underline','strike'])if(typeof m.attrs?.[k]==='boolean')attrs[k]=m.attrs[k];
    if(FONT_PRESETS[m.attrs?.font])attrs.font=m.attrs.font;
    if(EFFECTS[m.attrs?.effect])attrs.effect=m.attrs.effect;
    if(m.attrs?.color==='inherit'||/^#[0-9a-f]{6}$/i.test(m.attrs?.color))attrs.color=m.attrs.color;
    if(Number.isFinite(m.attrs?.px)&&m.attrs.px>=12&&m.attrs.px<=36)attrs.px=m.attrs.px;
    if([.85,1,1.2,1.5].includes(m.attrs?.size))attrs.size=m.attrs.size;
    if([1,2,3].includes(m.attrs?.intensity))attrs.intensity=m.attrs.intensity;
    return Object.keys(attrs).length?[{start,end,attrs}]:[];
  });
}
// Preserve ranges around an insertion/deletion without putting markup in the manuscript.
export function remapMarks(marks,oldText,newText){
  let start=0;while(start<oldText.length&&start<newText.length&&oldText[start]===newText[start])start++;
  let oldEnd=oldText.length,newEnd=newText.length;
  while(oldEnd>start&&newEnd>start&&oldText[oldEnd-1]===newText[newEnd-1]){oldEnd--;newEnd--;}
  const delta=newEnd-oldEnd;
  return cleanMarks(marks,oldText.length).flatMap(m=>{
    if(m.end<=start)return [m];
    if(m.start>=oldEnd)return [{...m,start:m.start+delta,end:m.end+delta}];
    const a=m.start<start?m.start:start,b=m.end>oldEnd?m.end+delta:newEnd;
    return a<b?[{...m,start:a,end:b}]:[];
  });
}
export function formatText(text,input){
  const marks=cleanMarks(input,text.length),edges=[...new Set([0,text.length,...marks.flatMap(m=>[m.start,m.end])])].sort((a,b)=>a-b);
  const runs=[];for(let i=0;i<edges.length-1;i++){const start=edges[i],end=edges[i+1],attrs=Object.assign({},...marks.filter(m=>m.start<=start&&m.end>=end).map(m=>m.attrs));const last=runs.at(-1);if(last&&JSON.stringify(last.attrs)===JSON.stringify(attrs))last.end=end;else runs.push({start,end,attrs})}
  return runs.map(({start,end,attrs})=>{
    if(!Object.keys(attrs).length)return escape(text.slice(start,end));
    const styles=[];if(attrs.bold!==undefined)styles.push('font-weight:'+(attrs.bold?700:400));
    if(attrs.italic!==undefined)styles.push('font-style:'+(attrs.italic?'italic':'normal'));
    if(attrs.underline!==undefined)styles.push('text-decoration:'+(attrs.underline?'underline':'none'));
    if(attrs.strike!==undefined)styles.push('text-decoration:'+(attrs.strike?'line-through':attrs.underline?'underline':'none'));
    if(attrs.px)styles.push('font-size:'+attrs.px+'px');
    if(attrs.color)styles.push('color:'+attrs.color);
    if(attrs.font)styles.push('font-family:'+escape(FONT_PRESETS[attrs.font].family));
    if(attrs.size&&!attrs.px)styles.push('font-size:'+attrs.size+'em');
    styles.push('--motion:'+(attrs.intensity||1)+'px');
    const cls=attrs.effect&&attrs.effect!=='none'?' fx fx-'+attrs.effect:'';
    return `<span data-galpi="${escape(JSON.stringify(attrs))}" class="${cls}" style="${styles.join(';')}">${effectContent(text.slice(start,end),attrs.effect)}</span>`;
  }).join('');
}
export function clearMarks(input,start,end){return input.flatMap(m=>m.end<=start||m.start>=end?[m]:[{...m,end:Math.min(m.end,start)},{...m,start:Math.max(m.start,end)}].filter(x=>x.start<x.end))}
export function lineCount(text){return text.split(/\r?\n/).filter(line=>line.trim()).length}

export function effectContent(text,effect){
 if(effect!=='tremble')return escape(text);
 const parts=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('ko',{granularity:'grapheme'}).segment(text)].map(s=>s.segment):Array.from(text);
 return parts.map((ch,i)=>/\s/.test(ch)?escape(ch):'<span class="fx-letter" style="--delay:-'+((i*37)%170)+'ms">'+escape(ch)+'</span>').join('');
}
