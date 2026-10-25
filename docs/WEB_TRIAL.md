# Nghiệm thu web trước khi phát hành điện thoại

Thứ tự hiện hành: kiểm chứng code/web → APK preview Android cho diễn tập → nghiệm thu điện thoại. Chủ dự án đã cho phép build preview sau khi demo được kiểm tra (23–24/10); không tự OTA, cửa hàng, iOS native hoặc bật billing. [STATUS](STATUS.md) là nơi tra phiên bản, [MOBILE_RELEASES](MOBILE_RELEASES.md) ghi các bước phát hành.

## 1. Mở đúng phần

Mốc bàn giao 25/10 là **0.4.7**; source 0.4.8 còn local/chưa phát hành. Đối chiếu [STATUS](STATUS.md) ở các lần tiếp theo. Bản 0.4.7: xem [kết quả theo flow](VERIFICATION_V0_4_7.md) và [kịch bản hai Android](ACCEPTANCE_FLOW.md). Các mốc phát hành thực ghi tại LAB_NOTES. Lịch sử **0.4.4**: [màu, lỗi đã sửa, bằng chứng và checklist nghiệm thu](VERIFICATION_V0_4_4.md). Tải lại trang rồi kiểm tra số phiên bản; Patient xanh dương, TNV xanh lá, người báo cam, quản trị tím, yêu cầu khẩn đỏ.

