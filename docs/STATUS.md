# Trạng thái EHIS — tra cứu phiên bản tại đây


Cập nhật08/11/2026. Chỉ diễn tập có hướng dẫn với dữ liệu giả; chưa tiếp nhận cấp cứu thật. [Quy trình bàn giao và vận hành](operations/HANDOVER_AND_MAINTENANCE.md) · [Bằng chứng15](testing/verification/VERIFICATION_V0_4_15.md) · [Số liệu gốc](testing/verification/VERIFICATION_V0_4_15.json).

## 1. Bản đang bàn giao

**Web/backend/APK0.4.15 đã xác minh ở lớp phát hành.** S22+ đã cài đè và thử điều khiển UI qua USB; các bài chức năng/GPS/chuông/nền trên máy vẫn chờ. [Giải đáp tiến độ và cập nhật câu trả lời](operations/REPORT_UPDATES_AND_ARRIVAL.md). Có APK mới không có nghĩa mọi máy trong nhóm đã cập nhật.

**Phát hiện trên máy thật08/11:** chuông trong app15 không nạp được alias tài nguyên; bài này **Không đạt**, chưa nghiệm thu báo động. Bản sửa16 đang kiểm chứng/build, chưa có APK16 được xác nhận phát tiếng. Không dùng kết quả artifact/CI15 để ghi chuông Đạt.

