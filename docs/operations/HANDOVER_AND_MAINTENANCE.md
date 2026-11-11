# Bàn giao ca và kiểm tra vận hành

Áp dụng từ mã 0.4.14. Xem [STATUS](../STATUS.md) để biết bản nào đã được triển khai, chưa suy ra từ tài liệu này rằng điện thoại đã cập nhật. Chỉ diễn tập với dữ liệu giả.

## Từ0.4.21: TNV tự yêu cầu người nhận thay

- Trong ca đang di chuyển, bấm **Không thể tiếp tục · tìm người thay** và xác nhận. Hệ thống ghi trở ngại và mời tối đa5TNV gần nhất đủ điều kiện trong cùng transaction; không cần quản trị tạo đề nghị bằng tay.
- TNV khác nhận cảnh báo/lời mời **Nhận bàn giao**. Chỉ một người xác nhận thành công; lúc đó ca tự chuyển, người cũ được giải phóng và mất quyền riêng.
- Khi không có TNV phù hợp, app ghi rõ chưa có người nhận thay. TNV bật Sẵn sàng muộn có thể được mời trong thời hạn5phút. Hết hạn hoặc chưa có ứng viên thì tìm lại; không tự đóng ca hoặc hứa đã có người đến.
- Giới hạn diễn tập: GPS≤5phút, trong5km, chỉ TNV approved/sẵn sàng/không bận;5lời mời đầu, tối đa20người một lượt/40người mỗi ca. Chưa có điều phối nền liên tục.
- Quản trị chỉ can thiệp khi cần, theo cách thủ công bên dưới. Cần hủy đề nghị đang chờ trước khi người cũ xác nhận tiếp tục để tránh hai luồng xử lý song song.

## 1. Khi TNV không thể tiếp tục

