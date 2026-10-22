// Navigation intent only. Volunteer approval is always decided by the backend.
export const accountPurposes = {
  patient: {
    title: 'Bệnh nhân',
    description: 'Lưu thông tin sức khỏe cá nhân và tạo thẻ QR để chia sẻ khi cần hỗ trợ.',
    nextStep: 'Sau khi tạo tài khoản, bạn sẽ điền hồ sơ sức khỏe tự khai và phát hành thẻ QR.',
    route: '/patient',
  },
  volunteer: {
    title: 'Tình nguyện viên',
    description: 'Tham gia hỗ trợ người gần bạn và xem đường đi khi tiếp nhận yêu cầu.',
    nextStep: 'Sau khi tạo tài khoản, bạn cần gửi đơn và được quản trị duyệt trước khi nhận ca.',
    route: '/volunteer',
  },
} as const;
export type AccountPurpose = keyof typeof accountPurposes;
