# Kiểm chứng 0.4.14 — bàn giao có xác nhận

Phạm vi: diễn tập phần mềm bằng dữ liệu giả. Không phải nghiệm thu điện thoại, đánh giá lâm sàng hoặc cam kết vận hành cấp cứu thật. Trạng thái triển khai hiện hành tra [STATUS](../../STATUS.md).

## 1. Những phần đã thay đổi

- Admin đề nghị bàn giao có lý do/lịch sử; người mới xác nhận thì transaction mới chuyển quyền. Giữ người cũ khi đề nghị chờ/hết hạn/hủy; chặn người nhận đang bận/ngoài5km/GPS cũ. Ghi metadata audit cho nhận/đọc riêng/kết thúc/bàn giao, không lưu payload bệnh án.
- Người báo khôi phục được báo cáo đã gửi khi reload, chặn tab cũ ghi đè bằng revision; lỗi đường dẫn xuất hiện ngay và không hiện bảng hỏi bị khóa. Màn ca kết thúc bỏ form và nhãn bổ sung.
- Quản trị phân biệt ON và đủ điều kiện nhận ca khi GPS cũ. Heartbeat vẫn kiểm tra GPS30s khi foreground; giảm ghi khi đứng yên về90s hoặc khi di chuyển100m. Chưa đo pin/hiệu suất GPS máy thật.
- Maintenance nhiều trang có lease/ngân sách/kết quả và nút admin chạy lại; giữ ca đang hoạt động, không cam kết xóa24–48h khi có tồn đọng.
- Rút gọn bước báo tin, thêm gọi người báo nếu có phone, sửa style ô input mặc định và nhãn bàn giao. Không tự gọi điện trong bài thử.

## 2. Kết quả thực đã thu

| Lớp | Kết quả | Giới hạn |
| --- | --- | --- |
| Check mã cuối | PASS22 backend+49 logic, app/web typecheck/lint và đường dẫn tài liệu | Không phải kiểm thử mọi thiết bị |
| Integration | PASS15 bộ trên Auth/Functions/Firestore Emulator thật | Synthetic fixtures; FCM không được giả là đã gửi thành công |
| Bàn giao/phục hồi | PASS owner-only/revision/retry, đúng5km/GPS, giữ người cũ, nhận lặp, từ chối người bận, hủy, fixture hết hạn, đua nhận vs kết thúc, lịch sử admin-only | Fixture timestamp hết hạn được ghi rõ, không nói đã chờ5phút thật |
| Dọn tồn đọng | PASS75 expired+65 purge+450 counters+450 push; giữ1 active;1707ms local cho lượt dọn | Không phải số đo cloud hay ngưỡng tối đa |
| Tải portable lượt1 | PASS1000 Auth giả;128 phiên,32 feed SDK,32 ca đồng thời/8 vùng/320 API,40 từ chối dự kiến,0 retry; p50/p95 lời mời932/1435ms | Check mã chạy trùng phần cuối workload. Không kết luận nhanh/chậm hơn p95 baseline925ms khác điều kiện |
| Browser local | PASS QR→báo→ON muộn→nhận→A bàn giao B→đến/kết thúc; khôi phục báo cáo; hai tab chặn stale; admin dọn/lịch sử cả ca đóng; đăng xuất | Một viewport mỗi tab, không gọi là thử điện thoại. Bản đồ/OSRM có hiển thị một lượt, không bảo đảm dịch vụ luôn sẵn sàng |
| Build cloud frontend | Lượt2 PASS trước hai chỉnh sửa UI cuối; phải build lại trước deploy | Lượt1 EPERM được giữ, không dùng artifact lỗi |
| Cloud/backend/native mới | Chưa ghi đạt tại mốc lập tài liệu; sẽ bổ sung kết quả thật sau triển khai/build | APK0.4.13 đã có artifact; bàn giao cần web mới hoặc APK0.4.14 |

Raw log và ảnh local: `.local/improve-14`, không chứa dữ liệu y tế thật. Mỗi lần chạy có timestamp/exit code/hash log và dirty-source marker; không đổi failed thành pass. Các lỗi chuẩn bị được lưu: integration-1 bị timeout cổng trong vùng hạn chế; build-1 EPERM; setup UI gọi quá sớm khi Function chưa load; clipboard/selector CUA phải nhập/chọn lại. Invalid-report ảnh đầu là loading, ảnh resolved mới chứng minh màn lỗi.

## 3. Nghiệm thu còn mở

- Hai Android: cài đè/đúng version, GPS Wi-Fi/4G, mất mạng/khôi phục, chuông Im lặng/Rung/Home/khóa, quyền thông báo/pin, chạm/cuộn/cỡ chữ lớn. Chưa có kết quả thiết bị trong đợt này.
- Bán kính và tuổi GPS vẫn là điều kiện phần mềm; không suy ra người đã tới hoặc có năng lực y tế. Chưa có đầu mối trực.
- Không có worker liên tục/SLA. FCM và nhà cung cấp bản đồ còn giới hạn; điều khoản sử dụng/thiết kế thông báo cho ca thật còn phải giải quyết, không sửa được chỉ bằng tăng priority.
- Consent chi tiết, thẻ in/export, đầu mối chuyên môn/cohort/quy trình sự cố/khôi phục và chính sách giữ audit còn mở trong [review](PRODUCT_REVIEW_2026_11_07.md). Không đóng toàn bộ backlog chỉ vì71 test đạt.

[Cách dùng tính năng mới](../../operations/HANDOVER_AND_MAINTENANCE.md) · [Lab notes](../../LAB_NOTES.md).
