# Mobile — app Patient và Volunteer

**Phụ trách:** TV3 (Auth/Patient/build), TV2 (Volunteer/bản đồ). Đây là một app React Native + Expo Router, dùng chung đăng nhập và có hai khu vực. Chọn khu vực TNV không tự cấp quyền.

## Tìm file theo việc cần làm

| Việc | File chính |
|---|---|
| Khung màn hình / điều hướng | [src/app/_layout.tsx](src/app/_layout.tsx) |
| Màn chọn Patient / Volunteer | [src/app/index.tsx](src/app/index.tsx) |
| Hồ sơ, thẻ QR, consent, thu hồi, lịch sử Patient | [src/app/patient.tsx](src/app/patient.tsx) |
| Lời mời, nhận/đến nơi/kết thúc ca | [src/app/volunteer.tsx](src/app/volunteer.tsx) |
| Đăng nhập, đăng ký, quên mật khẩu | [src/components/Session.tsx](src/components/Session.tsx) |
| Chọn mục đích trước đăng ký và mô tả hai đối tượng | [src/components/PurposeChoices.tsx](src/components/PurposeChoices.tsx), [src/lib/account-purpose.ts](src/lib/account-purpose.ts) |
| Đơn ứng tuyển TNV | [src/components/VolunteerApplication.tsx](src/components/VolunteerApplication.tsx) |
| GPS, tọa độ giả, heartbeat sẵn sàng | [src/components/VolunteerAvailability.tsx](src/components/VolunteerAvailability.tsx) |
| Tính và trình bày tuyến đường | [src/components/IncidentNavigation.tsx](src/components/IncidentNavigation.tsx), [src/lib/directions.ts](src/lib/directions.ts) |
| Bản đồ Android/iOS | [src/components/RouteMap.tsx](src/components/RouteMap.tsx), [src/lib/route-html.ts](src/lib/route-html.ts) |
| Bản đồ app chạy trên trình duyệt | [src/components/RouteMap.web.tsx](src/components/RouteMap.web.tsx) |
| Firebase client, chọn endpoint cloud/local, lỗi API | [src/lib/firebase.ts](src/lib/firebase.ts) |
| Chữ, nút, xác nhận thao tác, style chung | `src/components/AppText.tsx`, `ActionButton.tsx`, `ConfirmAction.tsx`; `src/lib/ui.ts` |
| App ID / quyền native / EAS project | [app.json](app.json) |
| Loại build: development, preview APK, production AAB | [eas.json](eas.json) |
| Phiên bản và thông báo OTA đã tải, không ép reload | [src/components/ReleaseStatus.tsx](src/components/ReleaseStatus.tsx), bản web có file `.web.tsx` riêng |

Expo tự chọn file `.web.tsx` khi chạy trên web, file `.tsx` tương ứng dùng cho native. Không sửa file trong `node_modules/`, thư mục build hoặc tạo tay `android/`, `ios/`.

## Vận hành

App dùng Firebase Auth. Các thao tác ghi gọi backend; Firestore listener chỉ đọc dữ liệu được Rules cho phép. Patient cấp QR trỏ website `web/`, không trỏ Metro hoặc app web. TNV nhận listener khi màn hình mở; chưa có push/GPS nền.

Khi chưa đăng nhập, người dùng chọn Bệnh nhân hoặc Tình nguyện viên và đọc mô tả trước khi thấy form đăng ký. Sau đăng ký chuyển đúng khu vực; intent được giữ tại SessionProvider để không mất khi Auth thông báo và unmount form. Đây là lựa chọn điều hướng, không ghi/cấp role; đăng ký TNV vẫn cần nộp đơn và xét duyệt. Tài khoản có sẵn dùng nút Đăng nhập.

Từ **root repo**: `npm run mobile:web` để xem app trên PC, hoặc `npm run mobile` cho development build. Chuẩn bị Emulator/môi trường trước theo [LOCAL_DEVELOPMENT.md](../docs/LOCAL_DEVELOPMENT.md). Expo Go chỉ là cách xem development tương thích SDK, không phải APK độc lập.

Trong **mobile/**: `npm run typecheck`, `npm run lint`. Build/cài cloud: [ANDROID_TRIAL.md](../docs/ANDROID_TRIAL.md). Bản web của app deploy lên site `ehis-next-20261021-hc03-app`; website người báo là site khác.

Khi đổi payload, quyền hoặc trạng thái: phối hợp TV1 theo [API contract](../docs/API_CONTRACT.md). Khi đổi QR/URL: phối hợp TV4. Khi đổi cấu hình build: kiểm tra môi trường EAS riêng, không đưa secret backend vào biến `EXPO_PUBLIC_*`.

Từ 0.4.1, dùng quy trình [MOBILE_RELEASES.md](../docs/MOBILE_RELEASES.md) để cập nhật đồng thời web/Android sau mỗi thay đổi app. Kênh preview nhận OTA tương thích fingerprint ở lần mở lại; đổi native cần APK mới. Không tự gọi reload khi người dùng đang xử lý ca. APK 0.4.0 không có thư viện cập nhật nên cần thay bộ cài một lần.
