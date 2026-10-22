import Link from 'next/link';
export default function Home() {
  return <main className="page">
    <div className="eyebrow">EHIS · HỖ TRỢ CỘNG ĐỒNG</div>
    <h1>Thẻ của bạn.<br />Kết nối người hỗ trợ.</h1>
    <p className="intro">Bạn quản lý thẻ sức khỏe. Người quét thẻ có thể báo vị trí và tình trạng để tình nguyện viên tiếp nhận.</p>
    <div className="notice">Đợt thử nghiệm có hướng dẫn của nhóm EHIS. Tài khoản và dữ liệu được lưu trên máy chủ; chỉ nhập tình huống và thông tin giả trong đợt nghiệm thu phần mềm. Không bảo đảm có người tiếp nhận và không thay thế dịch vụ cấp cứu.</div>
    <a className="primary home-action" href={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8082/'}>Mở ứng dụng EHIS →</a>
    <section className="grid">
      <article className="card"><span>01 · CHỦ THẺ</span><h2>Chuẩn bị thẻ sức khỏe</h2><p>Chọn Bệnh nhân khi đăng ký. Những lần đăng nhập sau, ứng dụng mở thẳng hồ sơ và thẻ QR của bạn. Bạn quyết định có chia sẻ hồ sơ với người tiếp nhận hay không.</p></article>
      <article className="card"><span>02 · NGƯỜI QUA ĐƯỜNG</span><h2>Quét thẻ, báo hỗ trợ</h2><p>Quét QR bằng camera điện thoại. Gửi yêu cầu khi ở cạnh bệnh nhân, rồi trả lời ba câu hỏi. Không cần tài khoản; số điện thoại không bắt buộc.</p></article>
      <article className="card"><span>03 · TÌNH NGUYỆN VIÊN</span><h2>Sẵn sàng giúp đỡ</h2><p>Đăng ký và chờ xét duyệt trong ứng dụng. Sau khi được duyệt, bật sẵn sàng và giữ màn hình mở để nhận lời mời trong buổi thử.</p></article>
    </section>
    <footer><Link href="/admin">Đăng nhập quản trị</Link><Link href="/privacy">Thông tin được lưu và chia sẻ thế nào?</Link></footer>
  </main>;
}
