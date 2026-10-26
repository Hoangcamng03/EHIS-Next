const {test}=require('node:test'),assert=require('node:assert/strict'),{dispatchBounds}=require('../lib/dispatchBounds');
test('area queries include true points inside 5km across hemispheres and antimeridian',()=>{
 for(const latitude of [-85,-60,0,30,85])for(const longitude of [-180,-179.99,0,179.99,180]){
  const boxes=dispatchBounds({latitude,longitude});
  for(let bearing=0;bearing<360;bearing+=5)for(const distance of [0,4999,5000]){
   const lat=latitude*Math.PI/180,lon=longitude*Math.PI/180,angle=bearing*Math.PI/180,arc=distance/6371000;
   const nextLat=Math.asin(Math.sin(lat)*Math.cos(arc)+Math.cos(lat)*Math.sin(arc)*Math.cos(angle));
   const nextLon=lon+Math.atan2(Math.sin(angle)*Math.sin(arc)*Math.cos(lat),Math.cos(arc)-Math.sin(lat)*Math.sin(nextLat));
   const p={latitude:nextLat*180/Math.PI,longitude:((nextLon*180/Math.PI+540)%360)-180};
   if(Math.abs(p.latitude)<=85)assert.ok(boxes.some(b=>p.latitude>=b.south-1e-9&&p.latitude<=b.north+1e-9&&p.longitude>=b.west-1e-9&&p.longitude<=b.east+1e-9),JSON.stringify({latitude,longitude,bearing,distance,p}));
  }
 }
 assert.throws(()=>dispatchBounds({latitude:90,longitude:0}));
});
