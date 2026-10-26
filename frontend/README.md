# Frontend — chọn đúng giao diện

| Thư mục | Người dùng | Công nghệ | Đầu ra |
| --- | --- | --- | --- |
| [app](app/README.md) | Bệnh nhân và Tình nguyện viên | React Native + Expo Router | Android APK; app web từ cùng source |
| [web](web/README.md) | Người qua đường và quản trị | Next.js | Website HTTPS, trang QR/bảng hỏi/admin/install |

Hai phần gọi chung backend và Firebase project. Quyền truy cập do backend/Rules kiểm tra; chọn giao diện không tự cấp quyền. Backend không đặt trong thư mục frontend.

[Về dự án](../README.md) · [Cài/chạy local](../docs/development/LOCAL_DEVELOPMENT.md) · [Kiến trúc/API](../docs/architecture/ARCHITECTURE.md).
