import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { pushJobId, queuePush } from './pushJobs';
// Catch up only valid offers/assignment for this device, never replay closed cases or ring other devices.
export async function recoverDeviceInvitations(uid: string, deviceKey: string) {
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const v = (await tx.get(db.doc(`volunteers/${uid}`))).data(), now = Date.now();
    if (v?.verificationStatus !== 'approved') return { recoveryQueued: 0, recoveryOverflow: false };
    const offers = await tx.get(db.collection(`volunteers/${uid}/alerts`).where('status', '==', 'offered').limit(101));
    const ids = [...new Set([...offers.docs.slice(0, 100).map(d => d.id), ...(v.activeIncidentId ? [v.activeIncidentId as string] : [])])];
    if (!ids.length) return { recoveryQueued: 0, recoveryOverflow: offers.size > 100 };
    const incidents = await tx.getAll(...ids.map(id => db.doc(`incidents/${id}`)));
    const plans = incidents.flatMap(item => {
      const c = item.data(); if (!c) return [];
      const assigned = ['accepted', 'arrived'].includes(c.status) && c.acceptedBy === uid && v.activeIncidentId === item.id;
      const fresh = typeof v.lastSeenAt?.toMillis === 'function' && now - v.lastSeenAt.toMillis() <= 300000 && v.lastSeenAt.toMillis() <= now + 60000;
      const offered = c.status === 'dispatching' && !c.acceptedBy && c.offerExpiresAt?.toMillis?.() > now && v.isAvailable === true && !v.activeIncidentId && fresh && c.invitedVolunteerIds?.includes(uid) && offers.docs.some(a => a.id === item.id);
      if (!assigned && !offered) return [];
      const kind = assigned ? 'update' : 'request', expiry = assigned ? Timestamp.fromMillis(now + 120000) : c.offerExpiresAt;
      return [{ id: item.id, kind, expiry, ref: db.doc(`pushJobs/${pushJobId(uid, item.id, kind, 0, deviceKey)}`) }];
    });
    if (!plans.length) return { recoveryQueued: 0, recoveryOverflow: offers.size > 100 };
    const existing = await tx.getAll(...plans.map(p => p.ref)); let queued = 0;
    plans.forEach((p, i) => { if (!existing[i].exists || ['no-device', 'failed'].includes(existing[i].data()?.status)) { queuePush(tx, db, uid, p.id, p.kind, 0, p.expiry, deviceKey); queued++; } });
    return { recoveryQueued: queued, recoveryOverflow: offers.size > 100 };
  });
}
