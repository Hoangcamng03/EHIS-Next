import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import { mergeAlertFeed, type AlertRecord } from './alert-feed';
export type AlertFeedState = {
  alerts: AlertRecord[];
  connected: boolean;
  error: unknown | null;
  overflow?: boolean;
};
export function subscribeVolunteerAlerts(
  db: Firestore,
  uid: string,
  receive: (value: AlertFeedState) => void,
) {
  let cancelled = false,
    faulted = false,
    recent: AlertRecord[] = [],
    pending: AlertRecord[] = [],
    pinned: AlertRecord | null = null,
    overflow = false;
  let listConfirmed = false,
    pendingConfirmed = false,
    activeConfirmed = true,
    ownerConfirmed = false;
  let activeId: string | null = null,
    stopActive: (() => void) | undefined;
  const emit = () => {
    if (!cancelled && !faulted)
      receive({
        alerts: mergeAlertFeed(recent, activeId, pinned, pending),
        connected: ownerConfirmed && listConfirmed && pendingConfirmed && activeConfirmed,
        error: null,
        overflow,
      });
  };
  const failed = (error: unknown) => {
    if (!cancelled) {
      faulted = true;
      listConfirmed = false;
      activeConfirmed = false;
      recent = [];
      pinned = null;
      receive({ alerts: [], connected: false, error });
    }
  };
  const stopList = onSnapshot(
    query(collection(db, `volunteers/${uid}/alerts`), orderBy('createdAt', 'desc'), limit(30)),
    { includeMetadataChanges: true },
    (snapshot) => {
      recent = snapshot.docs.map((item) => item.data() as AlertRecord);
      listConfirmed = !snapshot.metadata.fromCache;
      emit();
    },
    failed,
  );
  // Live invitations must not be displaced by thirty newer history entries.
  const stopPending = onSnapshot(
    query(
      collection(db, `volunteers/${uid}/alerts`),
      where('status', '==', 'offered'),
      orderBy('createdAt', 'desc'),
      limit(101),
    ),
    { includeMetadataChanges: true },
    (snapshot) => {
      pending = snapshot.docs.slice(0, 100).map((item) => item.data() as AlertRecord);
      overflow = snapshot.size > 100;
      pendingConfirmed = !snapshot.metadata.fromCache;
      emit();
    },
    failed,
  );
  // Keep list listeners alive across assignment; only the pinned case changes.
  // Recreating every listener used to clear the UI immediately after acceptance.
  function selectActive(next: string | null) {
    if (next === activeId) return;
    stopActive?.();
    activeId = next;
    const existing =
      next && listConfirmed
        ? recent.find(
            (item) => item.incidentId === next && ['accepted', 'arrived'].includes(item.status),
          ) || null
        : null;
    pinned = existing;
    activeConfirmed = !next || !!existing;
    stopActive = next
      ? onSnapshot(
          doc(db, `volunteers/${uid}/alerts/${next}`),
          { includeMetadataChanges: true },
          (snapshot) => {
            if (cancelled || activeId !== next) return;
            pinned = snapshot.exists() ? (snapshot.data() as AlertRecord) : null;
            activeConfirmed = !snapshot.metadata.fromCache && !!pinned;
            emit();
          },
          failed,
        )
      : undefined;
  }
  // A rules dependency change need not immediately produce an alert snapshot.
  // Observe approval itself so revocation clears even an unchanged alert feed.
  const stopOwner = onSnapshot(
    doc(db, `volunteers/${uid}`),
    { includeMetadataChanges: true },
    (snapshot) => {
      const approved = snapshot.data()?.verificationStatus === 'approved';
      if (!snapshot.metadata.fromCache && !approved) {
        failed({ code: 'permission-denied' });
        return;
      }
      ownerConfirmed = !snapshot.metadata.fromCache && approved;
      if (ownerConfirmed)
        selectActive(
          typeof snapshot.data()?.activeIncidentId === 'string'
            ? snapshot.data()!.activeIncidentId
            : null,
        );
      emit();
    },
    failed,
  );
  return () => {
    cancelled = true;
    stopList();
    stopPending();
    stopActive?.();
    stopOwner();
  };
}
