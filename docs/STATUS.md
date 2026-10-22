# Trạng thái v0.4 — 2026-10-22

- Đã tạo Firestore thật Standard tại Singapore trong project riêng ehis-next-20261021-hc03. Billing được xác nhận false; không dùng dữ liệu dự án cũ.
- Auth email/password và anonymous đã bật; Rules và composite index đã deploy. Client không được ghi trực tiếp; backend xác thực token và quyền trên từng API.
- Web: https://ehis-next-20261021-hc03.web.app; app Patient/TNV: https://ehis-next-20261021-hc03-app.web.app. Hai bản đã phát hành lên Hosting.
- Backend Node/Express trên Vercel Hobby: https://ehis-next-api-hc03.vercel.app/api. Service account runtime chỉ có Datastore User; khóa chỉ nằm trong secret backend.
- Luồng cloud tự động đã đạt: lưu hồ sơ → cấp QR → đăng ký/duyệt TNV → sẵn sàng → gửi trước → bổ sung không phone → nhận → đến nơi → kết thúc → từ chối đọc thông tin riêng sau đóng.
- UI có nút tối thiểu 56px, chữ nội dung lớn hơn, hiện/ẩn và quên mật khẩu; xác nhận trước hủy/kết thúc. Chế độ chạy thử được ghi rõ và cho dùng tọa độ giả; không đưa hồ sơ thật vào bài thử.
- App web đã cập nhật bước chọn Bệnh nhân/Tình nguyện viên kèm mô tả trước đăng ký; sau tạo tài khoản chuyển đúng khu vực. Đã thử hai signup thật với tài khoản giả và xác nhận không tự cấp quyền. Code Android/Hermes export đạt; APK v0.4 đã phát hành trước đó chưa chứa cập nhật onboarding này, chưa xuất APK mới trong vòng này.
- Tài khoản/mật khẩu chạy thử đã lưu trong repo private EHIS-Next-Team-Access, có link cố định ở README/lab note public. Hiện chỉ chủ dự án được truy cập theo yêu cầu.
- Rate limit theo phút: 120/UID, tạo yêu cầu 30/UID, 600/IP băm. Chưa phải chống bot toàn diện; App Check chưa cưỡng chế.
- Cron Vercel hằng ngày xử lý hết hạn và dọn dữ liệu riêng đủ 24h. Thực tế có thể 24–48h hoặc lâu hơn khi lỗi/quota/backlog; không phải SLA.
- EAS project ehiss-team/ehis-next đã tạo và liên kết; preview dùng backend cloud, APK đã build FINISHED và tải về, kiểm tra manifest/DEX/embedded bundle và đúng backend/project cloud. Chưa xác nhận APK cài/chạy trên thiết bị; chưa IPA/TestFlight.
- Chưa có push/GPS nền, dẫn đường liên tục/giọng nói, NFC, tìm TNV nhiều đợt hoặc vận hành cấp cứu thật. Giữ màn TNV mở trong thử nghiệm.
- APK có cảnh báo Expo Doctor về 5 patch SDK 58 mới, đã ghi rõ trong VERIFICATION_V0_4.md; chưa áp dụng patch vào bộ cài này. Gradle build thành công.
- Thử cài trên điện thoại đã gặp Play Protect chặn, thông báo chưa nhận diện nhà phát triển. Chưa xử lý xong và chưa coi là cài thành công; không yêu cầu tắt Play Protect. Có thể tiếp tục thử UI cloud bằng trình duyệt trong lúc xác minh.

Hướng dẫn: [CLOUD_TRIAL.md](CLOUD_TRIAL.md). Quy trình thay đổi: [LAB_NOTES.md](LAB_NOTES.md). Bảo mật: [SECURITY_REVIEW.json](SECURITY_REVIEW.json).
