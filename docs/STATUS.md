# Trạng thái EHIS — tra cứu phiên bản tại đây

Mốc tổng hợp ngày 28/10/2026 từ bằng chứng đã ghi trong [LAB_NOTES](LAB_NOTES.md). Đây là đầu mối phiên bản; các tài liệu khác dẫn về đây. Không suy ra máy đã cập nhật từ việc source hoặc build đã đổi.

## 1. Bản đang bàn giao

| Phần | Mốc đã xác minh | Còn thiếu |
| --- | --- | --- |
| App web và web người báo/admin/referrer | UI 0.4.11 đã deploy; 35 đối chiếu HTML/JS/CSS khớp bản build | Nghiệm thu bằng tay trên thiết bị/điều kiện của nhóm |
| Backend | 0.4.11: cloud flow giả đạt; index mới READY; quyền runtime chỉ đọc Auth/gửi FCM đã bổ sung đúng phạm vi được duyệt | FCM giao/chuông trên thiết bị và tải cloud chưa nghiệm thu |
| APK Android | [0.4.11/code 9 từ d4e6591](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/1fb30d53-b177-4584-acd8-1c4be02eedf5) đang IN_QUEUE trên EAS miễn phí; chưa có artifact mới để cài | Chỉ đổi thành link tải khi FINISHED và verifier đạt; không dùng APK cũ thử thông báo nền mới |
| Source kiểm tra | d4e6591: [CI 40720265276 SUCCESS](https://github.com/Hoangcamng03/EHIS-Next/actions/runs/40720265276) trên Node22; 52 unit/logic, 12 integration, scale và build Android/web. Browser local đã đi hết ca | Lượt tải local đầu FAIL 429 khi máy bận, lượt chạy riêng PASS; chưa công bố số người tối đa hay SLA |
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

## 4. Khi cập nhật lần sau

**Nguồn chuẩn là main:** frontend/app, frontend/web, backend và docs theo công việc. Cấu trúc được hợp nhất qua [PR #7](https://github.com/Hoangcamng03/EHIS-Next/pull/7) theo chỉ đạo ngày 26/10; UI 0.4.8 được tích hợp/kiểm tra ở đợt 27/10. [Hướng dẫn chuyển máy thành viên](development/REPOSITORY_MIGRATION.md). Checkout cũ/WIP vẫn được giữ nguyên, không dùng làm nguồn phát hành song song.

Ghi bằng chứng ở lab note trước, cập nhật bảng phần 1 theo kết quả thực; chưa thử thì không đổi thành Đạt. Hướng dẫn thao tác ở trang cài/demo/phát hành; không chép lịch sử dài vào trang trạng thái này.

[Lịch sử trạng thái trước lần tổ chức](https://github.com/Hoangcamng03/EHIS-Next/blob/f921d33/docs/STATUS_HISTORY.md).
