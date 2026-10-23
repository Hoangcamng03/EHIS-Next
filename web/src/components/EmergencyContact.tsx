export function EmergencyContact() {
  return <aside className="emergency-contact" aria-label="Liên hệ cấp cứu">
    <strong>Cần cấp cứu ngay?</strong>
    <p>Ở Việt Nam, gọi 115. Không chờ tình nguyện viên hoặc hoàn tất bảng hỏi nếu cần cấp cứu.</p>
    <a className="primary emergency-action" href="tel:115">Gọi cấp cứu 115</a>
    <small>Chỉ gọi khi có tình huống thật. Buổi diễn tập không gọi số khẩn cấp. Nếu máy không gọi được, nhờ người bên cạnh dùng điện thoại khác.</small>
  </aside>;
}
