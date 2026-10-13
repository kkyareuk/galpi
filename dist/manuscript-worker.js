import {renderManuscript,normalizeImport} from './manuscript.js';
self.onmessage=({data})=>{try{const result=data.type==='import'?normalizeImport(data.buffer,data.encoding):renderManuscript(data.text,data.marks,data.characters,data.markdown);self.postMessage({id:data.id,result})}catch(error){self.postMessage({id:data.id,error:error.message})}};
