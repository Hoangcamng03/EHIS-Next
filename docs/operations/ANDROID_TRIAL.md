# Android — cài đặt và nghiệm thu

## 1. Chọn đúng bản

[STATUS](../STATUS.md) là nơi tra cứu phiên bản đang bàn giao và việc còn thiếu. Luôn lấy bản mới từ [trang cài cố định](https://ehis-next-20261021-hc03.web.app/install), đối chiếu STATUS trước mỗi buổi; không dùng APK lịch sử chỉ vì thấy link trong báo cáo cũ. File APK đã kiểm tra không đồng nghĩa đã cài hoặc nghiệm thu trên điện thoại.

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

## 5. Phối hợp kiểm thử qua USB — Samsung Galaxy

Kết nối vào máy tính đang làm dự án bằng cáp truyền dữ liệu. Không cần cài Android Studio chỉ để kết nối; dùng [Platform-Tools chính thức của Google](https://developer.android.com/tools/releases/platform-tools). Nhóm đã chuẩn bị bản portable trong thư mục local bị Git bỏ qua; không đổi PATH hoặc tự cài/gỡ EHIS khi chỉ kiểm tra kết nối.

1. Trên điện thoại: Cài đặt → Thông tin điện thoại → Thông tin phần mềm → Số hiệu bản tạo; chạm7 lần. Chủ máy tự nhập PIN nếu được hỏi, không gửi PIN vào chat. [Hướng dẫn Samsung](https://www.samsung.com/uk/support/mobile-devices/how-do-i-turn-on-the-developer-options-menu-on-my-samsung-galaxy-device/).
2. Quay lại Cài đặt → Tùy chọn nhà phát triển → Gỡ lỗi USB. Mở khóa màn hình, cắm cáp.
3. Điện thoại có thể hỏi Cho phép gỡ lỗi USB; chủ máy kiểm tra đúng máy tính của mình rồi tự chấp thuận. Chỉ thấy thiết bị ở trạng thái `unauthorized` chưa có nghĩa kết nối kiểm thử được. [Cơ chế xác nhận Android](https://developer.android.com/studio/run/device).
4. Sau khi được cấp quyền: kiểm tra model/Android và phiên bản package EHIS. Chỉ sau đó mới chọn bài thử. Nếu cần cài đè, kết thúc ca trước; không gỡ app hoặc xóa dữ liệu để che lỗi.
5. Chỉ đọc log/ảnh của EHIS khi đang thử bằng dữ liệu giả; không thu toàn bộ log điện thoại, tài khoản cá nhân, số serial hay vị trí thật vào GitHub. Nghe chuông/cảm nhận rung/đối chiếu vị trí đứng cần người cầm máy xác nhận.
6. Hết buổi: kiểm tra ca đã đóng, TNV OFF, rút cáp; chủ máy có thể tắt Gỡ lỗi USB/thu hồi quyền máy tính khi không còn dùng.

Nếu không thấy hộp thoại: mở khóa, kiểm tra cáp/cổng dữ liệu và kết nối lại. Nếu Samsung báo chính sách bảo vệ chặn USB, ghi nguyên cảnh báo và xác định nguyên nhân trước; không tự tắt các cơ chế bảo vệ thiết bị.

Lượt S22+08/11 đã kết nối/điều khiển thật, cài đè16 và xác nhận chuông foreground có tiếng/rung. [Ảnh, lỗi15 được giữ và các bài chưa thử](../testing/verification/VERIFICATION_V0_4_16.md). Khi cửa sổ phản chiếu chậm, không dùng ảnh cũ để chọn nút hoặc đo app lag: đọc trạng thái/bounds hiện tại của chính EHIS bằng công cụ kiểm thử Android; không thao tác app khác hoặc màn mật khẩu/quyền hệ thống. USB chỉ phục vụ kiểm thử/điều khiển; APK đã cài chạy độc lập, gửi/nhận dữ liệu vẫn cần Internet.

Người đóng gói xem [MOBILE_RELEASES](MOBILE_RELEASES.md); lịch sử APK cũ ở [ANDROID_TRIAL_HISTORY](https://github.com/Hoangcamng03/EHIS-Next/blob/f921d33/docs/ANDROID_TRIAL_HISTORY.md). Không phát hành hoặc đổi cloud khi chỉ đang chạy bài thử.

## Kiểm tra hồi quy GPS, chuông và nhiều ca trên Samsung/Android

1. Cài đè APK từ trang cài, không cần gỡ bản cũ. Vào Tài khoản và cài đặt, kiểm tra phiên bản khớp bản tải được bàn giao trong STATUS. Dừng ca đang thử trước khi cập nhật.
2. Trong Cài đặt Android → Ứng dụng → EHIS Next → Quyền → Vị trí, cho phép khi sử dụng và bật Vị trí chính xác nếu máy có tùy chọn. Bật dịch vụ vị trí, đứng nơi thoáng; ghi thời gian lấy fix đầu, sai số/độ mới. Cache EHIS chỉ nhận <=15 giây và <=100m; điểm yếu/cũ phải bị từ chối.
3. Mở thanh âm lượng mở rộng của Samsung và đặt Media >0; lần lượt thử Bình thường, Rung, Im lặng bằng nút thử chuông và một ca mới. Dừng chuông hiện tại rồi gửi ca khác để xác nhận không bị mute lâu dài. Ghi thêm Bluetooth/tai nghe, Media=0 và DND như các điều kiện riêng; không coi có popup là nghe được âm.
4. V1/V2 OFF, P1/P2 dùng hai thẻ khác nhau báo; bật V1/V2 khi còn hạn trong 5km. Xác nhận thấy/chuyển được cả hai ca, một TNV chỉ nhận một ca; TNV kia nhận ca còn lại. Dùng Wi-Fi/4G, giữ app mở; ghi version/máy/giờ/ảnh và kết quả vào A01–A13.

## Thử giao diện bản APK hiện hành

1. Tra STATUS/trang cài trước; phiên bản trong app phải khớp bản được bàn giao ở đó. Dừng ca diễn tập trước khi cài đè.
2. Đăng nhập, chạm sát mép trong nút; mở bàn phím rồi bấm nút một lần. Kéo trang rồi chạm, kiểm tra không nhận nhầm thao tác kéo thành nhận ca.
3. Bấm cả chữ ở hàng Sẵn sàng/Rung/Chia sẻ, không cần nhắm đúng biểu tượng nhỏ. Khi đang xử lý, nút phải khóa và hiện trạng thái chờ.
4. Kiểm tra chữ mặc định, sau đó tăng cỡ chữ hệ thống: nội dung phải xuống dòng, cuộn được và nút vẫn thao tác được. Không tắt phóng chữ để che lỗi.
5. Hai Patient báo trước TNV ON, chuyển ca thứ hai, Nhận ca → map/zoom → Đã đến nơi → Hoàn tất ca hỗ trợ → Quay lại → xác nhận. Đóng · Xem danh sách ca chỉ đóng popup, không hủy ca.
6. Ghi model/Android, cỡ chữ, bước bị bỏ chạm và video/ảnh vào phiếu A01–A13. Browser đã đạt không thay kết quả này.
