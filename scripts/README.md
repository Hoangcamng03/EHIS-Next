# Scripts — phân biệt chạy local, kiểm tra và triển khai

Các lệnh npm bên dưới chạy từ **root repo**. Script công cụ không phải code giao diện. Đọc phần môi trường trước khi chạy; tác vụ cloud cần tài khoản/quyền của nhóm, không bật billing tự động.

## 1. Phát triển local — project demo

| Lệnh | Script | Tác dụng |
|---|---|---|
| `npm run setup:local` | `setup-local.cjs`, `local-runtime.cjs` | Chuẩn bị cấu hình/công cụ local |
| `npm run doctor:local` | `doctor-local.cjs` | Kiểm tra Java/cấu hình/port |
| `npm run emulators` | `firebase-local.cjs`, `firebase-cli.cjs` | Build backend và chạy Emulator demo |
| `npm run web` | Next.js CLI trong `web/` | Website local port 3100 |
| `npm run mobile:web` | Expo CLI trong `mobile/` | App trên trình duyệt port 8082 |
| `npm run mobile` | Expo CLI trong `mobile/` | Development build workflow |
| `npm run trial:prepare` | `prepare-complete-demo.cjs` | Tạo tài khoản giả local cho luồng đầy đủ |
| `npm run trial:seed` | `seed-report-demo.cjs` | Seed kịch bản báo cáo local theo tọa độ của lệnh |
| `npm run trial:snapshot` | `firebase-local.cjs snapshot` | Export dữ liệu Emulator ra `.local/` |

## 2. Kiểm tra mã và nghiệp vụ

- `npm run check`: lint/typecheck app/web, build TypeScript backend, unit validation, `test-navigation.cjs` và `test-emergency-alerts.cjs` (dedupe/expiry/lịch chuông hữu hạn). Kiểm tra phần mềm không xác nhận loa/rung vật lý.
- `npm run test:integration`: build backend, khởi động Emulator kiểm tra và chạy `run-integration.cjs`; tránh trùng port phiên phát triển đang chạy.
- `run-integration.cjs`: gọi 5 suite `smoke-starter`, `smoke-reports`, `smoke-lifecycle`, `smoke-maintenance`, `smoke-portable` trên Emulator sẵn sàng. Các suite dùng dữ liệu giả, kiểm tra quyền/trạng thái/transaction/HTTP wrapper; không chạy chúng vào database cloud.
- `npm --prefix web run build`: production build web local; khác `cloud:build` có static export và cấu hình cloud.
- GitHub CI ở `../.github/workflows/check.yml`: cài dependency, chạy check, Android JS export, web build và integration; **không tự deploy**.

## 3. Build và vận hành cloud — chỉ người phụ trách

| Lệnh / script | Tác dụng | Điều cần biết |
|---|---|---|
| `npm run cloud:configure -- <backend-HTTPS>/api` | `cloud.cjs` tạo client config cloud bị Git bỏ qua | Kiểm tra đúng project mới; không ghi đè demo |
| `npm run cloud:build` | Xuất web Next.js + Expo web | Chỉ build; chưa deploy APK/backend/web |
| `npm run cloud:probe` | Health đúng project và từ chối API không Auth | Không thay cho kiểm thử toàn luồng |
| `npm run cloud:deploy-web` | Probe rồi deploy hai site Hosting | Chỉ phát hành frontend artifacts đã build |
| `npm run cloud:status` | `cloud-access.cjs status` | Đọc edition/vùng/billing; không bật billing |
| `node scripts/vercel.cjs deploy` | Deploy backend từ `functions/` | Cần Vercel CLI đăng nhập và secret runtime đúng |
| `cloud-access.cjs admin <UID>` | Cấp claim admin bằng quyền operator | Chỉ cấp tài khoản được chủ project xác nhận |
| `cloud-access.cjs runtime-key ...`, `vercel.cjs secrets ...` | Tạo/quản lý credential runtime và lưu secret | Thao tác quyền nhạy cảm, cần phê duyệt cụ thể; không chạy như lệnh setup thường ngày |
| `cloud-operator.cjs` | Helper dùng phiên Firebase CLI của operator | Không import vào client hoặc backend runtime |

`cloud-database-probe.cjs`, `cloud-flow-probe.cjs`, `cloud-maintenance-probe.cjs` là công cụ nghiệm thu **có gọi cloud thật**. Flow probe tạo tài khoản/dữ liệu giả và có bước cấp admin bằng operator; không chạy lại tùy tiện hoặc xem là unit test. Tài khoản bàn giao hiện tại xem [lab note](../docs/LAB_NOTES.md).

APK build bằng EAS từ `mobile/`, không qua `cloud:deploy-web`. [Android](../docs/ANDROID_TRIAL.md), [cloud](../docs/CLOUD_TRIAL.md), [local từng bước](../docs/LOCAL_DEVELOPMENT.md).

## 4. Phát hành app web và điện thoại đồng bộ

**Chỉ áp dụng sau khi chủ dự án duyệt web và cho phép phát hành native.** Trong giai đoạn nghiệm thu hiện tại dùng `cloud:build` và `cloud:deploy-web`, không chạy `release:preview` vì sẽ phát OTA/Android.

Khi được phép, dùng `npm run release:preview -- --message "mô tả"` cho thay đổi app tương thích runtime; thêm `--native` khi cần APK mới. `release-preview.cjs` kiểm tra source sạch/env/fingerprint, chạy check, phát OTA Android + Hosting từ cùng commit; `eas-cli.cjs` chọn CLI của operator hoặc CLI chính thức qua npm. Kết quả trong `.local/release-preview.latest.json`, không bao gồm credentials.

Script chặn OTA đơn lẻ nếu native fingerprint không khớp APK preview FINISHED gần nhất. Chế độ native chỉ gửi build; phải chờ và xác nhận APK FINISHED, tải artifact, rồi thử thiết bị. Không tự reload ca đang hoạt động. [MOBILE_RELEASES.md](../docs/MOBILE_RELEASES.md) là đầu mối phiên bản và hướng dẫn.

## 5. Kiểm chứng bản web đã phát hành

Sau `npm run cloud:build` và `npm run cloud:deploy-web`, chạy `node scripts/verify-cloud-artifacts.cjs` để đối chiếu HTML/JS/CSS trên hai site với artifact local bằng SHA-256. Chỉ đọc mạng, ghi kết quả vào `.local/cloud-artifact-proof.json`; không thay dữ liệu hoặc thay cho kiểm thử nghiệp vụ/thiết bị. Bản build local phải là bản vừa deploy, nếu không so sánh sẽ báo lệch đúng chủ đích.

## 6. Build APK thử và kiểm tra artifact

`node scripts/build-trial-android.cjs start` gửi build preview từ source sạch; `status` đọc tiến độ và xác minh source/version khi FINISHED. `node scripts/verify-trial-apk.cjs` tải/kiểm tra manifest, quyền, target cloud, WAV và SHA-256; không thay nghiệm thu thiết bị hoặc kiểm tra chứng chỉ ký. Không tự phát OTA/submit store. [Quy trình](../docs/PHONE_INSTALL_AND_LAUNCH.md).
