# Trạng thái EHIS — tra cứu phiên bản tại đây

Mốc tổng hợp ngày 05/11/2026: [bản 0.4.13](testing/verification/VERIFICATION_V0_4_13.md) **nghiệm thu một phần**. Source/CI, 67 test/14 suites, tải local32 ca và web/backend cloud đạt. Bản đồ nền/thiết bị vẫn còn việc mở. APK0.4.13 đang xếp hàng; bản tải thực vẫn0.4.12 đã xác minh. Không suy ra điện thoại đã cập nhật từ việc source hoặc cloud đã đổi.

## 1. Bản đang bàn giao

**0.4.13:** GPS mới/cũ, mốc tìm bệnh nhân riêng tư, sửa giữ sót triệu chứng và bảng quản trị diễn tập. Đầu mối trực vẫn trống theo xác nhận. [Số thực/timestamp/hash log](testing/verification/VERIFICATION_V0_4_13.json).

| Phần | Mốc đã xác minh | Còn thiếu |
| --- | --- | --- |
| App web và web người báo/admin/referrer | 0.4.13 đã deploy; 38 HTML/JS/CSS khớp build; browser thấy version mới, quản trị/Privacy/trang cài đúng | Local browser PARTIAL vì tile map; nghiệm thu trên thiết bị của nhóm còn thiếu |
| Backend | 0.4.13: flow cloud giả/overview admin/index mới/meetingNote riêng tư đạt; quyền tạm của probe đã thu; giữ runtime ESM và quyền hiện có | Chưa tải cloud/điện thoại; không có worker liên tục hoặc cam kết giao FCM |
| APK Android | [Tải APK0.4.12/code10](https://expo.dev/artifacts/eas/eHIioq5ReWQNAuqHuHxGi3e2eXE4TkJdCbCSULWc0Fk.apk) từ bc3f2be; EAS FINISHED, artifact102.895.417 bytes, SHA256 trong báo cáo; đúng package/cloud/tone/quyền rung | Chưa nghiệm thu máy thật/chứng chỉ ký; chỉ cài khi không có ca active, không cần Expo Go |
| APK0.4.13 đang chuẩn bị | [Build code11](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/97330def-c292-4f69-b20c-b146f3fe520b) từ359427b: IN_QUEUE tại lần kiểm tra ghi trong JSON | Chưa artifact mới/verifier/cài máy; giữ link tải0.4.12 |
| Source kiểm tra | main/runtime359427b; 67 test/14 suites, scale cuối32 ca/320 API/p95 lời mời925 ms local; [CI run42063552503 SUCCESS](https://github.com/Hoangcamng03/EHIS-Next/actions/runs/42063552503) | Không diễn giải CI/local thành nghiệm thu máy thật, SLA hoặc ca thật |
| Đối chiếu trước sửa04/11 | Runtime không đổi từ 22aff2e; local 56 test/12 suites/multi 15/ba lượt portable/cloud flow/browser/JS export đạt theo báo cáo | Functions load RECHECK >15 s; map preview/tile lỗi; audit còn 24 app/16 web/9 backend. CI cũ không thay kết quả phiên mới |
| iOS native | Hoãn, chưa có IPA/TestFlight | Chưa tài khoản/ký/nghiệm thu; iPhone có thể dùng web |
| Tài khoản demo | Sáu tài khoản cloud cấp ngày 25/10, kiểm tra login/quyền đạt | Trạng thái có thể đổi khi nhóm tự thử; kiểm tra lại trước mỗi vòng |

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
