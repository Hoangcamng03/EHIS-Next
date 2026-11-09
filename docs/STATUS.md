# Trạng thái EHIS — tra cứu phiên bản tại đây


Cập nhật08/11/2026. Chỉ diễn tập có hướng dẫn với dữ liệu giả; chưa tiếp nhận cấp cứu thật. [Quy trình bàn giao và vận hành](operations/HANDOVER_AND_MAINTENANCE.md) · [Bằng chứng15](testing/verification/VERIFICATION_V0_4_15.md) · [Số liệu gốc](testing/verification/VERIFICATION_V0_4_15.json).

## 1. Bản đang bàn giao

Source backend sửa retry09/11: check83 và integration16suite local PASS (multi15/15,222Auth/201API); chưa deploy. CI `ba90a0a` trước sửa vẫn là FAIL, CI bản sửa/tải còn chờ. APK18 chỉ chứa sửa GPS/frontend đã build trước sửa backend, không tự cập nhật backend hay trang web.

**Web/backend/APK0.4.16 đã phát hành ở lớp thử nghiệm.** S22+ đã cài đè16/code14; chủ máy xác nhận có tiếng và rung ở bài Thử chuông foreground. Một bài thông báo sau Home đã đạt trên15. [Bằng chứng16](testing/verification/VERIFICATION_V0_4_16.md) ghi rõ các bài chưa thử; không coi một máy là nghiệm thu mọi điều kiện hoặc mọi Android.

**Kiểm thử hai Android bổ sung08/11:** bản16 đã nhận hai ca chờ, chặn nhận thêm khi bận, tải các bản tình trạng, báo chuông/rung khi khóa và mở đúng ca khi chạm thông báo; ETA trễ giữ nguyên người phụ trách. **GPS trực tiếp tại chỗ chưa đạt**: vẫn chờ điểm mới quá lâu. Offline chỉ thử một phần vì mạng laptop cũng bị ảnh hưởng. [Báo cáo thật, gồm FAIL/RECHECK](testing/verification/ACCEPTANCE_ANDROID_2026_11_08.md).

**Máy S22+ đã cài APK0.4.18/code16 ngày09/11.** GPS tại chỗ đã cập nhật0–1giây ở các ảnh cách nhau gần4phút, tính được tuyến tới điểm bệnh nhân giả lập; tắt/bật và Home/mở lại lấy fix mới. Report2 được app tự tải/ack. Người báo vòng này là API giả lập theo yêu cầu, không phải điện thoại thứ hai hay bệnh nhân thật. Chưa đi bộ/nghiệm thu toàn bộ. [Bằng chứng chi tiết](testing/verification/ACCEPTANCE_ANDROID_2026_11_08.md). Cloud/trang tải chung vẫn16, không OTA; GPS16/17 FAIL được giữ trong lịch sử.

**Lỗi ưu tiên cao còn mở:** tự về Home chưa tái hiện trong40mẫu/90giây18 nhưng chưa đóng lỗi. Bố cục/cuộn đổi trong thao tác từ xa, chủ máy xác nhận không chạm; lượt hoàn tất native18 chưa đạt, có bấm lệch Đã đến nơi trên ca giả lập (không phải đến thật), đã dọn qua API và TNV OFF/no active. CI18 `ba90a0a` FAIL ở8retry cùng yêu cầu do tranh khóa Firestore; bản sửa backend đang kiểm tra, chưa deploy. Chưa bàn giao18 như bản đã nghiệm thu.

| Phần | Mốc đã xác minh | Còn thiếu |
| --- | --- | --- |
| App web và web người báo/admin/referrer |0.4.16 đã deploy;38 HTML/JS/CSS khớp build; luồng ETA/report/font browser local đã thử ở15 | Chưa browser cloud16; một lượt tile/OSRM local không bảo đảm dịch vụ |
| Backend |0.4.16 Vercel, đúng project/health/401; chỉ metadata đổi so với15; luồng2 ca cloud giả đã đạt ở15 | Chưa tải lớn cloud/worker liên tục/SLA; giữ Firebase Spark/Vercel Hobby/quyền hiện có |
| Android |[APK0.4.16/code14](https://expo.dev/artifacts/eas/I4rVMe1xroxr-i8MaVKmBP3NEImFfg9ARfGXLWMVsGc.apk) đã cài trên S22+/Android16; báo cáo08/11 có hai máy, nhiều ca, revision, ETA và khóa máy | GPS16 chưa đạt ở điều kiện thử;17 chưa nghiệm thu máy. Offline độc lập/đi bộ/Im lặng/DND/Media0/Bluetooth/nhiều hãng còn mở |
| Source/CI |main, runtime16 d7f34d4;74 test local; [CI42471477876 SUCCESS](https://github.com/Hoangcamng03/EHIS-Next/actions/runs/42471477876), gồm Android export/web build/integration/scale | CI/source/build/deploy không thay nghiệm thu thiết bị hoặc y tế |
| Tải/hiệu suất local (các lượt trước) |2 lượt portable, mỗi lượt1000 Auth giả/128 phiên/32feed/32ca/320API; paired2×96 ca đo+16 warmup tổng | Lượt paired1 RECHECK, lượt2 PASS không đổi mã/ngưỡng; không khẳng định mọi API nhanh hơn hoặc1000 người thao tác cùng lúc |
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
