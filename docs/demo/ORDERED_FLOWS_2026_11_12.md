# EHIS — bộ ảnh theo vai trò và từng trường hợp

**Ảnh lịch sử trước đợt tinh chỉnh UI cuối12/11.** [Ảnh giao diện mới, kết quả kiểm thử và bảng cải thiện](../testing/verification/PRODUCT_REVIEW_2026_11_12.md). Không dùng bộ này để nói bố cục cũ vẫn là bố cục hiện hành.

[Danh mục tài liệu](../README.md) · [Bằng chứng và hash ảnh](../testing/verification/ORDERED_FLOWS_2026_11_12.json) · [Thư mục ảnh](../assets/ordered-flow-2026-11-12/)

53 ảnh chụp giao diện thật trong môi trường local, ngày 12/11/2026. Hồ sơ và tọa độ chủ động dùng cho kịch bản; tên hiển thị bình thường. Đây là bằng chứng thao tác phần mềm, không chứng minh di chuyển, âm thanh/FCM nền Android hay khả năng vận hành cấp cứu thực tế.

## Cách sử dụng cho presentation

- Đọc phần đăng ký/duyệt theo thứ tự liên vai trò dưới đây; các thư mục 01–04 dùng khi muốn trình bày riêng một đối tượng.
- Các thư mục 05–08 tách từng trường hợp. Các ảnh mở thẻ và trạng thái Sẵn sàng được chụp lại sau sửa UI, chưa tạo ca/GPS ở ảnh đó. Toàn bộ nhóm bàn giao dùng cùng một ca mới; không ghép ca bàn giao cũ vào ca mới. Mỗi ảnh có thao tác, kết quả quan sát và câu dẫn gợi ý.
- App dùng ảnh 390 × 843; người báo dùng ảnh 375 × 811 (khung dọc điện thoại). Quản trị/người giới thiệu dùng khung desktop, kích thước thực ghi trong JSON. Đây là mobile web, không phải ảnh APK.
- Mở `index.html` trong bộ tải về để xem ảnh lớn và chú thích; giữ nguyên các thư mục đi cùng.

## Thứ tự liên vai trò: đăng ký và duyệt

Patient đăng ký → lưu hồ sơ → chia sẻ/QR; người giới thiệu đăng ký → quản trị xác minh và cấp quyền; TNV đăng ký → nộp hồ sơ/chỉ định người giới thiệu → người giới thiệu checklist → TNV chờ quản trị → quản trị duyệt → TNV mở Sẵn sàng.

