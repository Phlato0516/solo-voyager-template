import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
const parser={};new Function('exports',ts.transpile(fs.readFileSync('app/trip-photo-upload.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(parser);
const photoModule={};new Function('exports','require',ts.transpile(fs.readFileSync('app/trip-photo-input.tsx','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}))(photoModule,id=>id==='./trip-photo-upload'?parser:require(id));
// Browser adapters verify the actual compression orchestration without claiming a device test.
let revoked=0,drawn,canvas,shouldFail=false,encodedSizes=[100],qualities=[];
const old={Image:globalThis.Image,FileReader:globalThis.FileReader,document:globalThis.document,create:URL.createObjectURL,revoke:URL.revokeObjectURL};
URL.createObjectURL=()=> 'blob:fixture';URL.revokeObjectURL=()=>revoked++;
globalThis.Image=class{naturalWidth=4032;naturalHeight=3024;async decode(){if(shouldFail)throw Error('decoder failure')}};
globalThis.document={createElement(type){assert.equal(type,'canvas');canvas={width:0,height:0,getContext(){return {fillRect(){},drawImage(...args){drawn=args}}},toBlob(callback,type,quality){assert.equal(type,'image/jpeg');qualities.push(quality);callback(new Blob([new Uint8Array(encodedSizes.shift()??100)],{type}))}};return canvas}};
globalThis.FileReader=class{readAsDataURL(blob){assert.equal(blob.type,'image/jpeg');this.result='data:image/jpeg;base64,/9j/4AAC/9k=';this.onload()}};
try{
 const result=await photoModule.prepareTripPhoto({size:8_000_000,type:'image/jpeg'});assert.equal(result.type,'image/jpeg');assert.equal(canvas.width,1920);assert.equal(canvas.height,1440);assert.equal(drawn[3],1920);assert.equal(revoked,1);assert.equal(parser.parseTripCoverUpload(result).length,8);
 encodedSizes=[1_600_000,900_000];qualities=[];await photoModule.prepareTripPhoto({size:8_000_000,type:'image/png'});assert.deepEqual(qualities,[.82,.6]);
 await assert.rejects(photoModule.prepareTripPhoto({size:26*1024*1024,type:'image/jpeg'}),/25MB/);await assert.rejects(photoModule.prepareTripPhoto({size:100,type:'application/pdf'}),/照片檔案/);
 const revokedBefore=revoked;shouldFail=true;await assert.rejects(photoModule.prepareTripPhoto({size:100,type:'image/heic'}),/無法讀取/);assert.equal(revoked,revokedBefore+1);shouldFail=false;
 encodedSizes=[1_600_000,1_600_000];await assert.rejects(photoModule.prepareTripPhoto({size:100,type:'image/png'}),/壓縮後仍過大/);
 console.log('PASS: proportional 1920px resize, JPEG encoding/quality fallback, output validated by server parser, file type/size checks, decode/oversize errors, object URLs released');
}finally{globalThis.Image=old.Image;globalThis.FileReader=old.FileReader;globalThis.document=old.document;URL.createObjectURL=old.create;URL.revokeObjectURL=old.revoke}