- App Patient/Volunteer: https://ehis-next-20261021-hc03-app.web.app . Một app, tự mở khu vực theo đối tượng tài khoản.
- Website người quét: https://ehis-next-20261021-hc03.web.app . Người quét đi vào đường dẫn QR của thẻ; trang chính giải thích và dẫn sang app.
- Quản trị: https://ehis-next-20261021-hc03.web.app/admin . Cần tài khoản có quyền admin.
- [Tài khoản thử](LAB_NOTES.md#tài-khoản-chạy-thử--mục-bàn-giao): email/mật khẩu trong repo riêng tư, không tạo quyền admin bằng lựa chọn trên UI.

Đợt này nghiệm thu phần mềm với dữ liệu giả và người tham gia được hướng dẫn. Tài khoản đăng ký được lưu trên Firebase thật; chưa mở tiếp nhận tình huống cấp cứu thật hoặc thu thập bệnh án thật. Thông tin giới hạn được giữ lại để người dùng hiểu đúng chức năng.

## 2. Tài khoản mở đúng giao diện thế nào?

1. Người mới chọn Bệnh nhân/Tình nguyện viên có mô tả trước đăng ký.
2. Đọc thông tin dữ liệu/phạm vi và xác nhận, nhập email/mật khẩu rồi tạo tài khoản.
3. Backend lưu `accountPurpose` theo UID; đây là lựa chọn giao diện, không phải quyền hành nghề/duyệt TNV.
4. Lần đăng nhập sau, kể cả thiết bị khác, app lấy lựa chọn từ backend và mở thẳng khu vực đó; mở URL khu vực còn lại cũng được chuyển về đúng khu vực.
5. Tài khoản cũ: ưu tiên lựa chọn đã lưu; nếu chưa có, suy ra từ volunteer/application, rồi hồ sơ patient. Không có dữ liệu thì hoàn tất lựa chọn một lần. Có cả hai hồ sơ cũ sẽ vào Volunteer nếu chưa lưu lựa chọn; nhóm cần xác nhận ngoại lệ này khi nghiệm thu.

Đợt này không có nút tự chuyển đối tượng sau đăng ký. Nếu chọn nhầm, liên hệ người tổ chức để xác minh và xử lý; chưa có công cụ quản trị đổi đối tượng. Quyền admin/approved do backend quản lý riêng. Nếu lưu lựa chọn thất bại sau khi Auth tạo tài khoản, chọn tải lại; không cần đăng ký lại email.

## 3. Dùng trên iPhone và Android

- Dùng trực tiếp đường dẫn app trong trình duyệt hiện đại, bật JavaScript và Internet. Chưa thể cam kết mọi trình duyệt/phiên bản đều hoạt động.
- iPhone: Safari → mở app → Chia sẻ → Thêm vào Màn hình chính → Thêm; bật mở dưới dạng ứng dụng web nếu tùy chọn xuất hiện.
- Android: Chrome → menu → Cài đặt ứng dụng hoặc Thêm vào màn hình chính. Nếu không có mục này, vẫn dùng trực tiếp trang web.
- Trình duyệt tích hợp Zalo/Facebook có thể hạn chế vị trí/cài đặt; chọn mở bằng trình duyệt ngoài.
- Đây là web app, không phải IPA/TestFlight. Không thêm service worker lưu hồ sơ/ca để giả lập offline; cần máy chủ xác nhận gửi/lưu thành công. Giữ màn hình TNV mở; chưa có push/GPS nền.

Hướng dẫn xuất hiện cả ở màn đăng ký và khu vực đã đăng nhập. Manifest và icon giúp thêm vào màn hình chính; việc cài thực tế phải nghiệm thu trên thiết bị. Tham khảo [Apple](https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios) và [Expo](https://docs.expo.dev/guides/progressive-web-apps/).

## 4. Bài thử nhóm chạy trước khi duyệt

| Bài thử | Kết quả mong đợi | Ghi bằng chứng |
|---|---|---|
| Đăng ký Patient → đăng xuất → đăng nhập → mở lại trang | Vào Patient, không hỏi chọn lại | Thiết bị, browser, version, ảnh |
| Đăng ký Volunteer → đăng xuất → đăng nhập | Vào Volunteer, chưa được duyệt thì chỉ được nộp đơn | Ảnh và quyền thực tế |
| Mở URL sai khu vực | Tự quay về khu vực đã đăng ký; không tự tăng quyền | URL/kết quả |
| Tài khoản cũ chưa có loại/hồ sơ | Chọn một lần, đăng nhập lại không hỏi nữa | Hai lần đăng nhập |
| Mất mạng khi tải tài khoản | Báo chưa tải được, có thử lại; không tạo thêm tài khoản | Tắt/bật mạng trên máy thử |
| Patient lưu hồ sơ giả/cấp QR | QR trỏ HTTPS, không chứa bệnh án | Quét trên máy khác |
| Người báo gửi → backend ack → trả lời không phone | Chỉ chuyển sau ack, ba câu hỏi gửi được không cần phone | Thời điểm và ảnh |
| Admin duyệt → TNV sẵn sàng GPS → nhận/đến/kết thúc | Đúng người nhận, bản đồ/ca cập nhật; mất quyền riêng sau kết thúc | Hai thiết bị + web quản trị |
| Không có TNV / GPS bị từ chối | Nói đúng chưa ai nhận/chưa lấy vị trí; không báo thành công giả | Ảnh |
| Thêm vào màn hình chính iPhone/Android | Mở biểu tượng, đăng nhập và giữ phiên đúng đối tượng | Model, OS, browser, kết quả |

Tọa độ giả chỉ còn trong Emulator; bài thử cloud GPS cần người thử xác nhận vị trí và không tạo ca thật. Dùng tài khoản/trình duyệt tách biệt cho các vai trò; các tab cùng origin có thể dùng chung phiên.

## 5. Tiêu chí bàn giao và giới hạn

Theo [BUG_FIX_WORKFLOW.md](BUG_FIX_WORKFLOW.md), ghi riêng source/check/build/deploy/browser/device. CI hoặc kiểm tra tự động không thay cho thử Safari/iPhone thật. Nhóm duyệt dựa trên kết quả bài thử, không dựa vào việc xóa chữ demo. Các mốc chưa thử để trạng thái chờ và chỉ rõ ai làm tiếp.

Trước khi thu thập bệnh án thật hoặc mở công khai, cần chốt người chịu trách nhiệm vận hành và liên hệ hỗ trợ, cơ chế đồng ý/xóa dữ liệu, kiểm soát lạm dụng, giám sát sự cố, khả năng thông báo khi app đóng và nghiệm thu quyền/bảo mật/quy trình hỗ trợ. Những việc này chưa được tự nhận là đã hoàn tất. Đây không phải công cụ chẩn đoán hay dịch vụ cấp cứu có cam kết tiếp nhận.