1. Quản trị liên hệ TNV hiện tại, xác minh tình huống và đầu mối buổi thử. Không tự suy ra TNV bỏ ca từ việc GPS cũ hoặc mất mạng.
2. Mở [quản trị](https://ehis-next-20261021-hc03.web.app/admin) → **Bàn giao ca đang xử lý** → **Tải ca đang xử lý**.
3. Chọn ca → **Tìm TNV có thể nhận bàn giao**. Danh sách gồm TNV đã duyệt, đang sẵn sàng, không có ca khác, GPS mới trong 5 phút và cách điểm bệnh nhân không quá 5 km. Khoảng cách là đường thẳng lúc tải, không phải thời gian đến.
4. Chọn TNV mới, ghi lý do ngắn và xác nhận đã liên hệ. Không ghi bệnh án/số điện thoại vào lý do.
5. Gửi đề nghị. **Người cũ vẫn phụ trách và giữ quyền xem ca.** Người mới chỉ nhận lời mời tối thiểu, chưa xem tên/hồ sơ/điểm riêng/số người báo.
6. TNV mới dùng app web mới hoặc APK từ **0.4.14/code12**, bấm **Xác nhận nhận bàn giao**. Máy chủ kiểm tra lại quyền, GPS, khoảng cách và trạng thái bận. Khi thành công mới chuyển người phụ trách nguyên tử và thu quyền người cũ.
7. Ca quay về trạng thái đang di chuyển; người mới xác nhận đến nơi và kết thúc như bình thường. Không coi trạng thái phần mềm là kết quả điều trị.

Đề nghị có hạn 5 phút. Hết hạn, hủy hoặc TNV mới đang bận không làm ca tự kết thúc, không giải phóng người cũ. Quản trị hủy đề nghị rồi có thể chọn người khác. TNV cũ vẫn có thể kết thúc ca trước khi người mới nhận; máy chủ xử lý nhận/kết thúc đồng thời để chỉ một kết quả hợp lệ tồn tại. APK cũ không được dùng endpoint nhận ca thông thường để chuyển quyền.

Lịch sử nằm trong từng ca ở bảng quản trị. Với ca đã kết thúc, nhập **mã ca đầy đủ** vào ô tra lịch sử. Các bản ghi gồm lý do, người chuyển/nhận, thời điểm và trạng thái; chỉ quản trị được tra. Nhật ký đọc dữ liệu riêng chỉ ghi mã người/mã ca/hành động/thời gian, không sao chép hồ sơ. Dữ liệu đã xem/chụp lại trên thiết bị không thể thu hồi bằng việc đổi quyền trên máy chủ.

## 2. Trước và sau mỗi buổi diễn tập

- **Theo dõi buổi diễn tập** → tải số liệu. Xem số ca chờ quá hạn, thông báo đang chờ và kết quả dọn gần nhất.
- Nếu tác vụ dọn chưa có kết quả, lỗi, quá cũ hoặc còn tồn đọng: bấm **Dọn dữ liệu đến hạn** một lần, chờ phản hồi rồi tải lại. Chưa giải quyết được thì dừng tạo thêm dữ liệu thử và kiểm tra log/hạn mức.
- Lượt dọn có khóa chống chạy trùng, đọc nhiều trang với ngân sách khoảng 35 giây trước mỗi trang; tác vụ mạng trong trang có thể kéo dài hơn. Có giới hạn 50 trang/nhóm, không phải dọn vô hạn hoặc cam kết xóa đúng giờ. Kết quả `partial` cần chạy tiếp; `busy` nghĩa là đã có lượt khác.
- Chỉ dọn dữ liệu riêng của ca đã kết thúc và đến hạn. Không dọn ca accepted/arrived dù fixture có hạn sai. Bản ghi được bảo vệ phải được người phụ trách xem lại, không ép xóa.
- Cron Vercel miễn phí vẫn chạy mỗi ngày. Nút chạy tay không biến hệ thống thành dịch vụ trực liên tục. Không có đầu mối trực công khai được cấu hình.

## 3. GPS và dữ liệu người báo

- Khi màn TNV mở: kiểm tra GPS mỗi 30 giây, gửi máy chủ khi dịch chuyển từ 100 m hoặc đã 90 giây kể từ lần gửi thành công. Bật sẵn sàng/làm mới/trở lại foreground gửi lại chủ động. Đây là chính sách giảm ghi khi đứng yên; chưa phải số đo pin hoặc tốc độ GPS máy thật.
- GPS quá 5 phút khiến bảng quản trị và điều phối coi TNV chưa sẵn sàng. ON không đồng nghĩa đủ điều kiện nhận ca. Chưa có GPS nền lâu dài.
- Trang báo tin tải lại câu trả lời, số liên hệ và mốc tìm từ máy chủ cho đúng phiên đã gửi. Không lưu hồ sơ vào localStorage. Trình duyệt khác không có quyền khôi phục.
- Nếu tab khác gửi bản mới, bản cũ bị chặn ghi đè. Bấm **Tải bản đã gửi · bỏ phần đang sửa** khi đã đọc cảnh báo. Yêu cầu gửi lặp với cùng mã giữ nguyên kết quả, không tăng bản bổ sung lần nữa.

## 4. Điều chưa được bảo đảm

Chưa xác minh chuông Home/khóa, Samsung im lặng, GPS/pin hoặc cài đè trên máy thật trong phiên này. Dịch vụ bản đồ/push miễn phí không có cam kết điều phối cấp cứu. Cần hoàn thành phiếu [Android](ANDROID_TRIAL.md), có chuyên môn y tế/đầu mối vận hành và giải quyết các mục còn mở trong [review](../testing/verification/PRODUCT_REVIEW_2026_11_07.md) trước khi xét ca thật.


## 5. Bài nghiệm thu nhóm với hai Android

Quản trị dùng laptop; A/B dùng hai Android đã cài14/code12, tài khoản được duyệt, vị trí thật gần điểm diễn tập. A nhận ca → B sẵn sàng → admin liên hệ và gửi đề nghị → trước khi B xác nhận, A vẫn thấy ca/B chưa thấy hồ sơ → B xác nhận → A mất quyền, B thấy mốc tìm/hồ sơ được chia sẻ/tuyến mới → B xác nhận đến và hoàn tất. Nhập mã ca đã đóng để tra lại lịch sử. Ghi PASS/FAIL/chưa thử cho từng bước, không thay kết quả Emulator vào phiếu máy thật. Chuông/GPS/Home/khóa và Wi-Fi/4G vẫn dùng [phiếu Android](ANDROID_TRIAL.md).
