const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const policy=import('../mobile/src/lib/live-location.ts');
test('reporter rejects weak/stale GPS before initial request and confirmed relocation',async()=>{
 const {confirmedPoint}=await import('../web/src/lib/location-fix.ts'),position={coords:{latitude:10.8,longitude:106.7,accuracy:12},timestamp:100000};
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
 const ts=require('../mobile/node_modules/typescript'),directions=await import('../mobile/src/lib/directions.ts');
 const compiled=ts.transpileModule(fs.readFileSync('mobile/src/lib/route-html.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
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
