# EHIS — bản trình thầy và midterm

Cập nhật 25/10/2026. Mục tiêu chủ dự án: thầy xem tiến độ khoảng tuần 26/10–01/11; midterm khoảng giữa tháng 11, chưa chốt ngày/thời lượng. Đây là trình diễn phần mềm có kiểm soát với hồ sơ và tình huống giả, không tiếp nhận cấp cứu thật.

**Tài liệu buổi thử cho người mới:** [bắt đầu](START_HERE_DEMO.md) → [runbook](DEMO_RUNBOOK.md) → [xử lý lỗi](DEMO_TROUBLESHOOTING.md). Dùng 0.4.7 hiện hành; 0.4.8 đang sửa local, chưa deploy/build APK mới. Bản hướng dẫn không phải xác nhận nghiệm thu thiết bị.

## 1. Mở đúng nơi

- [Trang cài Android và mở web](https://ehis-next-20261021-hc03.web.app/install).
- [App Bệnh nhân/Tình nguyện viên](https://ehis-next-20261021-hc03-app.web.app).
- Website người qua đường mở từ QR; quản trị ở `/admin` trên website người báo.
- Tài khoản dùng chung: repo riêng tư được dẫn ở đầu [LAB_NOTES](LAB_NOTES.md). Không đưa mật khẩu lên slide, video hoặc GitHub public. Các tài khoản Emulator không đăng nhập được cloud/APK.
- Phiên bản nguồn đợt này: 0.4.8/code 6. Mốc đã deploy/build/kiểm chứng xem [VERIFICATION_V0_4_8](VERIFICATION_V0_4_8.md); không coi đổi source là máy đã cập nhật.

## 2. Kịch bản diễn tập đề xuất 7–10 phút

| Thứ tự | Người thực hiện | Thao tác và điều cần giải thích |
| --- | --- | --- |
| Chuẩn bị | Cả nhóm | Cài đúng APK lên hai Android; một Wi-Fi, một 4G. Laptop dùng Patient/người báo. Kiểm tra quyền GPS, âm lượng, kết nối; chỉ dùng dữ liệu giả. TNV thử phải được duyệt trước buổi diễn. |
| 1 | Thành viên 1 — Patient | Đăng nhập tự vào Bệnh nhân; lưu hồ sơ; tạo QR với lựa chọn chia sẻ. QR chỉ chứa đường dẫn/mã thẻ, không chứa bệnh án. Đưa QR lên màn hình cho người báo quét. |
| 2 | Thành viên 2 — TNV | Đăng nhập tự vào TNV; bật sẵn sàng, cho GPS, thử chuông. Giữ màn TNV mở. |
| 3 | Thành viên 3 — người báo | Quét QR, xác nhận đang ở cạnh bệnh nhân, gửi yêu cầu. Chỉ sau ack backend mới sang bảng hỏi; không nói đã có người cứu khi chỉ mới có ack. |
| 4 | Thành viên 3 | Trả lời ba câu quan sát, để trống số điện thoại rồi gửi. Không cần kết luận hoặc hướng dẫn y khoa chưa được duyệt. |
| 5 | Thành viên 2 | Cảnh báo đỏ → nhận ca → chỉ sau API xác nhận mới mở thông tin được chia sẻ/bản đồ. Giải thích điểm A/B, sai số GPS và thời gian tuyến tham khảo. |
| 6 | Thành viên 4 — quan sát/TNV2 | Thử nhận cùng ca từ máy khác, hệ thống phải từ chối. Ghi kết quả thực; không chỉ đọc source để khẳng định. |
| 7 | Thành viên 2 và 3 | Reporter xác nhận đổi điểm khi cần, TNV nhìn tuyến mới; xác nhận đã đến → hoàn tất → đóng thông tin riêng. Patient thấy trạng thái kết thúc. |
| 8 | Cả nhóm | Tắt sẵn sàng; trình bày bằng chứng kiểm thử, lỗi đã sửa và các giới hạn còn mở. |

Nếu chỉ được 5 phút: bỏ bước đổi điểm/tranh ca trực tiếp, trình ảnh/video bằng chứng đã ghi trước và nói rõ đó là bằng chứng diễn tập. Không phát cảnh báo hoặc gọi số cấp cứu thật để minh họa.

## 3. Mỗi người chuẩn bị một đầu ra

| Người | Trước khi thầy xem | Sau phản hồi của thầy |
| --- | --- | --- |
| TV1 — tích hợp/backend | Phiên bản, sơ đồ dữ liệu/quyền, bằng chứng API/CI; kiểm tra quay lui | Phân loại phản hồi, điều tra độ trễ/quota, giữ API contract |
| TV2 — Patient và giao diện | Hồ sơ giả/QR, thứ tự thao tác, thử màn nhỏ/cỡ chữ lớn | Tối ưu form, lưu/chia sẻ/thu hồi dữ liệu theo phản hồi |
| TV3 — TNV/Android | Hai máy, GPS/loa/rung/đổi mạng; điền A01–A13 | Đánh giá nhận nền, định vị và pin bằng kiểm thử thiết bị |
| TV4 — web/nghiệm thu/tài liệu | Người báo/admin, chụp màn hình, video dự phòng và lab note | Kịch bản người dùng, báo cáo lỗi, tổng hợp số đo và kết quả |

Mỗi thay đổi có một người khác review; lỗi do TV nào sửa thì người khác thử lại. Tên thực tế do nhóm tự phân công.

## 4. Điều kiện trước buổi trình

1. Các kiểm tra tự động và cloud đạt; không còn lỗi P0/P1 đã biết trong luồng sẽ trình. Các lỗi còn mở phải được phân loại và công bố phạm vi ảnh hưởng.
2. Nhóm hoàn thành [A01–A13](ACCEPTANCE_FLOW.md), tối thiểu hai vòng độc lập; GPS/chuông/rung không thể nghiệm thu thay bằng trình duyệt PC. Riêng nhận nền chưa hỗ trợ được xác minh thì ghi giới hạn, không đánh dấu đạt.
3. Ghi máy, mạng, phiên bản, thời gian gửi→ack→cảnh báo/nhận, kết quả và ảnh. Không dùng một lượt nhanh hoặc số Emulator làm SLA.
4. Có ảnh/video và QR đã kiểm tra từ trước. Nếu mạng/dịch vụ bản đồ lỗi khi trình: nói đúng lỗi, chuyển sang bằng chứng đã ghi; không hiển thị trạng thái thành công giả.
5. Sau buổi thử kiểm tra các TNV thử đã OFF, không để ca giả dang dở. Không xóa dữ liệu người khác để dọn demo.

## 5. Đi tiếp cho cuối kỳ

| Ưu tiên | Mốc và đầu ra | Điều kiện hoàn thành |
| --- | --- | --- |
| Cao | Chốt phản hồi thầy và kết quả hai Android; sửa lỗi P0/P1 trước tính năng | Issue tái hiện được, bản sửa có regression/bằng chứng máy thật |
| Cao | Hiệu năng và bảo mật: cold/warm, nhiều ca, dependency advisory, quota và query có quyền | Báo cáo số mẫu/điều kiện, advisory được phân tích/vá tương thích; không force downgrade hoặc tắt Rules |
| Cao | Quyết định có nhận ca khi khóa máy hay không; nếu có, thiết kế push/lifecycle và chống nhận trùng | Thử foreground/background/khóa máy/mạng yếu/Android tiết kiệm pin; không coi listener là push |
| Trung bình | GPS thực địa và bản đồ: điểm cũ, pin, đường vào/tầng/phòng, nhà cung cấp và dữ liệu vị trí | Đi bộ an toàn, số đo lặp lại; chọn phạm vi không vượt quyền/hạn mức dịch vụ |
| Trung bình | Quản trị dữ liệu thử: consent, thu hồi, thời hạn giữ/xóa, audit không có PHI | Có kiểm thử quyền và hướng dẫn vận hành; chưa dùng dữ liệu y tế thật khi chưa có người phụ trách |
| Trung bình | Báo cáo cuối kỳ: yêu cầu→thiết kế→triển khai→kiểm thử→hạn chế | Mỗi kết luận có phiên bản, bằng chứng và số đo; phân biệt mục tiêu với tính năng đã làm |
| Thấp | iOS native, NFC, điều phối nhiều đợt hoặc tính năng mở rộng khác | Chỉ làm sau MVP ổn và có nguồn lực, ưu tiên do thầy/nhóm chốt |

Ngày báo cáo cuối kỳ chưa được cung cấp nên các mốc trên xếp theo thứ tự, không tự đặt hạn nộp. Chưa mở ca thật khi chưa có đơn vị/chuyên môn phụ trách, đội TNV được xác minh, dự phòng và trách nhiệm vận hành.
