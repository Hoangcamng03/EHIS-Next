# EHIS 0.4.10 — giao diện gọn và thao tác dễ hơn

Ngày 27/10/2026. [Trạng thái phát hành](../../STATUS.md) · [Lab note](../../LAB_NOTES.md). Đợt này chỉ đổi frontend; backend giữ 0.4.9, không đổi API, Rules, dữ liệu hay gói dịch vụ.

## 1. Những gì thay đổi

- Chữ mặc định 16, tiêu đề chính 26; khoảng cách và câu hướng dẫn ngắn hơn. Giữ phóng chữ theo cài đặt hệ thống, nội dung được xuống dòng.
- Nút chính cao tối thiểu 48, vùng nhận chạm mở thêm 6 và giữ thao tác khi ngón tay lệch nhẹ. Có phản hồi khi nhấn và trạng thái đang xử lý; hành động vẫn xảy ra khi thả tay, không chuyển sang thực thi ngay khi vừa chạm.
- Khi bàn phím mở, vùng cuộn cho phép bấm nút; kéo để đóng bàn phím. Công tắc cho phép bấm cả hàng. Web dùng checkbox gốc với role switch để hỗ trợ Space, focus và một mục trợ năng duy nhất.
- Thông tin phụ về âm báo, GPS, đường đi, liên kết QR và hướng dẫn được thu gọn. Sai số/độ mới GPS, trạng thái khẩn, quyền chia sẻ hồ sơ và xác nhận kết thúc/vô hiệu hóa QR vẫn giữ.
- Nhãn chính: **Nhận ca**, **Đã đến nơi**, **Thử chuông**, **Đóng · Xem danh sách ca**. Popup khẩn bỏ hiệu ứng chuyển cảnh; giữ màu đỏ và danh sách lựa chọn ca.
- Nút zoom và vùng bấm điểm bản đồ 48 trên web/WebView; không đổi thuật toán GPS, định tuyến hoặc điều phối.

## 2. Kết quả kiểm tra local

| Lớp | Kết quả quan sát |
| --- | --- |
| Check | Đạt kiểm tra repository, type/lint, 12 backend + 34 logic = 46 test |
| Integration | Đạt 10 bộ; có 32 ca trước ON, 35 lịch sử mới hơn, tranh nhận và ngưỡng 101. Lượt late delivery 186ms local không phải SLA cloud |
| Giao diện 390 × 844 | Đăng nhập/đăng ký gọn, hai vai trò có mô tả, consent chặn tạo trước khi đồng ý, không tràn ngang ở màn đo |
| Công tắc/trợ năng | Bấm nhãn và Space bật/tắt đúng; disclosure mở bằng Enter; nút đang nhận ca bị khóa/có trạng thái chờ |
| TNV và nhiều ca | Hai ca giả gửi trước ON; chọn ca thứ hai bằng mép trong nút, nhận đúng ca, khóa đổi sẵn sàng khi bận, có hồ sơ/map sau xác nhận |
| Map 360 × 780 | Tuyến nhúng 0,88km/~2 phút với vị trí giả; bấm zoom +/-; vùng zoom/marker 48; không tràn ngang ở màn đo |
| Kết thúc ca | Đã đến nơi → mở xác nhận → quay lại → xác nhận hoàn tất; backend completed, private/map đóng và TNV OFF |
| Patient | Đăng ký qua UI → vào đúng vai trò, lưu hồ sơ giả, đồng ý chia sẻ, tạo QR; vô hiệu hóa vẫn khóa trước khi xác nhận |
| Đối chiếu dữ liệu | Đọc lại Emulator xác nhận purpose/profile/card/consent/completed/OFF; đóng ca chờ thuộc phiên thử. Không sửa tài khoản cloud của nhóm |
| Console | Không có error ở lần đọc cuối; không suy ra mọi thiết bị đều không lỗi |

Không chạy lại bài local 1.000 Auth chỉ để đo chữ; backend không đổi. Bài scale trong CI được ghi riêng khi hoàn thành, không dùng kết quả lịch sử như số đo mới.

## 3. Những lần chưa đạt và cách xử lý

- Công tắc Pressable trên web ban đầu chưa hỗ trợ Space/ARIA đúng: thay bằng input/label của trình duyệt và kiểm tra lại cả chuột/bàn phím. Metro từng giữ cách resolve cũ; khởi động sạch mới xác nhận bản sửa.
- Công cụ nhập trên một tab gặp lỗi focus/target token. Sau ba lượt, kiểm tra DOM/hit-test không thấy lớp che của app; mở tab thử riêng, xác nhận focus rồi nhập bằng giao diện. Đăng nhập và đăng ký cuối cùng đều hoàn tất; không thêm cách lách vào code sản phẩm.
- Một lệnh hỗ trợ bị lỗi escape PowerShell trước khi chạy; chuyển sang file hỗ trợ local, không ghi secret vào Git. Hai lần đọc sai đường dẫn tài liệu đã được điều chỉnh, không thay đổi source.

## 4. Ảnh và nghiệm thu còn thiếu

[Đăng nhập](../../assets/trial-0410/login.png) · [Chọn vai trò](../../assets/trial-0410/roles.png) · [TNV](../../assets/trial-0410/volunteer-idle.png) · [Hai ca khẩn](../../assets/trial-0410/emergency.png) · [Map 360px](../../assets/trial-0410/map.png) · [Patient QR](../../assets/trial-0410/patient-qr.png). Ảnh dùng dữ liệu giả/Emulator; RN ScrollView chỉ chụp vùng đang thấy.

Máy Android/Samsung thật **Chưa thử**. Cần cài đè APK mới, kiểm tra bấm sát mép, cuộn rồi bấm, bàn phím mở, chữ hệ thống lớn, công tắc, popup hai ca, zoom và xác nhận hoàn tất. Kiểm tra loa/rung/GPS theo [phiếu nghiệm thu](../ACCEPTANCE_FLOW.md). Không coi browser hoặc artifact đạt là đã sửa được mọi vấn đề cảm ứng/vận hành thật.
