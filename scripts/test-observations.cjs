const {test}=require('node:test'),assert=require('node:assert/strict');
test('changing a detailed choice clears obsolete detail without changing the other observations',async()=>{
 const {chooseAnswer,selectedAnswer}=await import('../frontend/web/src/lib/observations.ts');
 let a={responsiveness:'unknown',breathing:'unknown',bleeding:'none_seen'};
 a=chooseAnswer(a,'breathing','gasping');assert.equal(a.breathing,'abnormal');assert.equal(selectedAnswer(a,'breathing'),'gasping');
 a=chooseAnswer(a,'bleeding','heavy');assert.equal(a.bleeding,'visible');assert.equal(a.bleedingDetail,'heavy');
 a=chooseAnswer(a,'breathing','normal');assert.equal(a.breathingDetail,undefined);assert.equal(a.bleedingDetail,'heavy');
 a=chooseAnswer(a,'bleeding','unknown');assert.equal(a.bleedingDetail,undefined);
});
test('volunteer summaries distinguish each reported breathing pattern and retain legacy meaning',async()=>{
 const {observationLabels}=await import('../frontend/app/src/lib/observations.ts');
 const a={responsiveness:'unresponsive',breathing:'abnormal',bleeding:'visible'};
 assert.match(observationLabels(a).breathing,/báo cáo cũ/);
 assert.match(observationLabels({...a,breathingDetail:'gasping'}).breathing,/ngáp/);
 assert.match(observationLabels({...a,breathingDetail:'not_seen'}).breathing,/không thấy thở/);
 assert.match(observationLabels({...a,breathingDetail:'difficulty'}).breathing,/khó thở/);
 assert.match(observationLabels({...a,bleedingDetail:'heavy'}).bleeding,/chảy nhiều/);
});
