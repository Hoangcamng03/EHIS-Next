import Link from 'next/link';
export default function Home() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8082/';
  return (
    <main className="landing">
      <header className="site-nav">
        <Link className="site-wordmark" href="/">
          EHIS
        </Link>
        <nav aria-label="Điều hướng giới thiệu">
          <a href="#how">Cách hoạt động</a>
          <a href="#roles">Dành cho bạn</a>
          <Link href="/install">Tải ứng dụng</Link>
        </nav>
      </header>
      <section className="landing-hero">
        <div>
          <p className="eyebrow">Thẻ sức khỏe · Kết nối hỗ trợ</p>
          <h1>
            Một mã QR.
            <br />
            Một kết nối
            <br />
            <em>đúng lúc.</em>
          </h1>
          <p className="intro">
            Mang theo thông tin sức khỏe cần thiết. Kết nối với tình nguyện viên gần bệnh nhân khi
            cần hỗ trợ.
          </p>
          <div className="hero-actions">
            <a className="primary" href={appUrl}>
              Mở EHIS
            </a>
            <Link className="secondary" href="/install">
              Tải Android
            </Link>
          </div>
          <p className="hint">iPhone có thể mở bản web. Chưa có bản iOS native.</p>
        </div>
        <div
          className="connection-visual"
          aria-label="Chủ thẻ kết nối người báo và tình nguyện viên"
        >
          <div className="connection-node patient-node">
            <span>01 · Chủ thẻ</span>
            <strong>Hồ sơ của bạn</strong>
            <p>Tên · Bệnh nền · Dị ứng</p>
            <div className="qr-symbol" aria-hidden="true">
              ▦
            </div>
            <small>Bạn quyết định chia sẻ</small>
          </div>
          <div className="connection-line" aria-hidden="true">
            ↓
          </div>
          <div className="connection-node reporter-node">
            <span>02 · Người báo</span>
            <strong>Gửi vị trí bệnh nhân</strong>
            <p>Quan sát thực tế, không đoán bệnh</p>
          </div>
          <div className="connection-line" aria-hidden="true">
            ↓
          </div>
          <div className="connection-node volunteer-node">
            <span>03 · Tình nguyện viên</span>
            <strong>Tiếp nhận và đến hỗ trợ</strong>
            <p>Đã được admin xác minh</p>
          </div>
        </div>
      </section>
      <section id="how" className="landing-section">
        <p className="eyebrow">Cách EHIS hoạt động</p>
        <h2>Từ thẻ sức khỏe đến người hỗ trợ</h2>
        <div className="landing-steps">
          {[
            ['1', 'Chuẩn bị thẻ', 'Tạo hồ sơ và QR. Chọn thông tin được chia sẻ.'],
            ['2', 'Báo hỗ trợ', 'Quét QR, xác nhận vị trí bệnh nhân rồi gửi yêu cầu.'],
            ['3', 'Bổ sung quan sát', 'Cho biết phản ứng, nhịp thở và dấu hiệu chảy máu.'],
            ['4', 'Theo dõi đến khi kết thúc', 'TNV nhận ca, xem đường đi và cập nhật tiến độ.'],
          ].map(([n, title, body]) => (
            <article key={n}>
              <span className="step-number">{n}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="roles" className="landing-section">
        <h2>Bạn tham gia theo cách nào?</h2>
        <div className="grid">
          <article className="card patient-node">
            <h3>Chủ thẻ</h3>
            <p>Quản lý hồ sơ, người liên hệ, mã QR và lịch sử hỗ trợ.</p>
            <a href={appUrl}>Tạo thẻ của bạn</a>
          </article>
          <article className="card reporter-node">
            <h3>Người báo tin</h3>
            <p>Quét thẻ không cần đăng ký. Có thể xác nhận điểm bệnh nhân khi báo từ xa.</p>
            <a href="#questions">Xem hướng dẫn báo tin</a>
          </article>
          <article className="card volunteer-node">
            <h3>Tình nguyện viên</h3>
            <p>Gửi hồ sơ và kỹ năng. Admin duyệt, sau đó bạn chủ động bật sẵn sàng.</p>
            <a href={appUrl}>Đăng ký tình nguyện viên</a>
          </article>
        </div>
      </section>
      <section id="questions" className="landing-section faq">
        <h2>Điều cần biết</h2>
        <details>
          <summary>Người quét QR có đọc được bệnh án không?</summary>
          <p>
            Không. Hồ sơ chỉ mở cho TNV đã nhận ca khi chủ thẻ cho phép. QR chứa liên kết, không
            chứa bệnh án trong hình mã.
          </p>
        </details>
        <details>
          <summary>Tôi không ở cạnh bệnh nhân thì báo thế nào?</summary>
          <p>
            Chọn “Không, chọn điểm bệnh nhân”, nhập địa chỉ và ghim đúng điểm trên bản đồ. Xác nhận
            với người tại chỗ trước khi gửi; đừng dùng GPS của bạn thay cho bệnh nhân.
          </p>
        </details>
        <details>
          <summary>Có phải mọi yêu cầu đều có người đến?</summary>
          <p>
            Không bảo đảm. EHIS phụ thuộc tình nguyện viên sẵn sàng, kết nối và vị trí. Yêu cầu gửi
            thành công chưa có nghĩa đã có người nhận.
          </p>
        </details>
        <details>
          <summary>Kỹ năng của TNV được xác minh thế nào?</summary>
          <p>
            Admin đối chiếu danh tính, đào tạo và phạm vi hỗ trợ. Hệ thống ưu tiên kỹ năng phù hợp
            với quan sát, vẫn giữ người ở gần làm dự phòng. Đây không phải chẩn đoán tự động.
          </p>
        </details>
      </section>
      <footer>
        <strong>EHIS · Hỗ trợ cộng đồng</strong>
        <Link href="/privacy">Dữ liệu và quyền riêng tư</Link>
        <Link href="/admin">Quản trị</Link>
        <p>EHIS không bảo đảm có người tiếp nhận và không thay thế dịch vụ cấp cứu.</p>
      </footer>
    </main>
  );
}
