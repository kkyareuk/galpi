export const liveChapters=book=>book.chapters.filter(ch=>ch.deleted!==true);
export function groupedSeries(books){
 const groups=new Map();
 for(const book of books){const group=book.collection;if(!group?.id||!group.title)continue;if(!groups.has(group.id))groups.set(group.id,{id:group.id,title:group.title,books:[]});groups.get(group.id).books.push(book)}
 return [...groups.values()].map(group=>({...group,books:group.books.sort((a,b)=>(a.collection.order||0)-(b.collection.order||0))}));
}
export function cleanCollection(value){
 if(!value||typeof value.id!=='string'||typeof value.title!=='string')return null;
 return {id:value.id.slice(0,100),title:value.title.slice(0,80),order:Math.max(0,Math.min(999,Number(value.order)||0))};
}
