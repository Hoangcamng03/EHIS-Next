# Android — cài đặt và nghiệm thu

## 1. Chọn đúng bản

[STATUS](../STATUS.md) là nơi tra cứu phiên bản. Mốc bàn giao 25/10: APK 0.4.7/code 5 đã FINISHED và xác minh artifact; source 0.4.8 còn local. [Trang cài cố định](https://ehis-next-20261021-hc03.web.app/install). Không tải APK lịch sử chỉ vì thấy link trong báo cáo cũ.

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
