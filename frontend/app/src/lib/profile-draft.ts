export function profileDraft(fullName: string, allergies: string, phone: string) {
  return { fullName: fullName.trim(), allergies: allergies.split(',').map(value => value.trim()).filter(Boolean), emergencyContactPhone: phone.replace(/[\s().-]/g, '') };
}
export function profileMatchesSaved(draft: ReturnType<typeof profileDraft>, saved: string | null) {
  return saved !== null && JSON.stringify(draft) === saved;
}
