# Kiểm chứng v0.4 — 2026-10-22

## Đã đạt

- `npm run check`: mobile/web lint + typecheck, Functions TypeScript, 6 bài validation và 5 bài navigation.
- 5 integration suites trên Emulator: starter, reports, lifecycle, maintenance, portable HTTP. Bao gồm tranh ca, sai quyền, chống field injection, idempotency, consent, hết hạn, dọn dữ liệu riêng và rate limit nguyên tử.
- Build web Next.js static và Expo web cloud thành công; hai site Firebase Hosting deploy thành công.
- Real Firestore Standard Singapore/freeTier; billingEnabled=false. Owner-read, cross-user/public read và direct client-write được kiểm tra thật.
- Backend Vercel READY; health đúng project/version; không token hoặc token sai bị từ chối; cron không secret trả 401, đúng secret trả 200.
- Luồng API cloud với tài khoản giả: hồ sơ → QR → đơn TNV → admin duyệt → sẵn sàng → gửi → bổ sung không phone → nhận → đến nơi → kết thúc → mất quyền đọc thông tin riêng.
- UI HTTPS ở viewport điện thoại: lưu hồ sơ và thông báo thành công; chọn khu vực Patient/TNV; giữ phiên sau reload; gửi yêu cầu chỉ chuyển sau ack; bổ sung không phone; TNV nhận realtime; tuyến trong EHIS hiển thị bản đồ/từng bước rẽ (0,78 km cho hai tọa độ giả).

## Bằng chứng và phạm vi

Ảnh từng bước nằm trong `.local/cloud-proof-20261022` trên máy người thực hiện, không đưa tài khoản, khóa hoặc dữ liệu sức khỏe thật vào repo. Profile/phone/observations/coordinates dùng cho các bài thử là giả. Kiểm tra trình duyệt không chứng minh WebView/GPS trên Android hoặc iOS.

APK EAS đang build: https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/cf99a628-de58-4e55-b93c-f48f13178af7. Chỉ coi file đã xuất khi EAS báo FINISHED và có artifact. Chưa thử cài APK lên thiết bị, chưa IPA/TestFlight, chưa push/GPS nền/NFC hoặc dẫn đường liên tục.

Cron được gọi kiểm tra thủ công; chưa có bằng chứng một chu kỳ lịch tự động hằng ngày đã chạy. Quota và sự cố nhà cung cấp vẫn có thể chặn thử nghiệm; giữ phạm vi nhóm nhỏ và dữ liệu giả.
