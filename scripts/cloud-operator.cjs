const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname,'..');
const project = 'ehis-next-20261021-hc03';
// Reuse the signed-in operator through Firebase CLI's auth library. Never export its tokens.
async function operatorAccessToken() {
 const runtime = JSON.parse(fs.readFileSync(path.join(root,'.local/runtime.json'),'utf8').replace(/^\uFEFF/,''));
 if(!runtime?.firebaseCli) throw new Error('Cần cấu hình firebaseCli trong .local/runtime.json và firebase login.');
 const cliRequire = createRequire(runtime.firebaseCli);
 const auth = cliRequire('../auth');
 const { requireAuth } = cliRequire('../requireAuth');
 const account = auth.getProjectDefaultAccount(root);
 if(!account) throw new Error('Cần firebase login bằng tài khoản chủ project.');
 const options = {project,projectRoot:root,...account,nonInteractive:true};
 await requireAuth(options);
 const token = await auth.getAccessToken(account.tokens.refresh_token,options.authScopes);
 if(!token?.access_token) throw new Error('Không lấy được quyền operator.');
 return token.access_token;
}
async function googleRequest(url, method='GET', body) {
 if(!/^https:\/\/(iam|cloudresourcemanager|identitytoolkit|firestore|cloudbilling)\.googleapis\.com\//.test(url)) throw new Error('Unapproved Google API host.');
 const response=await fetch(url,{method,headers:{Authorization:'Bearer '+await operatorAccessToken(),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 const value=await response.json();
 if(!response.ok) throw new Error(`Google API ${response.status}: ${value.error?.message || 'Request failed'}`);
 return value;
}
module.exports={operatorAccessToken,googleRequest,project};
