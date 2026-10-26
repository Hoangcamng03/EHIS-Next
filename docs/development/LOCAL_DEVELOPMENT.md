# Chạy EHIS trên máy phát triển

**Phạm vi:** Emulator và dữ liệu giả. Dùng [CLOUD_TRIAL.md](../operations/CLOUD_TRIAL.md) cho cloud, [ANDROID_TRIAL.md](../operations/ANDROID_TRIAL.md) cho APK. Không dùng tài khoản Emulator để đăng nhập APK cloud.

## 1. Lấy đúng code và cài dependency

Cần Git, Node.js 22 và Java 21 cho Emulator. Cấu trúc hiện dùng ba package npm độc lập; chạy ở **root repo**:

```powershell
git clone https://github.com/Hoangcamng03/EHIS-Next.git
cd EHIS-Next
git switch main
npm --prefix frontend/app ci
npm --prefix frontend/web ci
npm --prefix backend ci
npm run setup:local
npm run doctor:local
```

Sau clone, dùng main làm nguồn chuẩn. Không chạy lại clone nếu đã có checkout: lưu công việc, fetch rồi cập nhật main theo [CONTRIBUTING](../../CONTRIBUTING.md). Không kéo thay đổi di chuyển thư mục đè lên source đang sửa; xem [hướng dẫn chuyển cấu trúc](REPOSITORY_MIGRATION.md).

**Đạt khi:** cài được ba package, doctor xác nhận Java/cấu hình cần thiết. `.local/` chứa dữ liệu riêng được tạo trên máy đó, không được tải từ repo. `.env.example` là mẫu; nếu setup báo thiếu, copy mẫu module thành `.env.local` và kiểm tra project `demo-ehis-next`, bật Emulator theo mẫu. Giữ lockfile, không ép downgrade framework bằng audit fix.

## 2. Mở ba terminal ở root

Terminal A — backend và database giả:

```powershell
npm run emulators
```

**Đạt khi:** Auth 9199, Firestore 8180, Functions 5101 sẵn sàng; Emulator UI ở http://127.0.0.1:4100. Health: http://127.0.0.1:5101/demo-ehis-next/asia-southeast1/health. Health chỉ kiểm tra dịch vụ, chưa chứng minh luồng ca đúng.

Terminal B — website người báo/quản trị:

```powershell
npm run web
```

**Đạt khi:** mở được http://localhost:3100; đây là website trong `frontend/web/`.

Terminal C — app Patient/Volunteer trên PC:

```powershell
npm run app:web
```

**Đạt khi:** http://localhost:8082 có đăng ký theo đối tượng và đăng nhập tự vào đúng khu vực; tài khoản cũ thiếu lựa chọn/hồ sơ thì hoàn tất một lần. Đây là source trong `frontend/app/`, không phải website người báo.

## 3. Tạo kịch bản dùng thử

Khi Emulator sẵn sàng, mở terminal khác ở root:

```powershell
npm run trial:prepare
```

Tài khoản giả local được lưu trong `.local/complete-demo.json`. Các tài khoản cloud bàn giao được liệt kê riêng ở [LAB_NOTES.md](../LAB_NOTES.md); mật khẩu có trong [repo GitHub riêng tư](https://github.com/Hoangcamng03/EHIS-Next-Team-Access), không nằm trong repo public. Không dùng script operator cloud để seed Emulator.

Thử theo thứ tự: Patient lưu/cấp QR → admin duyệt TNV → TNV sẵn sàng ở vị trí giả → mở URL thẻ bằng website → gửi và bổ sung không phone → TNV nhận/xem tuyến/đến nơi/kết thúc. Chi tiết kịch bản PC: [COMPLETE_FLOW.md](https://github.com/Hoangcamng03/EHIS-Next/blob/f921d33/docs/COMPLETE_FLOW.md).

Trước khi dừng cưỡng bức Emulator, dùng `npm run trial:snapshot`; bình thường dừng bằng Ctrl+C để export theo cấu hình. Snapshot chỉ ở local và không tự được chuyển lên Firestore thật.

## 4. Kiểm tra trước PR

```powershell
npm run check
npm --prefix frontend/web run build
npm run test:integration
```

`test:integration` khởi chạy một phiên Emulator kiểm tra. Dừng phiên Emulator dùng phát triển trước nếu trùng port; giữ snapshot cần dùng. Xem [scripts/README.md](../../scripts/README.md) để phân biệt test độc lập với chạy smoke trên Emulator đang mở.

## 5. Thử điện thoại

- APK cloud là đường dùng thử độc lập laptop, không cần Expo Go. APK và hướng dẫn hiện có trong [ANDROID_TRIAL.md](../operations/ANDROID_TRIAL.md).
- `npm run app` dùng development build để lập trình. Expo Go chỉ dùng khi SDK/module tương thích; không coi quét Metro QR là đã có standalone app.
- Trên điện thoại, `127.0.0.1` chỉ chính điện thoại. Muốn dùng Emulator từ điện thoại phải cấu hình IP LAN, bind/firewall phù hợp; GPS web cần HTTPS. Không đổi địa chỉ cloud thành localhost để thử nhiều thiết bị.
- Bản đồ/OSRM cần Internet dù dữ liệu nghiệp vụ ở Emulator. Không xác nhận hành vi thiết bị chỉ bằng screenshot trình duyệt.
