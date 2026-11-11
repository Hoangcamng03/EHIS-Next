# Bộ tài khoản cloud để tự demo — cập nhật10/11/2026

[Danh mục tài liệu](../README.md) · [Bắt đầu từ đầu](../START_HERE_DEMO.md) · [Trạng thái phiên bản](../STATUS.md)

## Bộ mở rộng10/11 — 15tài khoản và10bộ đăng ký trống

**[Mở bảng riêng P7–P16/V7–V11/NEW01–NEW10](https://github.com/Hoangcamng03/EHIS-Next-Team-Access/blob/main/accounts/BULK_2026_11_10.md)**.15tài khoản đã kiểm tra đăng nhập thật;10Patient có medicalConditions/dị ứng giả đa dạng, P8/P11/P14 không chia sẻ.5TNV được duyệt diễn tập quaR1/A1, đềuOFF/no active khi cấp. NEW01–NEW10 chỉ là email/password gợi ý, đã kiểm tra0email tồn tại lúc10/11 06:49UTC; dùng màn Đăng ký, không đăng nhập. Khi nhóm sử dụng, trạng thái này sẽ thay đổi; không reset tài khoản đã dùng.5bộ dự kiến Patient,5bộ TNV. Không tạo ca tự động khi cấp.

Hồ sơ bệnh nền có từ web/source20; APK19 chưa có ô này. Tra [STATUS](../STATUS.md)/trang cài để biết APK mới hoàn tất chưa. Tất cả bệnh lý/kinh nghiệm/checklist là GIẢ; không dùng làm chứng nhận năng lực.

## Bộ bổ sung10/11/2026 — ưu tiên dùng cho lượt mới

**[Mở email, mật khẩu và QR của8tài khoản mới trong repo riêng tư](https://github.com/Hoangcamng03/EHIS-Next-Team-Access/blob/main/accounts/DEMO_2026_11_10.md)**. Nếu hiện404, đăng nhập GitHub có quyền repo hoặc nhờ chủ dự án phân tài khoản qua kênh riêng. Không đưa mật khẩu/QR vào slide/Issue public.

| Mã | Vai trò | Trạng thái khi cấp |
| --- | --- | --- |
| P3, P5 | Bệnh nhân | Hồ sơ giả + QR riêng; cho phép TNV đúng ca xem sau khi nhận |
| P4, P6 | Bệnh nhân | Hồ sơ giả + QR riêng; không chia sẻ bệnh án |
| V4, V5 | TNV | Được duyệt diễn tập qua checklist giả lập + A1; OFF/no active |
| V6 | TNV | Đơn chờ checklist R1 và duyệt A1; chưa được bật Sẵn sàng |
| R1 | Người giới thiệu giả lập | Đăng nhập /referrer để xem đơn V6 và thử checklist; không có quyền admin |
| A1 (giữ bộ cũ) | Quản trị | Đăng nhập /admin để duyệt cuối; không tạo admin mới |

- Đã kiểm tra8/8mật khẩu bằng Firebase Auth thật, mục đích đăng ký, không có quyền admin, thẻ/quyền chia sẻ và trạng thái TNV. V6 bật Sẵn sàng bị403; TNV đọc trực tiếp hồ sơ Patient bị403. R1 xem được đơn được giao. Không tạo ca, không bật GPS/chuông khi cấp, không đổi tài khoản cũ.
- V4 được gán mức sơ cứu/0tháng, V5 sinh viên lâm sàng/6tháng để thử phần mềm: **tất cả là dữ liệu GIẢ, không phải chuyên môn thật của người dùng**. R1/checklist/emailVerified là fixture do nhóm vận hành tạo, không có xác minh hộp thư/đơn vị/người quản lý thật.
- Phân4người: P3 → V4 → người báo không cần tài khoản → người quan sát. Vòng tranh ca dùng V4/V5 trên2thiết bị/phiên riêng; vòng quyền riêng tư dùng P4; nhiều ca dùng P3–P6. Phải cấp GPS thật và ở trong5km khi thử điều phối; chưa cấu hình sẵn tọa độ cho tài khoản mới.
- Email .test không nhận thư Quên mật khẩu; điện thoại toàn số0 trong đơn là dữ liệu giả, không gọi. Chưa chứng minh UI/GPS/chuông trên từng thiết bị cho từng tài khoản. Cuối buổi hoàn tất ca, tắt Sẵn sàng.

## Bộ25/10/2026 — vẫn giữ để đối chiếu và dùng A1

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

1. [Tải APK hiện hành](https://ehis-next-20261021-hc03.web.app/install) hoặc [mở app web](https://ehis-next-20261021-hc03-app.web.app). Bản tải hiện hành là0.4.19; kiểm tra [STATUS](../STATUS.md) trước mỗi buổi, không dùng mốc phiên bản cũ trong ảnh.
2. Laptop dùng P1; hai điện thoại dùng V1/V2. Trên TNV, cho phép GPS, bật sẵn sàng và thử chuông; giữ màn mở. Các tab cùng địa chỉ website chia sẻ phiên cloud, nên dùng thiết bị hoặc hồ sơ trình duyệt riêng cho các tài khoản khác nhau.
3. Người báo đứng cạnh bệnh nhân giả, quét QR P1, xác nhận vị trí và gửi. Khi máy chủ xác nhận, trả lời ba câu hỏi; có thể để trống số điện thoại.
4. V1/V2 cùng thử nhận: chỉ một người được phân công. Chỉ TNV nhận ca được mở thông tin và chỉ đường. Dùng P2 ở vòng sau để đối chiếu hồ sơ không được chia sẻ.
5. Chỉ xác nhận đã đến khi thực sự có mặt; nếu thử tại chỗ thì hủy hộp thoại này rồi hoàn tất ca diễn tập; kiểm tra thông tin riêng đóng. Cuối buổi tắt sẵn sàng cả hai TNV. Nếu chưa ai nhận, Patient/người báo có thể hủy yêu cầu gửi nhầm.
6. [A1 mở quản trị](https://ehis-next-20261021-hc03.web.app/admin) để duyệt đơn khi muốn thử ứng tuyển; với đơn mới, cần checklist của người giới thiệu trước. A1 không dùng trong app Patient/TNV. Sau khi tự duyệt, V3 không còn ở trạng thái chờ như lúc bàn giao.

## Phạm vi đã xác minh cho bộ25/10 (lịch sử)

Đã kiểm tra sáu mật khẩu đăng nhập qua Firebase Auth thật, đối tượng lưu trên backend, hai TNV được duyệt/OFF/no-active, V3 bị từ chối bật sẵn sàng, quyền admin chỉ ở A1 và TNV không đọc được hồ sơ Patient trực tiếp. P1/P2 chưa có lịch sử ca khi bàn giao. Không tạo ca/bật chuông tự động bằng bộ mới; để nhóm tự thao tác.

Email `.test` là email giả, không nhận thư Quên mật khẩu/xác minh. Bộ này dùng thử đăng nhập và luồng hỗ trợ; muốn thử gửi email cần tài khoản với hộp thư nhóm sở hữu. Không dùng dữ liệu y tế thật, không gọi số điện thoại giả trong hồ sơ. Chưa phải nghiệm thu giao diện/loa/rung/GPS trên máy thật hoặc đủ điều kiện tiếp nhận cấp cứu thật.

[Lab note](../LAB_NOTES.md) ghi mốc cấp; tài khoản cũ được giữ nguyên, không xóa/đổi mật khẩu trong lần này.
