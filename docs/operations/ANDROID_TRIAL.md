# Android — cài đặt và nghiệm thu

## 1. Chọn đúng bản

[STATUS](../STATUS.md) là nơi tra cứu phiên bản. Mốc bàn giao 27/10: APK 0.4.9/code 7 đã FINISHED và xác minh artifact, cùng source runtime c40e2f1 với web/backend. Chưa nghiệm thu máy thật. [Trang cài cố định](https://ehis-next-20261021-hc03.web.app/install). Không tải APK lịch sử chỉ vì thấy link trong báo cáo cũ.

## 2. Cài trên thiết bị

1. Mở trang cài trên Android và tải APK được nhóm bàn giao.
2. Kiểm tra nguồn/tên app và thông báo hệ thống. Nếu bị chặn, ghi cảnh báo, dừng cài và xem [xử lý lỗi](../demo/DEMO_TROUBLESHOOTING.md). Không tắt Play Protect hoặc bảo vệ thiết bị để điền kết quả Đạt.
3. Với máy đã có EHIS, ưu tiên thử cài đè đúng package/ký; không tự gỡ app trước vì có thể mất dữ liệu local. Chưa có bằng chứng cài đè trên máy nhóm thì ghi Chưa thử.
4. Mở app, kiểm tra phiên bản. Không cần Expo Go/laptop; đăng nhập, gửi/nhận ca và bản đồ cần Internet.
5. Dùng tài khoản CLOUD theo [bảng hướng dẫn](../demo/MANUAL_DEMO_ACCOUNTS.md). Tài khoản sẵn có chọn Đã có tài khoản? Đăng nhập nếu màn hình ban đầu hỏi đăng ký. App tự mở đúng Patient/TNV.

## 3. Thử theo flow

[Bắt đầu](../START_HERE_DEMO.md) → [runbook](../demo/DEMO_RUNBOOK.md) → [phiếu A01–A13](../testing/ACCEPTANCE_FLOW.md). Hai Android đủ vòng một TNV/người báo cùng laptop; bài tranh ca hai TNV cần thêm nơi báo tin có định vị đạt.

Chỉ dùng dữ liệu giả. Cho phép GPS khi cần; TNV bật sẵn sàng và thử chuông trước khi báo. Tọa độ giả chỉ có ở Emulator local, không phải tính năng để nhập điểm giả trên APK cloud. Khóa máy/đưa nền chưa được xác minh tiếp nhận; giữ màn mở trong vòng chính.

## 4. Ghi kết quả và kết thúc

Ghi model/Android, phiên bản, mạng/quyền, bước, thực tế và bằng chứng không có secret. Tách Đạt/Không đạt/Chưa thử/Bị chặn; web chạy được không thay cho APK đã cài. Cuối buổi đóng ca và kiểm tra TNV OFF.

Người đóng gói xem [MOBILE_RELEASES](MOBILE_RELEASES.md); lịch sử APK cũ ở [ANDROID_TRIAL_HISTORY](https://github.com/Hoangcamng03/EHIS-Next/blob/f921d33/docs/ANDROID_TRIAL_HISTORY.md). Không phát hành hoặc đổi cloud khi chỉ đang chạy bài thử.

## Thử lại lỗi 0.4.9 trên Samsung/Android

1. Cài đè APK từ trang cài, không cần gỡ bản cũ. Vào Tài khoản và cài đặt, kiểm tra EHIS 0.4.9. Dừng ca đang thử trước khi cập nhật.
2. Trong Cài đặt Android → Ứng dụng → EHIS Next → Quyền → Vị trí, cho phép khi sử dụng và bật Vị trí chính xác nếu máy có tùy chọn. Bật dịch vụ vị trí, đứng nơi thoáng; ghi thời gian lấy fix đầu, sai số/độ mới. Cache EHIS chỉ nhận <=15 giây và <=100m; điểm yếu/cũ phải bị từ chối.
3. Mở thanh âm lượng mở rộng của Samsung và đặt Media >0; lần lượt thử Bình thường, Rung, Im lặng bằng nút thử chuông và một ca mới. Dừng chuông hiện tại rồi gửi ca khác để xác nhận không bị mute lâu dài. Ghi thêm Bluetooth/tai nghe, Media=0 và DND như các điều kiện riêng; không coi có popup là nghe được âm.
4. V1/V2 OFF, P1/P2 dùng hai thẻ khác nhau báo; bật V1/V2 khi còn hạn trong 5km. Xác nhận thấy/chuyển được cả hai ca, một TNV chỉ nhận một ca; TNV kia nhận ca còn lại. Dùng Wi-Fi/4G, giữ app mở; ghi version/máy/giờ/ảnh và kết quả vào A01–A13.