| Thứ tự chụp | Vai trò / ảnh | Thao tác | Quan sát |
| --- | --- | --- | --- |
| 1 | [Mở ứng dụng](../assets/ordered-flow-2026-11-12/01-patient/01-start.jpg) | Mở app | Chưa đăng nhập |
| 2 | [Chọn vai trò](../assets/ordered-flow-2026-11-12/01-patient/02-role.jpg) | Chọn Đăng ký | Hiện hai đối tượng |
| 3 | [Nhập tài khoản bệnh nhân](../assets/ordered-flow-2026-11-12/01-patient/03-register.jpg) | Điền email/mật khẩu và xác nhận dữ liệu | Nút tạo tài khoản mở |
| 4 | [Nhập hồ sơ](../assets/ordered-flow-2026-11-12/01-patient/04-profile.jpg) | Điền bệnh nền, dị ứng và liên hệ | Thông tin chưa lưu |
| 5 | [Chọn chia sẻ](../assets/ordered-flow-2026-11-12/01-patient/05-consent.jpg) | Bật chia sẻ cho TNV nhận ca | Hồ sơ được chia sẻ theo consent |
| 6 | [QR được tạo](../assets/ordered-flow-2026-11-12/01-patient/06-qr.jpg) | Bấm tạo mã QR | Mã QR hoạt động |
| 7 | [Đăng ký người giới thiệu](../assets/ordered-flow-2026-11-12/02-referrer/01-register.jpg) | Điền email/mật khẩu | Nút tạo tài khoản mở |
| 8 | [Chờ xác minh người giới thiệu](../assets/ordered-flow-2026-11-12/02-referrer/02-wait-verification.jpg) | Tạo tài khoản xong | Chưa có quyền giới thiệu; cần xác minh email và quản trị |
| 9 | [Đăng nhập quản trị](../assets/ordered-flow-2026-11-12/03-admin/01-login.jpg) | Dùng tài khoản được cấp | Quản trị không tự đăng ký từ app |
| 10 | [Xác minh người giới thiệu](../assets/ordered-flow-2026-11-12/03-admin/02-referrer-details.jpg) | Điền đơn vị, chức vụ và căn cứ | Quản trị xác nhận trước cấp quyền |
| 11 | [Người giới thiệu đã có quyền](../assets/ordered-flow-2026-11-12/03-admin/03-referrer-approved.jpg) | Xác nhận cấp quyền | Backend thông báo thành công |
| 12 | [Chọn TNV](../assets/ordered-flow-2026-11-12/04-volunteer/01-select-role.jpg) | Mở đăng ký | Chọn tình nguyện viên |
| 13 | [Tạo tài khoản TNV](../assets/ordered-flow-2026-11-12/04-volunteer/02-register.jpg) | Nhập email, mật khẩu và xác nhận dữ liệu | Sẵn sàng tạo tài khoản |
| 14 | [Thông tin ứng tuyển](../assets/ordered-flow-2026-11-12/04-volunteer/03-application-top.jpg) | Điền danh tính và đào tạo | Chưa gửi |
| 15 | [Chỉ định người giới thiệu](../assets/ordered-flow-2026-11-12/04-volunteer/04-application-manager.jpg) | Điền đơn vị và email quản lý | Người quản lý sẽ đối chiếu hồ sơ |
| 16 | [TNV chờ người giới thiệu](../assets/ordered-flow-2026-11-12/04-volunteer/05-wait-referrer.jpg) | Gửi hồ sơ | Chưa được nhận ca |
| 17 | [Đối chiếu bốn điều kiện](../assets/ordered-flow-2026-11-12/02-referrer/03-checklist.jpg) | Xác nhận danh tính, đơn vị, đào tạo, phạm vi | Đủ checklist để đề nghị duyệt |
| 18 | [TNV chờ quản trị](../assets/ordered-flow-2026-11-12/04-volunteer/06-wait-admin.jpg) | Người giới thiệu đã xác nhận | Chờ mở quyền nhận ca |
| 19 | [Quản trị xem đơn đã xác nhận](../assets/ordered-flow-2026-11-12/03-admin/04-review-volunteer.jpg) | Tải đơn chờ | Hiện checklist/căn cứ từ người giới thiệu |
| 20 | [Xác nhận mở quyền nhận ca](../assets/ordered-flow-2026-11-12/03-admin/05-confirm-approval.jpg) | Bấm Duyệt đơn | Cần xác nhận cuối |
| 21 | [TNV được duyệt](../assets/ordered-flow-2026-11-12/04-volunteer/07-approved.jpg) | Mở lại TNV đã duyệt sau chỉnh sửa giao diện | Tài khoản được duyệt, đang tắt Sẵn sàng; ảnh chụp lại sau các ca |

## Bệnh nhân: đăng ký → hồ sơ → QR

### 1. Mở ứng dụng

[Ảnh 01-start.jpg](../assets/ordered-flow-2026-11-12/01-patient/01-start.jpg)

- **Thao tác:** Mở app.
- **Quan sát:** Chưa đăng nhập.
- **Câu dẫn:** “Chưa đăng nhập.”

### 2. Chọn vai trò

[Ảnh 02-role.jpg](../assets/ordered-flow-2026-11-12/01-patient/02-role.jpg)

- **Thao tác:** Chọn Đăng ký.
- **Quan sát:** Hiện hai đối tượng.
- **Câu dẫn:** “Hiện hai đối tượng.”

### 3. Nhập tài khoản bệnh nhân

[Ảnh 03-register.jpg](../assets/ordered-flow-2026-11-12/01-patient/03-register.jpg)

