# EHIS 0.4.13 — GPS, điểm hẹn và theo dõi diễn tập

Đang xác minh; chỉ dùng dữ liệu giả. Các số dưới đây là lượt thực chạy, không phải kết quả giao thông báo trên điện thoại.

## Thay đổi

- TNV nhìn rõ GPS đã quá 5 phút; mở lại app khôi phục refresh foreground, không có GPS nền.
- Người báo thêm mốc cổng/tầng/phòng tùy chọn, tối đa 240 ký tự. Chỉ TNV đã nhận ca được xem; APK cũ không xóa ghi chú khi gửi payload thiếu trường mới.
- Admin xem số ca chờ/nhận/đến, ca quá hạn, hàng đợi gửi và năm ca chờ gần hết hạn. Cập nhật/thử lại là thủ công, không giả định có người trực hoặc worker liên tục.
- Hàng đợi bỏ job hết hạn trước giới hạn 20; receipt theo hash thiết bị và lease fencing giảm gửi lặp. Vẫn có cửa sổ mất xác nhận sau nhà cung cấp nhận; không cam kết exactly-once.
- Chưa có đầu mối trực: không điền số giả/cá nhân/115, chỉ hướng tới người phụ trách diễn tập tại chỗ.

## Bằng chứng đã có

- `check-13-final`: 21 test backend + 46 test logic/tool = **67 PASS**, lint/typecheck/build đạt, 30.715 ms. Source nền 544839b + worktree thay đổi, log SHA256 `aa07e78b6ba3abf24c6cdbb6f8f7bc173d3326b309d3e50c49dea4deefe6e8e4`.
- `integration-13`: 14 suites PASS trước bổ sung truy vấn loại backlog hết hạn. `integration-13-final`: FAIL khởi động công cụ (port 4400/quyền môi trường), không phải PASS nghiệp vụ; lượt chạy lại được giữ riêng.
- Receipt trong bài test là fixture tổng hợp kiểm tra giao dịch Firestore thật; không giả FCM đã nhận/giao. Emulator chủ động bỏ gửi FCM.

## Chưa kết luận

### Vòng cuối đã chạy

- Chốt sau sửa giữ sót triệu chứng: `check-13-release` **67 PASS**; `integration-13-symptoms` **14 suites PASS**, hash `8061046e991a372400bd499b564e8ba1f8fe6460c8ef17291fd2d166117f9a5a`; `scale-13-release` **PASS**, 320 API/32 ca, lời mời p50 **597 ms**, p95 **925 ms**, max **942 ms**. Đây là lượt cuối; số926 ms bên dưới thuộc lượt trước và được giữ để đối chiếu. Không thay số cũ bằng số đẹp hơn.

- `integration-13-final-retry`: **14 suites PASS**, 254.165 ms; hash log `6402f78cafcbffe5b045cedd22de6aef7cafea27d0a49ffb970f69d02aa9b756`. Có bài query chọn job thật với 25 job hết hạn, hai job hợp lệ và lease chưa đến hạn; không gọi FCM.
- `scale-13`: **PASS**, 1.000 Auth (128 phiên/872 offline-pending), 64 TNV ready, 32 SDK feeds/32 ca đồng thời/tám vùng/**320 API**. Lời mời realtime local p50 **592 ms**, p95 **926 ms**, max **942 ms**. Không đo FCM; không phải 1.000 người đang dùng đồng thời. [JSON số thực](VERIFICATION_V0_4_13.json) giữ mẫu và hash log. Một lượt không chứng minh nhanh hơn bản cũ.
- Browser local đạt các nhánh GPS cũ→OFF→điểm giả mới, nhận ghi chú khi bỏ phone, private chỉ sau accept và đóng khi completed, fallback không có TNV/đầu mối, bảng admin. **PARTIAL** vì tile OSM vẫn không tải đủ; OSRM trả tuyến 0,78 km. Không thay phiếu máy thật. Các lần clipboard nhập sai/fixture trước khi dịch vụ sẵn sàng được giữ riêng.
- Qua browser đã phát hiện/sửa lỗi giữ thông báo lỗi GPS cũ dù refresh mới thành công. OFF chờ heartbeat đang gửi xong trước khi ghi OFF. Kiểm tra mã/UI cuối ghi trong JSON theo đúng attempt.

Đang chờ hồi quy cuối, tải local, browser, cloud và APK mới. APK công khai vẫn là bản 0.4.12 đã được verifier xác minh cho đến khi có artifact mới đạt kiểm tra. Không ghi điện thoại đã cập nhật nếu nhóm chưa cài/xác nhận.

Chưa thử máy thật: GPS, âm/rung, Home/khóa, Wi-Fi/4G/5G, pin/quyền theo hãng. Chưa nghiệm thu tải cloud, SLA, xử lý ca thật hoặc chuyên môn y tế. Các vấn đề lịch sử map tile/Functions lạnh/dependency vẫn mở nếu không có bài thử mới đóng chúng. FCM có [hạn chế life-critical](https://firebase.google.com/docs/cloud-messaging/customize-messages/setting-message-priority#life_critical_use_cases); đây chỉ là diễn tập phần mềm, không phát hành dịch vụ cấp cứu thật.
