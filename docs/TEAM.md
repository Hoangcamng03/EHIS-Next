# Phân công nhóm 4 người

[Danh mục tài liệu](README.md) · [Bắt đầu từ đầu](START_HERE_DEMO.md) · [Trạng thái phiên bản](STATUS.md)

**Phối hợp buổi demo:** đọc [bắt đầu](START_HERE_DEMO.md) rồi [runbook bốn người](DEMO_RUNBOOK.md). Bảng dưới chia việc phát triển; vai trong runbook chia thao tác buổi thử.

## Tiếp quản bản thử v0.4

Luồng cơ bản trong bảng cũ bên dưới đã có mã và đã chạy thử PC. Nhóm nên tiếp quản theo đầu ra tiếp theo, không viết lại song song cùng chức năng:

| Người | Đầu ra tiếp theo | Kiểm tra thành công |
|---|---|---|
| TV1 | Backend/Rules: quản lý cloud Spark + Vercel đã có, theo dõi cron/quota, App Check và hoàn thiện chính sách dữ liệu | kiểm thử từ chối sai quyền vẫn qua; kiểm tra log cron và thời gian dọn thực tế |
| TV2 | Volunteer: thử GPS và WebView Android thật, xử lý vòng đời app và push | nhận ca đúng tài khoản, tọa độ đúng, trạng thái đến nơi/hoàn tất đồng bộ; ghi rõ giới hạn khi app đóng |
| TV3 | Patient/Auth và APK: quản lý dự án ehiss-team/ehis-next đã liên kết, thử bản preview trên Android thật | APK cài được, mở lại giữ phiên, QR trỏ HTTPS đúng backend; ghi lại model/Android và kết quả |
| TV4 | Website/admin: thử QR trên trình duyệt điện thoại, hồi phục phiên, đa kích thước và accessibility | backend xác nhận rồi mới chuyển bảng hỏi; phone tùy chọn; không có TNV vẫn hiện đúng trạng thái |

Một người sửa một vùng chức năng trên nhánh riêng; thống nhất API trước. Khi cùng sửa một file, chia hàm/component rồi review diff; dùng Live Share cho buổi pair programming, không dùng thư mục đồng bộ làm cơ chế hợp nhất mã. Mỗi PR phải có bước thử và người khác review trước khi merge.

## Phân công khởi đầu (tham chiếu)

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