- **Thao tác:** Điền email/mật khẩu và xác nhận dữ liệu.
- **Quan sát:** Nút tạo tài khoản mở.
- **Câu dẫn:** “Nút tạo tài khoản mở.”

### 4. Nhập hồ sơ

[Ảnh 04-profile.jpg](../assets/ordered-flow-2026-11-12/01-patient/04-profile.jpg)

- **Thao tác:** Điền bệnh nền, dị ứng và liên hệ.
- **Quan sát:** Thông tin chưa lưu.
- **Câu dẫn:** “Thông tin chưa lưu.”

### 5. Chọn chia sẻ

[Ảnh 05-consent.jpg](../assets/ordered-flow-2026-11-12/01-patient/05-consent.jpg)

- **Thao tác:** Bật chia sẻ cho TNV nhận ca.
- **Quan sát:** Hồ sơ được chia sẻ theo consent.
- **Câu dẫn:** “Hồ sơ được chia sẻ theo consent.”

### 6. QR được tạo

[Ảnh 06-qr.jpg](../assets/ordered-flow-2026-11-12/01-patient/06-qr.jpg)

- **Thao tác:** Bấm tạo mã QR.
- **Quan sát:** Mã QR hoạt động.
- **Câu dẫn:** “Mã QR hoạt động.”


## Người giới thiệu: đăng ký → xác minh → checklist

### 1. Đăng ký người giới thiệu

[Ảnh 01-register.jpg](../assets/ordered-flow-2026-11-12/02-referrer/01-register.jpg)

- **Thao tác:** Điền email/mật khẩu.
- **Quan sát:** Nút tạo tài khoản mở.
- **Câu dẫn:** “Nút tạo tài khoản mở.”

### 2. Chờ xác minh người giới thiệu

[Ảnh 02-wait-verification.jpg](../assets/ordered-flow-2026-11-12/02-referrer/02-wait-verification.jpg)

- **Thao tác:** Tạo tài khoản xong.
- **Quan sát:** Chưa có quyền giới thiệu; cần xác minh email và quản trị.
- **Câu dẫn:** “Chưa có quyền giới thiệu; cần xác minh email và quản trị.”

### 3. Đối chiếu bốn điều kiện

[Ảnh 03-checklist.jpg](../assets/ordered-flow-2026-11-12/02-referrer/03-checklist.jpg)

- **Thao tác:** Xác nhận danh tính, đơn vị, đào tạo, phạm vi.
- **Quan sát:** Đủ checklist để đề nghị duyệt.
- **Câu dẫn:** “Đủ checklist để đề nghị duyệt.”


## Quản trị: xác minh người giới thiệu → duyệt TNV

### 1. Đăng nhập quản trị

[Ảnh 01-login.jpg](../assets/ordered-flow-2026-11-12/03-admin/01-login.jpg)

- **Thao tác:** Dùng tài khoản được cấp.
- **Quan sát:** Quản trị không tự đăng ký từ app.
- **Câu dẫn:** “Quản trị không tự đăng ký từ app.”

### 2. Xác minh người giới thiệu

[Ảnh 02-referrer-details.jpg](../assets/ordered-flow-2026-11-12/03-admin/02-referrer-details.jpg)

- **Thao tác:** Điền đơn vị, chức vụ và căn cứ.
- **Quan sát:** Quản trị xác nhận trước cấp quyền.
- **Câu dẫn:** “Quản trị xác nhận trước cấp quyền.”

### 3. Người giới thiệu đã có quyền

[Ảnh 03-referrer-approved.jpg](../assets/ordered-flow-2026-11-12/03-admin/03-referrer-approved.jpg)

- **Thao tác:** Xác nhận cấp quyền.
- **Quan sát:** Backend thông báo thành công.
- **Câu dẫn:** “Backend thông báo thành công.”

### 4. Quản trị xem đơn đã xác nhận

[Ảnh 04-review-volunteer.jpg](../assets/ordered-flow-2026-11-12/03-admin/04-review-volunteer.jpg)

