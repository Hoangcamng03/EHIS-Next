// Build only: never treats compilation as permission for clinical operation.
function validateBuildEnvironment(env) {
 const profile=env.EAS_BUILD_PROFILE;
 if(!profile || profile==='development')return;
 if(env.EXPO_PUBLIC_USE_EMULATORS!=='false')throw Error('Native release must explicitly disable emulators.');
 const project=env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
 if(!project || project.startsWith('demo-'))throw Error('Native release needs an explicit cloud Firebase project.');
 const api=new URL(env.EXPO_PUBLIC_BACKEND_URL||'');
 if(api.protocol!=='https:'||api.username||api.password||api.search||api.hash||!api.pathname.endsWith('/api'))throw Error('Native release needs an HTTPS backend ending in /api.');
 if(profile==='preview') {
  if(project!=='ehis-next-20261021-hc03'||env.EXPO_PUBLIC_TRIAL_MODE!=='true'||api.hostname!=='ehis-next-api-hc03.vercel.app')throw Error('Preview must use the isolated EHIS trial environment.');
 } else if(profile==='production') {
  if(env.EXPO_PUBLIC_TRIAL_MODE!=='false'||project==='ehis-next-20261021-hc03'||api.hostname==='ehis-next-api-hc03.vercel.app')throw Error('Production cannot use the trial database/backend. Provision and verify production first.');
 } else throw Error('Unrecognized build profile; review its release environment first.');
}
module.exports={validateBuildEnvironment};
if(require.main===module){try{validateBuildEnvironment(process.env);console.log('Build environment guard passed (not clinical/device approval).');}catch(error){console.error(error.message);process.exitCode=1;}}
