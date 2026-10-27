// Navigation intent only. Volunteer approval is always decided by the backend.
export const accountPurposes = {
  patient: {
    title: 'Bệnh nhân',
    description: 'Tạo thẻ QR và lưu thông tin sức khỏe.',
    nextStep: 'Điền hồ sơ rồi tạo thẻ QR.',
    route: '/patient',
  },
  volunteer: {
    title: 'Tình nguyện viên',
    description: 'Nhận yêu cầu gần bạn và xem đường đi.',
    nextStep: 'Gửi đơn để được duyệt trước khi nhận ca.',
    route: '/volunteer',
  },
} as const;
export type AccountPurpose = keyof typeof accountPurposes;
