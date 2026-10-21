# Kiến trúc đích và phạm vi hiện tại

## Luồng đích

Patient đăng nhập → lưu hồ sơ → cấp cardId → QR/NFC → người báo mở web → phiên anonymous + xác nhận vị trí → createIncident → chọn TNV đã duyệt/sẵn sàng/vị trí còn mới → lời mời → accept bằng transaction → cấp hồ sơ riêng tư + dẫn đường → arrived → completed.

Backend là nơi cấp quyền và đổi trạng thái; route hoặc vai trò chọn trên UI không cấp quyền. Người báo không đọc hồ sơ y tế. Firestore realtime không đánh thức iOS khi app bị đình chỉ; không mô tả nó thay thế push nền.

## Collection đích (chưa tạo dữ liệu)

| Collection | Nội dung | Quyền |
|---|---|---|
| users | tài khoản, quyền server quản lý | chủ tài khoản đọc phần được phép |
| patients | hồ sơ tự khai | chủ hồ sơ đọc, Function kiểm tra ghi |
| volunteers | xét duyệt và trạng thái hoạt động | không tự bật approved |
| cards | ánh xạ cardId và active | qua Function |
| incidents | trạng thái và phân công | không public read |
| incidents/{id}/private | vị trí, snapshot tối thiểu | TNV được phân công qua API |
| volunteers/{uid}/alerts | lời mời | đúng TNV |
| reporters/{uid}/incidentStatuses | trạng thái tối thiểu | đúng phiên người báo |
| auditLogs | hành động quan trọng | backend ghi |

Rules hiện tại chỉ mở owner-read cho users/patients/volunteers; mọi đường khác đều đóng. Phải mở từng đường kèm test, không allow read/write toàn bộ để tiện demo.

## Môi trường

- Local: `demo-ehis-next`, các port trong firebase.json. Dữ liệu giả.
- Cloud mới: `ehis-next-20261021-hc03`. Không dùng project gốc, Rebuild hoặc trial.
- Trước cloud database: chốt edition/region, Auth providers, Rules và ngân sách. Không provision database hay bật Blaze chỉ từ việc có project ID.

MapLibre phụ trách hiển thị, dịch vụ routing lấy đường/ETA. REST key chỉ ở backend. Bắt đầu bằng nút mở app dẫn đường rồi tích hợp bản đồ. GPS người báo cần được xác nhận; không mặc định là vị trí bệnh nhân.
