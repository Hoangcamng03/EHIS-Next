// Keep the one-recipient admin workflow compatible with bounded automatic invitations.
export function handoverTargets(value: { targetUid?: unknown; targetUids?: unknown } | null | undefined): string[] {
  const values = Array.isArray(value?.targetUids) ? value.targetUids : typeof value?.targetUid === 'string' ? [value.targetUid] : [];
  return [...new Set(values.filter((uid): uid is string => typeof uid === 'string' && uid.length > 0))];
}
