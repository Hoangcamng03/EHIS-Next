// Disposable presentation fixtures only. emulator.cjs fixes project and hosts
// to demo-ehis-next / loopback; this helper cannot connect to cloud.
const { db, auth } = require('./emulator.cjs');
(async () => {
  const users = [];
  let page;
  do {
    page = await auth.listUsers(1000, page?.pageToken);
    users.push(
      ...page.users.filter((u) =>
        /^(minhan|lanphuong|anhkhoa|baongoc)\.[a-f0-9]{8}@example\.com$/.test(u.email || ''),
      ),
    );
  } while (page.pageToken);
  for (const user of users) {
    const incidents = await db.collection('incidents').where('patientId', '==', user.uid).get();
    for (const incident of incidents.docs) {
      const alerts = await db
        .collectionGroup('alerts')
        .where('incidentId', '==', incident.id)
        .get();
      for (const alert of alerts.docs) await alert.ref.delete();
      await db.recursiveDelete(incident.ref);
    }
    for (const collection of ['patients', 'volunteers', 'users'])
      await db.recursiveDelete(db.doc(`${collection}/${user.uid}`));
    await auth.deleteUser(user.uid);
  }
  console.log(JSON.stringify({ disposableLocalFlowAccountsRemoved: users.length }));
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
