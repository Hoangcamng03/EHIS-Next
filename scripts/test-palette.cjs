const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const colors = import('../mobile/src/lib/palette.ts');
function luminance(hex) {
  const rgb=hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
}
function contrast(a,b) { const values=[luminance(a),luminance(b)].sort((x,y)=>y-x); return (values[0]+0.05)/(values[1]+0.05); }
test('all role and emergency foregrounds meet 4.5:1 contrast for normal text',async()=>{
  const {palette}=await colors;
  for(const [role,p] of Object.entries(palette)) {
    assert.ok(contrast(p.primary,'#ffffff')>=4.5,`${role} button`);
    assert.ok(contrast(p.ink,p.background)>=4.5,`${role} body`);
    assert.ok(contrast(p.primary,p.background)>=4.5,`${role} badge`);
  }
  assert.equal(new Set(Object.values(palette).map(p=>p.primary)).size,5);
});
test('reporter/admin web role tokens and emergency styling match the shared palette',async()=>{
  const {palette}=await colors, css=fs.readFileSync('web/src/app/globals.css','utf8');
  for(const role of ['reporter','admin']){
    const block=css.match(new RegExp(`\\.role-${role} \\{([^}]+)\\}`))[1];
    for(const key of ['primary','background','ink','border']) assert.ok(block.includes(`--role-${key}: ${palette[role][key]}`),`${role}.${key}`);
  }
  assert.ok(css.includes(`.role-reporter .emergency-action { background: ${palette.emergency.primary}; }`));
});
