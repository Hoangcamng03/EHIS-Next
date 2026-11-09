# Kiểm thử EHIS kết hợp hai Android — 08/11/2026

**Chưa nghiệm thu toàn bộ; bổ sung09/11.** S22+ SM-S906E/Android16 đã cài0.4.17/code15, GPS trực tiếp vẫn chưa đạt. Source18/code16 đang sửa bước khởi động, chưa có bằng chứng thiết bị cho18. Kết quả16 bên dưới giữ nguyên theo phiên bản. [Số liệu gốc](ACCEPTANCE_ANDROID_2026_11_08.json) · [Trạng thái phát hành](../../STATUS.md).

## Bổ sung09/11 — APK17 và ứng viên18

- APK17 cài đè thành công08/11 17:03:43UTC, giữ đăng nhập; SHA256 `b832508172a57bf0d2fc4fd1660e54758892de1928306310c27cbbe542bf818a`. CI42502290040 đạt, không đồng nghĩa GPS đạt.
- GPS17 **FAIL**: nhiều ảnh foreground chưa có fix; thao tác native tắt/bật13:56:51/13:57:15UTC09/11 và chờ hơn40giây vẫn chưa có timeout/retry. Đã xác nhận switch thực sự OFF rồi ON. Không nới ngưỡng100m/15giây.
- D ở vị trí khác thực tế cách S22+ khoảng18,3km, chủ máy xác nhận: không mời đúng bán kính5km. D hủy bằng tài khoản bệnh nhân. C đóng bằng API dọn diễn tập. E hoàn tất bằng nút native + Xác nhận14:09:09UTC09/11; Firebase14:09:19 xác nhận TNV OFF/không active. Không đánh dấu đã đến nơi hay chữa trị.
- Tự về Home **OPEN**:40mẫu trong90giây08/11 không mất process/focus; Android09/11 có LOW_MEMORY20:42:40VN ở nền. Chưa đủ chứng minh nguyên nhân lần tự thoát đang mở app. Log CookieManager about:blank không được quy thành crash.
- Ứng viên18: kiểm tra quyền hiện có trước khi request, timeout phủ cả permission/services và trạng thái khởi động ngắn. Unit9/9; full check-5 **79/79** (22backend+57logic),49614ms. Build-3 **FAIL** EPERM tạo thư mục Next; chạy lại đúng quyền build-4 **PASS**34043ms, không sửa ngưỡng hoặc bỏ bài lỗi.
- Web/backend/trang tải vẫn16, không OTA/deploy. APK18 chưa build/cài lúc ghi mục này. Mọi ảnh/log chứa dữ liệu vị trí giữ riêng tư. Giữ sáng USB tạm đã khôi phục0 lúc13:50:42UTC.

## 1. Điều kiện và cách ghi nhận

- Hai điện thoại: S22+ TNV qua USB; Android thứ hai do chủ dự án thao tác web người báo. Không đi bộ; không giả GPS của hai điện thoại. Hồ sơ A/B/C là dữ liệu diễn tập được tạo thật qua Auth/API; không dùng bệnh án thật.
- `PASS` chỉ cho đúng bài đã chạy. Tách xác nhận của người nghe, ảnh Android, trạng thái Firestore, API cloud và Emulator. FCM chấp nhận gửi, CI xanh hoặc bản đồ có điểm đánh dấu không chứng minh điện thoại nhận chuông hay GPS cập nhật.
- Thời gian API là thời gian request quan sát trên máy tính. Thời gian chờ công cụ/chat không phải độ trễ app. Không đo được độ trễ chính xác từ máy người báo đến tiếng chuông.
- Vị trí/QR/mật khẩu/số liên hệ/log thô và ảnh bản đồ chỉ giữ local riêng tư; JSON công khai có hash ảnh, không có tọa độ hoặc khóa. Không sửa ca P1 cũ đang tồn tại của nhóm.

## 2. Kết quả phần mềm và cloud

