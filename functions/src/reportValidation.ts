export type ObservationAnswers = {
  responsiveness: 'responsive' | 'unresponsive' | 'unknown';
  breathing: 'normal' | 'abnormal' | 'unknown';
  bleeding: 'none_seen' | 'visible' | 'unknown';
};

export function objectValue(input: unknown, keys: string[]): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid object');
  const data = input as Record<string, unknown>;
  if (Object.keys(data).some(key => !keys.includes(key))) throw new Error('Unexpected field');
  return data;
}
export function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(value)) throw new Error('Invalid identifier');
  return value;
}
export function parseCreateIncident(input: unknown) {
  const data = objectValue(input, ['cardId', 'requestId', 'location']);
  const location = objectValue(data.location, ['latitude', 'longitude']);
  const { latitude, longitude } = location;
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || Math.abs(latitude) > 85 ||
      typeof longitude !== 'number' || !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
    throw new Error('Invalid location');
  }
  return { cardId: identifier(data.cardId), requestId: identifier(data.requestId), location: { latitude, longitude } };
}
export function parseBystanderReport(input: unknown) {
  const data = objectValue(input, ['incidentId', 'submissionId', 'phone', 'answers']);
  const answers = objectValue(data.answers, ['responsiveness', 'breathing', 'bleeding']);
  const allowed: Record<string, string[]> = {
    responsiveness: ['responsive', 'unresponsive', 'unknown'],
    breathing: ['normal', 'abnormal', 'unknown'],
    bleeding: ['none_seen', 'visible', 'unknown'],
  };
  for (const key of Object.keys(allowed)) {
    if (typeof answers[key] !== 'string' || !allowed[key].includes(answers[key] as string)) {
      throw new Error('Answer every question; unknown is allowed');
    }
  }
  let phone: string | null = null;
  if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
    if (typeof data.phone !== 'string' || data.phone.length > 40) throw new Error('Invalid phone');
    const normalized = data.phone.replace(/[\s().-]/g, '');
    if (!/^\+?[0-9]{8,15}$/.test(normalized)) throw new Error('Invalid phone');
    phone = normalized;
  }
  return {
    incidentId: identifier(data.incidentId), submissionId: identifier(data.submissionId), phone,
    answers: answers as ObservationAnswers,
  };
}
export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const rad = Math.PI / 180;
  const deltaLat = (b.latitude - a.latitude) * rad;
  const deltaLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(deltaLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
