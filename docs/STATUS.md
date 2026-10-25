# Trạng thái EHIS — tra cứu phiên bản tại đây

Mốc tổng hợp ngày 25/10/2026 từ bằng chứng đã ghi trong [LAB_NOTES](LAB_NOTES.md). Đây là đầu mối phiên bản; các tài liệu khác dẫn về đây. Không suy ra máy đã cập nhật từ việc source hoặc build đã đổi.

## 1. Bản đang bàn giao

| Phần | Mốc đã xác minh | Còn thiếu |
| --- | --- | --- |
| App web, web người báo/admin và backend | 0.4.7 đã deploy; 32 đối chiếu artifact và ca cloud giả đạt | Nghiệm thu bằng tay trên thiết bị/điều kiện của nhóm |
| APK Android | 0.4.7, versionCode 5; EAS FINISHED, artifact đã kiểm tra | Cài đè/Play Protect/loa/rung/GPS trên máy thật |
| Source sửa giao diện | 0.4.8/code 6 đang ở local, chưa phát hành | UI TNV/reporter/admin, build cuối, CI, cloud và APK mới chưa hoàn tất |
| iOS native | Hoãn, chưa có IPA/TestFlight | Chưa tài khoản/ký/nghiệm thu; iPhone có thể dùng web |
| Tài khoản demo | Sáu tài khoản cloud cấp ngày 25/10, kiểm tra login/quyền đạt | Trạng thái có thể đổi khi nhóm tự thử; kiểm tra lại trước mỗi vòng |

[Mở app](https://ehis-next-20261021-hc03-app.web.app) · [Trang cài](https://ehis-next-20261021-hc03.web.app/install) · [Quản trị](https://ehis-next-20261021-hc03.web.app/admin) · [Tài khoản](MANUAL_DEMO_ACCOUNTS.md).

## 2. Bằng chứng theo đúng lớp

- Bản 0.4.7: [VERIFICATION_V0_4_7](VERIFICATION_V0_4_7.md). Logic/Emulator/browser/cloud/artifact được ghi riêng; không thay thế thử điện thoại.
- Bản sửa local 0.4.8: [VERIFICATION_V0_4_8](VERIFICATION_V0_4_8.md). 35 unit/logic + type/lint và tám bộ integration đã đạt; Patient đã thử một phần. Computer-use tự dừng ở bước mở tab mới; chưa nghiệm thu cả UI hoặc phát hành 0.4.8.
- Phiếu người thử: [ACCEPTANCE_FLOW](ACCEPTANCE_FLOW.md), A01–A13. Chưa có kết quả nhóm gửi về thì vẫn Chưa thử.

## 3. Phạm vi đang áp dụng

Android miễn phí + web, dữ liệu giả, trình thầy và diễn tập có kiểm soát. Chưa đủ điều kiện tiếp nhận cấp cứu thật. Không tự bật Blaze/nâng gói, OTA, cửa hàng hoặc iOS native. Quyền TNV/admin do backend quyết định; chọn đối tượng chỉ mở đúng giao diện.

Các việc còn mở: thiết bị/GPS/âm/rung và nhận nền, hiệu năng tải lớn, advisory dependency, giám sát/quota và điều kiện chuyên môn/vận hành. [Kế hoạch sản phẩm](PRODUCT_LAUNCH_PLAN.md) · [Kế hoạch trình thầy/cuối kỳ](MIDTERM_DEMO.md).

## 4. Khi cập nhật lần sau

Ghi bằng chứng ở lab note trước, cập nhật bảng phần 1 theo kết quả thực; chưa thử thì không đổi thành Đạt. Hướng dẫn thao tác ở trang cài/demo/phát hành; không chép lịch sử dài vào trang trạng thái này.

[Lịch sử trạng thái trước lần tổ chức](STATUS_HISTORY.md).