| Phần | Mốc đã xác minh | Còn thiếu |
| --- | --- | --- |
| App web và web người báo/admin/referrer |0.4.15 đã deploy;38 HTML/JS/CSS khớp bytes build; browser local thao tác thật cho ETA, hai bản trả lời/receipt và font đạt | Chưa browser cloud/điện thoại; một lượt tile/OSRM local không bảo đảm dịch vụ |
| Backend |0.4.15 Vercel, đúng project/health/401; luồng2 ca cloud giả đạt, gồm ETA/receipt/bàn giao/reset/thu quyền fixture tạm | Chưa tải lớn cloud/worker liên tục/SLA; giữ Firebase Spark/Vercel Hobby/quyền hiện có |
| Android |[APK0.4.15/code13](https://expo.dev/artifacts/eas/WaJg4V8bEWjjjSGTdZJDb1P5Lb0BBFR_euaelL9Yo80.apk), artifact đạt;08/11 cài đè0.4.7→15 thành công trên S22+ SM-S906E/Android16; mở Patient, cuộn, mở cài đặt thấy15 và đăng xuất thực | Chưa nghiệm thu đầy đủ font/phóng chữ/GPS/âm/rung/Home/khóa và luồng TNV. Chưa trích hash chứng chỉ ký; không gọi điều khiển UI là nghiệm thu toàn bộ |
| Source/CI |main, runtime0eb17de;74 test/16 integration suites local; [CI42447024274 SUCCESS](https://github.com/Hoangcamng03/EHIS-Next/actions/runs/42447024274), gồm Android export/web build/integration/scale | CI/source/build/deploy không thay nghiệm thu thiết bị hoặc y tế |
| Tải/hiệu suất local |2 lượt portable, mỗi lượt1000 Auth giả/128 phiên/32feed/32ca/320API; paired2×96 ca đo+16 warmup tổng | Lượt paired1 RECHECK, lượt2 PASS không đổi mã/ngưỡng; không khẳng định mọi API nhanh hơn hoặc1000 người thao tác cùng lúc |
| iOS native |Hoãn, chưa IPA/TestFlight; iPhone dùng app web | Chưa tài khoản/ký/nghiệm thu iOS native |
| Tài khoản demo |Bộ cloud25/10 nằm trong repo riêng tư; không đổi bộ ổn định trong đợt14 | Trạng thái có thể đổi khi nhóm tự thử; kiểm tra trước buổi demo |

[Mở app](https://ehis-next-20261021-hc03-app.web.app) · [Trang cài](https://ehis-next-20261021-hc03.web.app/install) · [Quản trị](https://ehis-next-20261021-hc03.web.app/admin) · [Tài khoản](demo/MANUAL_DEMO_ACCOUNTS.md).

[Người quản lý giới thiệu TNV](https://ehis-next-20261021-hc03.web.app/referrer) · [Quy trình xác minh](operations/VOLUNTEER_VERIFICATION.md) · [Thông báo Android và phiếu máy thật](operations/ANDROID_BACKGROUND_ALERTS.md).

## 2. Bằng chứng theo đúng lớp

- Bản 0.4.7: [VERIFICATION_V0_4_7](testing/verification/VERIFICATION_V0_4_7.md). Logic/Emulator/browser/cloud/artifact được ghi riêng; không thay thế thử điện thoại.
- Bản đối chiếu 0.4.8 ngày 27/10: [VERIFICATION_V0_4_8](testing/verification/VERIFICATION_V0_4_8.md). 40 unit/logic, chín integration, bài 1.000 Auth/32 ca và browser đủ vai trò; chưa thay phiếu máy thật. Kết quả sau vá dependency/CI/phát hành ở lab note và bảng trên.
- Bản sửa 0.4.9: [VERIFICATION_V0_4_9](testing/verification/VERIFICATION_V0_4_9.md), [JSON](testing/verification/FIX_2026_10_27_0_4_9.json). TNV ON muộn, nhiều ca tách history, GPS cache/watch và audio tải muộn; cloud/APK đạt lớp phát hành, máy thật vẫn chờ.
- Bản UI 0.4.10: [VERIFICATION_V0_4_10](testing/verification/VERIFICATION_V0_4_10.md). Chữ gọn, nút/công tắc cả hàng, disclosure, map 48px; đăng ký và hai ca trước ON đã kiểm tra local.
- Bản 0.4.11: [VERIFICATION_V0_4_11](testing/verification/VERIFICATION_V0_4_11.md). Người giới thiệu/checklist/duyệt hai bước, liên hệ Patient, câu hỏi người báo và thông báo Android; ghi rõ tải FAIL/PASS và giới hạn chuông nền.
- Phiếu người thử: [ACCEPTANCE_FLOW](testing/ACCEPTANCE_FLOW.md), A01–A13. Chưa có kết quả nhóm gửi về thì vẫn Chưa thử.
- [So sánh hiệu suất 26/10](testing/PERFORMANCE_COMPARISON.md): baseline cùng tính năng trước sắp xếp; 192 ca đo qua hai lượt, build/payload và luồng browser. Kết quả local không thay SLA cloud hoặc thử Android thật.

## 3. Phạm vi đang áp dụng

Android miễn phí + web, dữ liệu giả, trình thầy và diễn tập có kiểm soát. Chưa đủ điều kiện tiếp nhận cấp cứu thật. Không tự bật Blaze/nâng gói, OTA, cửa hàng hoặc iOS native. Quyền TNV/admin do backend quyết định; chọn đối tượng chỉ mở đúng giao diện.

Các việc còn mở: thiết bị/GPS/âm/rung và nhận nền, hiệu năng tải lớn trên cloud, advisory dependency, giám sát/quota và điều kiện chuyên môn/vận hành. [Kế hoạch sản phẩm](planning/PRODUCT_LAUNCH_PLAN.md) · [Kế hoạch trình thầy/cuối kỳ](planning/MIDTERM_DEMO.md).

Nhóm chưa có đầu mối trực; không tự điền số cá nhân/115. FCM có hạn chế đối với life-critical/emergency; chỉ diễn tập dữ liệu giả và phải đánh giá lại thiết kế trước ca thật, xem [giới hạn nhà cung cấp](operations/ANDROID_BACKGROUND_ALERTS.md#2-giới-hạn-phải-hiểu).

## 4. Khi cập nhật lần sau

**Nguồn chuẩn là main:** frontend/app, frontend/web, backend và docs theo công việc. Cấu trúc được hợp nhất qua [PR #7](https://github.com/Hoangcamng03/EHIS-Next/pull/7) theo chỉ đạo ngày 26/10; UI 0.4.8 được tích hợp/kiểm tra ở đợt 27/10. [Hướng dẫn chuyển máy thành viên](development/REPOSITORY_MIGRATION.md). Checkout cũ/WIP vẫn được giữ nguyên, không dùng làm nguồn phát hành song song.

Ghi bằng chứng ở lab note trước, cập nhật bảng phần 1 theo kết quả thực; chưa thử thì không đổi thành Đạt. Hướng dẫn thao tác ở trang cài/demo/phát hành; không chép lịch sử dài vào trang trạng thái này.

[Lịch sử trạng thái trước lần tổ chức](https://github.com/Hoangcamng03/EHIS-Next/blob/f921d33/docs/STATUS_HISTORY.md).
