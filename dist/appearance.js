export const PAPERS={
 cotton:{name:'수채화 종이',image:'cotton',theme:'white'},
 ruled:{name:'줄 노트',image:'ruled',theme:'white'},
 vintage:{name:'접힌 오래된 종이',image:'vintage',theme:'cream'},
 black:{name:'검은 질감',image:'black',theme:'night'},
 plain:{name:'질감 없이',image:null,theme:'white'}
};
export function normalizeAppearance(prefs){
 if(!Object.hasOwn(PAPERS,prefs.paper))prefs.paper='cotton';
 delete prefs.dark;delete prefs.theme;
 return prefs;
}
export function applyPaper(prefs,doc=document){
 normalizeAppearance(prefs);const paper=PAPERS[prefs.paper];
 doc.body.dataset.paper=prefs.paper;doc.body.dataset.theme=paper.theme;
 doc.body.classList.toggle('dark',paper.theme==='night');
 // Request that mobile browsers retain the chosen light palette, even with OS dark mode.
 doc.documentElement.style.colorScheme=paper.theme==='night'?'dark':'only light';
 doc.body.style.setProperty('--paper-texture',paper.image?`url("${new URL('textures/'+paper.image+'.jpg',import.meta.url).href}")`:'none');
}
const thumb=p=>p.image?`<img src="${new URL('textures/'+p.image+'.jpg',import.meta.url).href}" alt="" loading="lazy">`:'<span class="plain-paper"></span>';
export function paperPicker(selected){
 const chosen=PAPERS[selected]||PAPERS.cotton;
 return `<details class="paper-picker"><summary>${thumb(chosen)}<span>종이 질감 · ${chosen.name}</span><span aria-hidden="true">⌄</span></summary><div class="paper-options" role="group" aria-label="종이 질감 선택">${Object.entries(PAPERS).map(([id,p])=>`<button type="button" data-paper-choice="${id}" aria-pressed="${selected===id}">${thumb(p)}<span>${p.name}</span></button>`).join('')}</div></details>`;
}
export function bindPaperPicker(root,prefs,onChange){
 root.querySelectorAll('[data-paper-choice]').forEach(button=>button.onclick=()=>{prefs.paper=button.dataset.paperChoice;onChange();const picker=button.closest('.paper-picker');picker.outerHTML=paperPicker(prefs.paper);bindPaperPicker(root,prefs,onChange)});
}
