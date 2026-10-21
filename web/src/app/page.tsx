import Link from 'next/link';
export default function Home() {
  return <main className="page">
    <div className="eyebrow">CAPSTONE · FIREBASE · REACT NATIVE</div>
    <h1>EHIS Next</h1>
    <p className="intro">Nền tảng mới để nhóm xây lại hệ thống thẻ hỗ trợ y tế khẩn cấp, từng bước và có kiểm chứng.</p>
    <div className="notice">Bản khởi đầu phát triển. Chưa dùng để báo sự cố thật và chưa có hồ sơ bệnh nhân.</div>
    <section className="grid">
      <article className="card"><span>01 · MOBILE</span><h2>Một app, hai khu vực</h2><p>Bệnh nhân quản lý hồ sơ và thẻ. Tình nguyện viên được duyệt để nhận và xử lý ca.</p></article>
      <article className="card"><span>02 · WEB</span><h2>Người báo sự cố</h2><p>Gửi yêu cầu trước, rồi trả lời ba câu hỏi nhanh. Số điện thoại tùy chọn. Không hiển thị hồ sơ y tế.</p><Link href="/c/synthetic-card-preview">Xem giao diện (thẻ chưa kích hoạt) →</Link></article>
      <article className="card"><span>03 · BACKEND</span><h2>Quyền do server kiểm tra</h2><p>Firebase project riêng. Luồng tạo ca, cập nhật thông tin và nhận ca đã có kiểm thử local bằng dữ liệu giả.</p></article>
    </section>
    <footer><Link href="/admin">Khu vực quản trị (chưa triển khai)</Link><span>Không có chức năng tự cấp quyền quản trị trên giao diện.</span></footer>
  </main>;
}
