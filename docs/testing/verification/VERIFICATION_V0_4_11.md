# EHIS 0.4.11 — xác minh, liên hệ và thông báo Android

Ngày chạy: 28/10/2026. Chỉ dữ liệu giả, diễn tập có kiểm soát. Không dùng kết quả Emulator để công bố tải tối đa hay độ tin cậy cấp cứu thật.

## 1. Thay đổi cần kiểm tra

- TNV mới khai đào tạo, tháng lâm sàng, khu vực cư trú/đơn vị/hỗ trợ và người quản lý giới thiệu. Người quản lý được admin xác minh, tự xác nhận bốn checklist bằng tài khoản riêng; admin duyệt cuối.
- Đổi đơn tăng revision và xóa checklist cũ. Thiếu checklist, sai người quản lý, quyền bị thu hồi, tài khoản quản lý bị khóa/chưa xác minh email hoặc phiên bản đơn cũ đều không duyệt được.
- Patient có đủ tên, quan hệ, số liên hệ hoặc để trống cả ba. Client cũ không được đổi phone rồi giữ nhầm tên người liên hệ cũ.
- Ba câu hỏi người báo theo quan sát, có Không rõ; phone tiếp tục tùy chọn. Backend xác nhận yêu cầu trước khi mở bảng hỏi.
- Android dùng FCM trực tiếp và kênh thông báo native. Nội dung khóa màn hình không chứa bệnh án/liên hệ/GPS. Cần APK mới, quyền thông báo và bài thử vật lý riêng.

## 2. Kết quả theo từng lớp

| Lớp | Kết quả quan sát | Giới hạn |
| --- | --- | --- |
| Typecheck/lint/build và unit/logic | PASS: 17 backend + 35 logic = 52 test | Không thay thử giao diện/máy thật |
| Integration | PASS 12 bộ: starter, reports, lifecycle, maintenance, portable, location, multi, active-alert, budget-queue, pending-dispatch, verification, push | Auth/Firestore/Functions Emulator; FCM network bị tắt có chủ đích |
| Hồi quy thu hồi quyền | PASS: admin vẫn tắt được registry khi Auth người quản lý đã bị khóa; không cấp lại được khi còn khóa | Chạy lại verification + push sau bản vá cuối |
| Nhiều ca/khoảng cách | PASS 15 tình huống; 222 Auth; lượt cuối 198 API | Có ca cách khoảng 111 / 1.111 / 3.335 m; ba yêu cầu nhận đồng thời chỉ một thắng, hai bị chặn |
| Build | PASS Next static, Expo web và Android JS export | Android JS export chưa phải APK/Gradle hoặc kiểm thử thiết bị |
| Cloud | PASS hai ca trước ON, truy vấn index thật, nhận một ca, consent, đến nơi/hoàn tất và chặn private sau đóng | Chỉ probe giả, không thử tải lớn trên cloud |
| Hosting | PASS 35 đối chiếu SHA-256 HTML/JS/CSS với artifact local | Không suy ra từng máy đã tải bản mới |
| Browser | Đã thử checklist → admin duyệt; Patient lưu/tải lại liên hệ; mẫu TNV prefill; bảng hỏi gửi không phone; ON muộn → nhận → hồ sơ/liên hệ → map OSRM 0,78 km → đến nơi/hoàn tất | Ảnh dữ liệu giả trong docs/assets/trial-0411; chuông vật lý chưa đo |
| FCM quyền và payload | Lượt đầu token giả trả 400; lượt kiểm tra cuối dùng topic + validate_only trả HTTP200 | Payload HTTP v1 và quyền runtime được FCM chấp nhận ở chế độ không gửi. Chưa có message thật giao tới máy |
| Android Home/khóa, Samsung/4G | CHƯA THỬ | Phải dùng APK mới và hai điện thoại; không ghi PASS từ build thành công |

## 3. Tải lớn — ghi cả lượt chưa đạt

