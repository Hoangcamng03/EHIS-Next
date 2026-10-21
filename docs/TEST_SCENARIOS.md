# Kịch bản kiểm tra

## Kiểm tra tự động của starter

- TypeScript mobile/web/functions.
- ESLint mobile/web.
- Web production build.
- Parser hồ sơ: hợp lệ, field injection, kiểu dữ liệu, độ dài và SĐT.
- Emulator integration smoke (`scripts/smoke-starter.cjs`): đã xác nhận health, từ chối chưa đăng nhập, chặn field injection, owner save/read, chặn người khác/public đọc và chặn tự sửa verificationStatus.

## Phải bổ sung trước khi dùng dữ liệu thật

- Authenticated owner lưu/đọc hồ sơ; tài khoản khác không đọc được.
- Anonymous không lưu hồ sơ bệnh nhân; client không tự bật verified/admin.
- Ca không public read; người báo chỉ theo dõi ca của phiên mình.
- Nhận ca đồng thời chỉ một TNV thắng.
- Retry create/task không tạo trùng hoặc ghi đè ca đã nhận.
- Vị trí hết hạn, mất mạng, mở lại app khôi phục ca.
- Thẻ thu hồi không tạo được ca mới.
- Push/token refresh, NFC, GPS và bản đồ trên máy thật.
- APK preview mở khi laptop tắt và dùng cloud endpoint.

Test parser không thay thế Rules integration test; web build không chứng minh đã deploy; Expo export không phải APK.
