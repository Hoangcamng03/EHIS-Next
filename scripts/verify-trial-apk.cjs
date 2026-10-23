// Artifact structure/configuration check, not device or signing-certificate acceptance.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=b=>createHash('sha256').update(b).digest('hex');
function entries(bytes){
 let end=bytes.length-22;while(end>=Math.max(0,bytes.length-65557)&&bytes.readUInt32LE(end)!==0x06054b50)end--;
 assert.ok(end>=0,'ZIP end directory');const total=bytes.readUInt16LE(end+10),out=new Map();let cursor=bytes.readUInt32LE(end+16);
 for(let i=0;i<total;i++){
  assert.equal(bytes.readUInt32LE(cursor),0x02014b50);const method=bytes.readUInt16LE(cursor+10),size=bytes.readUInt32LE(cursor+20),nameLength=bytes.readUInt16LE(cursor+28),extra=bytes.readUInt16LE(cursor+30),comment=bytes.readUInt16LE(cursor+32),offset=bytes.readUInt32LE(cursor+42),name=bytes.subarray(cursor+46,cursor+46+nameLength).toString('utf8');
  out.set(name,()=>{assert.equal(bytes.readUInt32LE(offset),0x04034b50);const start=offset+30+bytes.readUInt16LE(offset+26)+bytes.readUInt16LE(offset+28),data=bytes.subarray(start,start+size);assert.ok(method===0||method===8);return method===8?zlib.inflateRawSync(data,{maxOutputLength:150*1024*1024}):data;});cursor+=46+nameLength+extra+comment;
 }return out;
}
function manifest(bytes){
 let strings=[],attributes={},permissions=[];
 for(let offset=bytes.readUInt16LE(2);offset<bytes.length;){
  const type=bytes.readUInt16LE(offset),size=bytes.readUInt32LE(offset+4);assert.ok(size>0);
  if(type===1){const header=bytes.readUInt16LE(offset+2),count=bytes.readUInt32LE(offset+8),utf8=!!(bytes.readUInt32LE(offset+16)&256),base=offset+bytes.readUInt32LE(offset+20);
   strings=Array.from({length:count},(_,i)=>{let p=base+bytes.readUInt32LE(offset+header+i*4);if(utf8){const len=()=>{let n=bytes[p++];return n&128?((n&127)<<8)|bytes[p++]:n;};len();const n=len();return bytes.subarray(p,p+n).toString('utf8');}let n=bytes.readUInt16LE(p);p+=2;if(n&32768){n=((n&32767)<<16)|bytes.readUInt16LE(p);p+=2;}return bytes.subarray(p,p+n*2).toString('utf16le');});
  }
  if(type===0x102){const tag=strings[bytes.readUInt32LE(offset+20)],count=bytes.readUInt16LE(offset+28),step=bytes.readUInt16LE(offset+26),start=offset+16+bytes.readUInt16LE(offset+24),a={};
   for(let i=0;i<count;i++){const q=start+i*step,key=strings[bytes.readUInt32LE(q+4)],raw=bytes.readUInt32LE(q+8),kind=bytes[q+15],value=bytes.readUInt32LE(q+16);a[key]=raw!==0xffffffff?strings[raw]:kind===3?strings[value]:value;}
   if(tag==='manifest')attributes=a;if(tag==='uses-permission')permissions.push(a.name);
  }offset+=size;
 }return {attributes,permissions};
}
async function main(){
 const record=JSON.parse(fs.readFileSync('.local/android-trial-build.json','utf8'));
 assert.equal(record.status,'FINISHED');assert.ok(record.apkUrl?.startsWith('https://expo.dev/artifacts/eas/')&&record.apkUrl.endsWith('.apk'));
 const response=await fetch(record.apkUrl,{signal:AbortSignal.timeout(120000)});assert.equal(response.status,200);
 const bytes=Buffer.from(await response.arrayBuffer());assert.ok(bytes.length>1e6&&bytes.length<150e6,'Expected APK size');const zip=entries(bytes);
 const native=manifest(zip.get('AndroidManifest.xml')());assert.equal(native.attributes.package,'com.hoangcamng.ehisnext');assert.equal(native.attributes.versionName,record.version);assert.equal(Number(native.attributes.versionCode),record.versionCode);
 assert.ok(!native.permissions.includes('android.permission.RECORD_AUDIO'),'No microphone permission');assert.ok(native.permissions.includes('android.permission.VIBRATE'),'Vibration permission');
 const bundle=zip.get('assets/index.android.bundle')();assert.ok(bundle.includes(Buffer.from('ehis-next-20261021-hc03')));assert.ok(bundle.includes(Buffer.from('https://ehis-next-api-hc03.vercel.app/api')));
 const toneHash=hash(fs.readFileSync('mobile/assets/emergency-tone.wav'));const tone=[...zip].filter(([name])=>name.endsWith('.wav')).some(([,read])=>hash(read())===toneHash);assert.ok(tone,'Original alarm included in binary');
 const folder='.local/releases';fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,`EHIS-Next-v${record.version}.apk`),bytes);
 const result={...record,bytes:bytes.length,sha256:hash(bytes),artifactVerified:true,packageName:native.attributes.package,microphonePermission:false,vibrationPermission:true,embeddedTone:true,cloudTargetVerified:true,deviceVerified:false};
 fs.writeFileSync('.local/android-trial-artifact.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
