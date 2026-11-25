import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { guardedCall } from './guards';
import { objectValue } from './reportValidation';

export const getCaseHistory = guardedCall('getCaseHistory', async (request) => {
  let role: string;
  try {
    const data = objectValue(request.data, ['role']);
    if (!['patient', 'volunteer'].includes(String(data.role))) throw Error();
    role = String(data.role);
  } catch {
    throw new HttpsError('invalid-argument', 'Chọn đúng loại lịch sử.');
  }
  const uid = request.auth!.uid,
    db = getFirestore();
  return db.runTransaction(async (tx) => {
    if (role === 'volunteer') {
      const volunteer = await tx.get(db.doc(`volunteers/${uid}`));
      if (volunteer.data()?.verificationStatus !== 'approved')
        throw new HttpsError('permission-denied', 'Cần quyền TNV hiện hành.');
    }
    const recent = await tx.get(
      db
        .collection(
          role === 'patient' ? `patients/${uid}/incidentStatuses` : `volunteers/${uid}/caseHistory`,
        )
        .orderBy('createdAt', 'desc')
        .limit(30),
    );
    // Old installations did not keep a participant index. Read a bounded legacy window,
    // then still verify actual assignment on the incident, never mere invitation.
    const legacy =
      role === 'volunteer'
        ? await tx.get(
            db.collection(`volunteers/${uid}/alerts`).orderBy('createdAt', 'desc').limit(30),
          )
        : null;
    const ids = [...new Set([...recent.docs, ...(legacy?.docs || [])].map((doc) => doc.id))];
    if (!ids.length) return { cases: [], limit: 30 };
    const records = await tx.getAll(...ids.map((id) => db.doc(`incidents/${id}`)));
    const owned = records.filter((doc) => {
      const c = doc.data();
      return (
        c &&
        (role === 'patient'
          ? c.patientId === uid
          : c.acceptedBy === uid || c.participantUids?.includes(uid))
      );
    });
    const snapshots = owned.length
      ? await tx.getAll(...owned.map((doc) => doc.ref.collection('private').doc('history')))
      : [];
    const patientIds = [...new Set(owned.map((doc) => String(doc.data()!.patientId || '')).filter(Boolean))];
    const patientCounts = new Map<string, number>();
    for (const pid of patientIds) {
      const countSnap = await tx.get(
        db.collection(`patients/${pid}/incidentStatuses`).select('status').limit(200),
      );
      patientCounts.set(
        pid,
        countSnap.docs.filter((item) => item.data()?.status !== 'cancelled').length,
      );
    }
    const now = Date.now();
    const cases = owned.map((doc, i) => {
      const c = doc.data()!,
        h = snapshots[i].data();
      const terminal = ['completed', 'cancelled', 'expired'].includes(c.status);
      // Cut access at the deadline even when the maintenance job has not run.
      const retained =
        terminal && c.closedAt?.toMillis() + 30 * 86400000 > now && h?.consented === true;
      return {
        incidentId: doc.id,
        status: c.status,
        createdAtMs: c.createdAt?.toMillis() ?? null,
        acceptedAtMs: c.acceptedAt?.toMillis?.() ?? null,
        arrivedAtMs: c.arrivedAt?.toMillis?.() ?? null,
        closedAtMs: c.closedAt?.toMillis() ?? null,
        patientEmergencyCount: patientCounts.get(String(c.patientId || '')) ?? 1,
        wasHandedOver: (c.participantUids?.length ?? 0) > 1,
        clinicalSummary: retained
          ? {
              fullName: h.fullName,
              medicalConditions: h.medicalConditions ?? [],
              allergies: h.allergies ?? [],
              answers: h.answers ?? null,
              reporterPresence: h.reporterPresence ?? null,
            }
          : null,
        summaryReason: retained
          ? null
          : !terminal
            ? 'active'
            : h?.consented !== true
              ? 'not-consented-or-legacy'
              : 'retention-expired',
      };
    });
    tx.create(db.collection('auditLogs').doc(), {
      actorUid: uid,
      action: 'case-history-read',
      role,
      count: cases.length,
      createdAt: FieldValue.serverTimestamp(),
    });
    const sorted = cases.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)).slice(0, 30);
    return {
      cases: sorted,
      summary: {
        totalCases: owned.length,
        completedCases: owned.filter((doc) => doc.data()!.status === 'completed').length,
      },
      limit: 30,
    };
  });
});
