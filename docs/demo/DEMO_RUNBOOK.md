# EHIS — bốn người phối hợp chạy demo

[Danh mục tài liệu](../README.md) · [Bắt đầu từ đầu](../START_HERE_DEMO.md) · [Trạng thái phiên bản](../STATUS.md)

[Bắt đầu](../START_HERE_DEMO.md) · [Tài khoản](MANUAL_DEMO_ACCOUNTS.md) · [Khi có lỗi](DEMO_TROUBLESHOOTING.md). Tên nút theo source 0.4.10; tra STATUS để biết bản web/APK đang bàn giao. Điền tên thật của bốn thành viên trước buổi tập. Bản 0.4.7 còn dùng tên Kết thúc phiên hỗ trợ; 0.4.8 dùng Hoàn tất ca hỗ trợ.

## 1. Chia vai theo thiết bị thực có

| Thành viên | Chỉ có hai điện thoại + laptop | Có thêm thiết bị báo tin |
| --- | --- | --- |
| A — điều phối/Patient | Laptop P1; chuẩn bị A1 trước buổi; hô chuyển bước | Như cột bên |
| B — TNV chính | Android 1 dùng V1 | Android 1 dùng V1 |
| C — người báo | Android 2 quét QR và dùng web, không đăng nhập EHIS | Điện thoại 3 báo tin; Android 2 dành cho V2 |
| D — quan sát/TNV2 | Ghi thời gian, kết quả và ảnh; chuyển sang bài V2 ở vòng riêng | Android 2 dùng V2 để thử tranh ca |

Với hai điện thoại, chạy luồng một TNV trước là đủ cho vòng chính. Bài tranh ca hai TNV phải có thêm một nơi báo tin: điện thoại thứ ba hoặc laptop nếu định vị đủ tốt. Laptop không có GPS đủ tốt có thể bị chặn gửi; không cố biến điểm sai thành điểm hợp lệ. Nếu thiếu điều kiện thì ghi bài tranh ca trên thiết bị là Chưa thử; dùng bằng chứng Emulator đã có và nói rõ phạm vi.

Patient trên app web và người báo trên web QR có địa chỉ khác nhau, có thể dùng laptop cho cả hai nếu định vị đạt. Hai tài khoản V1/V2 không được mở bằng hai tab app cùng hồ sơ trình duyệt vì dùng chung phiên; dùng hai điện thoại hoặc hai hồ sơ trình duyệt.

## 2. Kiểm tra trước khi trình

| Ai | Làm gì | Đạt khi |
| --- | --- | --- |
| A | Mở app HTTPS, kiểm tra phiên bản và P1; lấy QR mới nhất | Thấy thẻ đang hoạt động, đúng P1 |
| B/D | Đăng nhập V1/V2, bật sẵn sàng, cho phép GPS và thử chuông | Máy chủ xác nhận sẵn sàng; có thể nghe chuông thử trên đúng máy |
| C | Chuẩn bị camera/trình duyệt; thử tại nơi có bệnh nhân giả | Trang QR mở được; định vị được phép |
| D | Ghi máy/mạng/phiên bản, phân ai nhận trước ở vòng chính | Có phiếu ghi và người quan sát |

Nếu app hiện lựa chọn đối tượng: tài khoản đã cấp chọn **Đã có tài khoản? Đăng nhập**, không tạo tài khoản trùng. Sau đăng nhập hệ thống tự mở Patient/TNV theo đối tượng đã lưu. V3 không phải tài khoản thay thế V1/V2 khi cần nhận ca vì V3 còn chờ duyệt.

## 3. Vòng chính — làm đúng thứ tự

| Bước | Người bấm | Thao tác | Những người còn lại phải thấy |
| --- | --- | --- | --- |
| 1 | A | P1 mở phần Thẻ EHIS và đưa QR lên màn hình. Hồ sơ/QR đã chuẩn bị, không cần thu hồi/tạo lại mỗi lần | C thấy QR rõ. Nếu vừa sửa hồ sơ, bấm Lưu hồ sơ và chờ xác nhận trước |
| 2 | B | Bật sẵn sàng V1, thử chuông, giữ màn mở | D xác nhận V1 sẵn sàng trước khi C gửi |
| 3 | C | Quét QR P1, xác nhận đang cạnh bệnh nhân, bấm Báo tình nguyện viên gần đây | Đang gửi → backend xác nhận → web mở bảng hỏi. Chưa ai được nói TNV đã nhận |
| 4 | C | Chọn ba câu theo tình huống giả; không rõ thì chọn Không rõ; bỏ trống phone rồi gửi bổ sung | Web xác nhận đã ghi nhận bổ sung; không tạo ca mới |
| 5 | B | Khi cảnh báo đỏ hiện, bấm Nhận ca | Chỉ sau xác nhận máy chủ mới xem chi tiết; C thấy TNV đã nhận, A thấy trạng thái thay đổi |
| 6 | B/C | Xem bản đồ trong app. Nếu thử GPS, đi bộ an toàn và giữ màn chỉ đường mở. C chỉ cập nhật điểm khi đứng cạnh điểm mới và xác nhận | Ký hiệu A/B trên bản đồ lần lượt là vị trí TNV/điểm cần hỗ trợ, khác tên thành viên A/B; tọa độ điểm bệnh nhân không tự chạy theo người báo. Thời gian tuyến chỉ tham khảo |
| 7 | B | Bấm Xác nhận đã đến nơi khi đến điểm diễn tập | A/C thấy TNV xác nhận đã đến; đây là thao tác xác nhận của TNV |
| 8 | B | Bấm Hoàn tất ca hỗ trợ và xác nhận | A/C thấy ca kết thúc; B không còn xem hồ sơ riêng/bản đồ của ca |
| 9 | B/D | Tắt sẵn sàng V1/V2, đối chiếu trạng thái đã cập nhật | Không còn ca giả dang dở hoặc TNV bị bỏ quên đang ON |