- **Thao tác:** Tải đơn chờ.
- **Quan sát:** Hiện checklist/căn cứ từ người giới thiệu.
- **Câu dẫn:** “Hiện checklist/căn cứ từ người giới thiệu.”

### 5. Xác nhận mở quyền nhận ca

[Ảnh 05-confirm-approval.jpg](../assets/ordered-flow-2026-11-12/03-admin/05-confirm-approval.jpg)

- **Thao tác:** Bấm Duyệt đơn.
- **Quan sát:** Cần xác nhận cuối.
- **Câu dẫn:** “Cần xác nhận cuối.”


## TNV: đăng ký → hồ sơ → chờ duyệt → được duyệt

### 1. Chọn TNV

[Ảnh 01-select-role.jpg](../assets/ordered-flow-2026-11-12/04-volunteer/01-select-role.jpg)

- **Thao tác:** Mở đăng ký.
- **Quan sát:** Chọn tình nguyện viên.
- **Câu dẫn:** “Chọn tình nguyện viên.”

### 2. Tạo tài khoản TNV

[Ảnh 02-register.jpg](../assets/ordered-flow-2026-11-12/04-volunteer/02-register.jpg)

- **Thao tác:** Nhập email, mật khẩu và xác nhận dữ liệu.
- **Quan sát:** Sẵn sàng tạo tài khoản.
- **Câu dẫn:** “Sẵn sàng tạo tài khoản.”

### 3. Thông tin ứng tuyển

[Ảnh 03-application-top.jpg](../assets/ordered-flow-2026-11-12/04-volunteer/03-application-top.jpg)

- **Thao tác:** Điền danh tính và đào tạo.
- **Quan sát:** Chưa gửi.
- **Câu dẫn:** “Chưa gửi.”

### 4. Chỉ định người giới thiệu

[Ảnh 04-application-manager.jpg](../assets/ordered-flow-2026-11-12/04-volunteer/04-application-manager.jpg)

- **Thao tác:** Điền đơn vị và email quản lý.
- **Quan sát:** Người quản lý sẽ đối chiếu hồ sơ.
- **Câu dẫn:** “Người quản lý sẽ đối chiếu hồ sơ.”

### 5. TNV chờ người giới thiệu

[Ảnh 05-wait-referrer.jpg](../assets/ordered-flow-2026-11-12/04-volunteer/05-wait-referrer.jpg)

- **Thao tác:** Gửi hồ sơ.
- **Quan sát:** Chưa được nhận ca.
- **Câu dẫn:** “Chưa được nhận ca.”

### 6. TNV chờ quản trị

[Ảnh 06-wait-admin.jpg](../assets/ordered-flow-2026-11-12/04-volunteer/06-wait-admin.jpg)

- **Thao tác:** Người giới thiệu đã xác nhận.
- **Quan sát:** Chờ mở quyền nhận ca.
- **Câu dẫn:** “Chờ mở quyền nhận ca.”

### 7. TNV được duyệt

[Ảnh 07-approved.jpg](../assets/ordered-flow-2026-11-12/04-volunteer/07-approved.jpg)

- **Thao tác:** Mở lại TNV đã duyệt sau chỉnh sửa giao diện.
- **Quan sát:** Tài khoản được duyệt, đang tắt Sẵn sàng; ảnh chụp lại sau các ca.
- **Câu dẫn:** “Tài khoản được duyệt, đang tắt Sẵn sàng; ảnh chụp lại sau các ca.”


## Trường hợp 1: một ca hỗ trợ

### 1. TNV sẵn sàng trước ca

[Ảnh 01-ready.jpg](../assets/ordered-flow-2026-11-12/05-single-case/01-ready.jpg)

- **Thao tác:** Chuẩn bị trạng thái Sẵn sàng qua API local sau sửa UI.
- **Quan sát:** Hiển thị Sẵn sàng, không còn mục nhập tọa độ.
- **Câu dẫn:** “Hiển thị Sẵn sàng, không còn mục nhập tọa độ.”

### 2. Người qua đường mở QR

[Ảnh 02-scan.jpg](../assets/ordered-flow-2026-11-12/05-single-case/02-scan.jpg)

