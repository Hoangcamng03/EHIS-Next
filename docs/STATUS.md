# Trạng thái và giới hạn

- Repo và Firebase project riêng đã tạo. Xem README cho ID.
- Đã đăng ký Firebase Web, Android và iOS; mã định danh ở firebase.apps.json. Các App ID không phải credentials quản trị.
- Local đã qua lint/typecheck, web production build, 5 validation tests và Emulator Auth/Firestore/Functions integration (starter + báo cáo hai bước, realtime cập nhật, optional phone, Rules và race accept). Android JS export đã thành công; không phải APK.
- Cloud Firestore database, Auth providers, hosting và Functions chưa được mặc định coi là đã provision/deploy; chỉ cập nhật khi có kết quả xác nhận.
- Không có APK/IPA, EAS project hoặc kết quả kiểm tra điện thoại thật trong lần tạo nền này.
- Đã viết web hai bước và TNV đăng nhập, bật/tắt sẵn sàng, cập nhật vị trí mỗi phút khi active, nhận ca/đọc bổ sung/kết thúc phiên; người báo hủy trước nhận. Giải phóng thẻ/TNV và dọn dispatch hết hạn khi có create mới. Patient/admin còn khung.
- Đã thử giao diện PC trực tiếp: gửi ban đầu trước bảng hỏi, ba đáp án không phone, TNV nhận ca và thấy không cung cấp phone, gửi số giả sau accept, nhận revision mới, kết thúc, dùng lại thẻ và hủy. Đã thấy banner app khi backend tắt; web không chuyển sang bước 2 hoặc báo thành công khi không nhận được xác nhận. Web người báo không tràn ngang ở viewport 390px. Chưa thử GPS/Android thật.
- Đã có setup/doctor local, fixture và hướng dẫn [PC rồi Android](TRIAL_CHECKLIST.md). Expo install check + Expo Doctor đạt 20/20. CLI Emulator cố định 15.34.0; có kiểm tra Java/Node/config và chờ Functions sẵn sàng.
- Chưa push/GPS nền, scheduler, điều phối nhiều đợt, chống lạm dụng hoặc retention/audit đầy đủ. Advisory còn tồn tại; [review bảo mật](SECURITY_REVIEW.json) nêu phạm vi và các việc phải làm trước public cloud/dữ liệu thật. Chỉ chạy thử có kiểm soát bằng dữ liệu giả.
- Đã thấy advisory từ dependency upstream trong npm audit của template Expo/Next/Firebase. Một số gợi ý audit yêu cầu major change hoặc downgrade framework; không tự áp dụng --force. Phải rà soát advisory và phiên bản SDK trước phát hành, không tuyên bố bộ thư viện sạch lỗ hổng.
- Port Emulator và Java là cấu hình local; Cloud Functions target Node 22, máy hiện tại có Node 24. CI dùng Node 22 để kiểm tra runtime dự kiến.
