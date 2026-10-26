export function reportProgress(status: string, invited: number, expiresAt: number | undefined, now: number) {
  if (status === 'completed' || status === 'cancelled' || status === 'expired') return { terminal: true, waiting: false, delayed: false, title: 'Phiên hỗ trợ đã kết thúc.', detail: 'Không nhận thêm thông tin. Cần hỗ trợ mới thì mở lại thẻ; không chờ EHIS nếu cần cấp cứu.' };
  if (status === 'accepted' || status === 'arrived') return { terminal: false, waiting: false, delayed: false, title: status === 'arrived' ? 'TNV xác nhận đã đến.' : 'TNV đã nhận ca.', detail: status === 'arrived' ? 'Thông tin do TNV xác nhận; người báo cần kiểm tra tại hiện trường.' : 'TNV đang di chuyển. Việc nhận ca chưa đồng nghĩa đã đến nơi.' };
  if (status !== 'dispatching' || !Number.isFinite(expiresAt)) return { terminal: true, waiting: false, delayed: false, title: 'Chưa xác minh được trạng thái tiếp nhận.', detail: 'Kết nối lại để kiểm tra. Không chờ ứng dụng nếu cần cấp cứu.' };
  const remaining = expiresAt! - now;
  if (remaining <= 0) return { terminal: true, waiting: false, delayed: true, title: 'Hết thời gian mời TNV · chưa có người nhận.', detail: 'Lời mời đã hết hạn. Không tiếp tục chờ yêu cầu này; dùng đường liên hệ cấp cứu khi cần.' };
  return { terminal: false, waiting: true, delayed: remaining <= 9 * 60 * 1000, title: 'Đã gửi · CHƯA CÓ NGƯỜI NHẬN.', detail: invited > 0 ? `Máy chủ đã tạo ${invited} lời mời. Chưa có TNV xác nhận tiếp nhận; không chờ hết thời hạn nếu cần cấp cứu.` : 'Hiện không có TNV phù hợp. Hệ thống chưa điều phối được người hỗ trợ.' };
}
