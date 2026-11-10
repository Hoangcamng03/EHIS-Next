# Kiểm thử EHIS kết hợp hai Android — 08/11/2026

**Chưa nghiệm thu toàn bộ; cập nhật10/11: vòng APK19 tại chỗ đã hoàn thành; còn thiếu các bài mở bên dưới.** S22+ SM-S906E/Android16 hiện cài0.4.19/code17; các kết quả GPS dưới đây thuộc18. GPS đứng yên, tắt/bật, Home/mở lại và nhận bản tình trạng mới đã đạt ở lượt thử này. Lỗi bố cục, tự thoát gián đoạn và CI còn cần xử lý. Kết quả16/17 bên dưới giữ nguyên theo phiên bản. [Số liệu gốc](ACCEPTANCE_ANDROID_2026_11_08.json) · [Trạng thái phát hành](../../STATUS.md).

### Tiếp tục10/11 — vòng APK19 tại chỗ hoàn thành (11:16 Việt Nam)

- Kết nối USB trở lại03:55:39UTC. Bật Sẵn sàng native03:55:55; có một lần mất foreground ngay sau bấm, không có crash marker Java/native riêng lúc03:56:07. Chưa xác định nguyên nhân, không đổi lỗi tự thoát thành PASS.
- Tạo3ca E/D/A mới qua Auth/API thật03:56:50, chỉ V2 đủ điều kiện ở vùng kiểm tra; người báo/triệu chứng/đích11/111/333m là giả lập, không phải3máy thật. Ảnh03:57:05 hiện3ca với khoảng cách11/111/334m. Nhận E trên APK19 lúc03:57:31.
- Hai lần thử nhận thêm D/A thực tế bị400; xem riêng D/A bị403, assignment E không đổi. Gửi report2 lúc03:57:58; màn app hiện bản2 và server xác nhận loadedRevision2. Không tự gọi APIack; không lấy khoảng chờ công cụ/duyệt quyền làm latency hệ thống.
- GPS thật tại chỗ: ảnh04:03:43 hiển thị fix1s/±35m,04:06:11 fix1s/±12m; map có A/B/polyline/ETA. Đích là giả lập, chưa đo đi bộ/độ chính xác so chuẩn. Hồ sơ E không chia sẻ được app ghi rõ, không hiện bệnh án.
- Ba lượt bảo vệ vùng chữ từ chối bấm khi ảnh/nút thay đổi; UIAutomator FAIL không lấy được idle, không dùng XML cũ. Helper định vị lại chữ có lỗi cú pháp ở lượt kiểm tra đầu, sửa cú pháp nhưng vẫn từ chối match, không bấm. Xem lại thấy ảnh chụp ngay sau swipe có thể còn quán tính; thêm chờ1600ms trong helper chụp riêng (không sửa runtime app). Sau đó guard pixel gốc bấm đúng. Đây là bằng chứng hỗ trợ giả thuyết quán tính, chưa giải thích mọi lỗi bố cục trước đó.
- Hộp thoại Đã đến nơi mở04:14:08, Quay lại04:14:29; server vẫn accepted, không giả đã đến. Hoàn tất mở04:15:04/Quay lại04:15:25, server vẫn accepted. Mở lại04:15:48/Xác nhận04:16:06 bằng native; server04:16:15 completed/no active. API chi tiết E sau đóng bị403. PASS đúng các thao tác này; không thử xác nhận arrival vì không đi bộ.
- D/A còn chờ được hủy qua tài khoản bệnh nhân sở hữu04:16:16; guard04:16:17 OFF/no active; ảnh04:16:43 về giao diện Chưa sẵn sàng. Crash buffer riêng04:16:50 không marker Java/native, không chứng minh hết crash gián đoạn. Bằng chứng hash ảnh private và kết quả đưa vào báo cáo MD/JSON; không đăng ảnh chứa tọa độ/thông báo cá nhân.
- Không đổi source runtime, không tạo APK mới/OTA/deploy frontend. APK19 vẫn là bản máy thử riêng; shared web/trang tải vẫn16. Còn thiếu: offline mạng độc lập, đi bộ GPS, nhiều máy/hãng/chế độ âm, nguyên nhân tự thoát; Functions p95RECHECK và dependency advisory giữ nguyên.

## 2026-11-10 — APK19 đã cài; dừng kiểm thử theo yêu cầu chủ máy

- APK0.4.19/code17 đã cài đè trên S22+, hoàn thành09/11 17:13:04UTC (10/11 00:13 Việt Nam), giữ đăng nhập; SHA256 `bb85c5dc57a5aadff114fde10fd92ad46418c1926ef2b3e3aca4699bc7e65022`. Build69de4982, sourcef9f015c. Đây là cài máy thử riêng; web/trang tải chung vẫn16, không OTA.
- Ba người báo/tọa độ/tình trạng được giả lập theo yêu cầu; gửi qua Auth/API/Firestore thật. S22+ thực sự hiện ba ca chờ ở ảnh09/11 17:16:40UTC; chủ máy xác nhận có chuông và rung. Không coi là ba điện thoại thật, ca bệnh thật, hay bằng chứng chuông mọi chế độ.
- Chủ máy yêu cầu dừng nếu phần còn lại không nhanh để chiều thử với nhóm. Kiểm tra10/11 03:49:31UTC: không có ca đang nhận; cả ba ca giả lập19 đã expired, không còn lời mời. Tắt Sẵn sàng qua API chuẩn03:50:06UTC; kiểm tra độc lập03:50:07UTC xác nhận OFF/no active. Không sửa thời gian hết hạn, không đóng ca người khác.
- Chưa thử trên19: nhận ca/chặn ca thứ hai, cập nhật tình trạng, hủy/xác nhận Modal Đã đến nơi và Hoàn tất. Các kết quả bản trước giữ nguyên, không suy thành PASS19. Tự thoát/cuộn dịch chuyển còn OPEN; offline độc lập, đi bộ GPS và tải cloud còn thiếu. Đã dừng, không chạy nền tiếp; ước tính phần thử19 còn20–30phút khi kết nối máy sẵn sàng, chưa bao gồm sửa lỗi mới.

