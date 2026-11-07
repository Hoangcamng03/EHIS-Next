# Câu trả lời người báo, tiến độ TNV và font chữ

Áp dụng từ mã0.4.15; tra [STATUS](../STATUS.md) để biết đã phát hành ở web/APK nào. Đây là cơ chế hỗ trợ diễn tập, không bảo đảm TNV đến đúng giờ hoặc đã đánh giá y khoa.

## 1. Trả lời hai câu hỏi của Phúc Nguyên

**Có 4G liên tục có bảo đảm TNV đến đúng hẹn không?** Không. Mạng chỉ giúp trao đổi dữ liệu; GPS cần quyền và tín hiệu, ứng dụng có thể vào nền, người đi đường có thể gặp trở ngại. Bản đồ/OSRM hiện trả tuyến tham khảo, chưa có giao thông trực tiếp. Không suy ra TNV đã di chuyển chỉ từ việc nhận ca hoặc app còn kết nối.

Luồng kiểm soát mới:

1. TNV nhận ca: hiển thị **Đã nhận**, chưa mặc định là đã đi.
2. TNV nhập1–120 phút rồi xác nhận **Đang lên đường**. Máy chủ ghi giờ dự kiến từ thời điểm xác nhận; đây là dự kiến do TNV tự xác nhận, không phải thời hạn bảo đảm.
3. Khi mở màn ca phía trước, app kiểm tra kết nối mỗi90s; máy chủ giới hạn ghi heartbeat không sớm hơn60s. Dấu thời gian này **không phải GPS hoặc bằng chứng di chuyển**. Heartbeat không kéo dài ETA.
4. TNV có thể xác nhận lại ETA hoặc báo chậm/không thể tiếp tục. Thiết bị thứ hai không được dùng bản tiến độ cũ để ghi đè; mất phản hồi rồi gửi lại cùng mã không tạo giờ hẹn mới.
5. Quá giờ dự kiến, hơn3phút chưa có cập nhật kết nối, hoặc chưa xác nhận lên đường sau3phút: hiển thị cần kiểm tra. Khi app ở nền/khóa màn, heartbeat có thể dừng dù máy còn4G; cảnh báo là thiếu thông tin, không kết luận TNV bỏ ca.
6. Quản trị liên hệ xác minh rồi dùng [bàn giao có xác nhận](HANDOVER_AND_MAINTENANCE.md). Không tự đóng/chuyển ca vì thời gian. Sau bàn giao, xóa ETA/xác nhận tải của người cũ; người mới xác nhận lại. Chưa cấu hình đầu mối trực, không tự dùng số cá nhân.

Người báo và Patient xem tiến độ qua projection riêng. Bảng quản trị hiển thị dữ liệu từ lần tải gần nhất; đồng hồ cảnh báo chạy tại chỗ, phải bấm tải lại để nhận thay đổi mới. Không có hệ thống trực/nhắn gọi tự động khi quản trị đóng trang.

**Bấm Yes/No thì TNV nhận gì, cập nhật liên tục thế nào?** Gửi câu trả lời/quan sát, không gửi “câu hỏi mới” cho TNV. Ba câu hiện gồm phản ứng, thở và máu nhìn thấy; không phải chẩn đoán.

| Bước | Giao diện | Điều thực sự xảy ra |
| --- | --- | --- |
| Người báo chọn đáp án | Đang sửa · chưa gửi TNV | Chỉ đổi bản nháp trên màn hình |
| Bấm Gửi thông tin bổ sung | Máy chủ đã lưu bản sốN | Backend kiểm tra owner/revision, lưu vào cùng ca và tăng số bản; gửi lặp cùng mã không tạo bản khác |
| App TNV đang kết nối | Bản tình trạng sốN + giờ cập nhật | Firestore listener nhận bản mới. Người nhận ca tải chi tiết theo quyền; app foreground gửi xác nhận tải khi đã có dữ liệu đúng số bản |
| Người báo thấy xác nhận tải | App TNV xác nhận tải bảnN | Chỉ là xác nhận do app gửi, không chứng minh con người đã đọc/hiểu/đánh giá y khoa |
| Người báo quan sát thay đổi | Chọn lại và Gửi lần nữa | N+1 cập nhật cùng ca, TNV nhận bản mới và cơ chế chuông cập nhật hiện có |
| App TNV offline/nền/bản cũ | Chưa có xác nhận tải bản mới | Không hiển thị “đã đọc”. Không thể bảo đảm giao ngay hoặc chuông nền; app cũ có thể không gửi xác nhận |

Không tự biết tình trạng bệnh nhân nếu người báo không quan sát/gửi tiếp. Không tự gửi từng radio để tránh chuyển cả các lựa chọn chưa hoàn tất. Snapshot cache không được dùng như xác nhận dữ liệu mới từ server; mất phiên/trình duyệt khác không có quyền xem lại báo cáo của người gửi.

## 2. Phông chữ

- Dùng font hệ thống có fallback tiếng Việt, không phụ thuộc font CDN: Android sans-serif; iOS System; web system-ui/Segoe UI/Roboto/Noto Sans/Arial theo hệ điều hành.
- Text, nút, ô nhập, tiêu đề điều hướng, công tắc web và phần HTML bản đồ dùng cùng chính sách. TextInput mật khẩu không vô tình chuyển sang kiểu chữ khác; vẫn cần thử show/hide thật trên máy.
- Giữ chữ co giãn theo thiết bị, nút tự giãn khi xuống dòng; chừa khoảng cho dấu tiếng Việt. Kiểm tra UTF-8 chỉ xác nhận mã nguồn, không chứng minh glyph/hiển thị trên mọi điện thoại.

## 3. Bài nghiệm thu nhóm

1. Hai Android hoặc app web bản mới; admin laptop. Tạo ca giả, gửi bản1, TNV nhận; đối chiếu số bản/thời gian và xác nhận tải.
2. TNV nhập5phút rồi xác nhận lên đường; người báo/Patient thấy giờ. Gửi bản2 có thay đổi rõ, đối chiếu TNV hiện2 và người báo nhận xác nhận2. Việc chỉ chọn radio chưa bấm Gửi không được đổi bản TNV.
3. Tắt mạng TNV, gửi bản3, kiểm tra không xuất hiện xác nhận3 giả. Mở lại mạng/app, bản3 phải tới rồi mới có xác nhận tải3. Ghi thời gian thực, không giả kết quả chuông.
4. Báo trở ngại, admin tải lại thấy trạng thái. Bàn giao A→B: A không còn sửa ETA/xác nhận tải; B không kế thừa ETA hoặc xác nhận cũ.
5. Muốn quan sát cảnh báo theo thời gian thật thì chờ đúng mốc và ghi giờ bắt đầu/kết thúc. Timestamp fixture trong test tự động không thay được bài chờ thật này. Ca không tự đóng khi quá ETA.
6. Font: kiểm tra Đ/đ/ă/â/ê/ô/ơ/ư và dấu ở màn Patient, TNV, đăng nhập/mật khẩu, bảng hỏi/admin/bản đồ; cỡ chữ hệ thống1×/1.3×/2×, màn hẹp và bàn phím. Mục chưa thử ghi Chưa thử.

Nguồn giới hạn nền: [Android background location](https://developer.android.com/develop/sensors-and-location/location/background), [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/). Không bật GPS nền trong đợt này.
