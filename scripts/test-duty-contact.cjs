const {test}=require('node:test'),assert=require('node:assert/strict');
const contact=import('../frontend/web/src/lib/duty-contact.ts');
test('missing duty contact never produces a guessed or broken call link',async()=>{
 const {dutyContact:c}=await contact;
 for(const [name,phone]of [[undefined,undefined],['Unit',''],['','0900000000'],['Unit','tel:0900000000'],['Unit','*123#'],['Unit','javascript:alert(1)']])assert.equal(c(name,phone),null);
});
test('explicit configured contact is normalized to a bounded tel link',async()=>{
 const {dutyContact:c}=await contact;
 assert.deepEqual(c('  Đơn vị GIẢ  ','090 000 0000'),{name:'Đơn vị GIẢ',phone:'0900000000',href:'tel:0900000000'});
 assert.equal(c('x'.repeat(101),'0900000000'),null);
});
