const {test}=require('node:test'),assert=require('node:assert/strict');
const {validateBuildEnvironment:check}=require('./check-build-environment.cjs');
const preview={EAS_BUILD_PROFILE:'preview',EXPO_PUBLIC_USE_EMULATORS:'false',EXPO_PUBLIC_FIREBASE_PROJECT_ID:'ehis-next-20261021-hc03',EXPO_PUBLIC_TRIAL_MODE:'true',EXPO_PUBLIC_BACKEND_URL:'https://ehis-next-api-hc03.vercel.app/api'};
test('preview requires isolated cloud environment and production rejects trial resources',()=>{
 assert.doesNotThrow(()=>check(preview));
 for(const update of [{EXPO_PUBLIC_USE_EMULATORS:'true'},{EXPO_PUBLIC_TRIAL_MODE:'false'},{EXPO_PUBLIC_BACKEND_URL:'http://localhost/api'},{EXPO_PUBLIC_BACKEND_URL:'https://user:secret@example.test/api'},{EXPO_PUBLIC_FIREBASE_PROJECT_ID:'demo-ehis-next'},{EAS_BUILD_PROFILE:'production'},{EAS_BUILD_PROFILE:'unknown'}]) assert.throws(()=>check({...preview,...update}));
 assert.doesNotThrow(()=>check({}));
});
