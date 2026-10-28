# Xác minh TNV qua người quản lý đơn vị

Áp dụng cho hồ sơ mới từ source 0.4.11. Xem [trạng thái phát hành](../STATUS.md) trước khi thao tác trên cloud. Các tài khoản và checklist giả trong test chỉ kiểm tra phần mềm, không chứng nhận chuyên môn.

## 1. Chuẩn bị người giới thiệu

1. Chọn người quản lý TNV có chức vụ tại đơn vị: trưởng khoa hoặc người được tổ chức giao nhiệm vụ. Nhóm kỹ thuật không tự xác nhận năng lực y tế.
2. Người này vào `/referrer`, tạo tài khoản và tự xác minh email qua hộp thư của mình. Không chia sẻ tài khoản quản trị.
3. Quản trị kiểm tra danh tính, chức vụ và phạm vi quản lý qua kênh chính thức của đơn vị. Ghi căn cứ và ngày kiểm tra, không nhập hồ sơ bệnh án.
4. Trong `/admin` → **Quản lý người giới thiệu tại đơn vị**, điền tài khoản, tổ chức, chức vụ, số liên hệ và căn cứ; xác nhận rồi cấp quyền. Chỉ có tài khoản/email chưa đủ chống mạo danh.

## 2. TNV nộp hồ sơ

- Họ tên, điện thoại, khóa đào tạo/nơi thực hành.
- Ba nhóm: đào tạo sơ cứu; sinh viên có thực hành lâm sàng; nhân sự có thực hành lâm sàng. Số tháng là kinh nghiệm được kiểm tra, không phải giấy phép hành nghề hay quyền thực hiện thủ thuật.
- Khu vực cư trú chỉ cần phường/xã và tỉnh/thành; đơn vị học tập/làm việc, địa chỉ và khu vực có thể hỗ trợ. Tránh thu số nhà nếu không cần.
- Email người quản lý đã được xác minh. Người quản lý không thể tự giới thiệu chính mình.
- Sửa và gửi lại thay toàn bộ đơn, tăng phiên bản và xóa checklist cũ. Nếu đơn cũ chưa đủ trường, nhập lại theo mẫu mới.

## 3. Người quản lý xác nhận

Tại `/referrer`, đăng nhập → **Tải hồ sơ được giao** → đối chiếu bốn mục: danh tính, thuộc đơn vị, đào tạo/kinh nghiệm, phạm vi hỗ trợ. Ghi mức đào tạo và số tháng đã kiểm tra, căn cứ và giới hạn. Chỉ đề nghị duyệt khi đủ bốn mục; chưa đạt thì ghi lý do. Không được sửa đơn do TNV tự khai hoặc xem đơn chỉ định người khác.

## 4. Quản trị duyệt sau cùng

Tải đơn chờ → đối chiếu thông tin tự khai với xác nhận → duyệt/từ chối. Backend chặn duyệt nếu thiếu checklist, người giới thiệu bị thu quyền hoặc đơn vừa đổi phiên bản. Duyệt không tự bật sẵn sàng. Đăng ký/chọn vai trò không cấp quyền.

## 5. Thu hồi và hồ sơ cũ

- Thu hồi quyền giới thiệu ngăn xác nhận và duyệt mới từ người đó. Không tự rút quyền của tất cả TNV đã được duyệt trước đó; quản trị cần rà từng trường hợp và xử lý ca đang hoạt động.
- V1/V2 diễn tập đã có trước quy trình này không được tự gắn nhãn đã xác minh y khoa. Giữ dữ liệu thử để demo; phải rà soát, xác minh và chuyển đổi trước pilot có người thật. Không dùng tài khoản dùng chung tiếp nhận ca thật.
- Tên bệnh nhân chỉ hiện sau nhận ca nếu có consent. Đối chiếu trực tiếp khi đến nơi; tên trùng không chứng minh là cùng bệnh nhân. Chưa có tính năng tự đối chiếu bệnh nhân cũ.
- Địa chỉ/khu vực dùng quản lý hồ sơ; chọn ca vẫn dùng GPS hiện tại trong 5km, mới tối đa 5 phút. Chưa tự tạo ranh giới tổ chức hay ưu tiên lâm sàng.

## 6. Tiêu chí đạt của phần mềm

Người dùng thường không tự cấp quyền; người quản lý khác không xem/xác nhận đơn; checklist thiếu không duyệt được; sửa đơn vô hiệu checklist; thu quyền chặn duyệt; chỉ admin duyệt cuối. Kết quả chạy thực tế nằm trong [lab note](../LAB_NOTES.md), không điền PASS chỉ từ checklist tài liệu.
