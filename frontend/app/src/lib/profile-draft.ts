export function profileDraft(fullName: string, allergies: string, phone: string, contactName = '', contactRelationship = '', medicalConditions = '') {
  return { medicalConditions: medicalConditions.split(/[;\n]+/).map(value => value.trim()).filter(Boolean), fullName: fullName.trim(), allergies: allergies.split(',').map(value => value.trim()).filter(Boolean), emergencyContactPhone: phone.replace(/[\s().-]/g, ''), emergencyContactName: contactName.trim(), emergencyContactRelationship: contactRelationship.trim() };
}
export function profileMatchesSaved(draft: ReturnType<typeof profileDraft>, saved: string | null) {
  return saved !== null && JSON.stringify(draft) === saved;
}