- **Thao tác:** Mở lại thẻ sau khi chỉnh giao diện.
- **Quan sát:** Trang báo hỗ trợ không còn công cụ tọa độ.
- **Câu dẫn:** “Trang báo hỗ trợ không còn công cụ tọa độ.”

### 3. Xác nhận điểm bệnh nhân

[Ảnh 03-confirm-location.jpg](../assets/ordered-flow-2026-11-12/05-single-case/03-confirm-location.jpg)

- **Thao tác:** Đánh dấu đang ở cạnh bệnh nhân.
- **Quan sát:** Nút báo hỗ trợ mở; chưa gửi GPS hoặc tạo ca từ bước này.
- **Câu dẫn:** “Nút báo hỗ trợ mở; chưa gửi GPS hoặc tạo ca từ bước này.”

### 4. Máy chủ đã nhận yêu cầu

[Ảnh 04-server-ack.jpg](../assets/ordered-flow-2026-11-12/05-single-case/04-server-ack.jpg)

- **Thao tác:** Gửi báo hỗ trợ.
- **Quan sát:** Đã tạo một lời mời; bảng hỏi mở.
- **Câu dẫn:** “Đã tạo một lời mời; bảng hỏi mở.”

### 5. Chọn quan sát

[Ảnh 05-questionnaire-top.jpg](../assets/ordered-flow-2026-11-12/05-single-case/05-questionnaire-top.jpg)

- **Thao tác:** Chọn phản ứng và nhịp thở.
- **Quan sát:** Ghi điều nhìn thấy, không đoán bệnh.
- **Câu dẫn:** “Ghi điều nhìn thấy, không đoán bệnh.”

### 6. Chọn chảy máu và gửi

[Ảnh 06-questionnaire-bottom.jpg](../assets/ordered-flow-2026-11-12/05-single-case/06-questionnaire-bottom.jpg)

- **Thao tác:** Không nhập số điện thoại.
- **Quan sát:** Ba câu trả lời vẫn gửi được.
- **Câu dẫn:** “Ba câu trả lời vẫn gửi được.”

### 7. TNV nhận lời mời

[Ảnh 07-alert.jpg](../assets/ordered-flow-2026-11-12/05-single-case/07-alert.jpg)

- **Thao tác:** Một yêu cầu được gửi.
- **Quan sát:** Hiện triệu chứng và khoảng cách.
- **Câu dẫn:** “Hiện triệu chứng và khoảng cách.”

### 8. Nhận ca thành công

[Ảnh 08-accepted.jpg](../assets/ordered-flow-2026-11-12/05-single-case/08-accepted.jpg)

- **Thao tác:** Bấm Nhận ca.
- **Quan sát:** Ca thuộc một TNV.
- **Câu dẫn:** “Ca thuộc một TNV.”

### 9. Xác nhận lên đường

[Ảnh 09-departure.jpg](../assets/ordered-flow-2026-11-12/05-single-case/09-departure.jpg)

- **Thao tác:** Nhập thời gian dự kiến 5 phút.
- **Quan sát:** TNV đã xác nhận tiến độ.
- **Câu dẫn:** “TNV đã xác nhận tiến độ.”

### 10. Hồ sơ sau khi nhận

[Ảnh 10-medical.jpg](../assets/ordered-flow-2026-11-12/05-single-case/10-medical.jpg)

- **Thao tác:** Cuộn tới thông tin bệnh nhân.
- **Quan sát:** Tên, bệnh nền, dị ứng và liên hệ đúng.
- **Câu dẫn:** “Tên, bệnh nền, dị ứng và liên hệ đúng.”

### 11. Bản đồ trong app

[Ảnh 11-map.jpg](../assets/ordered-flow-2026-11-12/05-single-case/11-map.jpg)

- **Thao tác:** Xem đường đến bệnh nhân.
- **Quan sát:** Hai điểm và tuyến ô tô tham khảo.
- **Câu dẫn:** “Hai điểm và tuyến ô tô tham khảo.”

