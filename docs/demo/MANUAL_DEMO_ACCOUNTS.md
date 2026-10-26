# Bộ tài khoản cloud để tự demo — 25/10/2026

[Danh mục tài liệu](../README.md) · [Bắt đầu từ đầu](../START_HERE_DEMO.md) · [Trạng thái phiên bản](../STATUS.md)

**[Mở email, mật khẩu và QR trong repo riêng tư của nhóm](https://github.com/Hoangcamng03/EHIS-Next-Team-Access)** → mục đầu **BỘ TÀI KHOẢN DEMO MỚI — 25/10/2026**. Đăng nhập GitHub bằng tài khoản chủ repo; hiện chủ dự án tự quản lý việc thêm thành viên. Không đưa bảng mật khẩu vào slide, ảnh hoặc repo public.

| Mã trong bảng riêng tư | Dùng để thử | Trạng thái khi cấp |
| --- | --- | --- |
| P1 | Bệnh nhân 01 | Hồ sơ giả + QR, cho phép TNV nhận ca xem hồ sơ |
| P2 | Bệnh nhân 02 | Hồ sơ giả + QR, không chia sẻ hồ sơ cho TNV |
| V1 | TNV 01 | Đã duyệt để diễn tập; sẵn sàng OFF, chưa có ca |
| V2 | TNV 02 | Đã duyệt để diễn tập; sẵn sàng OFF, thử tranh nhận với V1 |
| V3 | TNV 03 | Đã nộp đơn, chờ duyệt; chưa được bật sẵn sàng |
| A1 | Quản trị | Chỉ dùng trang quản trị để thử duyệt V3 |
| Người qua đường | Quét QR P1/P2 | Không cần email/mật khẩu; giữ nguyên trình duyệt đã gửi để theo dõi |

Thành viên mới đọc [bắt đầu từ đầu](../START_HERE_DEMO.md), [runbook phối hợp](DEMO_RUNBOOK.md) và [xử lý lỗi thường gặp](DEMO_TROUBLESHOOTING.md). Trạng thái tài khoản trong bảng là lúc cấp; đọc lại trạng thái trong app trước mỗi vòng vì nhóm có thể đã dùng thử.

## Mở và thao tác theo thứ tự

1. [Tải APK hiện hành](https://ehis-next-20261021-hc03.web.app/install) hoặc [mở app web](https://ehis-next-20261021-hc03-app.web.app). Tài khoản cloud mới dùng được với bản hiện hành 0.4.7. Bản nguồn 0.4.8 vẫn đang nghiệm thu, chưa tự cập nhật lên điện thoại.
2. Laptop dùng P1; hai điện thoại dùng V1/V2. Trên TNV, cho phép GPS, bật sẵn sàng và thử chuông; giữ màn mở. Các tab cùng địa chỉ website chia sẻ phiên cloud, nên dùng thiết bị hoặc hồ sơ trình duyệt riêng cho các tài khoản khác nhau.
3. Người báo đứng cạnh bệnh nhân giả, quét QR P1, xác nhận vị trí và gửi. Khi máy chủ xác nhận, trả lời ba câu hỏi; có thể để trống số điện thoại.
4. V1/V2 cùng thử nhận: chỉ một người được phân công. Chỉ TNV nhận ca được mở thông tin và chỉ đường. Dùng P2 ở vòng sau để đối chiếu hồ sơ không được chia sẻ.
5. TNV phụ trách xác nhận đã đến → kết thúc; kiểm tra thông tin riêng đóng. Cuối buổi tắt sẵn sàng cả hai TNV. Nếu chưa ai nhận, Patient/người báo có thể hủy yêu cầu gửi nhầm.
6. [A1 mở quản trị](https://ehis-next-20261021-hc03.web.app/admin) để duyệt V3 khi muốn thử bước ứng tuyển. A1 không dùng trong app Patient/TNV. Sau khi tự duyệt, V3 không còn ở trạng thái chờ như lúc bàn giao.

## Phạm vi đã xác minh

Đã kiểm tra sáu mật khẩu đăng nhập qua Firebase Auth thật, đối tượng lưu trên backend, hai TNV được duyệt/OFF/no-active, V3 bị từ chối bật sẵn sàng, quyền admin chỉ ở A1 và TNV không đọc được hồ sơ Patient trực tiếp. P1/P2 chưa có lịch sử ca khi bàn giao. Không tạo ca/bật chuông tự động bằng bộ mới; để nhóm tự thao tác.

Email `.test` là email giả, không nhận thư Quên mật khẩu/xác minh. Bộ này dùng thử đăng nhập và luồng hỗ trợ; muốn thử gửi email cần tài khoản với hộp thư nhóm sở hữu. Không dùng dữ liệu y tế thật, không gọi số điện thoại giả trong hồ sơ. Chưa phải nghiệm thu giao diện/loa/rung/GPS trên máy thật hoặc đủ điều kiện tiếp nhận cấp cứu thật.

[Lab note](../LAB_NOTES.md) ghi mốc cấp; tài khoản cũ được giữ nguyên, không xóa/đổi mật khẩu trong lần này.
