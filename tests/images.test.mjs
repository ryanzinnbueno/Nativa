import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {prepareImage,readUpload,MAX_IMAGE_BYTES} from '../lib/upload-image.ts';
test('uploads decode actual image content, resize photos and reject disguised or oversized input',async()=>{
 const photo=await sharp({create:{width:2500,height:2000,channels:3,background:'#24563a'}}).png().toBuffer();
 const result=await prepareImage(photo,'image/png');
 const metadata=await sharp(result).metadata();
 assert.equal(metadata.format,'webp');assert.equal(metadata.width,1920);assert.ok(!metadata.exif);
 await assert.rejects(prepareImage(Buffer.from('not an image'),'image/jpeg'));
 await assert.rejects(prepareImage(photo,'image/jpeg'));
 await assert.rejects(prepareImage(Buffer.from('<svg/>'),'image/svg+xml'));
 await assert.rejects(prepareImage(Buffer.alloc(MAX_IMAGE_BYTES+1),'image/png'));
});
test('multipart upload enforces a body limit before decoding',async()=>{
 const form=new FormData();form.append('image',new File(['sample'],'photo.jpg',{type:'image/jpeg'}));form.append('kind','product');
 const parsed=await readUpload(new Request('http://localhost/api/admin/images',{method:'POST',body:form}));
 assert.equal(parsed.get('image').name,'photo.jpg');
 await assert.rejects(readUpload(new Request('http://localhost/',{method:'POST',headers:{'content-length':String(MAX_IMAGE_BYTES+100000)},body:'x'})));
});