### 12. Xác nhận đến nơi

[Ảnh 12-arrival-confirm.jpg](../assets/ordered-flow-2026-11-12/05-single-case/12-arrival-confirm.jpg)

- **Thao tác:** Bấm Đã đến nơi.
- **Quan sát:** Hiện hộp xác nhận; chỉ là thao tác trong ca local.
- **Câu dẫn:** “Hiện hộp xác nhận; chỉ là thao tác trong ca local.”

### 13. Hoàn tất ca

[Ảnh 13-complete-confirm.jpg](../assets/ordered-flow-2026-11-12/05-single-case/13-complete-confirm.jpg)

- **Thao tác:** Bấm Hoàn tất.
- **Quan sát:** Cần xác nhận để đóng thông tin riêng.
- **Câu dẫn:** “Cần xác nhận để đóng thông tin riêng.”

### 14. Người báo thấy ca kết thúc

[Ảnh 14-reporter-ended.jpg](../assets/ordered-flow-2026-11-12/05-single-case/14-reporter-ended.jpg)

- **Thao tác:** TNV xác nhận hoàn tất.
- **Quan sát:** Bảng hỏi bị đóng, không nhận thêm cập nhật.
- **Câu dẫn:** “Bảng hỏi bị đóng, không nhận thêm cập nhật.”


## Trường hợp 2: cập nhật tình trạng

### 1. Bắt đầu ca cập nhật

[Ảnh 01-new-request.jpg](../assets/ordered-flow-2026-11-12/06-condition-update/01-new-request.jpg)

- **Thao tác:** Mở lại trang trước yêu cầu.
- **Quan sát:** Trang trước khi gửi, không có công cụ kiểm thử.
- **Câu dẫn:** “Trang trước khi gửi, không có công cụ kiểm thử.”

### 2. Bản tình trạng số 1

[Ảnh 02-before.jpg](../assets/ordered-flow-2026-11-12/06-condition-update/02-before.jpg)

- **Thao tác:** Người báo gửi lần đầu.
- **Quan sát:** TNV thấy thở đều.
- **Câu dẫn:** “TNV thấy thở đều.”

### 3. Người báo thay đổi quan sát

[Ảnh 03-change.jpg](../assets/ordered-flow-2026-11-12/06-condition-update/03-change.jpg)

- **Thao tác:** Đổi sang khó thở và thấy máu.
- **Quan sát:** Cần bấm gửi để TNV nhận bản mới.
- **Câu dẫn:** “Cần bấm gửi để TNV nhận bản mới.”

### 4. TNV tự nhận bản số2

[Ảnh 04-new-version.jpg](../assets/ordered-flow-2026-11-12/06-condition-update/04-new-version.jpg)

- **Thao tác:** Người báo gửi lần2.
- **Quan sát:** Khó thở và chảy máu cập nhật cùng ca.
- **Câu dẫn:** “Khó thở và chảy máu cập nhật cùng ca.”

### 5. Người báo thấy xác nhận tải

[Ảnh 05-loaded-ack.jpg](../assets/ordered-flow-2026-11-12/06-condition-update/05-loaded-ack.jpg)

- **Thao tác:** Đợi app TNV tải.
- **Quan sát:** Phân biệt đã lưu với đã tải.
- **Câu dẫn:** “Phân biệt đã lưu với đã tải.”


## Trường hợp 3: ba ca đồng thời

### 1. Ba bệnh nhân báo đồng thời

[Ảnh 01-three-alerts.jpg](../assets/ordered-flow-2026-11-12/07-multiple-cases/01-three-alerts.jpg)

- **Thao tác:** API local gửi3ca thật.
- **Quan sát:** Hiện3lời mời với111/222/334m.
- **Câu dẫn:** “Hiện3lời mời với111/222/334m.”

### 2. Danh sách nhiều ca

[Ảnh 02-list.jpg](../assets/ordered-flow-2026-11-12/07-multiple-cases/02-list.jpg)

- **Thao tác:** Đóng cửa sổ nổi.
- **Quan sát:** Cả3ca vẫn còn, khoảng cách riêng.
- **Câu dẫn:** “Cả3ca vẫn còn, khoảng cách riêng.”

