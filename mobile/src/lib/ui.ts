import { StyleSheet } from 'react-native';
export const ui = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: '#f4f8f6', padding: 22, gap: 18 },
  eyebrow: { color: '#526f67', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '800', color: '#123c37' },
  heading: { fontSize: 20, fontWeight: '700', color: '#123c37' },
  body: { color: '#47665f', lineHeight: 23 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 18, borderWidth: 1, borderColor: '#dce8e0', gap: 14 },
  input: { borderWidth: 1, borderColor: '#b8cbc1', borderRadius: 10, padding: 13, backgroundColor: 'white', color: '#123c37', minHeight: 48 },
  notice: { backgroundColor: '#fff0ce', padding: 16, borderRadius: 12, gap: 8 },
  error: { color: '#a12626', lineHeight: 22 }, success: { color: '#096951', lineHeight: 22 },
  link: { paddingVertical: 12, color: '#096951', fontWeight: '700' },
});
export const statusLabel: Record<string, string> = { dispatching: 'Đang tìm TNV', accepted: 'TNV đang di chuyển', arrived: 'TNV xác nhận đã đến', completed: 'Đã kết thúc hỗ trợ', cancelled: 'Yêu cầu đã hủy', expired: 'Lời mời hết hạn', closed: 'Lời mời đã đóng', offered: 'Đang chờ TNV nhận', pending: 'Đang chờ duyệt', approved: 'Đã được duyệt', rejected: 'Chưa được duyệt' };
