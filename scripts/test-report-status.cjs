const {test}=require('node:test'),assert=require('node:assert/strict');
test('ack never implies acceptance, including no-volunteer and elapsed invitation',async()=>{
 const {reportProgress:p}=await import('../web/src/lib/report-status.ts');
 assert.match(p('dispatching',2,600000,0).title,/CHƯA CÓ NGƯỜI NHẬN/);
 assert.match(p('dispatching',0,600000,0).detail,/không có TNV/);
 assert.equal(p('dispatching',2,600000,600000).terminal,true);
 assert.equal(p('dispatching',2,600000,60000).delayed,true);
 assert.equal(p('dispatching',2,undefined,0).terminal,true);
 assert.match(p('accepted',2,600000,0).detail,/chưa đồng nghĩa đã đến/);
 for(const state of ['completed','cancelled','expired'])assert.equal(p(state,2,600000,0).terminal,true);
});
