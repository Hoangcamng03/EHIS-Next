import { HttpsError } from 'firebase-functions/v2/https';

export const specialtyCodes = ['basic_aid', 'cpr', 'respiratory', 'trauma'] as const;
export function parseSpecialties(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.length > specialtyCodes.length ||
    value.some((item) => !specialtyCodes.includes(item)) ||
    new Set(value).size !== value.length
  )
    throw new HttpsError('invalid-argument', 'Chọn ít nhất một nhóm kỹ năng hợp lệ.');
  return [...value];
}
// Observations suggest useful support skills; they are never a diagnosis or exclusion rule.
export function suggestedSpecialties(answers?: Record<string, unknown> | null): string[] {
  const result: string[] = [];
  if (
    answers?.responsiveness === 'unresponsive' ||
    answers?.breathingDetail === 'gasping' ||
    answers?.breathingDetail === 'not_seen'
  )
    result.push('cpr');
  if (answers?.breathing === 'abnormal') result.push('respiratory');
  if (answers?.bleeding === 'visible') result.push('trauma');
  return result;
}
export function skillMatch(verified: unknown, needs: string[]): number {
  return Array.isArray(verified) ? needs.filter((code) => verified.includes(code)).length : 0;
}
