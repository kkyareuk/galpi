// Selection bookkeeping ignores editor controls and speaker labels.
export function textNodes(root){
 const out=[],walker=root.ownerDocument.createTreeWalker(root,4);let node;
 while((node=walker.nextNode()))if(!node.parentElement.closest('[contenteditable="false"],[data-editor-ui]'))out.push(node);
 return out;
}
export function selectedNodes(root,range){
 if(!range||range.collapsed)return [];
 return textNodes(root).filter(node=>range.intersectsNode(node)).map(node=>({node,start:range.startContainer===node?range.startOffset:0,end:range.endContainer===node?range.endOffset:node.length})).filter(n=>n.end>n.start);
}
export function selectedEffect(root,range){
 const values=selectedNodes(root,range).map(({node})=>{
  let effect='none';const chain=[];for(let el=node.parentElement;el&&el!==root;el=el.parentElement)chain.unshift(el);
  for(const el of chain)if(el.dataset.galpi){try{const attrs=JSON.parse(el.dataset.galpi);if(attrs.effect)effect=attrs.effect}catch{}}
  return effect;
 });
 return values.length&&values.every(v=>v===values[0])?values[0]:values.length?'mixed':'none';
}
export function selectionOffsets(root,range){
 let offset=0,start=null,end=null;
 for(const node of textNodes(root)){if(range.intersectsNode(node)){const a=range.startContainer===node?range.startOffset:0,b=range.endContainer===node?range.endOffset:node.length;if(b>a){start??=offset+a;end=offset+b}}offset+=node.length}
 return start===null?null:{start,end};
}
export function restoreSelection(root,offsets){
 if(!offsets)return null;const range=root.ownerDocument.createRange();let offset=0,started=false;
 for(const node of textNodes(root)){const end=offset+node.length;if(!started&&offsets.start<end){range.setStart(node,Math.max(0,offsets.start-offset));started=true}if(started&&offsets.end<=end){range.setEnd(node,Math.max(0,offsets.end-offset));const s=root.ownerDocument.getSelection();s.removeAllRanges();s.addRange(range);return range}offset=end}return null;
}
