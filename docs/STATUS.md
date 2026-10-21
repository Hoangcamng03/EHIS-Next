# Trạng thái bản thử v0.3

- Một app có đăng ký/đăng nhập chung, hai khu vực Patient/TNV và nút chuyển khu vực. PC local dùng phiên riêng từng tab; mobile dùng AsyncStorage. Quản trị web có Auth riêng với người báo.
- Patient: lưu hồ sơ tối thiểu (tên, dị ứng, phone khẩn cấp), phát hành QR qua backend, tùy chọn chia sẻ hồ sơ, thu hồi/cấp lại, lịch sử realtime và hủy ca nhầm chưa được nhận.
- TNV: đăng ký, chờ duyệt, bật/tắt sẵn sàng, nhận ban đầu/bổ sung, nhận ca, xem thông tin theo consent, bản đồ/tuyến trong EHIS, arrived và completed. Rời khu vực TNV tắt sẵn sàng.
- Quản trị: danh sách đơn pending giới hạn 50, duyệt/từ chối bằng API kiểm tra custom claim. Không có tự cấp admin.
- Người báo: QR → gửi trước → ack → bảng hỏi, phone tùy chọn, cập nhật cùng ca. Thẻ thu hồi bị từ chối; không có TNV được báo trung thực.
- Backend có 16 Functions. Mọi client-write vẫn bị chặn. Rules chỉ cho owner đọc hồ sơ, card pointer, application, history/status và approved owner đọc alerts.
- Emulator khởi động Standard edition trong log, import snapshot nếu có và export-on-exit. Không provision database cloud hoặc bật billing.
- Các kiểm thử starter + reports + lifecycle đã đạt trên Emulator; lint/typecheck/validation/navigation đã đạt trong vòng phát triển. Kết quả build và GUI được ghi ở bản bàn giao sau kiểm tra cuối. Ảnh local không phải bằng chứng điện thoại thật.
- Repo/Firebase dự án mới vẫn tách khỏi dự án cũ. Android/iOS package `com.hoangcamng.ehisnext`; chưa EAS project/signing, APK/IPA hoặc triển khai cloud.
- Chưa push/GPS nền, dẫn đường liên tục/giọng nói, NFC, scheduler/multi-wave, App Check/throttle, retention hoặc phát hành người thật. Advisory upstream còn tồn tại; xem SECURITY_REVIEW.json.

Luồng, cách chạy và phần cản APK: [COMPLETE_FLOW.md](COMPLETE_FLOW.md). Bản đồ: [NAVIGATION.md](NAVIGATION.md). API: [API_CONTRACT.md](API_CONTRACT.md).
