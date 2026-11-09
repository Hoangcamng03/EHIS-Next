const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const policy=import('../frontend/app/src/lib/live-location.ts');
async function hookHarness(location) {
 const locationPolicy=await policy;
 const ts=require('../frontend/app/node_modules/typescript'),states=[],effects=[],timers=[];let slot=0;
 const hooks={useState(initial){const i=slot++;states[i]=typeof initial==='function'?initial():initial;return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];},useEffect(effect){effects.push(effect);}};
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('frontend/app/src/lib/use-live-location.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:name=>name==='react'?hooks:name==='react-native'?{AppState:{currentState:'active',addEventListener:()=>({remove(){}})}}:name==='expo-location'?location:locationPolicy,Date,setTimeout(fn){const timer={fn,cleared:false};timers.push(timer);return timer;},clearTimeout(timer){if(timer)timer.cleared=true;}});
 const result=exports.useLiveLocation(true),cleanup=effects[1]();
 for(let i=0;i<12;i++)await Promise.resolve();
 return {states,timers,result,cleanup};
}
function locationAdapter(extra={}) {return {Accuracy:{High:4},getForegroundPermissionsAsync:async()=>({status:'granted'}),requestForegroundPermissionsAsync:async()=>({status:'granted'}),hasServicesEnabledAsync:async()=>true,getLastKnownPositionAsync:async()=>null,watchPositionAsync:async()=>({remove(){}}),...extra};}
test('foreground GPS accepts successive stationary fixes without waiting for movement',async()=>{
 let emit,removed=0;const at=Date.now(),position={coords:{latitude:10.8,longitude:106.7,accuracy:12},timestamp:at};
 const h=await hookHarness(locationAdapter({getLastKnownPositionAsync:async()=>({...position,timestamp:at-60000}),watchPositionAsync:async(options,callback)=>{emit=callback;if(options.distanceInterval===0)callback(position);return {remove(){removed++;}};}}));
 assert.equal(h.states[1].timestamp,at);emit({...position,timestamp:at+1});assert.equal(h.states[1].timestamp,at+1);assert.equal(h.states[2],'');h.cleanup();assert.equal(removed,1);
});
test('first-fix timeout offers a retry; late subscription and callback cannot update a stopped watcher',async()=>{
 let resolveWatch,emit,removed=0;
 const h=await hookHarness(locationAdapter({watchPositionAsync:(_options,callback)=>{emit=callback;return new Promise(resolve=>resolveWatch=resolve);}}));
 h.timers.find(t=>!t.cleared).fn();assert.match(h.states[2],/15 giây/);h.result.retry();assert.equal(h.states[3],1);h.cleanup();
 resolveWatch({remove(){removed++;}});emit({coords:{latitude:10.8,longitude:106.7,accuracy:12},timestamp:Date.now()});await new Promise(resolve=>setImmediate(resolve));assert.equal(h.states[1],null);assert.equal(removed,1);
});
test('denied location permission does not start GPS requests or create a success fix',async()=>{
 let started=0;
 const h=await hookHarness(locationAdapter({getForegroundPermissionsAsync:async()=>({status:'denied',canAskAgain:false}),watchPositionAsync:async()=>{started++;return {remove(){}};}}));
 assert.equal(started,0);assert.equal(h.states[1],null);assert.match(h.states[2],/quyền vị trí/);h.cleanup();
});
test('already granted GPS permission never requests a new permission dialog',async()=>{
 let requests=0;const h=await hookHarness(locationAdapter({requestForegroundPermissionsAsync:async()=>{requests++;throw Error('Unexpected request');}}));
 assert.equal(requests,0);h.cleanup();
});
test('native permission startup cannot leave the UI waiting without a timeout',async()=>{
 let finish,started=0;const h=await hookHarness(locationAdapter({getForegroundPermissionsAsync:()=>new Promise(resolve=>finish=resolve),watchPositionAsync:async()=>{started++;return {remove(){}};}}));
 h.timers.find(t=>!t.cleared).fn();assert.match(h.states[2],/15 giây/);h.cleanup();finish({status:'granted'});await new Promise(resolve=>setImmediate(resolve));assert.equal(started,0);assert.equal(h.states[1],null);
});
test('reporter rejects weak/stale GPS before initial request and confirmed relocation',async()=>{
 const {confirmedPoint}=await import('../frontend/web/src/lib/location-fix.ts'),position={coords:{latitude:10.8,longitude:106.7,accuracy:12},timestamp:100000};
 assert.deepEqual(confirmedPoint(position,100000),{latitude:10.8,longitude:106.7});
 for(const change of [{coords:{...position.coords,accuracy:300}},{timestamp:80000},{timestamp:106000},{coords:{...position.coords,latitude:NaN}}])assert.throws(()=>confirmedPoint({...position,...change},100000));
});
test('GPS rejects stale, future, inaccurate and invalid fixes; precise fixes remain usable',async()=>{
 const {usableFix}=await policy,fix={point:{latitude:10.8,longitude:106.7},accuracy:10,timestamp:100000};
 assert.equal(usableFix(fix,100000),true);
 for(const change of [{timestamp:80000},{timestamp:106000},{accuracy:101},{accuracy:NaN},{accuracy:-1},{point:{latitude:Infinity,longitude:0}}])assert.equal(usableFix({...fix,...change},100000),false);
});
test('rerouting is immediate for a new destination and bounded for movement and retries',async()=>{
 const {shouldRefreshRoute:r}=await policy,a={latitude:10.8,longitude:106.7},b={latitude:10.81,longitude:106.71},last={origin:a,destination:b,at:100000};
 assert.equal(r(null,a,b,100000),true);assert.equal(r(last,{latitude:10.801,longitude:106.7},b,110000),false);
 assert.equal(r(last,{latitude:10.801,longitude:106.7},b,115000),true);
 assert.equal(r(last,a,b,159000),false);assert.equal(r(last,a,b,160000),true);
 assert.equal(r(last,a,{latitude:10.82,longitude:106.71},100001),true);
});
test('native map updates move markers without recreating map; invalid points cannot enter bridge',async()=>{
 const ts=require('../frontend/app/node_modules/typescript'),directions=await import('../frontend/app/src/lib/directions.ts');
 const compiled=ts.transpileModule(fs.readFileSync('frontend/app/src/lib/route-html.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={};vm.runInNewContext(compiled,{exports,require:name=>{assert.equal(name,'./directions');return directions;}});
 const a={latitude:10.8,longitude:106.7},b={latitude:10.81,longitude:106.71};
 const count={map:0,pin:0,moved:0},map={fitBounds(){},invalidateSize(){},removeLayer(){}};
 const L={map(){count.map++;return map;},tileLayer(){return {addTo(){return {on(){}};}};},latLngBounds:b=>b,divIcon:x=>x,marker(){count.pin++;const marker={addTo(){return marker;},bindTooltip(){return marker;},setLatLng(){count.moved++;}};return marker;},polyline(){const line={addTo(){return line;},setLatLngs(){}};return line;}};
 const scope={window:{L},L,document:{getElementById:()=>({})},ResizeObserver:class{observe(){}}};
 const html=exports.routeHtml(a,b,null),inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];vm.createContext(scope);vm.runInContext(inline,scope);
 vm.runInContext(exports.routeUpdateScript({latitude:10.801,longitude:106.7},b,null),scope);
 assert.equal(count.map,1);assert.equal(count.pin,2);assert.ok(count.moved>=2);
 assert.throws(()=>exports.routeUpdateScript({latitude:NaN,longitude:0},b,null));
});
