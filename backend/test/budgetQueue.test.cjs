const {test}=require('node:test'),assert=require('node:assert/strict');
const {BudgetQueue,BudgetQueueBusy}=require('../lib/budgetQueue');
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
test('same budget never overlaps while unrelated budgets proceed independently',async()=>{
 const queue=new BudgetQueue(),first=deferred(),entered=deferred();let running=0,max=0;const order=[];
 const a=queue.run('shared',async()=>{running++;max=Math.max(max,running);entered.resolve();await first.promise;order.push('a');running--;});
 await entered.promise;
 const b=queue.run('shared',async()=>{running++;max=Math.max(max,running);order.push('b');running--;});
 assert.equal(await queue.run('other',async()=>42),42);assert.deepEqual(order,[]);
 first.resolve();await Promise.all([a,b]);assert.equal(max,1);assert.deepEqual(order,['a','b']);
});
test('a failed transaction releases successors without swallowing its error',async()=>{
 const queue=new BudgetQueue();const failure=Error('transaction failed');
 await assert.rejects(queue.run('same',async()=>{throw failure;}),e=>e===failure);
 assert.equal(await queue.run('same',async()=>7),7);
});
test('bounded active keys are reclaimed after completion',async()=>{
 const queue=new BudgetQueue(1),gate=deferred(),entered=deferred();
 const active=queue.run('a',async()=>{entered.resolve();await gate.promise;});await entered.promise;
 await assert.rejects(queue.run('b',async()=>{}),BudgetQueueBusy);
 gate.resolve();await active;assert.equal(await queue.run('b',async()=>2),2);
});
test('pending admission is bounded, and rejected requests never execute',async()=>{
 const queue=new BudgetQueue(1,1),gate=deferred(),entered=deferred();let ran=false;
 const first=queue.run('a',async()=>{entered.resolve();await gate.promise;});await entered.promise;
 await assert.rejects(queue.run('a',async()=>{ran=true;}),BudgetQueueBusy);
 gate.resolve();await first;assert.equal(ran,false);
});
test('timed-out waiters cannot release a successor ahead of an active transaction',async()=>{
 const queue=new BudgetQueue(1,4,25),gate=deferred(),entered=deferred();let active=false,ranExpired=false;
 const first=queue.run('a',async()=>{active=true;entered.resolve();await gate.promise;active=false;});await entered.promise;
 await assert.rejects(queue.run('a',async()=>{ranExpired=true;}),BudgetQueueBusy);
 const successor=queue.run('a',async()=>{assert.equal(active,false);return 9;});
 gate.resolve();await first;assert.equal(await successor,9);assert.equal(ranExpired,false);
 assert.equal(await queue.run('new-key',async()=>11),11);
});
