export type PatientProfile = {
  fullName: string;
  allergies: string[];
  emergencyContactPhone: string;
};

// Explicit allow-list: never spread untrusted data into a database write.
export function parsePatientProfile(input: unknown): PatientProfile {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Profile must be an object');
  }
  const value = input as Record<string, unknown>;
  const allowed = ['fullName', 'allergies', 'emergencyContactPhone'];
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
      !/^\+?[0-9]{8,15}$/.test(value.emergencyContactPhone)) {
    throw new Error('Emergency contact phone format is invalid');
  }
  return {
    fullName: value.fullName.trim(),
    allergies: (value.allergies as string[]).map(item => item.trim()),
    emergencyContactPhone: value.emergencyContactPhone,
  };
}
