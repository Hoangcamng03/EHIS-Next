import Link from 'next/link';
export default function Home() {
  return <main className="page">
    <div className="eyebrow">CAPSTONE · FIREBASE · REACT NATIVE</div>
    <h1>EHIS Next</h1>
    <p className="intro">Nền tảng mới để nhóm xây lại hệ thống thẻ hỗ trợ y tế khẩn cấp, từng bước và có kiểm chứng.</p>
    <div className="notice">Bản khởi đầu phát triển. Chưa dùng để báo sự cố thật và chưa có hồ sơ bệnh nhân.</div>
    <section className="grid">
      <article className="card"><span>01 · MOBILE</span><h2>Một app, hai khu vực</h2><p>Bệnh nhân quản lý hồ sơ và thẻ. Tình nguyện viên được duyệt để nhận và xử lý ca.</p></article>
      <article className="card"><span>02 · WEB</span><h2>Người báo sự cố</h2><p>Trang /c/[cardId] sẽ xác nhận vị trí, gửi yêu cầu và theo dõi trạng thái. Không hiển thị hồ sơ y tế.</p><Link href="/c/demo">Xem khung trang →</Link></article>
      <article className="card"><span>03 · BACKEND</span><h2>Quyền do server kiểm tra</h2><p>Firebase project riêng. Backend khởi đầu có health, getMyAccess và savePatientProfile.</p></article>
    </section>
    <footer><Link href="/admin">Khu vực quản trị (chưa triển khai)</Link><span>Không có chức năng tự cấp quyền quản trị trên giao diện.</span></footer>
  </main>;
}
