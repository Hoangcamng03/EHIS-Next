const {test}=require('node:test'),assert=require('node:assert/strict');
const {rawResourceFiles}=require('./test-support/android-resources.cjs');
// Small binary format fixtures, never used as APK/device or latency evidence.
function pool(items){
 const parts=items.map(s=>Buffer.concat([Buffer.from([s.length,Buffer.byteLength(s)]),Buffer.from(s),Buffer.from([0])]));
 const offsets=Buffer.alloc(items.length*4);let at=0;parts.forEach((b,i)=>{offsets.writeUInt32LE(at,i*4);at+=b.length;});
 const b=Buffer.alloc(28);b.writeUInt16LE(1);b.writeUInt16LE(28,2);b.writeUInt32LE(28+offsets.length+at,4);b.writeUInt32LE(items.length,8);b.writeUInt32LE(256,16);b.writeUInt32LE(28+offsets.length,20);
 return Buffer.concat([b,offsets,...parts]);
}
function table({name='emergency_tone',compact=false,indexFlags=0,path='res/_X.wav'}={}){
 const global=pool([path]),types=pool(['raw']),keys=pool([name]);
 const entry=Buffer.alloc(compact?8:16);
 if(compact){entry.writeUInt16LE(0);entry.writeUInt16LE(8|(3<<8),2);entry.writeUInt32LE(0,4);}
 else{entry.writeUInt16LE(8);entry.writeUInt32LE(0,4);entry.writeUInt16LE(8,8);entry[11]=3;entry.writeUInt32LE(0,12);}
 const type=Buffer.alloc(24),index=Buffer.alloc(indexFlags===2?2:4);
 type.writeUInt16LE(0x201);type.writeUInt16LE(24,2);type.writeUInt32LE(type.length+index.length+entry.length,4);type[8]=1;type[9]=indexFlags;type.writeUInt32LE(1,12);type.writeUInt32LE(type.length+index.length,16);type.writeUInt32LE(4,20);
 const pkg=Buffer.alloc(288);pkg.writeUInt16LE(0x200);pkg.writeUInt16LE(288,2);pkg.writeUInt32LE(pkg.length+types.length+keys.length+type.length+index.length+entry.length,4);pkg.writeUInt32LE(127,8);pkg.writeUInt32LE(288,268);pkg.writeUInt32LE(288+types.length,276);
 const header=Buffer.alloc(12);header.writeUInt16LE(2);header.writeUInt16LE(12,2);header.writeUInt32LE(header.length+global.length+pkg.readUInt32LE(4),4);header.writeUInt32LE(1,8);
 return Buffer.concat([header,global,pkg,types,keys,type,index,entry]);
}
test('raw notification name resolves through shortened AAPT path, full and compact entries',()=>{
 for(const compact of [false,true])assert.deepEqual(rawResourceFiles(table({compact}),'emergency_tone'),['res/_X.wav']);
});
test('raw resources accept normal, sparse and 16-bit offset indexes',()=>{
 for(const indexFlags of [0,1,2])assert.deepEqual(rawResourceFiles(table({indexFlags}),'emergency_tone'),['res/_X.wav']);
});
test('a WAV file or matching path without the required raw name cannot satisfy the check',()=>{
 assert.deepEqual(rawResourceFiles(table({name:'wrong_sound'}),'emergency_tone'),[]);
 assert.throws(()=>rawResourceFiles(table({path:'assets/emergency_tone.wav'}),'emergency_tone'),/Resource file path/);
});
test('invalid or truncated resource tables fail closed',()=>{
 assert.throws(()=>rawResourceFiles(Buffer.alloc(3),'emergency_tone'),/bounds/);
 const b=table();b.writeUInt32LE(b.length+16,4);assert.throws(()=>rawResourceFiles(b,'emergency_tone'),/bounds/);
 const bad=table();bad.writeUInt32LE(0xffffff00,4);assert.throws(()=>rawResourceFiles(bad,'emergency_tone'),/bounds/);
});
