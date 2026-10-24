// Semantic colors: role identity never implies clinical severity or authorization.
export const palette = {
  patient: { primary: '#1756a9', background: '#eef5ff', ink: '#153759', border: '#aac6e8', label: 'BỆNH NHÂN' },
  volunteer: { primary: '#096951', background: '#eef8f3', ink: '#123c37', border: '#9bcbbb', label: 'TÌNH NGUYỆN VIÊN' },
  reporter: { primary: '#934500', background: '#fff7ed', ink: '#58320f', border: '#d6ad7c', label: 'NGƯỜI BÁO TIN' },
  admin: { primary: '#6934a3', background: '#f7f1fc', ink: '#40235c', border: '#c6addf', label: 'QUẢN TRỊ' },
  emergency: { primary: '#b4232b', background: '#fff0f0', ink: '#7c1720', border: '#b4232b' },
} as const;
