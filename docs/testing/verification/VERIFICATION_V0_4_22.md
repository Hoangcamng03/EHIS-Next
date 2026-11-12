# Android 0.4.22 — đóng gói thay đổi đã duyệt

Chủ dự án yêu cầu cập nhật app và cung cấp link tải mới ngày 12/11/2026. Native 0.4.22 / code 20 chứa thay đổi UI đã kiểm tra trong [báo cáo cải thiện](PRODUCT_REVIEW_2026_11_12.md); API/backend tiếp tục 0.4.21, cùng project và hợp đồng.

## Phạm vi

- APK Android preview cài độc lập, package com.hoangcamng.ehisnext; không đổi tài khoản, dữ liệu hoặc cấu hình ký.
- Chạy kiểm tra source và export Android trước build. Chỉ công bố link sau EAS FINISHED, đối chiếu commit/version/code và kiểm tra artifact.
- Không phát OTA, không phát hành iOS/cửa hàng. Tính năng người báo chạy trên web đã cập nhật; app Android chứa khu vực Patient/Volunteer.
- Điện thoại chưa được coi đã cập nhật hoặc nghiệm thu chỉ vì có APK; cần hoàn tất ca, tắt Sẵn sàng rồi cài đè và xác nhận phiên bản.

## Trạng thái chuẩn bị

Export Android bằng cấu hình cloud đã đạt; bundle Hermes 5,3 MB tạo thành công. Preflight đạt 31 bài backend và 62 bài client cùng lint/typecheck. Build đã gửi, trạng thái đọc lại IN_QUEUE; [trang tiến độ EAS](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/3d7867f6-1285-4bff-825d-379e7fe61fab). Source 8ba06d1; native fingerprint 60aa05fcc8324d4a8fffcc46722dfd8e59928430.

Chưa có link tải 0.4.22 được xác minh. Trang cài vẫn giữ bản đã xác minh trước cho đến khi APK mới được kiểm tra. Không OTA.