| Bài | Kết quả thật | Giới hạn |
| --- | --- | --- |
| Kiểm tra đầu phiên | PASS 22 backend + 52 logic, UTF-8/lint/type/path | Source `d5a46dc` sạch; không phải thử native |
| Tích hợp đầy đủ | PASS; 266949ms toàn lệnh | Auth/Firestore/Functions Emulator, dữ liệu tổng hợp |
| Tải portable (lớp HTTP dùng cho Vercel) | PASS: 1000 tài khoản, 128 phiên, 32 SDK feeds, 32 ca/8 vùng, 320 API, 40 từ chối dự kiến, 0 retry; cảnh báo p50 560ms/p95 933ms | Cục bộ, không phải 1000 người hay 32 điện thoại; không phải đo tải cloud |
| Tải Functions Emulator | **RECHECK / lệnh FAIL**; chức năng 8 giai đoạn đạt, cảnh báo p95 15744ms > ngưỡng15000ms | Giữ nguyên thất bại; không hạ ngưỡng. Không phải backend Functions đã deploy, dự án hiện dùng Spark/Vercel |
| Cloud health/project/không đăng nhập | PASS | Không thay bài phân quyền đầy đủ |
| Cloud workflow | PASS, 48402ms: xác minh hai bước, hai ca/bật muộn/chặn bận, consent, report, ETA, bàn giao/thu hồi quyền | Actor API và vị trí tổng hợp biệt lập; không phải hành trình hoặc chuyên môn y tế thật. Đã thu hồi admin/referrer tạm, đình chỉ TNV fixture |
| Build lại 0.4.16 và ứng viên0.4.17 | PASS | Chưa đồng nghĩa deploy/cài APK mới |
| Đối chiếu tệp sau rebuild | **FAIL so byte với bản đã deploy**; tìm thấy Next build ID khác nhau | Không bỏ qua verifier. Rebuild tạo build ID mới; mã build mới chưa được deploy nên đường dẫn manifest mới trả404. Cần đối chiếu lại đúng artifact sau lần deploy tiếp theo |
| Audit thư viện | Backend0; app12 moderate; web8 moderate; high/critical0 theo npm audit tại thời điểm chạy | Số entry báo cáo, có thể cùng nguồn phụ thuộc; không phải 20 CVE độc lập. Không chạy `audit fix --force` hoặc hạ Expo58 thành52 |
| Hồi quy sau sửa GPS | PASS 22 backend +55 logic; thêm3 bài mock GPS lifecycle | Test adapter/đồng hồ kiểm soát của unit test được ghi rõ; không gọi đó là số đo GPS thật |

## 3. Luồng hai điện thoại

| Bài | Kết quả | Bằng chứng/nhận xét |
| --- | --- | --- |
| Mở thẻ A trên máy báo | PASS người dùng xác nhận | Xem thẻ chưa tạo yêu cầu |
| Bật Sẵn sàng | PASS | Bấm switch native, Firebase ON/GPS thật; tọa độ không công khai |
| Gửi A → cảnh báo S22+ | PASS | Popup đỏ native; chủ máy xác nhận tiếng/rung |
| Hai ca A/B cùng chờ | PASS | Firebase2 lời mời và ảnh chọn2ca. Khoảng36/37m là đường thẳng từ GPS lúc mời, không phải đo độ chính xác hay quãng đường đã đi |
| Nhận B/chặn A | PASS | Native nhận B; API nhận thêm A trả400; riêng tư A/admin trả403; B giữ nguyên assignment |
| Bảng hỏi và biên nhận | PASS | B revision1→2; cập nhật sau đến6, native hiển thị và tự ack đúng revision; không gửi ack giả qua API |
| Khóa S22+ → cập nhật B | PASS theo xác nhận chủ máy | Có thông báo/chuông/rung; thông báo không tự mở app. Chủ máy chạm thông báo và xác nhận mở đúng B, revision4 được tải |
| Mất mạng/khôi phục | **PARTIAL/BLOCKED điều kiện** | Ảnh22:54 VN thấy màn chờ xác nhận kết nối; chủ máy bật lại mạng vì laptop cũng bị ảnh hưởng. Sau đó app tải revision6. Chưa chốt thời gian offline độc lập hoặc mọi trường hợp gửi lặp |
| ETA và cảnh báo trễ | PASS tại chỗ | Native nhập/xác nhận1phút15:50:43.986Z; ảnh16:05:33.707Z đã cảnh báo trễ; ca vẫn có người phụ trách. Không phải thật sự lên đường/đến bệnh nhân |
| Map/GPS trực tiếp | **FAIL trên0.4.16 ở điều kiện thử** | Tile/marker đã tải nhưng GPS vẫn chờ tại nhiều ảnh. Chưa đủ dữ liệu khẳng định mọi lỗi do cảm biến hay mọi môi trường trong nhà; không sửa bằng nới độ mới/độ chính xác |
| Hoàn tất B | PASS | Chủ máy hoàn tất diễn tập; Firestore completed, bỏ active pointer, OFF. Không ghi đã đến nơi giả |
| C được báo trước khi TNV ON | PASS | Trước ON: invited0. Sau switch thật: C được mời; popup native và chủ máy xác nhận có chuông/rung |
| C không chia sẻ bệnh án | PASS; đóng ca còn chờ | API patientProfile=null; ảnh native16:31:40.393Z thấy “Bệnh nhân không chia sẻ hồ sơ sức khỏe”; B đã đóng trả403 |
| App tự thoát khi xem C | **OPEN — ưu tiên cao** | Chủ máy báo app tự out. Chưa có crash riêng EHIS trong crash buffer; exit history mới nhất16:20:50Z ghi remove-task, không đủ giải thích báo cáo sau đó. 8 mẫu16:30:41–16:30:57Z tiến trình/focus/resumed đều còn EHIS; chưa tái hiện lượt tự thoát trong cửa sổ này. Không được coi đã sửa hoặc bác bỏ phản ánh chỉ vì chưa bắt được log |

