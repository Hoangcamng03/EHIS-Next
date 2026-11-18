export const levels = {
  first_aid: 'Đào tạo sơ cứu',
  clinical_student: 'Sinh viên có thực hành lâm sàng',
  clinical_staff: 'Nhân sự có thực hành lâm sàng',
};
export type Application = {
  uid: string;
  applicationRevision: number;
  fullName: string;
  phone: string;
  experience: string;
  trainingLevel: keyof typeof levels;
  clinicalMonths: number;
  homeAddress: string;
  workAddress: string;
  serviceArea: string;
  specialties?: string[];
  policyVersion?: number;
};
