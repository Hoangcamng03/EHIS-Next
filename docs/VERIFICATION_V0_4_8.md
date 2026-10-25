# EHIS 0.4.8 — sắp xếp giao diện và bản trình midterm

**Chưa phát hành:** đây là ghi chú source 0.4.8 đang sửa ở local; cloud và APK hiện hành vẫn 0.4.7. Chưa có bản 0.4.8 được nghiệm thu đầy đủ hoặc tự cập nhật lên điện thoại.

Ngày 25/10/2026. Android miễn phí + web; diễn tập có kiểm soát. [Kịch bản trình thầy và hướng cuối kỳ](MIDTERM_DEMO.md).

## Thay đổi cần review

- Đăng nhập mặc định; đăng ký chọn Bệnh nhân/Tình nguyện viên trước khi nhập thông tin. Đăng nhập tự vào đúng khu vực, không cấp quyền từ lựa chọn UI.
- Ba cấp nút: thao tác chính có nền màu vai trò; thao tác phụ có viền; tác vụ đọc/cài đặt nhẹ hơn. Hủy/vô hiệu hóa có cảnh báo đỏ; hoàn tất ca dùng màu TNV và có xác nhận.
- Patient: yêu cầu đang diễn ra → QR đang dùng → chỉnh hồ sơ → lịch sử thu gọn → tài khoản/cài đặt. Chưa có thẻ thì lưu hồ sơ trước tạo QR. So sánh bản đang sửa với snapshot đã lưu, không cho tạo QR khi có thay đổi chưa lưu.
- TNV: cảnh báo/ca đang nhận trước; tùy chọn, lịch sử và tài khoản sau. Bản đồ trong app giữ vị trí chính; các chặng và Google Maps nằm trong mục tùy chọn.
- Người báo: ba câu quan sát trước, số điện thoại tùy chọn sau; đủ ba đáp án mới gửi. Hủy chưa nhận là khu vực riêng và cần xác nhận. Không đổi nguyên tắc gửi trước/bổ sung sau.
- Quản trị: xem đơn → chọn quyết định → xác nhận, có quay lại. Quyền backend không đổi.
- Không đổi Rules, IAM, schema, billing hoặc tạo tài khoản cloud mới trong phần sửa UI. Tài khoản QA local và cloud luôn tách riêng.

## Kiểm chứng và phát hành

Kết quả thực của logic/type/lint, tám bộ integration, browser, cloud và APK được bổ sung tại các mốc cuối trong [LAB_NOTES](LAB_NOTES.md). Chưa có số đo thiết bị mới thì giữ Chưa thử trong [phiếu Android](ACCEPTANCE_FLOW.md). Build thành công không chứng minh cài/apply trên máy.

Các giới hạn giữ nguyên: nhận nền chưa được xác minh; hiệu năng tải lớn và advisory dependency còn mở; GPS/loa/rung cần thử thiết bị; chưa có đơn vị y tế phụ trách ca thật. Không mô tả bản midterm là vận hành cấp cứu chính thức.

## Mốc đã quan sát ở local

35 unit/logic + type/lint, tám bộ integration (215 Auth giả, 180 API ở vòng nhiều ca) đạt. Brave mở được Patient 0.4.8; đã thử login, thu hồi QR, draft khóa tạo QR, lưu và tạo lại QR. TNV/reporter/admin của đợt sửa UI chưa nghiệm thu trực quan; computer-use đã tự dừng ở thao tác mở tab vì không xác định URL đủ chắc. Chưa CI/deploy/APK 0.4.8. Các ảnh local chỉ là bằng chứng Patient, không thay thử cả hệ thống.
