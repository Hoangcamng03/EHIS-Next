# Trạng thái và giới hạn

- Repo và Firebase project riêng đã tạo. Xem README cho ID.
- Đã đăng ký Firebase Web, Android và iOS; mã định danh ở firebase.apps.json. Các App ID không phải credentials quản trị.
- Local đã qua lint/typecheck, web production build, 5 validation tests và Emulator Auth/Firestore/Functions integration (starter + báo cáo hai bước, realtime cập nhật, optional phone, Rules và race accept). Android JS export đã thành công; không phải APK.
- Cloud Firestore database, Auth providers, hosting và Functions chưa được mặc định coi là đã provision/deploy; chỉ cập nhật khi có kết quả xác nhận.
- Không có APK/IPA, EAS project hoặc kết quả kiểm tra điện thoại thật trong lần tạo nền này.
- Đã viết web hai bước và TNV đăng nhập/nhận ca/đọc bổ sung khi màn hình mở; Patient/admin còn khung. Xem BYSTANDER_FLOW.md để tạo fixture giả và chạy thử. Đã xem hai trang web bằng trình duyệt; chưa kiểm thử người dùng hoàn tất form bằng GPS thật hay mobile trên thiết bị.
- Chưa push nền, chưa cập nhật vị trí/sẵn sàng qua UI, chưa hoàn thành/giải phóng ca hoặc xử lý hết hạn, chưa chống lạm dụng và retention/audit đầy đủ. Chưa phù hợp báo sự cố thật.
- Đã thấy advisory từ dependency upstream trong npm audit của template Expo/Next/Firebase. Một số gợi ý audit yêu cầu major change hoặc downgrade framework; không tự áp dụng --force. Phải rà soát advisory và phiên bản SDK trước phát hành, không tuyên bố bộ thư viện sạch lỗ hổng.
- Port Emulator và Java là cấu hình local; Cloud Functions target Node 22, máy hiện tại có Node 24. CI dùng Node 22 để kiểm tra runtime dự kiến.