1. **Lượt đầu FAIL 429:** vừa chạy build/check nặng trên cùng máy. Tạo 1.000 Auth và 32 listener đã qua, nhưng createIncident bị resource-exhausted. Không nới rate limit, tăng timeout hay tự retry để che kết quả. HTTP test cũ chỉ in loại lỗi, nên chưa kết luận chính xác nhánh 429 nào.
2. **Chạy lại cùng tải khi máy rảnh PASS:** 1.000 tài khoản Auth, trong đó **128 có phiên đăng nhập, 872 là fixture offline/pending**; 64 TNV sẵn sàng, 32 SDK listener, 32 ca đồng thời ở tám vùng, 320 API, không automatic retry. Thời gian 15:18:47–15:19:04 UTC.
3. Nhận lời mời: p95 **1.007 ms**, max **1.043 ms**; createIncident p95 **970 ms**, max **1.043 ms**. Đây là phép đo loopback trên Emulator/HTTP adapter, không phải 1.000 người cùng thao tác, SLA cloud hay kết quả điện thoại.

Máy chạy Node 24.21.0; Vercel/CI cấu hình Node 22. Tài nguyên máy ảnh hưởng kết quả. Cần đo cloud có kiểm soát và thiết bị Wi-Fi/4G trước khi đặt ngưỡng vận hành.

## 4. Bảo mật, hạ tầng và lỗi còn mở

- Chỉ thêm hai custom role đúng quyền đã được chủ dự án cho phép: `cloudmessaging.messages.create` và `firebaseauth.users.get`, riêng runtime EHIS; giữ Datastore user hiện có. Không thêm quyền sửa/tạo/xóa tài khoản, không tạo key mới và không bật billing.
- Hai index mới đã READY; backend 0.4.11 và hai Hosting đã cập nhật. Sáu tài khoản demo ổn định giữ nguyên, không tự gắn xác minh y khoa cho tài khoản cũ.
- Rà hợp đồng HTTP đã chuyển priority sang enum HIGH; kiểm tra backend 17 test đạt và FCM validate_only HTTP200. [Hợp đồng FCM REST](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages#androidmessagepriority). Công cụ `scripts/check-fcm-config.cjs --validate-only <đường-dẫn-key-đã-có>` không in key/token và không gửi đến người nhận.
- Đã vá node-forge 1.4.2, chọn @vercel/functions 3.6.1 để tránh kéo thêm advisory high. App còn advisory trên cây Expo CLI/zod/deepmerge; backend còn uuid transitive moderate. Không ép npm audit fix --force vì đề xuất đổi major/downgrade SDK. Chưa coi dependency audit sạch hoặc đủ điều kiện production.
- Hàng đợi thông báo gửi tối đa 20 job/đợt, ba thiết bị/TNV, năm lần thử; retry phụ thuộc request/cron. Chưa có worker liên tục, ACK từ điện thoại hay SLA. Kênh thông báo không bảo đảm reo ở mọi chế độ Im lặng/Không làm phiền.
- Chỉ foreground GPS; quá năm phút không được chọn cho ca mới. Không cam kết nhận khi force-stop, mất mạng hoặc tiết kiệm pin chặn nền.
- Nội dung quan sát không chẩn đoán; chưa được chuyên gia y tế duyệt. Chưa có người quản lý/đơn vị y tế thật được xác minh trong vòng này.

## 5. Cách nghiệm thu tiếp

[Quy trình xác minh](../../operations/VOLUNTEER_VERIFICATION.md) → [thông báo Android và phiếu hai máy](../../operations/ANDROID_BACKGROUND_ALERTS.md) → [flow nghiệm thu](../ACCEPTANCE_FLOW.md). Ghi model/Android/phiên bản app, thời điểm gửi/nhận, mạng, âm lượng, kết quả thật và ảnh/video. Bản phát hành/APK hiện hành luôn tra [STATUS](../../STATUS.md).