## 4. Điểm cần cải thiện và bản sửa

1. **Cao — GPS đứng yên:** bộ theo dõi cũ lọc di chuyển3m trong khi điểm chỉ dùng được15giây. SDK58 mô tả distanceInterval là khoảng di chuyển tối thiểu trước khi nhận cập nhật; bộ lọc có thể làm thiếu điểm mới khi đứng yên. Source đổi sang khoảng cách0, vẫn tối thiểu3giây trên Android, foreground only, giữ chặn >100m/điểm cũ. Thêm timeout thông báo15giây, thử lại GPS và ghi rõ markerA cũ. Đây là giả thuyết sửa có cơ sở; cần thử APK mới để xác nhận nguyên nhân trên máy. [Tài liệu Expo58](https://docs.expo.dev/versions/v58.0.0/sdk/location/).
2. **Trung bình — mất kết nối khó hiểu:** màn “Đang xác nhận quyền” có thể trống lâu. Source thêm thông báo mạng/thông tin riêng tạm ẩn và nút kiểm tra lại; lỗi listener thu hồi approved cục bộ. Không cho dữ liệu cache tự cấp quyền nhận ca.
3. **Trung bình — màn ca dài:** ở cài đặt hiện tại của S22+, cần cuộn qua nhiều phần để tới map/hoàn tất. Chưa có chữ lỗi rõ trong ảnh, chưa kiểm tra mọi mức phóng chữ. Nên gom thông tin phụ và đặt lối tắt map/progress sau khi xác minh GPS; không giảm chữ bằng cách vô hiệu hóa trợ năng.
4. **Trung bình — thao tác bảng hỏi:** A đã gọi hỗ trợ nhưng reportRevision0; B có gửi và cập nhật được. Không quy vội là lỗi lưu. Cần test hiểu hướng dẫn với thành viên mới; phân biệt “đã gọi hỗ trợ” và “đã gửi tình trạng”.
5. **Trung bình — audit/tải chưa đạt:** giữ hồ sơ cảnh báo phụ thuộc và Functions RECHECK, xử lý có review; không hạ tiêu chí để đẹp số. Tải lớn cloud không thực hiện trên tài nguyên miễn phí dùng chung trong buổi này.

## 5. Chưa thử hoặc cần phiên riêng

- Đi bộ thật, nhiều địa điểm thật, độ chính xác so mốc chuẩn, chuyển tuyến theo di chuyển và chất lượng GPS ngoài trời. Hôm nay chủ máy chỉ thử tại chỗ.
- Mất mạng S22+ với laptop dùng đường truyền độc lập; gửi lặp khi mất ACK; khôi phục sau nhiều phút.
- Im lặng/Rung, Media0, DND, Bluetooth, Doze/pin/đóng cưỡng bức; không suy từ một bài khóa máy sang mọi trạng thái.
- Native Patient/đăng ký mới, UI quản trị/người giới thiệu, nhiều hãng Android, trợ năng và iOS native chưa được nghiệm thu máy thật trong phiên này.
- Ca C phải được hoàn tất và V2 OFF/no active trước cài bản sửa. Không thay link tải hoặc gọi17 đã cài khi chưa có artifact và xác minh trên máy.

**Đánh giá:** điều phối hai ca, chặn bận, cập nhật tình trạng và thông báo khóa đã có bằng chứng thực hữu ích cho midterm. GPS trực tiếp, phản ánh app tự thoát và bài offline độc lập còn là điều kiện chặn nghiệm thu toàn bộ. Chưa đủ cơ sở vận hành cấp cứu thật hoặc cam kết không lỗi.
