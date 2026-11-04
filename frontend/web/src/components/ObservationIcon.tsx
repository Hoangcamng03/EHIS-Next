export function ObservationIcon({ kind }: { kind: string }) {
  return <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {kind === 'voice' ? <><circle cx="16" cy="13" r="7" /><path d="M4 37c0-14 24-14 24 0M30 15l5 3-5 3M37 10c9 6 9 12 0 18" /></> : kind === 'breath' ? <><path d="M22 5v18L12 15C1 22 4 39 15 40c6 0 7-5 7-10M26 5v18l10-8c11 7 8 24-3 25-6 0-7-5-7-10M17 7h14" /></> : <><path d="M24 4C18 15 9 22 9 31a15 15 0 0 0 30 0C39 22 30 15 24 4Z" /><path d="M16 31c0 5 3 8 8 8" /></>}
  </svg>;
}
