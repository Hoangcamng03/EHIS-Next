# Kịch bản kiểm tra

## Kiểm tra tự động của starter

- TypeScript mobile/web/functions.
- ESLint mobile/web.
- Web production build.
- Parser hồ sơ: hợp lệ, field injection, kiểu dữ liệu, độ dài và SĐT.
- Emulator integration smoke (`scripts/smoke-starter.cjs`): đã xác nhận health, từ chối chưa đăng nhập, chặn field injection, owner save/read, chặn người khác/public đọc và chặn tự sửa verificationStatus.
- `scripts/smoke-reports.cjs`: anonymous tạo ca trước khi có bảng hỏi; ack ở trạng thái dispatching/acceptedBy=null; thẻ sai bị chặn; retry tạo cùng ca; người báo khác không tạo trùng ca trên thẻ.
- Bổ sung không cần phone; thiếu câu trả lời bị chặn; owner khác bị chặn; retry cùng submissionId không tăng revision. Phone chỉ ở private doc, không xuất hiện trong alert.
- Firebase Web SDK listener thật nhận revision 0 rồi 1 trên cùng alert, chứng minh hai lần cập nhật khi client kết nối. Chưa chứng minh background push.
- Rules: owner đọc projection trạng thái; người khác/public không đọc được; chỉ đúng TNV approved đọc alert. Incidents/private không đọc trực tiếp.
- Hai TNV nhận đồng thời chỉ một người thắng; retry người thắng thành công; chỉ người thắng được lấy phone/vị trí. Bổ sung sau accept chỉ cập nhật người phụ trách, thu hồi approved chặn cả API và alert.

## Phải bổ sung trước khi dùng dữ liệu thật

- Authenticated owner lưu/đọc hồ sơ; tài khoản khác không đọc được.
- Anonymous không lưu hồ sơ bệnh nhân; client không tự bật verified/admin.
- Ca không public read; người báo chỉ theo dõi ca của phiên mình.
- Nhận ca đồng thời chỉ một TNV thắng.
- Retry create/task không tạo trùng hoặc ghi đè ca đã nhận.
- Vị trí hết hạn, mất mạng, mở lại app khôi phục ca.
- Thẻ thu hồi không tạo được ca mới.
- Push/token refresh, NFC, GPS và bản đồ trên máy thật.
- APK preview mở khi laptop tắt và dùng cloud endpoint.
- Kiểm tra GPS/HTTPS, thử form bằng bàn phím và trên viewport nhỏ, mất mạng giữa ack và chuyển trang, tắt/mở lại trình duyệt, nhiều tab, sửa câu trả lời sau retry, ngôn ngữ dễ hiểu với người chứng kiến.

Test parser không thay thế Rules integration test; web build không chứng minh đã deploy; Expo export không phải APK.
