# Phân công nhóm 4 người

| Người | Phần sở hữu | Việc đầu tiên | Đạt khi |
|---|---|---|---|
| TV1 (bạn) | Functions, schema, Rules, API | Chạy Emulator, bổ sung Auth/rules integration tests | chủ hồ sơ lưu được; người khác bị từ chối |
| TV2 | Volunteer và bản đồ | Form đăng ký TNV, màn hình sẵn sàng bằng contract | UI có loading/error, không tự cấp verified |
| TV3 | Auth/Patient/mobile config/APK | Auth UI, gọi savePatientProfile, đọc owner profile | đóng/mở app giữ phiên; lưu hồ sơ đúng UID |
| TV4 | Web người báo và admin | trang thẻ, anonymous session, xác nhận vị trí | chưa gửi báo thật khi backend chưa có; không tải PHI |

## Mốc tích hợp

1. Khung và bộ cài tối thiểu. Không chờ đủ tính năng mới thử build.
2. Auth + hồ sơ + Rules.
3. Card/QR → web → createIncident.
4. Lời mời → accept → arrived → complete, kiểm tra 2 TNV tranh ca.
5. Bản đồ, push Android, NFC trên máy thật.
6. Điều phối theo đợt, audit, cloud demo.

Một Issue cho một đầu ra nhỏ; mọi người cập nhật API contract trước khi ghép. Không mời collaborator khi chưa có username chính xác. Chủ repo thêm thành viên trong Settings → Collaborators.
