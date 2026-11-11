# 0.4.21 — bàn giao tự động, xác minh dễ hiểu và QR cài app

Chỉ diễn tập có kiểm soát, chưa nghiệm thu cấp cứu thật. [STATUS](../../STATUS.md) · [Số liệu thực](VERIFICATION_V0_4_21.json).

## Đã thay đổi

- Không thể tiếp tục: xác nhận → tự mời tối đa5TNV đủ điều kiện → người mới xác nhận → transaction chuyển ca, giải phóng/thu quyền người cũ. Không có người nhận thì giữ ca/chờ rõ ràng; TNV ON muộn nhận lời mời còn hạn, tìm lại nhóm rỗng được.
- Nhiều lời mời không đồng nghĩa nhiều người phụ trách: một người thắng, lời mời khác đóng; không tự đóng ca vì ETA trễ. Quản trị vẫn có bàn giao/hủy can thiệp.
- TNV/người giới thiệu/quản trị thấy3bước; form đã xác nhận không reset checklist/căn cứ; danh sách tự tải, thiết lập/vận hành gom nhóm. Quyền vẫn kiểm tra backend.
- Giữ bệnh nền20: optional medicalConditions,20mục/100ký tự; APK cũ lưu không xóa, client mới có thể xóa[]; chỉ TNV đúng ca/consent thấy.

## Bằng chứng

- Check cuối PASS88bài/lint/typecheck;17suite hồi quy lượt trước PASS297024ms. Lượt17suite cuối PASS293773ms, gồm tìm lại nhóm rỗng/cancel5lời mời; không suy PASS từ lượt trước. Build cuối PASS32513ms. JSON lưu hash/timestamp/exit thực và các failure đã sửa.
- BộP7–P16/V7–V11 đã tạo và kiểm tra15/15login thật10/11,5TNV OFF/no active lúc cấp.10bộNEW chưa tồn tại Auth ở thời điểm kiểm tra, không gọi signUp; trạng thái thay đổi khi nhóm tự dùng. [Bảng riêng](https://github.com/Hoangcamng03/EHIS-Next-Team-Access/blob/main/accounts/BULK_2026_11_10.md). Không công khai credentials/QR Patient.
- Backend và hai web21 đã triển khai từ f870ee3; health/401 đúng, 38 HTML/JS/CSS khớp byte bản build. Cloud thật chạy hai ca với dữ liệu/vị trí giả: gửi lời mời, chống lặp, hai người nhận đồng thời chỉ một thắng, thu quyền người cũ, không ứng viên và ON muộn đều PASS. V7–V9 đã trả về OFF/no active. Đây không phải kiểm thử chuông/GPS thiết bị.
- [APK 0.4.21/code19](https://expo.dev/artifacts/eas/uwcKeQiNQrGIoESYhgcQxChZpNcNnsRY83OHxhBR34U.apk) FINISHED, artifact xác minh 102725961 byte; SHA-256 61dde0e5a89392610a318802f1e5f5765162f591f2b3d5bc82ba483e147bec3a. Chưa cài/nghiệm thu21 trên điện thoại. QR mã hóa /install, đã giải mã độc lập khớp URL; trang tải21 đã deploy và kiểm tra HTTP/browser: nhãn/link đúng21, link19 không còn, APK HEAD200 đúng kích thước, QR remote khớp tệp gốc. Build trang tải lần đầu EPERM; lượt sau PASS39779ms, deploy33874ms, đối chiếu38tệp10985ms. Giữ failure, không triển khai bản build dở.

## Phần còn thiếu

Điện thoại21/chuông bàn giao mới chưa nghiệm thu; tự thoát gián đoạn, offline độc lập, đi bộ GPS và p95Functions RECHECK còn mở. Không đổi ngưỡng hoặc gộp build/API với kiểm thử thiết bị.
