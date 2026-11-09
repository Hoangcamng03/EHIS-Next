const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function harness(){
 const ts=require('../frontend/app/node_modules/typescript'),values=[];let slot=0,calls=0;
 const react={useState(initial){const i=slot++;if(!(i in values))values[i]=initial;return [values[i],v=>values[i]=v];},useRef(initial){const i=slot++;return values[i]??(values[i]={current:initial});}};
 const jsx=(type,props)=>({type,props}),exports={};const source=ts.transpileModule(fs.readFileSync('frontend/app/src/components/ConfirmAction.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(source,{exports,require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:'Fragment'}:name==='react-native'?{Modal:'Modal',ScrollView:'ScrollView',View:'View'}:name==='./ActionButton'?{Button:'Button'}:name==='./AppText'?{Text:'Text'}:{ui:{heading:{},body:{}}}});
 function render(disabled=false){slot=0;return exports.ConfirmAction({title:'Hoàn tất ca hỗ trợ',explanation:'Đóng ca?',disabled,onConfirm:()=>calls++,tone:'complete'});}
 const nodes=tree=>!tree?[]:Array.isArray(tree)?tree.flatMap(nodes):typeof tree==='object'?[tree,...nodes(tree.props?.children)]:[];
 return {render,nodes,get calls(){return calls;}};
}
test('opening/cancelling confirmation never completes the case; action stays in place',()=>{
 const h=harness(),first=h.render();const trigger=h.nodes(first).find(n=>n.type==='Button');trigger.props.onPress();
 let tree=h.render();assert.equal(h.nodes(tree).find(n=>n.type==='Modal').props.visible,true);assert.equal(tree.props.children[0].props.title,trigger.props.title);assert.equal(h.calls,0);
 h.nodes(tree).find(n=>n.props.title==='Quay lại').props.onPress();assert.equal(h.nodes(h.render()).find(n=>n.type==='Modal').props.visible,false);assert.equal(h.calls,0);
});
test('confirmation submits once even with a stale double tap, and disabled state prevents it',()=>{
 const h=harness();h.nodes(h.render()).find(n=>n.type==='Button').props.onPress();let tree=h.render();const confirm=h.nodes(tree).find(n=>n.props.title==='Xác nhận');confirm.props.onPress();confirm.props.onPress();assert.equal(h.calls,1);
 h.nodes(h.render()).find(n=>n.type==='Button').props.onPress();tree=h.render(true);h.nodes(tree).find(n=>n.props.title==='Xác nhận').props.onPress();assert.equal(h.calls,1);
 h.nodes(tree).find(n=>n.type==='Modal').props.onRequestClose();assert.equal(h.nodes(h.render()).find(n=>n.type==='Modal').props.visible,false);
});