### 3. Chuyển ca đang xem

[Ảnh 03-select.jpg](../assets/ordered-flow-2026-11-12/07-multiple-cases/03-select.jpg)

- **Thao tác:** Chọn ca111m.
- **Quan sát:** Có thể xem từng ca trước khi nhận.
- **Câu dẫn:** “Có thể xem từng ca trước khi nhận.”

### 4. Đang nhận một ca

[Ảnh 04-one-active.jpg](../assets/ordered-flow-2026-11-12/07-multiple-cases/04-one-active.jpg)

- **Thao tác:** Nhận ca111m.
- **Quan sát:** Còn2ca chờ; phải hoàn tất ca hiện tại.
- **Câu dẫn:** “Còn2ca chờ; phải hoàn tất ca hiện tại.”

### 5. Không nhận thêm khi đang bận

[Ảnh 05-block-second.jpg](../assets/ordered-flow-2026-11-12/07-multiple-cases/05-block-second.jpg)

- **Thao tác:** Mở ca thứ hai.
- **Quan sát:** Nút Nhận ca bị khóa.
- **Câu dẫn:** “Nút Nhận ca bị khóa.”


## Trường hợp 4: không thể tiếp tục → bàn giao

### 1. Ca riêng cho bài bàn giao

[Ảnh 01-original-offer.jpg](../assets/ordered-flow-2026-11-12/08-cannot-continue/01-original-offer.jpg)

- **Thao tác:** Tạo ca mới qua API local sau chỉnh sửa giao diện.
- **Quan sát:** TNV đầu nhận lời mời; toàn bộ nhóm bàn giao chụp lại trên ca mới.
- **Câu dẫn:** “TNV đầu nhận lời mời; toàn bộ nhóm bàn giao chụp lại trên ca mới.”

### 2. Xin người thay ca

[Ảnh 02-request-handover.jpg](../assets/ordered-flow-2026-11-12/08-cannot-continue/02-request-handover.jpg)

- **Thao tác:** TNV chọn Không thể tiếp tục.
- **Quan sát:** Hiện xác nhận trước khi phát lời mời bàn giao.
- **Câu dẫn:** “Hiện xác nhận trước khi phát lời mời bàn giao.”

### 3. Đang tìm người thay

[Ảnh 03-wait-replacement.jpg](../assets/ordered-flow-2026-11-12/08-cannot-continue/03-wait-replacement.jpg)

- **Thao tác:** Xác nhận không thể tiếp tục.
- **Quan sát:** Chưa bỏ ca trước khi có TNV khác nhận.
- **Câu dẫn:** “Chưa bỏ ca trước khi có TNV khác nhận.”

### 4. TNV khác nhận lời mời

[Ảnh 04-replacement-offer.jpg](../assets/ordered-flow-2026-11-12/08-cannot-continue/04-replacement-offer.jpg)

- **Thao tác:** Mở tài khoản TNV thứ hai.
- **Quan sát:** Có nút Xác nhận nhận bàn giao và khoảng cách.
- **Câu dẫn:** “Có nút Xác nhận nhận bàn giao và khoảng cách.”

### 5. Người thay đã nhận ca

[Ảnh 05-new-owner.jpg](../assets/ordered-flow-2026-11-12/08-cannot-continue/05-new-owner.jpg)

- **Thao tác:** TNV thứ hai xác nhận nhận bàn giao.
- **Quan sát:** Mở chi tiết ca và hồ sơ được chia sẻ.
- **Câu dẫn:** “Mở chi tiết ca và hồ sơ được chia sẻ.”

### 6. Người cũ được giải phóng

[Ảnh 06-original-released.jpg](../assets/ordered-flow-2026-11-12/08-cannot-continue/06-original-released.jpg)

- **Thao tác:** Hệ thống cập nhật sau bàn giao.
- **Quan sát:** TNV đầu không còn phụ trách ca.
- **Câu dẫn:** “TNV đầu không còn phụ trách ca.”

