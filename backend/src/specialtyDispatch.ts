import {
  Timestamp,
  type DocumentData,
  type Firestore,
  type Transaction,
} from 'firebase-admin/firestore';
import { dispatchBounds } from './dispatchBounds';
import { distanceMeters } from './reportValidation';
import { volunteerReadiness } from './readiness';
import { skillMatch, suggestedSpecialties } from './specialties';

export async function specialtyOffers(
  tx: Transaction,
  db: Firestore,
  c: DocumentData,
  incidentId: string,
  answers: Record<string, unknown>,
) {
  const needs = suggestedSpecialties(answers),
    previous = c.suggestedSpecialties || [];
  if (
    c.status !== 'dispatching' ||
    c.acceptedBy ||
    c.offerExpiresAt.toMillis() <= Date.now() ||
    !needs.length ||
    (c.invitedVolunteerIds?.length || 0) >= 20 ||
    needs.every((code) => previous.includes(code))
  )
    return { needs, people: [] };
  const location = (await tx.get(db.doc(`incidents/${incidentId}/private/location`))).data();
  if (!location) return { needs, people: [] };
  const point = location as { latitude: number; longitude: number },
    now = Date.now();
  const pages = await Promise.all(
    dispatchBounds(point).map((w) =>
      tx.get(
        db
          .collection('volunteers')
          .where('verificationStatus', '==', 'approved')
          .where('isAvailable', '==', true)
          .where('location.latitude', '>=', w.south)
          .where('location.latitude', '<=', w.north)
          .where('location.longitude', '>=', w.west)
          .where('location.longitude', '<=', w.east)
          .where('lastSeenAt', '>=', Timestamp.fromMillis(now - 300000))
          .where('lastSeenAt', '<=', Timestamp.fromMillis(now + 60000))
          .orderBy('location.latitude')
          .orderBy('location.longitude')
          .orderBy('lastSeenAt')
          .limit(1001),
      ),
    ),
  );
  const docs = [...new Map(pages.flatMap((p) => p.docs).map((d) => [d.id, d])).values()];
  if (docs.length > 1000) return { needs, people: [] }; // Preserve report; no unbounded specialist lookup.
  const people = docs
    .flatMap((d) => {
      const v = d.data(),
        match = skillMatch(v.verifiedSpecialties, needs);
      if (
        !match ||
        d.id === c.patientId ||
        c.invitedVolunteerIds?.includes(d.id) ||
        !volunteerReadiness(v, now).readyForDispatch
      )
        return [];
      const distance = distanceMeters(point, v.location);
      return distance <= 5000 ? [{ uid: d.id, distance, match }] : [];
    })
    .sort((a, b) => b.match - a.match || a.distance - b.distance || a.uid.localeCompare(b.uid))
    .slice(0, Math.min(3, 20 - c.invitedVolunteerIds.length));
  return { needs, people };
}
