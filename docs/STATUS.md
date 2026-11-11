# Trạng thái EHIS — tra cứu phiên bản tại đây


Cập nhật11/11/2026. Chỉ diễn tập có hướng dẫn với dữ liệu giả; chưa tiếp nhận cấp cứu thật. [Quy trình bàn giao và vận hành](operations/HANDOVER_AND_MAINTENANCE.md) · [Bằng chứng15](testing/verification/VERIFICATION_V0_4_15.md) · [Số liệu gốc](testing/verification/VERIFICATION_V0_4_15.json).

## 1. Bản đang bàn giao

**Cloud và APK21 đã có**: [bàn giao tự động/duyệt TNV/QR](testing/verification/VERIFICATION_V0_4_21.md). APK21/code19 đã xác minh artifact; chưa nghiệm thu trên điện thoại. Trang tải/QR đã trỏ tới21; kiểm tra HTTP và trình duyệt đạt.

**Chỉ diễn tập có hướng dẫn; chưa nghiệm thu toàn bộ.** [Báo cáo08–10/11](testing/verification/ACCEPTANCE_ANDROID_2026_11_08.md) và [số liệu gốc](testing/verification/ACCEPTANCE_ANDROID_2026_11_08.json) giữ cả thất bại và phần chưa thử.

| Phần | Đã xác minh | Còn thiếu |
| --- | --- | --- |
| App web/người báo/admin/referrer | Đã deploy21 từ f870ee3 ngày11/11; 38 HTML/JS/CSS khớp byte build, có bệnh nền và luồng xác minh rõ hơn | Chưa chạy lại browser đầy đủ vai trò sau deploy này; failure rebuild cũ vẫn giữ |
| Backend Vercel |21 từ f870ee3 đã deploy/probe đúng version/project/401; cloud bàn giao hai ca giả PASS | Chưa kiểm thử tải lớn cloud/worker liên tục/SLA; Spark/Hobby và quyền hiện có |
| S22+/Android16 | Lần kiểm tra gần nhất APK19/code17; kết quả18: GPS tại chỗ, route, OFF/ON, Home/resume, report2 tự tải/ack PASS ở lượt thử | Tự thoát gián đoạn còn OPEN; bố cục/bấm nhầm/hoàn tất native18 chưa đạt; chưa đi bộ/đoGPS chuẩn/offline độc lập/toàn bộ chế độ âm thanh |
| APK19/code17 | Đã cài S22+;3ca chờ, nhận E, chặn nhận D/A, bản2 tự tải/ack, GPS tại chỗ, hủy xác nhận arrival/hoàn tất và xác nhận hoàn tất native PASS. Kết thúc OFF/no active | Chưa nghiệm thu toàn bộ: tự thoát, offline độc lập, đi bộ GPS, nhiều máy/chế độ âm. Xem lab note10/11 |
| Trang tải chung | [APK0.4.21/code19](https://expo.dev/artifacts/eas/uwcKeQiNQrGIoESYhgcQxChZpNcNnsRY83OHxhBR34U.apk); /install200, nhãn/link21 đúng trên HTTP/browser, QR đã giải mã và đối chiếu remote | Chưa nghiệm thu21 trên máy thật; không OTA |
| Source/CI backend | a9134eb,CI42654274756 SUCCESS, có health assertions thật;72a186a đã qua16suite local/CI | CIba90 trước sửa FAIL vẫn được giữ; không đồng nghĩa nghiệm thu thiết bị/y tế |
| Tải local mới | Portable:1000Auth/128session/32feed/32ca/320API, p95cảnh báo1240ms,PASS | Không phải1000người dùng cloud; Functions local vẫn RECHECK,p95=21866ms>15000ms; chưa chứng minh mọi API nhanh hơn bản cũ |
| iOS native | Hoãn; iPhone dùng app web | Chưa IPA/TestFlight/tài khoản/ký/nghiệm thu iOS |
| Tài khoản demo | Bổ sung8tài khoản10/11:4Patient/2TNV duyệt diễn tập/1TNV chờ/1người giới thiệu giả lập;8/8login/API đã kiểm tra; repo riêng tư | Giữ A1/bộ cũ; kiểm tra trạng thái trước buổi; không công khai mật khẩu/QR/vị trí; không xác minh y tế thật |

[Mở app](https://ehis-next-20261021-hc03-app.web.app) · [Trang cài](https://ehis-next-20261021-hc03.web.app/install) · [Quản trị](https://ehis-next-20261021-hc03.web.app/admin) · [Tài khoản](demo/MANUAL_DEMO_ACCOUNTS.md) · [Người giới thiệu](https://ehis-next-20261021-hc03.web.app/referrer).

GPS16/17 FAIL, chuông15 FAIL và CIba90 FAIL không bị đổi thành PASS bởi các lượt sau. Chuông/khóa đã được chủ máy xác nhận ở16; chưa suy sang mọi chế độ/phiên bản/hãng. GPS18 là số đọc cảm biến trên máy thật với đích giả lập, không phải độ chính xác so mốc chuẩn. [Thông báo Android](operations/ANDROID_BACKGROUND_ALERTS.md) · [Xác minh TNV](operations/VOLUNTEER_VERIFICATION.md).

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
