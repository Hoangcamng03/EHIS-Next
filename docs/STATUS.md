# Trạng thái và giới hạn

- Repo và Firebase project riêng đã tạo. Xem README cho ID.
- Đã đăng ký Firebase Web, Android và iOS; mã định danh ở firebase.apps.json. Các App ID không phải credentials quản trị.
- Local đã qua lint/typecheck, web production build, 3 profile validation tests và Emulator Auth/Firestore/Functions integration smoke. Đây chưa phải kiểm thử luồng sự cố.
- Cloud Firestore database, Auth providers, hosting và Functions chưa được mặc định coi là đã provision/deploy; chỉ cập nhật khi có kết quả xác nhận.
- Không có APK/IPA, EAS project hoặc kết quả kiểm tra điện thoại thật trong lần tạo nền này.
- Các module nghiệp vụ hiển thị rõ là chưa triển khai.
- Đã thấy advisory từ dependency upstream trong npm audit của template Expo/Next/Firebase. Một số gợi ý audit yêu cầu major change hoặc downgrade framework; không tự áp dụng --force. Phải rà soát advisory và phiên bản SDK trước phát hành, không tuyên bố bộ thư viện sạch lỗ hổng.
- Port Emulator và Java là cấu hình local; Cloud Functions target Node 22, máy hiện tại có Node 24. CI dùng Node 22 để kiểm tra runtime dự kiến.