QR P1 bật chia sẻ hồ sơ. Nếu dùng P2, đúng người nhận vẫn thấy điểm và báo cáo nhưng **không được thấy hồ sơ sức khỏe**; đó là kết quả mong đợi. Không sửa lựa chọn chia sẻ để cố cho test qua.

TNV phải bật trước bước gửi: hệ thống chọn người phù hợp khi tạo yêu cầu, không tự mời lại một TNV vừa bật sau đó. Đóng popup chỉ là đã xem/dừng chuông, không phải nhận ca. Nếu gửi nhầm, chỉ hủy ca chưa có TNV nhận; không cố hủy ca đã được phân công.

## 4. Vòng mở rộng — mỗi lần một tình huống

| Bài | Chuẩn bị | Kết quả mong đợi |
| --- | --- | --- |
| Hai TNV tranh ca | V1/V2 cùng sẵn sàng trước gửi, hai người bấm nhận gần đồng thời | Một người thắng; người còn lại bị từ chối/đóng lời mời, không có thông tin riêng |
| Hai Patient | Có P1/P2 trên phiên khác nhau, lần lượt thử rồi mới gửi gần đồng thời | Không trộn hồ sơ/điểm; một TNV không nhận hai ca active |
| Không chia sẻ | QR P2 | Không hiển thị hồ sơ ngay cả sau nhận |
| Chờ duyệt | V3 thử trước; A1 chỉ mở /admin | V3 chưa bật được sẵn sàng. A1 duyệt khi muốn; sau duyệt V3 không còn pending |
| Mất mạng/đổi mạng | Chỉ thử sau vòng chính, quan sát một máy một lần | Không báo thành công giả; nối lại theo cùng ca, không bấm gửi hàng loạt |
| Không TNV/hết hạn | Các TNV tắt trước gửi, hoặc không ai nhận | Web thể hiện chưa có người nhận; không nói đã điều phối cứu hộ |

Chọn thêm từ [A01–A13](../testing/ACCEPTANCE_FLOW.md). Không vừa thử lỗi mạng/GPS, vừa trình vòng chính lần đầu. Tài khoản/hồ sơ chung là dữ liệu thử nhưng không xóa ca của người khác; thống nhất ai đang dùng P1/P2 trước khi bắt đầu.

## 5. Phiếu ghi đơn giản

Mỗi dòng ghi: ngày/người thử; bản app; máy/mạng; mã bài; bước; mong đợi; thực tế; Đạt/Không đạt/Chưa thử/Bị chặn; ảnh/Issue; người thử lại. Ghi ca rút gọn để phân biệt, không ghi mật khẩu hoặc bệnh án thật.

Một người dùng cùng đồng hồ/video đo gửi→ack, ack→cảnh báo và nhận→ack. Hai đồng hồ chưa đồng bộ không dùng để trừ thời gian. Nếu lỗi quyền, sai bệnh nhân/điểm hoặc báo thành công giả: dừng phần bị ảnh hưởng, ghi bằng chứng và tạo Issue theo [BUG_FIX_WORKFLOW](../testing/BUG_FIX_WORKFLOW.md).

## 6. Trình thầy/lớp

Tập một vòng 7–10 phút, chuẩn bị video/ảnh có phiên bản, xóa/ẩn dữ liệu nhạy cảm trước khi chia sẻ. Dùng video đã ghi khi mạng lỗi và nói rõ là bằng chứng diễn tập, không giả vờ ca live đã thành công. Nêu giới hạn: cần Internet, chưa xác minh tiếp nhận nền/khóa máy và chưa vận hành cấp cứu thật. Kế hoạch tuần thầy xem, midterm và cuối kỳ: [MIDTERM_DEMO](../planning/MIDTERM_DEMO.md).

## Vòng bổ sung sau sửa 0.4.9

Tắt V1/V2 → P1/P2 dùng hai thẻ khác nhau gửi ca → V1 bật sẵn sàng trong 5km khi ca còn hạn → xác nhận thấy cả hai và chuyển được trong popup → V1 nhận một ca, V2 bật muộn và nhận ca còn lại. Một thẻ chỉ có một ca active để chống trùng. Trên Samsung, thử chuông khi Bình thường/Rung/Im lặng với Media >0; ghi riêng Media=0, DND, Bluetooth, nền/khóa máy. Không ghi đạt nếu chỉ thấy popup.
