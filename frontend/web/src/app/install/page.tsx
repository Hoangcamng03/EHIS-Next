import Link from 'next/link';
import Image from 'next/image';
import releases from '@/config/releases.json';

export default function InstallPage() {
  const app = process.env.NEXT_PUBLIC_APP_URL || 'https://ehis-next-20261021-hc03-app.web.app';
  return <main className="report-page"><Link href="/">← EHIS</Link><h1>Cài EHIS trên điện thoại</h1>
    <p>Cùng một ứng dụng có giao diện Bệnh nhân và Tình nguyện viên. Đăng nhập sẽ mở đúng khu vực của bạn.</p>
    <p className="notice">Cho phép vị trí và thông báo để nhận yêu cầu hỗ trợ. Kiểm tra chuông trước khi bật Sẵn sàng.</p>
    <a className="primary home-action" href={app}>Mở EHIS ngay trên trình duyệt</a>
    <section className="report-panel"><h2>Android</h2>
      {releases.android.apkUrl ? <><a className="primary home-action" href={releases.android.apkUrl}>Tải APK EHIS {releases.android.version}</a><p>APK chạy độc lập, không cần Expo Go hoặc mở laptop. Các thao tác gửi/nhận dữ liệu cần Internet.</p></> : <p>APK mới đang được chuẩn bị. Dùng bản web ở trên trong lúc chờ; chưa có link tải bản mới được xác nhận.</p>}
      {!releases.android.apkUrl && releases.android.buildUrl && <><a className="secondary home-action" href={releases.android.buildUrl}>Xem tiến độ bản Android {releases.android.version}</a><p>Trang EAS sẽ có nút cài khi build hoàn tất. Chỉ cài bản có trạng thái Succeeded; build lỗi hoặc đang chờ chưa có APK để cài.</p></>}
      <p>Đã có EHIS? Hoàn tất ca đang hỗ trợ, tắt Sẵn sàng rồi cài bản mới đè lên bản cũ. Không cần gỡ ứng dụng hoặc xóa dữ liệu. Sau khi cài, kiểm tra phiên bản trong mục Thông tin ứng dụng.</p>
      {releases.android.apkUrl && <figure><Image src={`/ehis-download-qr.png?v=${releases.android.version}`} alt={`QR tải APK EHIS ${releases.android.version}`} width={256} height={256} unoptimized style={{ maxWidth: '100%', height: 'auto' }} /><figcaption>Quét để tải EHIS {releases.android.version} cho Android. <a href={`/ehis-download-qr.png?v=${releases.android.version}`} download>Lưu mã QR</a></figcaption></figure>}
      <p>Với Chrome: mở EHIS → menu ⋮ → Thêm vào màn hình chính hoặc Cài đặt ứng dụng nếu trình duyệt có tùy chọn này.</p>
      <p>Nếu Android chặn cài APK, kiểm tra nguồn và cảnh báo. Nhóm không yêu cầu tắt Play Protect để cài app.</p>
    </section>
    <section className="report-panel"><h2>iPhone / iPad</h2>
      <p>Mở EHIS bằng Safari → Chia sẻ → Thêm vào Màn hình chính → Thêm. Sau đó mở bằng biểu tượng EHIS. Không cần Expo Go.</p>
      <p>Cách này miễn phí, dùng web qua Internet. Để cả nhóm cài bản iOS native bằng link TestFlight, chủ dự án cần Apple Developer Program. Tài khoản Apple miễn phí chỉ hỗ trợ thử cá nhân qua Mac/Xcode, phải ký và cài lại sau 7 ngày.</p>
      {releases.ios.testFlightUrl ? <a className="primary home-action" href={releases.ios.testFlightUrl}>Cài bản thử qua TestFlight</a> : <p>Bản iOS native/TestFlight chưa phát hành. iPhone không cài được tệp APK; biểu tượng web trên màn hình chính hiện là cách dùng được ngay.</p>}
    </section>
    <section className="report-panel"><h2>Chuẩn bị trước khi sử dụng</h2><ol><li>Dùng tài khoản nhóm đã cấp hoặc đăng ký đúng đối tượng.</li><li>TNV cần được duyệt, bật sẵn sàng và cho phép vị trí.</li><li>Bấm thử chuông, kiểm tra âm lượng; không coi đã cài app là đã nhận thông báo nền.</li></ol><Link href="/privacy">Đọc cách EHIS dùng dữ liệu</Link></section>
  </main>;
}