## Bổ sung19 — bằng chứng trước khi cài máy (lịch sử)

- Source19 có85test và build web PASS, CI f9f015c SUCCESS42650746613. Đổi xác nhận sang Modal cố định và thêm xác nhận Đã đến nơi để giảm nguy cơ bấm nhầm; chưa coi hộp thoại19 đạt trên máy.
- Sau sửa retry, integration local đủ16suite PASS352817ms; multi15/15 với222Auth/201API. CI72a186a SUCCESS42648750261, giữ CIba90FAIL.
- Portable-scale mới PASS:1000Auth/128session/32SDKfeed/32ca/8vùng/320API/40từchối/0retry;p50=763ms,p95=1240ms,max1274ms. Không phải tải cloud/1000điện thoại; không có paired benchmark để nói mọi API nhanh hơn lượt cũ933ms. Functions-scale mới vẫn FAIL/RECHECK:p95=21866ms>15000ms dù8giaiđoạn chức năng đạt.
- Deploy-1 READY nhưng cloudprobe-2 FAIL vì health literal16. Sửa lấy phiên bản từpackage; health-integration-1 FAIL whitelist launcher, lượt2 PASS50178ms. CIa9134eb SUCCESS42654274756; deploy-2 PASS30887ms,cloudprobe-3 PASS2572ms đúng19/project/401. Không bỏ qua probe để nói deployREADY là đúngversion.
- Cloud thật16:31:57–16:32:02UTC:8/8request trùng thành công, chỉ1incident; payload khác bị400. Thời gian từngrequest đo được [2434,1145,3564,1146,2356,2806,3259,3738]ms. Dùng reporter/patient/vị trí giả lập biệt lập, không mời TNV; ca đã hủy bằng tài khoản bệnh nhân. Không coi8request là benchmark sức tải cloud.
- Tại mốc ghi trước khi cài: EAS19/code17 build69de4982 từf9f015c đang xử lý, máy vẫn18; trạng thái mới xem mục10/11 phía trên; backend19, web/trang tải chung16, không OTA. Các mốc16/17/18 bên dưới là lịch sử, không ghi đè thất bại.

## Bằng chứng APK18 trên S22+

| Bài thật | Kết quả | Giới hạn |
| --- | --- | --- |
| Artifact và cài đè | PASS,18/code16; kết thúc15:17:22UTC09/11; giữ đăng nhập |102722361bytes; SHA256 `68c984c2039717a597706a4fb1c2a034cb7487d9d6ce05386a16476b21440d61`; build c774063a, sourceba90a0a; không OTA |
| Người báo/điểm bệnh nhân | Giả lập được người dùng yêu cầu; Auth/API cloud thực | Điểm tổng hợp khoảng11m từ GPS Sẵn sàng, không coi là vị trí người báo thật hoặc độ chính xác GPS |
| Nhận ca và GPS tại chỗ | PASS native; nhận15:23:05; ảnh15:23:43 GPS0s/±13m,15:27:27 GPS1s/±13m | Sai số do cảm biến báo; không đo so mốc chuẩn hoặc đi bộ |
| Tuyến đường | PASS hiển thị marker A/B, polyline và thông tin tuyến | Tới đích giả lập gần, không đánh giá tuyến xa/giao thông/thời gian đến thực |
| Tắt/bật GPS | PASS OFF15:28:38,ON15:29:03; ảnh15:29:09 GPS0s/±47m | Một lượt, không bao gồm từ chối quyền/tắt GPS hệ thống |
| Home/mở lại | PASS Home15:29:40, mở15:29:48; ảnh15:29:49 GPS0s/±14m | Không khóa/PIN/Doze; không chứng minh chuông nền18 |
| Tình trạng mới | PASS report1→2, loaded2 tự từ app, server15:27:43 | Quan sát giả lập, không phải triệu chứng thật; không giả APIack |
| Theo dõi tự thoát |40mẫu15:24:31–15:26:00,0mất process/focus | Vẫn OPEN lỗi gián đoạn; không kết luận mọi điều kiện ổn |
| Hoàn tất native | Chưa đạt: bố cục/cuộn đổi giữa ảnh/lượt bấm; chủ máy nói không ai chạm | Có bấm lệch Đã đến nơi trên ca giả lập; không tính arrivalPASS. Guard đối chiếu ảnh mới đã từ chối mục tiêu thay đổi. Dọn đúng ca qua API15:39:42, OFF/no active15:39:43 |
| CI18 | FAIL thực ở integration RETRY-8,14/15multi-scenarios;222Auth/197API | Firestore ABORTED lock timeout; check/export/build đạt, scale chưa chạy. Source sửa gộp duplicate đang kiểm thử; không hạ bài test |

Ở thời điểm kết thúc lượt APK18, web/backend/trang tải chung còn16; backend19 được triển khai ở mốc sau phía trên. Chỉ S22+ nhận18 để thử. Raw screenshot/log giữ riêng tư; JSON công khai chứa hash và số liệu đã tách thông tin cá nhân.

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
