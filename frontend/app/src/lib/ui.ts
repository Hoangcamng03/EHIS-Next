import { StyleSheet } from 'react-native';
import { palette } from './palette';
export const ui = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: '#f4f8f6', padding: 16, gap: 14, width: '100%', maxWidth: 760, alignSelf: 'center' },
  eyebrow: { color: '#526f67', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 26, lineHeight: 33, fontWeight: '700', color: '#123c37' },
  heading: { fontSize: 18, lineHeight: 25, fontWeight: '700', color: '#123c37' },
  body: { color: '#36574e', fontSize: 16, lineHeight: 23 },
  caption: { color: '#526f67', fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#dce8e0', gap: 12 },
  input: { borderWidth: 1, borderColor: '#91afa0', borderRadius: 10, padding: 12, backgroundColor: 'white', color: '#123c37', minHeight: 48, fontSize: 16 },
  notice: { backgroundColor: '#fff5db', padding: 12, borderRadius: 12, gap: 8 },
  error: { color: '#a12626', fontSize: 15, lineHeight: 22 }, success: { color: '#096951', fontSize: 15, lineHeight: 22 },
  link: { paddingVertical: 12, color: '#096951', fontSize: 15, fontWeight: '600' },
});
export const patientUi = { ...ui,
  page: [ui.page, { backgroundColor: palette.patient.background }],
  eyebrow: [ui.eyebrow, { color: palette.patient.primary }],
  title: [ui.title, { color: palette.patient.ink }],
  heading: [ui.heading, { color: palette.patient.ink }],
  card: [ui.card, { borderColor: palette.patient.border }],
};
export const statusLabel: Record<string, string> = { dispatching: 'Đang tìm TNV', accepted: 'TNV đang di chuyển', arrived: 'TNV xác nhận đã đến', completed: 'Đã kết thúc hỗ trợ', cancelled: 'Yêu cầu đã hủy', expired: 'Lời mời hết hạn', closed: 'Lời mời đã đóng', offered: 'Đang chờ TNV nhận', pending: 'Đang chờ duyệt', approved: 'Đã được duyệt', rejected: 'Chưa được duyệt' };
