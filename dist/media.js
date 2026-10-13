export async function imageData(file,avatar=false){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('JPG, PNG, WebP 이미지를 선택해 주세요.');
 if(file.size>15*1024*1024)throw Error('이미지는 15MB 이하로 선택해 주세요.');
 const image=await createImageBitmap(file);try{
 const scale=Math.min(1,(avatar?160:700)/Math.max(image.width,image.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
 const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
 const limit=avatar?24000:220000;for(const quality of [.85,.7,.5,.3]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<=limit)return data}
 throw Error('복잡한 이미지여서 저장 크기를 초과했어요. 작은 이미지를 선택해 주세요.');
 }finally{image.close()}
}
