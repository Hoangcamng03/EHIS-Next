# Kiểm thử lại và so sánh hiệu suất sau đổi cấu trúc — 26/10/2026

## 1. Phạm vi và bản đối chứng

- Baseline: f921d33, trước khi chuyển mobile/web/functions sang frontend/app/frontend/web/backend; cùng bộ tính năng 0.4.7.
- Bản hiện tại: main/7c9154a khi bắt đầu vòng này. Không dùng bản UI 0.4.8 chưa nghiệm thu.
- Cùng máy, Node, Java, dependency/lockfile, schema và Firestore Rules. Dữ liệu giả, project demo-ehis-next, loopback; không đo tải hoặc ghi tài khoản lên cloud.
- Kiểm thử chức năng/type/lint, chín integration sau sửa, API/realtime, build và payload được ghi riêng. Emulator không chứng minh SLA, pin/FPS, GPS, loa/rung hoặc nhận nền trên Android thật.

## 2. Phương pháp được chốt trước khi đo

Backend dùng cùng HTTP callable wrapper như Vercel, qua hai process riêng kết nối cùng Emulator. Fixture dùng ID riêng và cùng kiểu dữ liệu; không sửa giới hạn bảo mật để làm đẹp kết quả.

`npm run perf:emulator -- --baseline ../ehis-next-baseline` yêu cầu checkout đối chứng đã cài dependency và build backend. Script tự khởi tạo Emulator riêng, từ chối dùng port đang có người chạy, không trỏ được sang cloud. Lịch baseline/current/current/baseline lặp hai lần cân bằng vị trí chạy; mỗi lượt bỏ một ca warmup rồi chạy sáu ca tuần tự và sáu ca đồng thời.

Tổng 96 ca đo + tám warmup. Đo p50/p95 cho gửi yêu cầu, bổ sung, nhận ca, đọc chi tiết, xác nhận đổi vị trí, đến nơi và kết thúc; thêm thời gian từ gửi đến snapshot lời mời bằng client SDK thật đã đăng nhập. Tốc độ mạng/bản đồ nhà cung cấp và phản ứng con người không nằm trong phép đo này.

Ngưỡng điều tra được chốt trước: p95 hiện tại vượt max(p95 baseline × 1.20, p95 baseline + 75 ms) thì đánh dấu RECHECK. Đây là ngưỡng phát hiện chậm lại trong thử nghiệm nhỏ, không phải chứng minh thống kê tương đương. Phải xem từng lượt và mức dao động, không lấy một lần nhanh nhất hoặc tăng ngưỡng sau khi nhìn số.

Build được so sánh sau warmup, chạy luân phiên và không chạy đồng thời benchmark API; báo trung vị và khoảng dao động. Payload dùng tổng byte/gzip của JavaScript tĩnh và kích thước Hermes/assets, tách khỏi thời gian cài dependency hoặc kiểm tra tài liệu.

Ngưỡng build: trung vị không vượt max(baseline × 1.20, baseline + 1 giây); payload không tăng quá 5%. Các số kích thước là tổng các chunk, không phải lượng tải của riêng lần mở màn đầu.

## 3. Kết quả

**Kết luận trong phạm vi đo:** việc sắp xếp thư mục không gây tăng dung lượng hoặc chậm đáng kể ở luồng tuần tự/build. Tuy nhiên cả baseline và bản trước tối ưu đều có độ trễ vài giây khi nhiều người cùng IP báo đồng thời. Đã sửa nguyên nhân tranh chấp counter giới hạn lượt gọi; phép đo lại đạt toàn bộ ngưỡng đã chốt. Đây là tối ưu backend bổ sung, không phải lợi ích tự động từ đổi tên thư mục.

### 3.1. Lỗi tái hiện và cách sửa

- Lượt đầu: 96 ca đo + tám warmup, trạng thái RECHECK; p95 thông báo burst khoảng tám giây ở cả hai bản. Thời gian retry dao động giữa các bước (nhận/đọc/đổi điểm), không kết luận một lần chậm do cấu trúc thư mục.
- Nguyên nhân: các API dùng chung transaction counter IP/phút; nhiều lượt cùng mạng gây tranh chấp Firestore. Thêm hàng đợi hữu hạn chỉ quanh transaction budget trong một process. Không xếp hàng toàn bộ nghiệp vụ, không cache quota, không đổi quyền hoặc giới hạn 120/UID, 30 create/UID, 600/IP.
- Năm unit test mới kiểm tra không chồng lấn, khóa độc lập, lỗi, giới hạn bộ nhớ/lượt chờ và thứ tự sau timeout. Bài hai process độc lập bắt đầu ở counter 598: tám lượt gọi, đúng hai được nhận, sáu bị từ chối, counter cuối 600. Quota chung vẫn do transaction quyết định.

### 3.2. Đo lại API và thông báo

Lượt xác nhận độc lập tiếp theo: 96 ca đo + tám warmup, tám vòng cân bằng, mỗi chỉ số/mode có 24 mẫu cho mỗi bản. Tổng hai lượt là 192 ca đo và 16 warmup. Bảng là **p95, mili giây**, từ bản đối chứng đến source đã tối ưu.

| Bước | Tuần tự: trước → sau | Sáu ca đồng thời: trước → sau |
| --- | ---: | ---: |
| Gửi yêu cầu | 145 → 137 | 7727 → 114 |
| Client TNV nhận snapshot lời mời | 155 → 141 | 7735 → 114 |
| Bổ sung tình trạng, không phone | 94 → 89 | 1985 → 70 |
| Nhận ca | 109 → 106 | 6329 → 80 |
| Đọc hồ sơ được cho phép | 148 → 148 | 6396 → 101 |
| Xác nhận đổi điểm | 88 → 85 | 3522 → 66 |
| Đến nơi | 92 → 80 | 85 → 100 |
| Kết thúc | 107 → 97 | 96 → 117 |

