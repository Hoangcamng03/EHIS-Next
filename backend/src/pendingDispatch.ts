import { handoverTargets } from './handoverPolicy';
import { type Firestore, type Transaction, Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { distanceMeters } from './reportValidation';
import { queuePush } from './pushJobs';

// Bounded pilot catch-up, not a scan on every 30-second location heartbeat.
// All reads precede writes so accept/cancel/observations race safely with joining.
export async function offerPendingIncidents(tx: Transaction, db: Firestore, uid: string, location: { latitude: number; longitude: number }, now: number) {
  const pending = await tx.get(db.collection('incidents').where('status', '==', 'dispatching')
    .where('offerExpiresAt', '>', Timestamp.fromMillis(now)).orderBy('offerExpiresAt').limit(101));
  if (pending.size > 100) throw new HttpsError('resource-exhausted', 'Có quá nhiều ca chờ để đồng bộ an toàn. Thử lại sau.', { reason: 'pending-dispatch-capacity' });
  const candidates = pending.docs.filter(item => {
    const value = item.data();
    return !value.acceptedBy && value.patientId !== uid && Array.isArray(value.invitedVolunteerIds) &&
      !value.invitedVolunteerIds.includes(uid) && value.invitedVolunteerIds.length < 20;
  });
  const handovers = await tx.get(db.collection('incidents').where('handover.expiresAt', '>', Timestamp.fromMillis(now)).orderBy('handover.expiresAt').limit(101));
  if (handovers.size > 100) throw new HttpsError('resource-exhausted', 'Quá nhiều ca chờ bàn giao. Thử lại sau.');
  const replacements = handovers.docs.filter(item => { const c = item.data(), targets = handoverTargets(c.handover); return c.status === 'accepted' && c.handover.mode === 'automatic' && c.acceptedBy !== uid && c.patientId !== uid && !targets.includes(uid) && targets.length < 20 && (c.invitedVolunteerIds?.length || 0) < 40; });
  const replacementData = replacements.length ? await tx.getAll(...replacements.flatMap(item => [item.ref.collection('private').doc('location'), item.ref.collection('private').doc('reporter')])) : [];
  const replacementMatches = replacements.flatMap((item,index) => { const point = replacementData[index*2].data(), report = replacementData[index*2+1].data(); if(!point || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude))return []; const distance=distanceMeters(location,point as {latitude:number;longitude:number});return distance<=5000?[{item,report,distance}]:[]; });
  if (!candidates.length && !replacementMatches.length) return 0;
  const privateData = candidates.length ? await tx.getAll(...candidates.flatMap(item => [item.ref.collection('private').doc('location'), item.ref.collection('private').doc('reporter')])) : [];
  const matched = candidates.flatMap((item, index) => {
    const point = privateData[index * 2].data(), report = privateData[index * 2 + 1].data();
    if (!point || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) || Math.abs(point.latitude) > 85 || Math.abs(point.longitude) > 180) return [];
    const distance = distanceMeters(location, point as { latitude: number; longitude: number });
    return distance <= 5000 ? [{ item, report, distance }] : [];
  });
  for (const { item, report, distance } of matched) {
    const value = item.data(), invitedVolunteerIds = [...value.invitedVolunteerIds, uid];
    queuePush(tx, db, uid, item.id, 'request', 0, value.offerExpiresAt);
    tx.update(item.ref, { invitedVolunteerIds });
    tx.update(db.doc(`reporters/${value.reporterUid}/incidentStatuses/${item.id}`), { invitedCount: invitedVolunteerIds.length });
    tx.set(db.doc(`patients/${value.patientId}/incidentStatuses/${item.id}`), { invitedCount: invitedVolunteerIds.length }, { merge: true });
    tx.create(db.doc(`volunteers/${uid}/alerts/${item.id}`), {
      incidentId: item.id, status: 'offered', distanceMeters: Math.round(distance), createdAt: value.createdAt,
      offeredAt: Timestamp.fromMillis(now), offerExpiresAt: value.offerExpiresAt,
      reportRevision: value.reportRevision ?? 0, answers: report?.answers ?? null,
    });
  }
  for(const {item,report,distance} of replacementMatches) {
    const c=item.data(),h=c.handover,targetUids=[...handoverTargets(h),uid],progress={...c.travelProgress,handoverStatus:'pending',handoverInvitedCount:targetUids.length,handoverExpiresAtMs:h.expiresAt.toMillis()};
    tx.update(item.ref,{'handover.targetUids':targetUids,'handover.targetUid':targetUids[0],invitedVolunteerIds:[...new Set([...(c.invitedVolunteerIds||[]),uid])],travelProgress:progress});
    tx.update(item.ref.collection('handoverRequests').doc(h.id),{targetUids,targetUid:targetUids[0]});
    tx.set(db.doc('volunteers/'+uid+'/alerts/'+item.id),{incidentId:item.id,status:'offered',offerKind:'handover',handoverId:h.id,createdAt:Timestamp.fromMillis(now),offeredAt:Timestamp.fromMillis(now),offerExpiresAt:h.expiresAt,distanceMeters:Math.round(distance),reportRevision:c.reportRevision||0,locationRevision:c.locationRevision||0,answers:report?.answers||null});
    tx.set(db.doc('volunteers/'+c.acceptedBy+'/alerts/'+item.id),{travelProgress:progress},{merge:true});
    for(const p of ['reporters/'+c.reporterUid+'/incidentStatuses/'+item.id,'patients/'+c.patientId+'/incidentStatuses/'+item.id])tx.set(db.doc(p),{handoverPending:true,travelProgress:progress},{merge:true});
    queuePush(tx,db,uid,item.id,'request',Number(c.handoverSequence||0),h.expiresAt,undefined,h.id);
  }
  return matched.length + replacementMatches.length;
}
