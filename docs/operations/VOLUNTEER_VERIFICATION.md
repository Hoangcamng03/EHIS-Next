# Xác minh TNV trực tiếp bởi admin

Áp dụng cho mã nguồn cập nhật ngày 18/11/2026. Tra [STATUS](../STATUS.md) để phân biệt source local, cloud và APK đã phát hành.

## Luồng ngắn

1. TNV đăng ký tài khoản → nhập danh tính, đào tạo, số tháng lâm sàng, đơn vị và khu vực → chọn nhóm kỹ năng → gửi hồ sơ.
2. Admin vào `/admin` → tải đơn → đối chiếu bốn mục: danh tính, đơn vị, đào tạo/kỹ năng và phạm vi hỗ trợ.
3. Admin ghi mức đào tạo, số tháng, kỹ năng đã kiểm tra và căn cứ → Duyệt đơn → Xác nhận duyệt đơn.
4. TNV mở lại app → bật Sẵn sàng → cho phép GPS/thông báo. Duyệt hồ sơ không tự bật sẵn sàng.

Không cần người giới thiệu. Trang `/referrer` chỉ thông báo chuyển quy trình; hồ sơ cũ đang chờ cũng do admin xét trực tiếp. Dữ liệu xác minh cũ được giữ để truy vết, không tự chuyển kỹ năng tự khai thành kỹ năng đã xác minh.

## Phân loại và phân vùng

- Nhóm kỹ năng: sơ cứu cơ bản, hồi sinh tim phổi, hỗ trợ hô hấp, chảy máu/chấn thương. Đây là phạm vi đào tạo được admin đối chiếu, không phải giấy phép hoặc chẩn đoán.
- Khi mới báo chưa có quan sát: mời tối đa năm TNV đủ điều kiện gần nhất trong 5 km, GPS không quá năm phút; một TNV chỉ phụ trách một ca.
- Khi có quan sát mới và ca chưa ai nhận: có thể mời bổ sung tối đa ba người có kỹ năng phù hợp, tổng người được mời không quá 20. Không rút lời mời của người gần, không chờ phân loại rồi mới tạo ca.
- Khi tìm người nhận bàn giao: ưu tiên kỹ năng phù hợp trước, rồi khoảng cách; vẫn giữ TNV gần làm dự phòng. Không tự chuyển quyền khi chưa có người nhận thay xác nhận.
- Khu vực cư trú/đơn vị dùng quản lý và lọc danh sách. Điều phối vẫn theo vị trí bệnh nhân đã xác nhận và GPS TNV, gồm cả người ở gần ranh giới.

## Admin quản lý sau duyệt

Trong danh sách TNV, xem nhóm kỹ năng đã xác minh, vùng, độ mới GPS và trạng thái bận. Có thể sửa vùng, tạm dừng hoặc khôi phục quyền kèm lý do. Không khóa để bỏ ca đang xử lý; phải kết thúc hoặc bàn giao có xác nhận. Khôi phục giữ OFF.

## Điều kiện cần kiểm tra

Người dùng thường không duyệt được; checklist/căn cứ thiếu phải bị chặn; kỹ năng không hợp lệ bị chặn; đơn vừa sửa phải tải lại; thu quyền admin chặn cả token cũ. Xem kết quả thực chạy trong [LAB_NOTES](../LAB_NOTES.md). Checklist này không tự chứng minh kiểm thử đạt hay năng lực y tế đã được kiểm chứng.