Đến nơi/kết thúc burst tăng 15/21 ms, vẫn trong ngưỡng điều tra đã chốt; không phải mọi thao tác đều nhanh hơn. Bốn vòng baseline mất 11,5–18,6 giây/12 ca, bốn vòng hiện tại 4,9–5,0 giây/12 ca. Thời gian này không tính chuẩn bị fixture và không tương đương thời gian đi cứu hộ. Lượt trước sửa và sau sửa đều được giữ trong [số liệu tổng hợp](verification/PERFORMANCE_2026_10_26.json).

### 3.3. Build và dung lượng

Ba mẫu đo cho mỗi bản/tác vụ, sau warmup, chạy luân phiên trên cùng máy. Backend đo lại sau tối ưu; web đo lại sau sửa ô phone.

| Chỉ số | Baseline | Hiện tại | Nhận xét |
| --- | ---: | ---: | --- |
| Backend build, trung vị | 1960 ms | 1946 ms | −0,7% |
| Web production build, trung vị | 4998 ms | 5064 ms | +1,3% |
| Android Hermes export, trung vị | 11778 ms | 11998 ms | +1,9% |
| Web JavaScript gzip, tổng chunk | 387135 byte | 387135 byte | Không tăng |
| App web JavaScript gzip, tổng chunk | 633611 byte | 633611 byte | Không tăng |
| Android Hermes bytecode | 5129250 byte | 5129250 byte | Không tăng |

Các chênh lệch build nhỏ không chứng minh nhanh/chậm về mặt thống kê; đều đạt ngưỡng. Tổng chunk không phải tải trang đầu; Hermes export không phải kích thước APK. Node local v24.21.0, Java 21; CI dùng Node 22. Không đổi dependency để đạt kết quả.

### 3.4. Hồi quy và giao diện

- Baseline và source trước sửa đều đạt 34 unit/logic và tám integration. Sau sửa: **39 unit/logic**, type/lint/build và **chín integration** đạt. Nhóm nhiều tài khoản/vùng: 14 nhóm, 215 tài khoản Auth giả, 179 lượt API sau sửa; số lượt API có thể dao động theo nhánh tranh ca.
- Browser thực: chọn vai trò/consent đăng ký → tự mở Patient → lưu hồ sơ không phone → tạo/thu hồi QR → TNV nộp đơn → admin duyệt → bật sẵn sàng bằng điểm giả → người báo gửi/ack → bảng hỏi không phone → cảnh báo đỏ/cập nhật mới → nhận → hồ sơ theo consent và bản đồ có chỉ đường → đến → kết thúc. Đăng nhập sai, tự định tuyến vai trò, TNV pending và QR thu hồi đều kiểm tra nhánh từ chối.
- Đã thấy bản đồ nhúng, điểm A/B, tuyến 0,78 km và danh sách rẽ với tọa độ giả. Không bật GPS thật. Sau đóng ca, profile/map riêng biến mất; reporter khóa câu hỏi/gửi. Phát hiện ô phone còn nhập được khi ca đóng: sửa dùng cùng điều kiện busy/canSend và tải lại production web xác nhận disabled.
- Patient và TNV kiểm tra ở viewport 390 px: scrollWidth bằng clientWidth 390; reporter viewport 390, clientWidth/scrollWidth 375 do thanh cuộn. Không tràn ngang ở các màn đã đo. Tuyến đang hoạt động kiểm tra desktop 1280 px; chưa khẳng định mọi màn/cỡ chữ/thiết bị đều đạt. Tab reporter và TNV hẹp không có console error ở lần đọc cuối.

[Cảnh báo khẩn](../assets/perf-20261026/volunteer-alert.jpg) · [Bổ sung và trạng thái đến nơi](../assets/perf-20261026/reporter-supplement.jpg) · [TNV màn hẹp](../assets/perf-20261026/volunteer-phone.jpg) · [Biểu mẫu ca đóng](../assets/perf-20261026/closed-case.jpg). Chỉ dữ liệu giả, không có mật khẩu. Ảnh app chỉ chụp vùng màn hình đang thấy, không coi là bằng chứng chụp toàn bộ vùng cuộn React Native.

### 3.5. Bàn giao và giới hạn

Mã đo dựa HEAD 7c9154a cộng thay đổi trong phiên; JSON ghi rõ base và hash source backend, không giả nhận đã đo trên commit chưa tồn tại. Raw log/fixture ở .local/performance, bị Git bỏ qua. Source hoàn thiện đưa lên main; chưa deploy backend/Hosting, chưa tạo APK/OTA mới, cloud và APK bàn giao vẫn 0.4.7.

Chưa đo cold start Vercel, quota/latency cloud, 4G/5G/mạng yếu, Android thật/loa/rung/GPS/nhận nền hoặc tải nhiều instance lớn. Hàng đợi cục bộ không loại tranh chấp giữa các instance; bài hai process chứng minh tính đúng quota, không chứng minh SLA. Tiếp tục theo phiếu Android và nghiệm thu thành viên độc lập, giữ Issue hiệu suất cloud/thiết bị mở. Không coi kết quả này là đủ điều kiện cấp cứu thật.

## 4. Khi cần sửa

Tái hiện bằng cùng lịch chạy, tìm nơi gây chờ/retry, sửa nguyên nhân, giữ nguyên auth/quyền/giới hạn và chạy lại hồi quy. Lỗi bộ đo phải được ghi riêng với lỗi ứng dụng. Mọi thay đổi và trường hợp chưa thử nằm tại [LAB_NOTES](../LAB_NOTES.md); [flow nghiệm thu](ACCEPTANCE_FLOW.md).
