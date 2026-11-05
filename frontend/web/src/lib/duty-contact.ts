export function dutyContact(name: string | undefined, phone: string | undefined) {
  const label = name?.trim() || '', number = phone?.replace(/[\s().-]/g, '') || '';
  return label.length >= 2 && label.length <= 100 && /^\+?[0-9]{8,15}$/.test(number) ? { name: label, phone: number, href: `tel:${number}` } : null;
}
