import { collection, doc, limit, onSnapshot, orderBy, query, type Firestore } from 'firebase/firestore';
import { mergeAlertFeed, type AlertRecord } from './alert-feed';
export type AlertFeedState = { alerts: AlertRecord[]; connected: boolean; error: unknown | null };
export function subscribeVolunteerAlerts(db: Firestore, uid: string, activeId: string | null, receive: (value: AlertFeedState) => void) {
  let cancelled = false, faulted = false, recent: AlertRecord[] = [], pinned: AlertRecord | null = null;
  let listConfirmed = false, activeConfirmed = !activeId, ownerConfirmed = false;
  const emit = () => { if (!cancelled && !faulted) receive({ alerts: mergeAlertFeed(recent, activeId, pinned), connected: ownerConfirmed && listConfirmed && activeConfirmed, error: null }); };
  const failed = (error: unknown) => { if (!cancelled) { faulted = true; listConfirmed = false; activeConfirmed = false; recent = []; pinned = null; receive({ alerts: [], connected: false, error }); } };
  const stopList = onSnapshot(query(collection(db, `volunteers/${uid}/alerts`), orderBy('createdAt', 'desc'), limit(30)), { includeMetadataChanges: true }, snapshot => { recent = snapshot.docs.map(item => item.data() as AlertRecord); listConfirmed = !snapshot.metadata.fromCache; emit(); }, failed);
  const stopActive = activeId ? onSnapshot(doc(db, `volunteers/${uid}/alerts/${activeId}`), { includeMetadataChanges: true }, snapshot => { pinned = snapshot.exists() ? snapshot.data() as AlertRecord : null; activeConfirmed = !snapshot.metadata.fromCache && !!pinned; emit(); }, failed) : undefined;
  // A rules dependency change need not immediately produce an alert snapshot.
  // Observe approval itself so revocation clears even an unchanged alert feed.
  const stopOwner = onSnapshot(doc(db, `volunteers/${uid}`), { includeMetadataChanges: true }, snapshot => {
    const approved = snapshot.data()?.verificationStatus === 'approved';
    if (!snapshot.metadata.fromCache && !approved) { failed({ code: 'permission-denied' }); return; }
    ownerConfirmed = !snapshot.metadata.fromCache && approved; emit();
  }, failed);
  return () => { cancelled = true; stopList(); stopActive?.(); stopOwner(); };
}
