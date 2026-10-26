# Kiểm chứng v0.4 — 2026-10-22

## Đã đạt

- `npm run check`: frontend/app/web lint + typecheck, Functions TypeScript, 6 bài validation và 5 bài navigation.
- 5 integration suites trên Emulator: starter, reports, lifecycle, maintenance, portable HTTP. Bao gồm tranh ca, sai quyền, chống field injection, idempotency, consent, hết hạn, dọn dữ liệu riêng và rate limit nguyên tử.
- Build web Next.js static và Expo web cloud thành công; hai site Firebase Hosting deploy thành công.
- Real Firestore Standard Singapore/freeTier; billingEnabled=false. Owner-read, cross-user/public read và direct client-write được kiểm tra thật.
- Backend Vercel READY; health đúng project/version; không token hoặc token sai bị từ chối; cron không secret trả 401, đúng secret trả 200.
- Luồng API cloud với tài khoản giả: hồ sơ → QR → đơn TNV → admin duyệt → sẵn sàng → gửi → bổ sung không phone → nhận → đến nơi → kết thúc → mất quyền đọc thông tin riêng.
- UI HTTPS ở viewport điện thoại: lưu hồ sơ và thông báo thành công; chọn khu vực Patient/TNV; giữ phiên sau reload; gửi yêu cầu chỉ chuyển sau ack; bổ sung không phone; TNV nhận realtime; tuyến trong EHIS hiển thị bản đồ/từng bước rẽ (0,78 km cho hai tọa độ giả).

## Bằng chứng và phạm vi

Ảnh từng bước nằm trong `.local/cloud-proof-20261022` trên máy người thực hiện, không đưa tài khoản, khóa hoặc dữ liệu sức khỏe thật vào repo. Profile/phone/observations/coordinates dùng cho các bài thử là giả. Kiểm tra trình duyệt không chứng minh WebView/GPS trên Android hoặc iOS.

APK EAS đã FINISHED: https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/cf99a628-de58-4e55-b93c-f48f13178af7. Đã tải artifact 100.235.444 byte; ZIP có manifest, DEX và bundle nhúng chứa đúng backend/project cloud. Chưa thử cài APK lên thiết bị, chưa IPA/TestFlight, chưa push/GPS nền/NFC hoặc dẫn đường liên tục.

Cron được gọi kiểm tra thủ công; chưa có bằng chứng một chu kỳ lịch tự động hằng ngày đã chạy. Quota và sự cố nhà cung cấp vẫn có thể chặn thử nghiệm; giữ phạm vi nhóm nhỏ và dữ liệu giả.

Expo Doctor trong build APK đạt 19/20: cảnh báo có 5 patch mới trong cùng SDK 58 (expo 58.0.16→58.0.17, constants 58.0.12→58.0.13, linking 58.0.13→58.0.14, router 58.0.24→58.0.25, status-bar 58.0.3→58.0.4). Gradle và APK vẫn thành công. Chưa áp dụng các patch đó vào artifact này; cần cập nhật tương thích và kiểm tra lại trong vòng bảo trì tiếp theo. Không báo bản build này sạch mọi cảnh báo.

## Cập nhật onboarding ngày 2026-10-22

- Repo tài khoản riêng tư đã tạo, xác minh private trước/sau upload; có tài khoản Patient/TNV/admin bàn giao, tài khoản local và hai tài khoản kiểm thử đăng ký mới. Không có token hạ tầng/service account/keystore. Không thêm collaborator theo yêu cầu chủ dự án.
- `npm run check` đạt; mobile lint/typecheck đạt; cloud web build và Android/Hermes export đạt. Lần export trong sandbox bị lỗi Hermes ghi file tạm; chạy lại ngoài sandbox thành công.
- UI cloud: chọn Patient → form → signup mới → tự đến `/patient`; chọn TNV từ route `/patient` → form → signup mới → tự đến `/volunteer`. Nút Đổi lựa chọn trở lại bước chọn. Firebase Auth và `getMyAccess` xác nhận cả hai tài khoản mới không có admin/approved.
- Đã phát hành app web lên Hosting. Chưa build APK mới cho onboarding; file APK v0.4 ở phần trên là artifact trước thay đổi này. Chưa có thử Android thật.

GitHub Actions độc lập: https://github.com/Hoangcamng03/EHIS-Next/actions/runs/39729774930 — tất cả bước thành công tại commit 26f0b565543d96362e8010991dba6ce00cfc6a6e, bao gồm Android JS export và integration. UI đã xác nhận hoàn tất, gỡ thông tin riêng, đồng bộ trang người báo.

## Phát hành đồng bộ app 0.4.1

[APK FINISHED](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/6e645e3e-bbcc-474b-89bf-f67205bfdcd7), web và OTA cùng commit `794bcbd4db670621b76fa9570f5b065c04e93d9a`/runtime `60be4f048122470351bfde1bf494fa80b951eb07`. Artifact/hash và cách cài: [MOBILE_RELEASES.md](../../operations/MOBILE_RELEASES.md). Expo Doctor 20/20 và GitHub CI run 39753486305 thành công. EAS manifest đúng runtime trả 200/đúng update; runtime sai trả 204. Chưa xác nhận thiết bị thật nhận OTA hoặc cài APK; cảnh báo Play Protect trước đây vẫn cần nghiệm thu. Các nhận định “chưa xuất APK mới” ở mục onboarding bên trên mô tả thời điểm trước vòng phát hành này.
