import { createHash } from 'node:crypto';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { guardedCall } from './guards';
import { identifier, objectValue } from './reportValidation';
function parse(value: unknown, keys: string[]) { try { return objectValue(value, keys); } catch { throw new HttpsError('invalid-argument', 'Dữ liệu tiến độ chưa hợp lệ.'); } }
function id(value: unknown) { try { return identifier(value); } catch { throw new HttpsError('invalid-argument', 'Mã chưa hợp lệ.'); } }
function assignment(value: unknown) { if (!Number.isSafeInteger(value) || Number(value) <= 0) throw new HttpsError('invalid-argument', 'Cần tải lại ca trước khi cập nhật.'); return Number(value); }

// A connection check-in is not a GPS observation or a guarantee of arrival.
export const updateIncidentProgress = guardedCall('updateIncidentProgress', async request => {
  const data = parse(request.data, ['incidentId', 'assignmentAtMs', 'updateId', 'action', 'etaMinutes', 'obstacle', 'expectedProgressRevision']);
  const incidentId = id(data.incidentId), updateId = id(data.updateId), assignmentAtMs = assignment(data.assignmentAtMs), uid = request.auth!.uid;
  if (!['going', 'blocked', 'heartbeat'].includes(String(data.action))) throw new HttpsError('invalid-argument', 'Chọn tiến độ hợp lệ.');
  if (data.action === 'going' ? !Number.isInteger(data.etaMinutes) || Number(data.etaMinutes) < 1 || Number(data.etaMinutes) > 120 || data.obstacle !== undefined : data.etaMinutes !== undefined) throw new HttpsError('invalid-argument', 'Thời gian dự kiến từ 1 đến 120 phút.');
  if (data.action === 'blocked' ? !['traffic', 'vehicle', 'cannot_continue', 'other'].includes(String(data.obstacle)) : data.obstacle !== undefined) throw new HttpsError('invalid-argument', 'Chọn trở ngại hợp lệ.');
  if (data.action !== 'heartbeat' ? !Number.isSafeInteger(data.expectedProgressRevision) || Number(data.expectedProgressRevision) < 0 : data.expectedProgressRevision !== undefined) throw new HttpsError('invalid-argument', 'Cần số bản tiến độ đang xem.');
  const fingerprint = createHash('sha256').update(JSON.stringify({ incidentId, assignmentAtMs, action: data.action, etaMinutes: data.etaMinutes ?? null, obstacle: data.obstacle ?? null, expectedProgressRevision: data.expectedProgressRevision ?? null })).digest('hex'), db = getFirestore();
  return db.runTransaction(async tx => {
    const ref = db.doc(`incidents/${incidentId}`), event = ref.collection('progressEvents').doc(updateId);
    const [incident, volunteer, prior] = await tx.getAll(ref, db.doc(`volunteers/${uid}`), event), c = incident.data();
    if (!c || c.acceptedBy !== uid || volunteer.data()?.verificationStatus !== 'approved' || volunteer.data()?.activeIncidentId !== incidentId || c.acceptedAt?.toMillis?.() !== assignmentAtMs) throw new HttpsError('permission-denied', 'Bạn không còn phụ trách lượt nhận ca này.');
    if (c.status !== 'accepted') throw new HttpsError('failed-precondition', 'Chỉ cập nhật khi đang phụ trách trước khi đến.');
    if (prior.exists) { if (prior.data()!.fingerprint !== fingerprint) throw new HttpsError('invalid-argument', 'Mã cập nhật đã dùng cho nội dung khác.'); return { progress: c.travelProgress ?? null, duplicate: true }; }
    if (data.action !== 'heartbeat' && Number(data.expectedProgressRevision) !== Number(c.travelProgress?.revision || 0)) throw new HttpsError('failed-precondition', 'Tiến độ đã đổi ở thiết bị khác. Kiểm tra bản mới rồi xác nhận lại.');
    const now = Date.now();
    if (data.action === 'heartbeat' && !c.travelProgress) throw new HttpsError('failed-precondition', 'Hãy xác nhận tiến độ trước.');
    // Bound stationary writes even if a client erroneously fires each render.
    if (data.action === 'heartbeat' && now - c.travelProgress.checkInAtMs < 60000) return { progress: c.travelProgress, throttled: true };
    const progress = data.action === 'heartbeat' ? { ...c.travelProgress, checkInAtMs: now } : {
      state: data.action, etaAtMs: data.action === 'going' ? now + Number(data.etaMinutes) * 60000 : null,
      firstEtaAtMs: c.travelProgress?.firstEtaAtMs ?? (data.action === 'going' ? now + Number(data.etaMinutes) * 60000 : null),
      obstacle: data.action === 'blocked' ? data.obstacle : null, revision: Number(c.travelProgress?.revision || 0) + 1, updatedAtMs: now, checkInAtMs: now,
    };
    tx.update(ref, { travelProgress: progress });
    tx.set(db.doc(`volunteers/${uid}/alerts/${incidentId}`), { travelProgress: progress }, { merge: true });
    for (const path of [`reporters/${c.reporterUid}/incidentStatuses/${incidentId}`, `patients/${c.patientId}/incidentStatuses/${incidentId}`]) tx.set(db.doc(path), { travelProgress: progress }, { merge: true });
    if (data.action !== 'heartbeat') {
      tx.create(event, { actorUid: uid, assignmentAtMs, fingerprint, progress, createdAt: FieldValue.serverTimestamp() });
      tx.create(db.collection('auditLogs').doc(), { action: 'incident-progress-' + data.action, incidentId, actorUid: uid, createdAt: FieldValue.serverTimestamp() });
    }
    return { progress };
  });
});

export const acknowledgeIncidentReport = guardedCall('acknowledgeIncidentReport', async request => {
  const data = parse(request.data, ['incidentId', 'assignmentAtMs', 'revision']), incidentId = id(data.incidentId), assignmentAtMs = assignment(data.assignmentAtMs), uid = request.auth!.uid, db = getFirestore();
  if (!Number.isSafeInteger(data.revision) || Number(data.revision) < 1) throw new HttpsError('invalid-argument', 'Số bản chưa hợp lệ.');
  return db.runTransaction(async tx => {
    const ref = db.doc(`incidents/${incidentId}`), [incident, volunteer] = await tx.getAll(ref, db.doc(`volunteers/${uid}`)), c = incident.data();
    if (!c || c.acceptedBy !== uid || volunteer.data()?.verificationStatus !== 'approved' || volunteer.data()?.activeIncidentId !== incidentId || c.acceptedAt?.toMillis?.() !== assignmentAtMs) throw new HttpsError('permission-denied', 'Không còn quyền xác nhận tải bản này.');
    if (!['accepted', 'arrived'].includes(c.status)) throw new HttpsError('failed-precondition', 'Ca đã đóng.');
    if (Number(data.revision) > Number(c.reportRevision || 0)) throw new HttpsError('invalid-argument', 'Bản này chưa được máy chủ ghi nhận.');
    const revision = Math.max(Number(c.volunteerLoadedRevision || 0), Number(data.revision));
    if (revision === c.volunteerLoadedRevision) return { acknowledgedRevision: revision };
    const at = Date.now(); tx.update(ref, { volunteerLoadedRevision: revision });
    tx.set(db.doc(`reporters/${c.reporterUid}/incidentStatuses/${incidentId}`), { volunteerLoadedRevision: revision, volunteerLoadedAtMs: at }, { merge: true });
    return { acknowledgedRevision: revision };
  });
});
