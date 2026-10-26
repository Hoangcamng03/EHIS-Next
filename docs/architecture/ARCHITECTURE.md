# Kiến trúc đích và phạm vi hiện tại

## Luồng đích

Patient đăng ký/đăng nhập → lưu hồ sơ → cấp cardId → QR → người báo mở web → phiên anonymous + xác nhận vị trí → createIncident → backend tạo ca/lời mời và xác nhận → web chuyển bảng hỏi → submitBystanderReport (phone tùy chọn, ba câu trả lời bắt buộc) → cùng ca cập nhật thêm cho TNV. Không chờ TNV nhận mới mở bảng hỏi. TNV đăng ký ứng tuyển → admin xét duyệt → bật sẵn sàng → lời mời → accept bằng transaction → cấp thông tin liên hệ/vị trí cho đúng TNV phụ trách → hồ sơ tự khai nếu Patient đồng ý → tuyến đường trong app → arrived → completed. Patient và người báo nhận projection trạng thái riêng. NFC chưa triển khai trên thiết bị. Xem [flow nghiệm thu hiện hành](../testing/ACCEPTANCE_FLOW.md) để chạy đầy đủ.

Backend là nơi cấp quyền và đổi trạng thái; route hoặc vai trò chọn trên UI không cấp quyền. Người báo không đọc hồ sơ y tế. Firestore realtime không đánh thức iOS khi app bị đình chỉ; không mô tả nó thay thế push nền.

## Collection và quyền (Emulator hoặc cloud riêng)

| Collection | Nội dung | Quyền |
|---|---|---|
| users | tài khoản, quyền server quản lý | chủ tài khoản đọc phần được phép |
| patients | hồ sơ tự khai | chủ hồ sơ đọc, Function kiểm tra ghi |
| volunteers | xét duyệt và trạng thái hoạt động | không tự bật approved |
| cards | ánh xạ cardId và active | qua Function |
| patientCards/{uid} | thẻ đang dùng và lựa chọn chia sẻ | chủ tài khoản đọc; backend ghi |
| volunteerApplications/{uid} | hồ sơ ứng tuyển và kết quả duyệt | chủ tài khoản đọc; admin xét qua callable |
| patients/{uid}/incidentStatuses | lịch sử trạng thái tối thiểu | chủ tài khoản đọc; backend ghi |
| incidents | trạng thái và phân công | không public read |
| incidents/{id}/private | location; reporter: phone, answers, revision | TNV được phân công qua API |
| incidents/{id}/reportEvents | mã chống gửi lặp và revision, không lưu phone | backend |
| reporters/{uid}/requestReceipts | request fingerprint và ca đã xác nhận/khôi phục | backend; client không đọc/ghi |
| volunteers/{uid}/alerts | lời mời | đúng TNV |
| reporters/{uid}/incidentStatuses | trạng thái tối thiểu | đúng phiên người báo |
| auditLogs | hành động quan trọng | backend ghi |

Rules cho owner-read users/patients/volunteers; người báo đọc projection trạng thái của chính phiên; TNV đã duyệt đọc alerts của chính mình. Mọi client-write bị chặn. cards/incidents/private/reportEvents đều không đọc trực tiếp. Admin SDK dùng trong callable phải kiểm tra quyền riêng.

Dispatch 0.4.7: Firestore lọc bbox quanh bán kính 5km, approved + isAvailable và lastSeen trong 5 phút (không quá tương lai 1 phút), tách query ở kinh tuyến 180. Dùng composite index location.latitude/location.longitude/lastSeenAt rồi exact Haversine; loại TNV bận/Patient tự nhận, mời tối đa 5 người gần nhất. Tối đa 1000 ứng viên trong vùng truy vấn, vượt trả dispatch-capacity trước ghi ca/pointer; không âm thầm cắt danh sách hoặc báo không có TNV. Lời mời nhận trong 10 phút. TNV tự bật/tắt sẵn sàng qua callable; vị trí được làm mới mỗi 30 giây khi màn hình active. Có kết thúc ca bởi TNV phụ trách, hủy ca chưa nhận bởi người báo, dọn ca dispatching hết hạn khi tạo ca mới. Đã có rate limit và worker hết hạn trên Vercel chạy hằng ngày; chưa có tìm kiếm địa lý tối ưu, dispatch nhiều đợt, App Check cưỡng chế, push/GPS nền hoặc audit đầy đủ. Không coi giới hạn này là thiết kế điều phối production.

## Môi trường

- Local: `demo-ehis-next`, các port trong firebase.json. Dữ liệu giả.
- Cloud mới: `ehis-next-20261021-hc03`. Không dùng project gốc, Rebuild hoặc trial.
- Cloud đã tạo: Standard/Singapore/free tier, Auth anonymous + email/password, Rules/indexes/Hosting đã deploy. Backend Express giữ HTTP callable wrapper trên Vercel Hobby; không deploy Firebase Functions/Blaze. Secrets chỉ ở runtime backend. Xem CLOUD_TRIAL.md.

Leaflet hiển thị bản đồ, OSRM trả tuyến đường/ETA cho bản thử. GPS người báo cần được xác nhận; không mặc định là vị trí bệnh nhân. Không đưa khóa bí mật nhà cung cấp vào client.

Hiện tại vị trí TNV dùng bản đồ OSM; sau accept, màn hình tuyến đường dùng Leaflet web / WebView Android-iOS, hai marker và polyline từ OSRM khi người dùng bấm xem. Quãng đường/thời gian OSRM được tách khỏi khoảng cách Haversine lúc dispatch. Từ 0.4.6, TNV bật GPS foreground trên màn chỉ đường; hiển thị độ mới/sai số, giữ map và giới hạn tính lại tuyến. Người báo có thể xác nhận đổi điểm sau nhận ca; xem LIVE_GPS_0_4_6.md. Google Maps URLs hỗ trợ xem tuyến từ điểm đã lưu hoặc dẫn đường từ vị trí do Google xác định. Không đưa phone, UID, cardId hoặc incidentId vào URL bản đồ/routing. Cần Internet dù backend chạy Emulator. Local demo cho nhập tọa độ riêng từng bên (vĩ độ -85..85, kinh độ -180..180); heartbeat dùng tọa độ đã áp dụng, không dùng nội dung đang gõ dở. Bán kính dispatch 5km và phân quyền vị trí bệnh nhân giữ nguyên. Xem NAVIGATION.md về nguồn dữ liệu, giới hạn và phát hành.
