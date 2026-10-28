# Thông báo Android khi bấm Home / khóa màn hình

Source 0.4.11 dùng FCM trực tiếp và expo-notifications. Cần APK mới chứa cấu hình Firebase Android và âm báo, không thể bổ sung native module bằng việc mở lại APK cũ. Xem [STATUS](../STATUS.md) để biết bản nào đã build/deploy.

## 1. Luồng hoạt động

1. TNV đã duyệt đăng nhập APK → **Bật / kiểm tra thông báo Android** → cho phép thông báo. Mỗi tài khoản tối đa ba thiết bị. Đăng xuất gỡ thiết bị đã đăng ký trong phiên.
2. Bật sẵn sàng, xác nhận GPS. Backend tìm ca trong 5km bằng vị trí mới tối đa 5 phút. GPS chỉ làm mới khi app mở; khóa máy lâu hơn cần mở app và làm mới vị trí.
3. Backend ghi ca/lời mời và công việc gửi thông báo trong cùng transaction. Không gửi mạng bên trong transaction. Người báo nhận xác nhận tạo ca trước khi việc gửi FCM hoàn tất.
4. Vercel dùng `waitUntil` chạy gửi sau phản hồi. Công việc còn trong Firestore nếu bị gián đoạn; thử lại ở thao tác điều phối/heartbeat sau, tối đa năm lần trước hết hạn. Cron ngày chỉ bảo trì, không bảo đảm thử lại trong vài giây khi hệ thống không có truy cập.
5. Trước gửi kiểm tra ca, quyền, lời mời và trạng thái TNV. Thông báo ngoài màn hình khóa chỉ có câu chung và mã ca; không có tên, bệnh án, câu trả lời, điện thoại hay GPS. Chạm thông báo mở TNV; app tải lại quyền/trạng thái từ backend.
6. Khi app đang mở, feed và âm báo hiện có xử lý ca để tránh hai chuông chồng nhau. Thông báo FCM được Android hiển thị khi nền.

## 2. Giới hạn phải hiểu

- FCM chấp nhận gửi chưa chứng minh điện thoại nhận, hiện banner, phát chuông hoặc TNV đọc. Không có cam kết độ trễ cấp cứu từ gói miễn phí.
- Âm thông báo phụ thuộc quyền, cài đặt kênh, âm lượng thông báo, chế độ Im lặng/Không làm phiền, tiết kiệm pin, mạng và hãng máy. Không cam kết vượt mọi trạng thái tắt âm. Không dùng quyền bỏ qua Không làm phiền hoặc chuông toàn màn hình trong vòng này.
- Phạm vi là Home và khóa màn hình; không bảo đảm Buộc dừng, tắt máy, mất mạng, hoặc trình duyệt web bị đóng. Không có định vị nền.
- Công việc gửi có lease, thời hạn và tag theo ca để hạn chế trùng. Có thể giao ít nhất một lần khi crash sau gửi; vẫn cần app xác nhận trạng thái. Tối đa 20 công việc/đợt, 3 thiết bị/TNV, không phải hàng đợi cứu hộ có SLA.
- Khóa token chỉ dùng backend; client không được đọc token hoặc công việc gửi của mình/người khác. Thu hồi quyền TNV ngăn gửi mới, không xóa được thông báo đã gửi trên thiết bị.

## 3. Checklist trên hai máy thật (chưa mặc định đạt)

| Thử | Điều kiện / cách làm | Bằng chứng cần ghi |
| --- | --- | --- |
| Home | TNV ON + GPS mới; bấm Home; người báo tạo ca | Giờ gửi, giờ hiện thông báo, chuông/rung thực tế |
| Khóa | Lặp lại khi màn hình khóa, Wi-Fi rồi 4G/5G | Hãng/máy/Android, độ trễ thực đo, âm lượng |
| Ba ca | Ba QR/hồ sơ giả khác nhau, điểm gần/xa khác nhau | Đủ ba lời mời; chỉ nhận được một ca |
| Bổ sung | Người báo trả lời câu hỏi / đổi điểm có xác nhận | TNV nhận cập nhật, không lộ dữ liệu ở lock screen |
| OFF / GPS cũ | TNV OFF hoặc quá 5 phút | Không được chọn cho ca mới |
| Bị chặn | Từ chối quyền, tắt âm kênh, tiết kiệm pin | Ghi FAIL hoặc giới hạn quan sát, không giả PASS |
| Đăng xuất | Gỡ token, người khác dùng cùng máy | Không nhận ca tài khoản cũ; chỉ thấy dữ liệu được phép |

Không dùng bệnh án thật hoặc báo cấp cứu thật trong bài này. Khi chưa có đầu mối y tế chịu trách nhiệm, chỉ diễn tập phần mềm.
