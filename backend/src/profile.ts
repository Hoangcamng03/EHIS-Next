export type PatientProfile = {
  fullName: string;
  allergies: string[];
  emergencyContactPhone: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
};

// Explicit allow-list: never spread untrusted data into a database write.
export function parsePatientProfile(input: unknown): PatientProfile {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Profile must be an object');
  }
  const value = input as Record<string, unknown>;
  const allowed = ['fullName', 'allergies', 'emergencyContactPhone', 'emergencyContactName', 'emergencyContactRelationship'];
  if (Object.keys(value).some(key => !allowed.includes(key))) {
    throw new Error('Unexpected profile field');
  }
  if (typeof value.fullName !== 'string' || !value.fullName.trim() || value.fullName.trim().length > 100) {
    throw new Error('Full name must contain 1 to 100 characters');
  }
  if (!Array.isArray(value.allergies) || value.allergies.length > 20 ||
      value.allergies.some(item => typeof item !== 'string' || !item.trim() || item.trim().length > 100)) {
    throw new Error('Allergies must contain at most 20 short text items');
  }
  if (typeof value.emergencyContactPhone !== 'string' ||
      (value.emergencyContactPhone !== '' && !/^\+?[0-9]{8,15}$/.test(value.emergencyContactPhone))) {
    throw new Error('Emergency contact phone format is invalid');
  }
  const hasDetails = 'emergencyContactName' in value || 'emergencyContactRelationship' in value;
  const contact: Pick<PatientProfile, 'emergencyContactName' | 'emergencyContactRelationship'> = {};
  if (hasDetails) {
    for (const [key, maximum] of [['emergencyContactName', 100], ['emergencyContactRelationship', 60]] as const) {
      if (typeof value[key] !== 'string' || value[key].trim().length > maximum) throw new Error('Emergency contact details are invalid');
      contact[key] = value[key].trim();
    }
    const complete = !!value.emergencyContactPhone && !!contact.emergencyContactName && !!contact.emergencyContactRelationship;
    const empty = !value.emergencyContactPhone && !contact.emergencyContactName && !contact.emergencyContactRelationship;
    if (!complete && !empty) throw new Error('Điền đủ tên, quan hệ và số điện thoại liên hệ, hoặc để trống cả ba.');
  }
  return {
    fullName: value.fullName.trim(),
    allergies: (value.allergies as string[]).map(item => item.trim()),
    emergencyContactPhone: value.emergencyContactPhone,
    ...contact,
  };
}
