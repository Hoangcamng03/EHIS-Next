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
- Backend/web20 đã deploy từ586a652; backend/web/APK21 chưa ghi đã phát. QR chỉ mã hóa URL công khai /install, không chứa thẻ bệnh nhân. Trang tải cònAPK19 cho tới khi APK21 FINISHED và artifact được xác minh.

## Phần còn thiếu

APK21/điện thoại/chuông bàn giao mới chưa nghiệm thu; tự thoát gián đoạn, offline độc lập, đi bộ GPS và p95Functions RECHECK còn mở. Không đổi ngưỡng hoặc gộp build/API với kiểm thử thiết bị.
