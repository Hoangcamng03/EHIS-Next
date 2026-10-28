// Explicit owner approval required. No new service-account keys and no billing changes.
const { googleRequest, project } = require('./cloud-operator.cjs');
async function main() {
  const mode = process.argv[2];
  if (!['--confirmed-send-only', '--confirmed-identity-read'].includes(mode)) throw Error('Explicit owner approval for this permission is required.');
  const permission = mode === '--confirmed-send-only' ? 'cloudmessaging.messages.create' : 'firebaseauth.users.get';
  const roleId = mode === '--confirmed-send-only' ? 'ehisPushSender' : 'ehisIdentityLookup', roleName = `projects/${project}/roles/${roleId}`;
  let role;
  try { role = await googleRequest(`https://iam.googleapis.com/v1/${roleName}`); }
  catch (error) {
    if (!String(error.message).includes('404')) throw error;
    role = await googleRequest(`https://iam.googleapis.com/v1/projects/${project}/roles`, 'POST', { roleId, role: { title: roleId, description: 'Owner approved single permission for controlled EHIS trial.', stage: 'GA', includedPermissions: [permission] } });
  }
  if (role.deleted || role.includedPermissions?.length !== 1 || role.includedPermissions[0] !== permission) throw Error('Existing role differs from approved scope. No IAM changes applied.');
  const member = `serviceAccount:ehis-runtime@${project}.iam.gserviceaccount.com`;
  const policy = await googleRequest(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:getIamPolicy`, 'POST', { options: { requestedPolicyVersion: 3 } });
  let binding = policy.bindings?.find(value => value.role === roleName && !value.condition);
  if (!binding) { binding = { role: roleName, members: [] }; (policy.bindings ||= []).push(binding); }
  if (!binding.members.includes(member)) { binding.members.push(member); await googleRequest(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:setIamPolicy`, 'POST', { policy }); }
  console.log(JSON.stringify({ project, role: roleName, permissions: [permission], runtimeGranted: true, newKeysCreated: false, billingChanged: false }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
