# EHIS — đánh giá toàn diện ngày 07/11/2026

## 1. Kết luận và phạm vi bằng chứng

EHIS là MVP có luồng chính rõ: chủ thẻ → người báo → TNV → nhận ca → chỉ đường → kết thúc. Có cơ sở để chuẩn bị demo và diễn tập phần mềm có kiểm soát. Chưa đủ điều kiện tiếp nhận cấp cứu thật. Khoảng thiếu lớn nhất nằm ở bảo đảm tiếp nhận, xử lý ngoại lệ, vận hành con người và bằng chứng điện thoại; giao diện đẹp hơn không tự giải quyết các khoảng thiếu này.

- Mã rà: main `8298bdfd0b9d1d22d355e9fd1ed6e544e32e3e3a`, runtime `359427b2676a1d4d5fcfc27619436653795cd8c7`. Đã đối chiếu remote main; branch chưa được bảo vệ tại lúc đọc. Không tự thay cài đặt bảo vệ.
- Xem web thật: trang giới thiệu, TNV OFF, chọn đối tượng, đăng nhập Patient giả và tự chuyển vai, QR/hồ sơ, bước báo hỗ trợ, liên kết ca không tồn tại, cửa vào admin/người giới thiệu và trang cài.
- Không tạo ca mới, gửi push, sửa bệnh án, bật GPS thật hoặc duyệt người thật trong phiên review. Phiên Patient thử đã đăng xuất.
- Yêu cầu viewport390×844 không có hiệu lực: thực tế vẫn1280×720. Không coi ảnh này là kiểm thử màn điện thoại. API chụp full-page lỗi; cách chụp viewport hoạt động. Lỗi clipboard nhập tự động được thử lại theo trạng thái UI, không gán thành lỗi đăng nhập app.
- 67 test/14 suites, 32 ca/320 API và p95 lời mời925 ms là bằng chứng ngày05/11 trong [báo cáo0.4.13](VERIFICATION_V0_4_13.md); không chạy lại toàn bộ trong phiên review07/11 và không lấy làm độ trễ GPS/FCM/cloud.
- Các phát hiện từ mã được ghi là suy luận có căn cứ; không ghi là lỗi đã tái hiện trên thiết bị nếu chưa thử.

## 2. Tình trạng phát hành đã kiểm tra mới

| Lớp | Kết quả ngày07/11 | Giới hạn |
| --- | --- | --- |
| App web | Giao diện hiển thị0.4.13, Patient tự mở đúng khu vực | Browser desktop; không phải native |
| Trang cài | Vẫn dẫn APK0.4.12 | Chưa đồng bộ link với artifact mới |
| APK0.4.13/code11 | EAS FINISHED; verifier cấu trúc PASS | Chưa thử chữ ký/cài đặt/Play Protect/điện thoại |
| iOS | Trang cài hướng dẫn dùng web trên màn hình chính; chưa TestFlight/IPA | Không có kiểm thử iPhone trong phiên này |
| Backend health | Cloud probe mới PASS: health/version/project đúng và yêu cầu không đăng nhập bị từ chối | Công cụ web không đọc được endpoint nhưng helper chính thức của repo đã kiểm tra thành công; không chạy lại full lifecycle/load cloud |

APK: build `97330def-c292-4f69-b20c-b146f3fe520b`, source359427b, package `com.hoangcamng.ehisnext`, **102897757 bytes**, SHA256 `92c907a8e6bc54c4abde18a445219bac8c23b1cfdf15526b0d9e479c0d651cf3`.

