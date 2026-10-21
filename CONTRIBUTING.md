# Quy trình làm việc

1. Chốt việc nhỏ trong Issue: mục tiêu, file/module, đầu vào/đầu ra, cách kiểm tra.
2. Cập nhật `main` sau khi đã commit công việc đang làm; tạo branch `feat/...` hoặc `fix/...`.
3. Chỉ sửa phạm vi liên quan. Báo người phối hợp khi sửa file chung hoặc API.
4. Commit, push branch, mở PR. Mỗi PR cần mô tả hành vi và bằng chứng kiểm tra.
5. Một thành viên khác review. Sau merge, người còn lại cập nhật main; không gửi ZIP và chép đè file.

Người phối hợp: Backend/Rules/API — TV1; Volunteer/Maps — TV2; Mobile config/Auth/Patient — TV3; Web/Admin — TV4.

Khi cùng sửa một file, Git có thể ghép các vùng độc lập. Conflict cần đọc và kết hợp logic, không chọn toàn bộ một bên cho hết lỗi. Có thể pair bằng Live Share trên một branch; chủ phiên commit/push.

Public repo không có nghĩa ai cũng có quyền ghi. Mời collaborator bằng tài khoản riêng, không dùng chung password. Nếu gói GitHub hỗ trợ, bật PR review và status checks cho main.
