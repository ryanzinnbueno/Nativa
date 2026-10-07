import fs from 'node:fs/promises';
const assets={
 hero:'https://foto.wuestenigel.com/photos/full/vielfalt-an-nuessen-samen-und-trockenfruechten-in-glasbehaeltern.jpg',
 caju:'https://jeppi.com/cdn/shop/collections/Welcome_1_d6b64953-0eff-4da6-b5e6-7c598c969035.png?v=1771524436',
 granola:'https://noem.imgix.net/Granola.png?auto=compress%2Cformat&w=685',
 hibisco:'https://neradatea.com.au/cdn/shop/files/Hibiscus_Flower_Leaves.jpg?v=1727336242&width=800',
 mix:'https://www.arimex.lt/uploads/_CGSmartImage/arimex_1561728758-016eceda2da1915da01be6ef2220a95e.jpg',
 aveia:'https://static.wixstatic.com/media/d5f6ce_8075c4e009e74b65b0ac72490e6dd467~mv2.png/v1/fit/w_500%2Ch_500%2Cq_90/file.png',
 frutas:'https://foto.wuestenigel.com/photos/full/vielfalt-an-nuessen-samen-und-trockenfruechten-in-glasbehaeltern.jpg'
};
await fs.mkdir('public/images',{recursive:true});
await Promise.all(Object.entries(assets).map(async([name,url])=>{try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(r.status);const bytes=Buffer.from(await r.arrayBuffer());await fs.writeFile(`public/images/${name}.jpg`,bytes);console.log(name,bytes.length);}catch(e){console.log(name,String(e));}}));