### 7. Người nhận thay kết thúc ca

[Ảnh 07-complete-replacement.jpg](../assets/ordered-flow-2026-11-12/08-cannot-continue/07-complete-replacement.jpg)

- **Thao tác:** Chọn Hoàn tất ca hỗ trợ.
- **Quan sát:** Yêu cầu xác nhận đóng ca.
- **Câu dẫn:** “Yêu cầu xác nhận đóng ca.”

### 8. Ca bàn giao đã kết thúc

[Ảnh 08-ended.jpg](../assets/ordered-flow-2026-11-12/08-cannot-continue/08-ended.jpg)

- **Thao tác:** Người nhận thay xác nhận hoàn tất.
- **Quan sát:** Không còn ca đang phụ trách, Sẵn sàng tắt.
- **Câu dẫn:** “Không còn ca đang phụ trách, Sẵn sàng tắt.”

## Kết quả đọc lại backend

- Bảy ca (gồm lượt bàn giao chụp lại): năm completed, hai cancelled; không còn ca đang mở trong bộ này.
- Ca cập nhật giữ reportRevision=2. Bàn giao có bản ghi accepted. Hai TNV OFF và không có activeIncidentId.
- Nhận ca thứ hai khi đang bận: nút UI bị khóa; API trả HTTP400.

## Phạm vi, lỗi và giới hạn

- Tài khoản quản trị do người vận hành chuẩn bị; không có chức năng tự đăng ký quản trị.
- Patient, TNV chính và người giới thiệu đăng ký qua UI. Bước xác minh email người giới thiệu được đặt bằng Auth emulator; chưa thử mở email/hộp thư thật.
- TNV thứ hai và hai bệnh nhân bổ sung được chuẩn bị qua Auth/API local, không có bộ ảnh đăng ký UI riêng cho họ.
- Ba ca đồng thời được tạo qua API thật với ba điểm cách TNV khoảng 111/222/334 m; UI được chụp sau đó. Đây không phải bài đo giới hạn tải hay GPS thật.
- Lần chuẩn bị ba ca có một report bị HTTP400 do enum difficult sai (đúng là difficulty). Không tạo lại ca hoặc sửa lịch sử: cả ba ca đã tồn tại; ca đầu giữ reportRevision=0, hai ca còn lại=1. Đã sửa giá trị đầu vào cho các lần sau.
- Đã bấm xác nhận đến nơi trong ca local để kiểm tra chuyển trạng thái; không có người thực sự di chuyển tới điểm.
- Nút “Không thể tiếp tục” gửi lời mời cho người thay; người cũ chỉ được giải phóng sau khi người mới xác nhận. Không tự bỏ ca.
- Có thử đọc backend ban đầu không kết nối trong môi trường hạn chế; chạy lại với quyền kết nối local đã trả kết quả. Không thay trạng thái dữ liệu để làm đẹp kết quả.
- Sau góp ý về nội dung chạy thử: đã bỏ công cụ tọa độ và nhãn kiểm thử khỏi UI app/web, xóa component chỉ phục vụ công cụ đó. 13 ảnh bị ảnh hưởng được chụp lại; toàn bộ nhóm bàn giao chụp lại trên một ca mới. Ảnh cũ lưu riêng ngoài bộ bàn giao, không chỉnh sửa pixel để che nhãn. Các ảnh không bị ảnh hưởng giữ thời điểm gốc. Chưa triển khai cloud hoặc phát hành APK/OTA trong đợt này.

## Đối chiếu cloud riêng biệt

[Bài UAT cloud 11/11](../testing/verification/CLOUD_UAT_2026_11_11.md) ghi ca phối hợp điện thoại, cập nhật bản2, bàn giao và kết thúc. [Bộ ảnh cloud trước](PRESENTATION_SCENARIOS_2026_11_12.md) có ngày kiểm chứng riêng. Không coi 53 ảnh local này là ảnh cloud mới hoặc APK. Các mục máy thật/GPS di chuyển/offline/hiệu suất chưa nghiệm thu vẫn giữ mở trong trạng thái dự án.
