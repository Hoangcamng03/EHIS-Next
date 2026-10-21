# Kiến trúc đích và phạm vi hiện tại

## Luồng đích

Patient đăng nhập → lưu hồ sơ → cấp cardId → QR/NFC → người báo mở web → phiên anonymous + xác nhận vị trí → createIncident → backend tạo ca/lời mời và xác nhận → web chuyển bảng hỏi → submitBystanderReport (phone tùy chọn, ba câu trả lời bắt buộc) → cùng ca cập nhật thêm cho TNV. Không chờ TNV nhận mới mở bảng hỏi. Nhánh TNV: lời mời → accept bằng transaction → cấp thông tin liên hệ/vị trí cho đúng TNV phụ trách → hồ sơ y tế + dẫn đường + arrived/completed còn backlog.

Backend là nơi cấp quyền và đổi trạng thái; route hoặc vai trò chọn trên UI không cấp quyền. Người báo không đọc hồ sơ y tế. Firestore realtime không đánh thức iOS khi app bị đình chỉ; không mô tả nó thay thế push nền.

## Collection và quyền (dữ liệu tổng hợp ở Emulator)

| Collection | Nội dung | Quyền |
|---|---|---|
| users | tài khoản, quyền server quản lý | chủ tài khoản đọc phần được phép |
| patients | hồ sơ tự khai | chủ hồ sơ đọc, Function kiểm tra ghi |
| volunteers | xét duyệt và trạng thái hoạt động | không tự bật approved |
| cards | ánh xạ cardId và active | qua Function |
| incidents | trạng thái và phân công | không public read |
| incidents/{id}/private | location; reporter: phone, answers, revision | TNV được phân công qua API |
| incidents/{id}/reportEvents | mã chống gửi lặp và revision, không lưu phone | backend |
| reporters/{uid}/requestReceipts | request fingerprint và ca đã xác nhận/khôi phục | backend; client không đọc/ghi |
| volunteers/{uid}/alerts | lời mời | đúng TNV |
| reporters/{uid}/incidentStatuses | trạng thái tối thiểu | đúng phiên người báo |
| auditLogs | hành động quan trọng | backend ghi |

Rules cho owner-read users/patients/volunteers; người báo đọc projection trạng thái của chính phiên; TNV đã duyệt đọc alerts của chính mình. Mọi client-write bị chặn. cards/incidents/private/reportEvents đều không đọc trực tiếp. Admin SDK dùng trong callable phải kiểm tra quyền riêng.

Prototype dispatch: đọc tối đa 100 TNV approved + isAvailable, vị trí không cũ quá 5 phút, không đang phụ trách ca khác; tính Haversine, chọn tối đa 5 người trong 5km. Lời mời nhận trong 10 phút. TNV tự bật/tắt sẵn sàng qua callable; vị trí được làm mới mỗi phút khi màn hình active. Có kết thúc ca bởi TNV phụ trách, hủy ca chưa nhận bởi người báo, dọn ca dispatching hết hạn khi tạo ca mới. Chưa có tìm kiếm địa lý tối ưu, dispatch nhiều đợt, scheduler hết hạn, rate-limit/App Check, push/GPS nền hoặc audit đầy đủ. Không coi giới hạn này là thiết kế điều phối production.

## Môi trường

- Local: `demo-ehis-next`, các port trong firebase.json. Dữ liệu giả.
- Cloud mới: `ehis-next-20261021-hc03`. Không dùng project gốc, Rebuild hoặc trial.
- Trước cloud database: chốt edition/region, Auth providers, Rules và ngân sách. Không provision database hay bật Blaze chỉ từ việc có project ID.

MapLibre phụ trách hiển thị, dịch vụ routing lấy đường/ETA. REST key chỉ ở backend. Bắt đầu bằng nút mở app dẫn đường rồi tích hợp bản đồ. GPS người báo cần được xác nhận; không mặc định là vị trí bệnh nhân.
