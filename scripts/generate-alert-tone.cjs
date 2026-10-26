// Original synthesized tone, without remote assets or licenses.
const fs=require('node:fs'),path=require('node:path');
const rate=16000,count=rate*6,data=Buffer.alloc(44+count*2);
data.write('RIFF');data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);
data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);
data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(count*2,40);
for(let i=0;i<count;i++){
 const t=i/rate,offset=t%0.75,frequency=offset<0.2?880:660;
 const envelope=offset<0.4?Math.min(1,offset/0.015,(0.4-offset)/0.04):0;
 data.writeInt16LE(Math.round(32767*0.08*envelope*Math.sin(2*Math.PI*frequency*t)),44+i*2);
}
fs.writeFileSync(path.join(__dirname,'../frontend/app/assets/emergency-tone.wav'),data);
console.log('Generated original six-second foreground alert tone.');
