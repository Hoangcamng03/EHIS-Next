# Bộ ảnh và ghi chú thuyết trình EHIS

Ảnh mới ngày12/11 và ảnh cloud ngày11/11 được ghi ngày riêng. Tên hiển thị dùng tên bình thường; bộ dữ liệu vẫn là hư cấu được cho phép. Ảnh là mobile web, không suy ra nghiệm thu APK/GPS/âm thanh thiết bị.

## Tình huống đã chạy lại ngày12/11

Cloud thật: tự mời bàn giao; gửi lặp không tạo nhiều đề nghị; hai TNV nhận đồng thời chỉ một thắng; chưa phân công bị403; người cũ mất quyền; không có người thay thì giữ ca; TNV ONmuộn nhận thay.2ca đã kết thúc,3TNV OFF/noactive. Không mô phỏng kết quả.

Các tình huống chưa được đo lại trong lượt này: nhiều thiết bị/di chuyển, mạng4G độc lập, chuông nền, tải lớn cloud và lỗi tự thoát APK. Không trình bày chúng là đã đạt.

## Ảnh 1 Hồ sơ sức khỏe cá nhân

![Hồ sơ sức khỏe cá nhân](../../assets/presentation-2026-11-12/01-patient-profile.jpg)

- **Nguồn:** 12/11/2026 — chụp mới.
- **Thao tác:** Mở Patient sau khi đổi tên hiển thị.
- **Quan sát:** Tên Nguyễn Minh An; hồ sơ bệnh nền và dị ứng được khôi phục từ Firebase.
- **Lời nói gợi ý:** “Người bệnh quản lý thông tin trước khi cần hỗ trợ.”

## Ảnh 2 Xác nhận đang cạnh bệnh nhân

![Xác nhận đang cạnh bệnh nhân](../../assets/presentation-2026-11-12/02-location-confirmation-required.jpg)

- **Nguồn:** 12/11/2026 — chụp mới.
- **Thao tác:** Chưa đánh dấu xác nhận vị trí.
- **Quan sát:** Nút báo TNV bị khóa.
- **Lời nói gợi ý:** “Xác nhận giúp hạn chế báo nhầm vị trí của người quét.”

## Ảnh 3 Không lấy được vị trí

![Không lấy được vị trí](../../assets/presentation-2026-11-12/03-gps-unavailable.jpg)

- **Nguồn:** 12/11/2026 — chụp mới.
- **Thao tác:** Xác nhận rồi thử gửi trên trình duyệt PC.
- **Quan sát:** Xem trạng thái thực tế trong ảnh; không ghi đã gửi thành công khi chưa nhận xác nhận backend.
- **Lời nói gợi ý:** “Khi không có GPS, ứng dụng cần phản hồi rõ và không dùng tọa độ mặc định.”

## Ảnh 4 TNV nhận cảnh báo

![TNV nhận cảnh báo](../../assets/presentation-2026-11-12/04-alert.jpg)

- **Nguồn:** 11/11/2026 — ảnh cloud đã kiểm chứng.
- **Thao tác:** Người báo gửi tình trạng và hệ thống mời TNV.
- **Quan sát:** Hiện triệu chứng và nút Nhận ca.
- **Lời nói gợi ý:** “TNV xem quan sát ban đầu; hồ sơ riêng chỉ mở sau nhận ca.”

## Ảnh 5 Tình trạng được cập nhật

![Tình trạng được cập nhật](../../assets/presentation-2026-11-12/05-update.jpg)

- **Nguồn:** 11/11/2026 — ảnh cloud đã kiểm chứng.
- **Thao tác:** Người báo đổi câu trả lời và gửi bản tiếp theo.
- **Quan sát:** App TNV hiển thị bản tình trạng số2.
- **Lời nói gợi ý:** “Cập nhật gắn với cùng một ca, tránh tạo nhiều yêu cầu trùng.”

## Ảnh 6 TNV không thể tiếp tục

![TNV không thể tiếp tục](../../assets/presentation-2026-11-12/06-handover.jpg)

- **Nguồn:** 11/11/2026 — ảnh cloud; API chạy lại12/11 đạt.
- **Thao tác:** Người phụ trách đề nghị tìm người thay.
- **Quan sát:** TNV thứ hai thấy đề nghị và nút Xác nhận nhận bàn giao.
- **Lời nói gợi ý:** “Chỉ chuyển quyền sau khi người mới xác nhận; không để ca mất người phụ trách.”

## Ảnh 7 TNV kết thúc ca

![TNV kết thúc ca](../../assets/presentation-2026-11-12/07-completed.jpg)

- **Nguồn:** 11/11/2026 — ảnh cloud đã kiểm chứng.
- **Thao tác:** Hoàn tất ca bằng xác nhận trên app.
- **Quan sát:** TNV trở về OFF; thông tin riêng của ca đóng bị backend chặn403.
- **Lời nói gợi ý:** “Hoàn tất ca phần mềm không có nghĩa đã xác nhận kết quả điều trị.”

## Ảnh 8 Chọn vai trò trước đăng ký

![Chọn vai trò trước đăng ký](../../assets/presentation-2026-11-12/08-role.jpg)

- **Nguồn:** 11/11/2026 — ảnh cloud giao diện.
- **Thao tác:** Mở Đăng ký.
- **Quan sát:** Hai lựa chọn Patient và Volunteer có mô tả ngắn.
- **Lời nói gợi ý:** “Hệ thống lưu mục đích tài khoản để các lần đăng nhập sau đi thẳng đúng khu vực.”

## Ảnh 9 Điều kiện đăng ký

![Điều kiện đăng ký](../../assets/presentation-2026-11-12/09-registration.jpg)

- **Nguồn:** 11/11/2026 — ảnh cloud giao diện.
- **Thao tác:** Mở form; chưa nhập và chưa xác nhận dữ liệu.
- **Quan sát:** Nút Tạo tài khoản đang khóa.
- **Lời nói gợi ý:** “Người dùng biết vai trò, yêu cầu mật khẩu và chính sách dữ liệu trước đăng ký.”