Verifier xác nhận version/code, target cloud, tone nhúng/tài nguyên notification, quyền rung và không có quyền microphone. Không coi verifier là kiểm tra ký mật mã hoặc quan sát máy đã reo. [Build](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/97330def-c292-4f69-b20c-b146f3fe520b) · [Artifact mới](https://expo.dev/artifacts/eas/SXu3BGlLoXC4Vfz8fFmiJgxliE4CWxqUF_WHVuudrgQ.apk). Phiên review chỉ xác minh artifact, không thay link Hosting, phát OTA hoặc cài máy.

Audit dependency thực ngày07/11: app12 moderate, web8 moderate, backend0; không có high/critical được npm báo tại thời điểm kiểm tra. Đây là số package bị đánh dấu, không phải20 lỗ hổng độc lập hoặc bằng chứng app an toàn hoàn toàn. Audit app/web exit1 vì còn advisory; backend exit0. Số thấp hơn báo cáo trước không được quy thành kết quả sửa mã vì phiên này không nâng dependency; danh mục advisory có thể đổi. Giữ kết quả và logs tại `.local/review-2026-11-07/network-retry.json`.

## 3. Những thiết kế nên giữ

1. Một app cho Patient/TNV, website người báo không buộc đăng nhập; lựa chọn khi đăng ký được lưu để điều hướng lần sau.
2. Chọn đối tượng không tự cấp quyền TNV; có người quản lý đơn vị, checklist và admin duyệt cuối. Trang người giới thiệu có đăng ký và gửi email xác minh riêng.
3. Người báo gửi yêu cầu trước, bảng hỏi sau backend xác nhận; không chờ TNV bấm nhận. Phone tùy chọn, ba câu có Chưa rõ, câu chữ dựa trên quan sát.
4. QR chứa mã liên kết, không chứa bệnh án; hồ sơ/phone/vị trí chi tiết kiểm tra quyền qua backend; push không đưa bệnh án/phone/GPS ra màn hình khóa.
5. Nhận ca bằng transaction; một ca/TNV, một TNV thắng khi tranh nhận; request/submission ID hỗ trợ retry không tạo lặp. Không nới các điều kiện này để làm demo dễ hơn.
6. Có trạng thái OFF/ON/GPS quá hạn, mất đồng bộ, ca nhận/đến/đóng; vị trí bệnh nhân chỉ đổi khi người báo xác nhận, không tự chạy theo người qua đường.
7. Màu Patient xanh dương, TNV xanh lục, người báo cam, admin tím và cảnh báo đỏ khá dễ phân biệt. Có chữ và công tắc đi kèm, không chỉ dựa màu.
8. Cấu trúc main theo frontend/app, frontend/web, backend, docs, scripts đã dễ tìm; có CI, lockfile, API contract, lab note và bằng chứng phân lớp. Không cần đổi framework hoặc sắp xếp lại thư mục trước midterm.

## 4. Giao diện và trải nghiệm theo từng vai trò

### Đăng ký / đăng nhập

Đạt về định hướng: hai thẻ lựa chọn có giải thích ngắn, chờ duyệt được nói rõ; có quên/hiện mật khẩu. Body16px, caption14px, vùng nút tối thiểu48px trong source là nền tảng hợp lý. Không khuyến nghị thu nhỏ toàn bộ chữ để giao diện trông gọn.

Cần cải thiện: hành động chính nổi bật hơn hành động phụ; Hiện mật khẩu không cần chiếm ưu tiên như Đăng nhập. Lỗi cần đặt sát trường sai; kiểm thử bàn phím che nút, nút Back, email autofill, cỡ chữ200%, TalkBack và máy nhỏ. Tài khoản chọn đối tượng hiện cố định; chọn nhầm sau khi tạo chưa có luồng sửa. TNV muốn có QR của bản thân cũng chưa có đường dùng cả hai mục đích bằng cùng tài khoản; đây là quyết định sản phẩm, không được nhầm với tự cấp quyền TNV.

### Patient / chủ thẻ

QR được đặt trước hồ sơ sau khi tạo, trạng thái hoạt động rõ; hồ sơ chưa lưu không bị trình bày thành đã lưu. Tên/quan hệ/phone liên hệ đủ bộ hoặc để trống, dị ứng trống được hiển thị Chưa khai báo là đúng hướng.

Cần bổ sung: tải/chia sẻ/in QR có bố cục chuẩn; lần cập nhật hồ sơ gần nhất và nhắc rà lại; thông báo rõ đổi QR phải thay bản in. Hiện hồ sơ chỉ có tên, dị ứng và liên hệ, chưa phải bệnh án đầy đủ. Không thu thêm hàng loạt dữ liệu sức khỏe trước khi đối tác xác định bộ tối thiểu cần dùng.

Consent hiện gắn với card: muốn đổi chia sẻ phải thu hồi/cấp lại, ca active lại chặn thu hồi. Cần thiết kế riêng thay đổi quyền chia sẻ và hiệu lực trong ca đang diễn ra; đây là hạn chế quyền kiểm soát dữ liệu, chưa kết luận pháp lý. Không tự cắt thông tin giữa ca khi chưa thống nhất SOP.

### Người qua đường

Điểm tốt: không có bức tường đăng nhập; xác nhận đứng cạnh bệnh nhân; gửi trước hỏi sau; phone/mốc tìm tùy chọn. Ba câu không thể xác định chính xác bệnh hay thay người chuyên môn, chỉ giúp TNV có quan sát ban đầu.

Chưa tốt: tiêu đề/mở đầu dài đẩy nút gửi xuống; tất cả lựa chọn câu2/3 tạo trang dài; thông tin lỗi và thành công ở cuối form dễ bị bỏ qua. Cần gọn đầu trang, nút chính luôn dễ tìm, trạng thái Gửi/Chưa ai nhận/Đã có người nhận rõ. Không dùng đỏ cho mọi nội dung hướng dẫn.

**Đã quan sát trực tiếp:** mở một ID đúng định dạng nhưng không tồn tại vẫn hiển thị cả bảng hỏi bị khóa; thông báo Không tìm thấy yêu cầu nằm dưới form. Nên trả màn phục hồi riêng phía trên, hướng dẫn dùng đúng trình duyệt hoặc quét lại; không tự tạo ca mới.

Reload trang làm answers/phone trong form về rỗng. Note đã có được giữ nếu không chỉnh ô mới, nhưng người báo chưa thấy lại nội dung note. Lần gửi tiếp có thể xóa phone hoặc đổi quan sát vì người dùng không biết bản cũ. Cần trả snapshot tối thiểu cho đúng phiên sở hữu hoặc ghi rõ đây là bản cập nhật mới và chỉ thay trường đã chỉnh; thêm test retry/reload, không lưu PHI tùy tiện vào localStorage.

GPS người báo yêu cầu fix mới<=15s, sai số<=100m, timeout15s; API tạo ca timeout20s và bước Auth chạy trước. Vì vậy số925ms của bài tải không phải thời gian từ quét QR tới có người nhận. Trong nhà/GPS yếu có thể bị chặn hoàn toàn, chưa có điểm ghim xác nhận trên cloud. Cần quyết định cách dùng điểm gần đúng + sai số/mốc tìm hoặc điểm chọn bằng tay, đánh dấu rõ nguồn; không âm thầm dùng vị trí cũ/địa chỉ nhà làm nơi bệnh nhân đang nằm.

Nội dung sơ cứu nhanh được người chuyên môn duyệt chưa được triển khai thành bộ hướng dẫn hoàn chỉnh. Không thêm chỉ dẫn chẩn đoán/điều trị tự sinh để lấp chỗ trống này.

### Tình nguyện viên

ON/OFF, cảnh báo đỏ, danh sách nhiều lời mời và một ca active hợp lý. Khóa màn hình chỉ còn đủ điều kiện ca mới trong5 phút từ GPS gần nhất, không phải trực nền cả buổi. Nên có kiểm tra trước ca: quyền, pin, mạng, độ mới GPS, thử nhận thông báo và người phụ trách.

Màn lời mời hiện thiên về mã ca và khoảng cách. Nên gắn nhãn thời điểm đo khoảng cách; distanceMeters được chụp lúc mời, không phải khoảng cách trực tiếp khi di chuyển. Danh sách ưu tiên hạn mời, không phải phân loại mức độ bệnh; tránh gọi đó là mức độ ưu tiên y khoa. Có thể cân nhắc khu vực gần đúng để TNV biết có tiếp cận được không, sau khi quyết định ranh giới riêng tư.

Sau nhận, nên ưu tiên hành động Liên hệ người báo (nếu họ cung cấp), mốc tìm và map; thông tin tự khai/quan sát phải tách rõ. Tên chỉ giúp nhận diện, không đủ kết luận đúng người hay bệnh cũ. Cần kết quả kết thúc có lý do tối thiểu: đã hỗ trợ/bàn giao/không tìm thấy/không tiếp cận được, do đội chuyên môn thống nhất; không đánh đồng completed với kết quả y tế thành công.

### Người giới thiệu / quản trị

Checklist riêng và duyệt hai bước là điểm mạnh. Tuy nhiên pending đang gom cả chờ người giới thiệu và chờ admin; nên hiển thị từng bước, phản hồi từ chối và người chịu trách nhiệm. Checklist là bản ghi xác minh, không tự chứng minh bằng cấp/chức vụ thật.

Bảng admin có số đếm, timestamp và thử lại thủ công nhưng chưa phải bàn điều phối: chưa có chi tiết hành động theo ca, cảnh báo nhận lâu không đến, bàn giao TNV, số người đang trực thực sự hoặc cảnh báo queue/cleanup trễ. Auto-refresh nếu thêm phải có giới hạn khi foreground, không gây đọc Firestore liên tục. Cửa vào /referrer cần dễ tìm hơn cho người được mời.

## 5. Các khoảng thiếu kỹ thuật và vận hành ưu tiên

P0: chặn tiếp nhận ca thật. P1: làm trước diễn tập mở rộng. P2: hoàn thiện khả dụng/bảo trì. Các ưu tiên này không phải số đo mức độ an toàn đã được chứng nhận.

| ID / ưu tiên | Phát hiện và căn cứ | Hành động / điều kiện đóng |
| --- | --- | --- |
| R01 P0 | FCM có hạn chế life-critical; chưa có ACK thiết bị/con người và đường dự phòng có người trực | Xác định mục đích dùng phù hợp điều khoản; thiết kế kênh/đối tác vận hành phù hợp trước ca thật. Không giải quyết bằng tăng priority hay mua gói đơn thuần |
| R02 P0 | accepted/arrived không được maintenance hết hạn; finish chỉ cho TNV nhận, người báo/Patient chỉ hủy trước nhận; admin suspension cũng từ chối khi có ca; chưa handover | Admin có quy trình kiểm tra, liên hệ, chuyển/bàn giao và khóa nguyên tử, audit; mô phỏng TNV mất máy/mất mạng/từ bỏ sau nhận hoặc cần thu quyền do sự cố. Không tự đóng ca chỉ vì timeout |
| R03 P0 | Đầu mối trực chưa có theo xác nhận chủ dự án | Chốt người trực/SOP/phương án khi không ai nhận; chỉ công khai số được đơn vị cho phép. Không tự gán số cá nhân/115 |
| R04 P1 | maintenance giới hạn50 ca quá hạn,50 ca purge,200 counters,200 push jobs mỗi lượt; cron ngày | Dọn nhiều trang theo ngân sách thời gian, lưu tiến độ/đếm tồn đọng, cảnh báo/dừng diễn tập nếu không dọn kịp. Test>50 ca và>200 counters; không cam kết xóa24–48h khi backlog chưa giải quyết |
| R05 P1 | Heartbeat30s ghi volunteer và bộ đếm rate limit mỗi lần | Đo reads/writes/giờ trực và quota thật, kiểm tra cùng Wi-Fi; tối ưu bộ đếm/heartbeat mà vẫn giữ giới hạn nguyên tử. Không bỏ bảo vệ hoặc tăng timeout để lấy PASS |
| R06 P1 | Report ID không tồn tại vẫn để form dài bị khóa; đã xem trên cloud | Early return màn phục hồi và nút hành động ở đầu; thử sai ID, sai phiên, quyền bị thu, mất mạng và quay lại |
| R07 P1 | Cài app/thông báo/GPS còn thiếu bằng chứng>=2 Android thật | Phiếu hãng/Android/version, Wi-Fi/4G, Home/khóa0–5 phút và sau5 phút, âm/rung/DND/quyền/pin, cập nhật đang có ca, hai tài khoản cùng máy; ghi FAIL theo quan sát |
| R08 P1 | Signup/anonymous công khai và tọa độ do client cung cấp; rate limit không chứng minh có mặt tại bệnh nhân | Pilot có danh sách/mã mời và vùng thử; App Check theo nền tảng, giám sát lạm dụng/quota, chống báo trùng có cân nhắc. QR bị chụp lại không chứng minh danh tính/vị trí |
| R09 P1 | Tài khoản TNV cũ được approved vẫn nhận ca dù không có verificationVersion2; UI chỉ cảnh báo | Cho dùng riêng diễn tập; rà/migrate/thu tài khoản chung trước dữ liệu thật, không coi label là ràng buộc backend |
| R10 P1 | APK0.4.13 đã verifier đạt nhưng installer0.4.12 | Chốt bàn giao preview, cập nhật manifest tải sau điều kiện phát hành, đối chiếu phiên bản trên hai máy; không force reload ca active hoặc coi build=đã cài |
| R11 P2 | Form bổ sung không phục hồi dữ liệu đã gửi; consent gắn card | Thiết kế update/get-owner-report tối thiểu và consent độc lập; test tương thích APK cũ, quyền và không xóa dữ liệu ngoài ý muốn |
| R12 P2 | Chưa có audit đầy đủ lượt đọc private và luồng accept/finish | Ghi metadata ai/ca/hành động/thời gian/lý do, không ghi payload bệnh án/phone/tokens; có nơi tra và hạn lưu audit |
| R13 P2 | Nội dung/trạng thái trùng giữa app/web/backend và tài liệu nhiều mốc | Một schema/contract được kiểm tra, glossary thống nhất và STATUS làm đầu mối; không mở cuộc di chuyển source lớn trước demo |
| R14 P2 | Chưa có phiếu phục hồi, cảnh báo quota/sự cố và diễn tập rollback đầy đủ trong bằng chứng đang xét | Chỉ rõ người trực, canary sau deploy, rollback backend/web/native tương thích; sao lưu/phục hồi theo ngân sách và quyền; không tự bật billing |
| R15 P2 | Main chưa bảo vệ, tài khoản demo/admin dùng chung không quy trách nhiệm từng người | Review/check bắt buộc theo thỏa thuận nhóm, tài khoản riêng khi vận hành, xác thực mạnh, thu/đổi bí mật theo SOP; không tự đổi quyền hoặc gửi mật khẩu lên repo public |
| R16 P1 | Admin roster dùng isAvailable để ghi Sẵn sàng, không trả lastSeenAt; TNV ON nhưng GPS>5 phút có thể vẫn hiện sẵn sàng trên admin dù dispatch loại | Trả độ mới/ready-for-dispatch cùng giờ kiểm tra; dùng tiêu chí đồng nhất app/backend, thử GPS6 phút, mất mạng, ca active và suspended. Đây là phát hiện qua source, chưa dựng fixture admin stale trong phiên review |

### Ước tính quota từ mã — không phải kết quả load test

Một heartbeat thông thường:1 write volunteer +1 bộ đếm user, thêm1 bộ đếm IP nếu IP được truyền. Chu kỳ30s tương đương120 heartbeat/giờ, khoảng**240–360 document writes/TNV/giờ**, chưa tính mời/báo/nhận/push/reads/listener. Mười TNV mở app8 giờ tương đương**19.200–28.800 writes** cho phần này. Đây là phép tính từ đường mã, không phải số usage dashboard, không tính quãng nền/OFF và không phải năng lực tối đa.

Free quota Firestore là20.000 writes/ngày,50.000 reads/ngày; tính theo ngày của nhà cung cấp, không theo giờ địa phương. Vì vậy miễn phí vẫn cần kiểm soát lịch trực/số máy và đo usage. [Firestore quotas](https://firebase.google.com/docs/firestore/quotas).

Counter dọn200/ngày có thể thấp hơn lượng tài liệu counter được sinh bởi nhiều người trực qua nhiều phút. Có nguy cơ backlog bộ đếm/ca/push dù thời điểm expiresAt đã qua; timestamps không tự xóa trên Spark. Cần đo và xử lý riêng, không dùng vòng tăng tải vào project cloud công khai để suy ra giới hạn.

### Thông báo / bản đồ / server

- HIGH priority là nỗ lực giao nhanh, không phải giao chắc chắn. Điều khoản FCM không cho loại sử dụng nguy cơ tính mạng được nêu trong tài liệu. [FCM life-critical](https://firebase.google.com/docs/cloud-messaging/customize-messages/setting-message-priority#life_critical_use_cases).
- Android cho người dùng kiểm soát âm và mức quan trọng của kênh; app không được quảng cáo luôn reo dù mọi chế độ tắt âm. Nên có nút mở đúng cài đặt kênh và bài nhận thông báo thực, không chỉ phát WAV phía trước. [Android channels](https://developer.android.com/develop/ui/compose/notifications/channels).
- Cron Hobby legacy hiện tối thiểu một ngày, độ chính xác theo giờ; cron ngày không thể là escalation tính giây/phút. Chưa có worker liên tục trong cấu hình EHIS. [Vercel cron](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing).
- Bản đồ trong app hiện là tuyến tham khảo ô tô, không giao thông trực tiếp, không dẫn giọng nói hoặc dẫn lối trong tòa nhà. OSM public tiles không có SLA. Lỗi tile được giữ mở từ05/11; vòng này không tái hiện route bằng ca mới. Không khẳng định nguyên nhân do Referrer-Policy: route layer đã có override riêng trong mã. [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/).
- setGlobalOptions/maxInstances của Firebase không phải bằng chứng Vercel bị giới hạn cùng số instance. Cần đo đúng portable runtime, cold start, hàng đợi, lỗi429/timeout và mạng; không chỉ chạy Functions Emulator rồi tuyên bố cloud tương đương.

## 6. Bảo mật / riêng tư

Rà tĩnh Rules không thấy client tự ghi role/approved/assignment hoặc đọc hồ sơ người khác: owner-read, tất cả client-write bị chặn, mặc định deny. Backend dùng Admin SDK nên phải kiểm tra riêng; wrapper hiện xác thực token và handler kiểm UID/trạng thái. Đây không phải chứng nhận pentest.

Checklist theo skill Firebase Security Rules Auditor (phạm vi chỉ file Rules hiện tại, không phải điểm bảo mật toàn hệ thống):

```json
{
  "score": 4,
  "summary": "Static rules review: strict owner reads, client writes denied, default deny. No cross-user read or self-role-write path found in this inspection; no new penetration test performed.",
  "findings": [
    {
      "check": "Resource exhaustion / list reads",
      "severity": "minor",
      "issue": "Owner history and alert list reads do not require a bounded query limit in Rules; application query limits alone do not constrain an authenticated custom client.",
      "recommendation": "Consider separate get/list permissions with query bounds compatible with actual listeners, plus App Check and quota monitoring. Validate in Emulator before changing Rules; this is not evidence of cross-user medical-data leakage."
    }
  ]
}
```

Các việc riêng trước dữ liệu thật: sơ đồ ai đọc gì, căn cứ/phiên bản đồng ý, rút quyền, yêu cầu xóa tài khoản/hồ sơ, hạn lưu từng nhóm, bảo toàn khi có sự cố, thông báo sự cố và bên chịu trách nhiệm. Rà việc dùng Firebase Singapore/Vercel/dịch vụ bản đồ với người có chuyên môn pháp lý. Không tự tuyên bố tuân thủ luật/chứng nhận y tế dựa vào Rules.

Giữ khóa backend ở môi trường bảo mật; cấu hình Firebase client công khai không tự động là lộ khóa service account. Tài khoản demo riêng tư là đúng nhưng mật khẩu dùng chung không phù hợp dữ liệu thật. Không chuyển PHI vào log/analytics hay dùng AI để xử lý triệu chứng trong vòng này. Audit mới nằm tại mục2; không chép số cũ thành số hiện tại hoặc dùng audit force tùy tiện.

## 7. Thứ tự hoàn thiện và nghiệm thu

### Trước buổi trình diễn

1. Chốt một bộ web/backend/APK và một trang tải; hai máy cài, kiểm version trực tiếp.
2. Sửa màn lỗi và giảm đoạn giới thiệu, đưa trạng thái/nút chính vào vị trí dễ thấy. Giữ body khoảng16px, nút>=48px; thử cuộn/keyboard/TalkBack/cỡ chữ lớn bằng máy thật.
3. Ba lượt kịch bản: luồng thuận; nhiều ca/hai TNV tranh nhận và chặn ca thứ hai; GPS/mạng/quyền/no-TNV/sai link. Ghi kết quả thật, không trình diễn thất bại thành thành công.
4. Có người phụ trách diễn tập tại chỗ và quy ước dừng; dữ liệu giả, không tiếp nhận ca thật. Chuẩn bị ảnh/video từ lượt đã thực chạy, ghi rõ đó là tư liệu dự phòng nếu mất Internet.

### Trước diễn tập mở rộng

Đóng R04/R05/R06/R07/R08; kiểm>50 ca cần dọn và>200 counters; đo quota cả buổi, hồi quy sau sửa; theo dõi queue/cleanup thật. Bổ sung kết quả trên>=2 Android (ưu tiên Samsung và một hãng khác), Wi-Fi và mạng di động. Không lấy load test tạo1.000 Auth làm bằng chứng1.000 người đang dùng đồng thời.

### Trước bất kỳ ca thật nào

Giải quyết R01/R02/R03, có người chịu trách nhiệm chuyên môn, đối tác/địa điểm/phạm vi TNV được xác minh, SOP nhận/bàn giao/sự cố, thiết kế thông báo phù hợp điều khoản và đường liên lạc dự phòng được thử, dữ liệu/tài khoản riêng và rà pháp lý. Ngưỡng phản hồi/đến nơi phải được thống nhất từ diễn tập; không tự biến mốc đề xuất3s/5s thành SLA.

Đề xuất chia4 người:1 UX/nội dung/UAT;1 Android/GPS/push/thiết bị;1 backend/handover/cleanup/quota;1 QA/phát hành/tài liệu/SOP. Mỗi ticket có tái hiện, mức ưu tiên, chủ trì, tiêu chí đóng, test và bằng chứng. Nội dung chuyên môn cần người có thẩm quyền bổ sung, nhóm kỹ thuật không tự thay vai trò đó.

### Hoãn đến sau nền tảng ổn định

NFC, chẩn đoán AI, chat/video, điểm thưởng, full EHR, dẫn đường giọng nói và iOS native chưa ưu tiên hơn các lỗi/thiếu sót trên. Không có nền tảng nào làm hết trách nhiệm lâm sàng hoặc vận hành con người chỉ bằng đổi framework.

## 8. Nơi sửa / nơi kiểm tra

| Phần | Source liên quan |
| --- | --- |
| Signup/role, QR/profile | [Session](../../../frontend/app/src/components/Session.tsx), [Patient](../../../frontend/app/src/app/patient.tsx), [lifecycle](../../../backend/src/lifecycle.ts) |
| Báo hỗ trợ, lỗi link, trả lời | [RequestHelp](../../../frontend/web/src/components/RequestHelp.tsx), [BystanderReport](../../../frontend/web/src/components/BystanderReport.tsx), [PublicRoute](../../../frontend/web/src/components/PublicRoute.tsx) |
| Nhận/kết thúc/private, chỉ đường | [reports](../../../backend/src/reports.ts), [Volunteer](../../../frontend/app/src/app/volunteer.tsx), [LiveNavigation](../../../frontend/app/src/components/LiveIncidentNavigation.tsx) |
| Chuông, queue và token | [native-push](../../../frontend/app/src/lib/native-push.native.ts), [pushJobs](../../../backend/src/pushJobs.ts), [PushPolicy](../../../backend/src/pushPolicy.ts) |
| Dọn/quota/vận hành | [maintenance](../../../backend/src/maintenance.ts), [guards](../../../backend/src/guards.ts), [operations](../../../backend/src/operations.ts), [Vercel config](../../../backend/vercel.json) |
| Quyền/listeners/phát hành | [Rules](../../../firestore.rules), [installer manifest](../../../frontend/web/src/config/releases.json), [quy trình phát hành](../../operations/MOBILE_RELEASES.md) |

Ảnh và records của phiên lưu trong thư mục ignored `.local/review-2026-11-07`; không có mật khẩu/health record thật trong tài liệu public. Phiên này chỉ cập nhật đánh giá/trạng thái artifact và lab note, không sửa/deploy hành vi ứng dụng. Mọi mục trên là backlog/điều kiện nghiệm thu cho đến khi có commit sửa và bằng chứng mới.

## Theo dõi sau review

Bản review trên là ảnh chụp hiện trạng trước sửa. Đợt0.4.14 đang xử lý R02 (bàn giao xác nhận), R04 (dọn nhiều trang/giám sát), R06 (giảm ghi GPS đứng yên), R08–R09 (khôi phục báo cáo/màn lỗi), R12 (metadata đọc riêng/nhận/bàn giao), R16 (GPS roster). Không tự đánh dấu đóng toàn bộ hoặc coi đã đạt điện thoại/ca thật. Xem [STATUS](../../STATUS.md) và [quy trình vận hành mới](../../operations/HANDOVER_AND_MAINTENANCE.md).
