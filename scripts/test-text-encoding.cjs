const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('all authored app/web text decodes as UTF-8 without replacement characters or common Vietnamese mojibake',()=>{
 let checked=0;function walk(folder){for(const e of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,e.name);if(e.isDirectory())walk(file);else if(/\.(tsx?|css|html)$/.test(e.name)){const text=new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(file));assert(!/[\uFFFD]|Ä‘|á»|áº/.test(text),'Malformed text: '+file);checked++;}}}
 walk('frontend/app/src');walk('frontend/app/public');walk('frontend/web/src');assert(checked>30);console.log('Actual UTF-8 source files checked: '+checked+'. This does not establish visual glyph rendering on a phone.');
});
