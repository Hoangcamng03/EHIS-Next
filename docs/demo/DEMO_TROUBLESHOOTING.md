# EHIS — xử lý vướng mắc khi chạy demo

[Danh mục tài liệu](../README.md) · [Bắt đầu từ đầu](../START_HERE_DEMO.md) · [Trạng thái phiên bản](../STATUS.md)

[Bắt đầu](../START_HERE_DEMO.md) · [Runbook](DEMO_RUNBOOK.md). Làm theo dòng khớp hiện tượng; nếu chưa được, giữ bằng chứng và nhờ người phụ trách, không liên tục bấm gửi/nhận.

| Hiện tượng | Kiểm tra và cách xử lý | Đã giải quyết khi |
| --- | --- | --- |
| Repo mật khẩu hiện 404 | Đăng nhập GitHub đúng tài khoản; repo private hiện chỉ chủ dự án có quyền. Nhờ chủ dự án phân tài khoản hoặc tự mời collaborator nếu muốn | Xem được mục bộ tài khoản 25/10; không cần bật repo public |
| Không đăng nhập được | Dùng đúng bộ CLOUD mới; copy đủ email/mật khẩu, không thêm dấu cách. Không dùng tài khoản QA local/Emulator. Kiểm tra Internet | Đăng nhập được và mở đúng Patient/TNV |
| Không nhận được thư Quên mật khẩu | Các email .test không có hộp thư thật. Dùng mật khẩu được cấp; nhờ chủ dự án xử lý nếu mất | Dùng lại được tài khoản, không khẳng định tính năng email đã được thử |
| App mở khu vực khác dự kiến | Kiểm tra đang dùng P1/P2 hay V1/V2. Hai tab cùng app/origin chia sẻ phiên cloud; dùng thiết bị/hồ sơ riêng | Mỗi người đúng tài khoản, không dùng A1 trong app Patient/TNV |
| Đăng ký xong chưa nhận ca được | TNV cần nộp đơn và được duyệt. V3 cố ý đang pending, A1 chỉ duyệt khi nhóm muốn thử | Trạng thái duyệt đúng; V1/V2 không cần đăng ký lại |
| APK bị Android chặn | Xác minh tải từ trang cài nhóm, ghi nguyên cảnh báo. Dùng web để thử UI trong lúc xử lý; không tắt Play Protect | Cài được mới ghi đạt APK; dùng web chưa chứng minh APK đã chạy |
| Điện thoại không mở được localhost | localhost là thiết bị hiện tại, không phải laptop của bạn. Dùng URL HTTPS cloud trong trang bắt đầu | App/QR mở đúng website cloud |
| Không lấy được vị trí | Kiểm tra quyền vị trí của app/trình duyệt và dịch vụ định vị. Đứng nơi thoáng, thử lại. Người báo phải cạnh bệnh nhân giả; laptop có thể không lấy vị trí đủ chính xác | Web chấp nhận điểm thật vừa xác nhận; không tự nhập tọa độ giả vào bản cloud |
| Gửi xong không TNV nào được mời | TNV đã bật trước gửi chưa, đã duyệt/chưa bận, có ở gần và điểm mới không? Hiện dispatch trong 5km, vị trí TNV quá 5 phút không được chọn. Sau khi sửa điều kiện, hủy ca chưa nhận rồi tạo ca mới theo runbook | Có lời mời đúng tài khoản; không coi bật ON sau gửi là sẽ tự có lời mời cũ |
| Có popup nhưng không nghe chuông | Bấm thử chuông bằng tay, kiểm tra âm lượng/tắt âm và giữ màn mở phía trước. Rung phụ thuộc thiết bị/trình duyệt | Ghi kết quả thực từng máy; popup không đồng nghĩa loa/rung đã đạt |
| Bấm Đã xem nhưng chưa có map | Đã xem chỉ đóng popup. Cần Nhận ca và mở đường đi, chờ backend xác nhận; có thể người khác vừa nhận | Đúng một TNV được phân công; chưa nhận không được xem private/map |
| Người thứ hai không nhận được | Nếu đang thử tranh ca, kiểm tra ai đã nhận. Đây có thể là kết quả đúng. Một TNV đã bận cũng không nhận thêm ca active | Một người phụ trách, không nhân đôi ca hoặc cấp quyền tay để vượt chặn |
| TNV nhận rồi không thấy hồ sơ | Với P2, đó là lựa chọn không chia sẻ. Với P1, kiểm tra đúng ca/người nhận và kết nối | Đúng consent và đúng phân công, không lộ hồ sơ cho người khác |
| Bản đồ/tuyến không tải | Giữ Internet, kiểm tra GPS/điểm A/B và thử lại mục xem đường. Nếu dịch vụ tuyến lỗi, ghi lỗi; không thay bằng đoạn thẳng rồi gọi là chỉ đường | Tuyến thật xuất hiện hoặc UI báo không tính được rõ ràng |
| GPS và điểm người bệnh không khớp | B lấy từ vị trí người báo lúc xác nhận, không từ QR hay Patient. Khi được phép, người báo đứng tại điểm mới rồi xác nhận cập nhật | TNV nhận điểm mới được xác nhận; kiểm tra lối vào, không chỉ nhìn pin |
| Mất mạng khi gửi/nhận | Giữ nguyên trình duyệt/phiên, nối lại và thử lại tại trang đó để dùng cơ chế chống lặp. Không mở nhiều tài khoản/QR để gửi bù | Server chỉ có một kết quả hợp lệ, không báo thành công khi chưa có ack |
| Đóng/mở trang báo bằng trình duyệt khác không thấy ca | Phiên người báo thuộc trình duyệt đã gửi. Không xóa dữ liệu trình duyệt/đổi hồ sơ giữa ca | Quay lại đúng phiên; không công khai mã ca để tìm cách truy cập |
| QR đang có ca, không báo thêm được | Chỉ một ca active/thẻ. Đúng TNV kết thúc hoặc đúng người báo/Patient hủy nếu chưa nhận | Ca cũ đóng trước khi thử vòng mới; không xóa Firestore để dọn |
| Điện thoại vẫn hiển thị giao diện cũ | Kiểm tra phiên bản và /install. Source 0.4.8 chưa phát hành không tự xuất hiện trong APK 0.4.7 | Các máy cùng bản đã phát hành; chưa gọi publish là đã cài trên máy |

## Khi cần nhờ sửa

Gửi cho người phụ trách: bản app, thiết bị/mạng, mã P1/V1… (không mật khẩu), bước vừa bấm, điều mong đợi, điều thực tế, giờ và ảnh đã che dữ liệu. Gắn Issue khi có thể tái hiện. Không gửi screenshot chứa bảng đăng nhập private vào Issue public.

## Điểm dừng của buổi thử

Nếu sai người/sai điểm, lộ thông tin hoặc trạng thái thành công không đúng: dừng phần đó và ghi lỗi. Khóa màn hình/đóng app chưa được xác minh tiếp nhận nền; không giữ một ca giả mở vô hạn để chờ chuông. Cuối buổi kiểm tra ca đã đóng và TNV OFF; bài chưa thực hiện phải ghi Chưa thử.
