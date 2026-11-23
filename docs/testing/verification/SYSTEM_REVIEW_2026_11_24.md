# Rà soát hệ thống 24/11/2026

**Phạm vi:** phần mềm local, dự án Emulator `demo-ehis-next`, hồ sơ hư cấu. Chủ dự án chưa có điện thoại trong phiên. Source đã sửa; chưa triển khai cloud, APK hoặc OTA. Android đã công bố vẫn là 0.4.23/code21.

[Số liệu và dấu kiểm tra tệp](SYSTEM_REVIEW_2026_11_24.json) · [Trạng thái phát hành](../../STATUS.md) · [Nhật ký](../../LAB_NOTES.md).

## 1. Lỗi đã tái hiện và sửa

| Vấn đề | Cách xử lý |
| --- | --- |
| Lỗi đổi quyền chia sẻ bị hộp xác nhận che | Hiện lỗi trong hộp; giữ lựa chọn cũ khi thất bại; chặn gửi lặp/mất kết nối. Bài UI trả lỗi API có chủ đích để kiểm cách hiển thị. |
| Lối tắt Liên hệ khẩn cấp mở đầu hồ sơ | Cuộn thẳng đến tên, quan hệ, số điện thoại; kiểm các ô trong viewport 390×844 và quay lại thẻ QR. |
| GPS cũ vẫn được xác nhận | Kiểm sai số thiết bị báo ≤30 m, tuổi ≤10 giây trước gửi và tại backend khi client mới cung cấp metadata. Pin thủ công là xác nhận riêng. |
| Backend đã đổi điểm nhưng người báo mất phản hồi | Khóa nguyên yêu cầu chưa rõ kết quả; kiểm tra lại cùng mã/nội dung. Backend đọc kết quả đã lưu trước kiểm tuổi GPS. Bài backend thực sự chờ 11 giây rồi gửi lại. |
| Bàn giao vẫn dùng vị trí cũ | Tự chọn lại ứng viên khi đổi điểm, đóng lời mời cũ; đề nghị do admin chọn phải chọn lại. Giữ người phụ trách cũ đến khi người thay xác nhận. |
| Điểm mới giữ trạng thái Đã đến/ETA cũ | Xóa xác nhận đến/tiến độ cũ; đóng hộp xác nhận nếu điểm thay đổi; backend từ chối revision cũ khi client mới cung cấp. |
| Đổi điểm lúc mở xác nhận gây lỗi `_leaflet_pos` | Trace chỉ ra callback kết thúc zoom sau khi map bị tháo. Tắt chuyển cảnh zoom trong khung chỉ đường, dừng pan và bỏ resize callback sau tháo. Vẫn kéo/zoom bản đồ được. UI bắt lỗi JavaScript và hoàn tất ca qua giao diện. |
| node-forge của công cụ build có advisory | Nâng override/lock từ 1.4.2 lên 1.4.3; chỉ một dependency thực tế thay đổi; giữ Expo hiện tại. |

Đã cập nhật API và quyền riêng tư về metadata GPS. Client cũ được hỗ trợ khi chưa gửi metadata/revision; không tuyên bố APK23 có bảo vệ client mới.

## 2. Kết quả

| Nhóm | Kết quả | Giới hạn |
| --- | --- | --- |
| Unit/source | 34 backend + 64 client đạt; repo/hợp đồng/type/lint/build đã chạy | Không thay thế máy thật |
| Liên thông | 21 chương trình đạt, gồm 11 bài Rules và 7 bất biến đổi điểm/bàn giao | Không cộng các bài con thành chương trình riêng |
| Giao diện | 12/12 đạt, lượt bàn giao cuối 40,3 giây, không retry/skip/flaky | Chromium; viewport mobile/desktop, không phải APK |
| Tải | 8/8 giai đoạn đạt; 320 API; 40 từ chối đúng mong đợi | HTTP wrapper dùng cho Vercel chạy loopback + Emulator |
| Đóng gói | Next web, Expo web và Android Hermes bundle local đạt | Chưa deploy; bundle Android không phải APK |
| Dependency | Backend/web: 0 advisory với omit=dev; app: còn 11 moderate, 0 high/critical | glob/minimatch và các mục kéo theo của Expo/ESLint, không phải 11 lỗ hổng độc lập |
| Cloud/Android mới | CHƯA TRIỂN KHAI / CHƯA THỬ | Không suy GPS/chuông/rung/crash từ browser |

Đã đi qua: đăng ký đúng vai trò, admin duyệt trực tiếp/kỹ năng, QR/quyền chia sẻ, báo tại chỗ/từ xa, nhiều ca, bật sẵn sàng muộn, tranh nhận, chặn TNV nhận thêm, cập nhật quan sát/điểm, bàn giao, đến nơi, hoàn tất, kiểm quyền và dọn dữ liệu. Không có nghĩa mọi tổ hợp thực tế đều đã thử.

### Số đo tải

- **1.000 tài khoản Auth**, **128 tài khoản có phiên**, **64 TNV sẵn sàng**, **32 client feed**, **32 ca đồng thời tại 8 vùng**. Không phải 1.000 người dùng đồng thời.
- Cảnh báo đến SDK: 32 mẫu; p50 **622 ms**, p95 **949 ms**, max **993 ms**.
- Tạo ca: 40 mẫu gồm gửi lại, p95 **931 ms**; nhận ca: 32 mẫu, **702 ms**; đổi điểm: 16 mẫu, **237 ms**; hoàn tất: 32 mẫu, **533 ms**.
- 32 ca hoàn tất/giải phóng người phụ trách; đọc riêng sau đóng bị chặn; không mời sang vùng cách xa trong kịch bản.
- Ngưỡng 15.000 ms. Một lượt đo local không phải SLA. Số lịch sử 943 ms và mới 949 ms không đủ kết luận nhanh/chậm hơn vì không có A/B cùng điều kiện. p95 Functions local lịch sử 21.866 ms vẫn là mục chưa đạt của phép đo đó; bài portable không xóa kết quả này.

### Các lần thất bại được giữ nguyên

1. UI trước sửa: **9 đạt, 3 thất bại** — chia sẻ, lối tắt liên hệ, GPS cũ.
2. Backend trước sửa: **thất bại** — giữ đề nghị bàn giao cũ sau đổi điểm.
3. Sau nhóm sửa đầu: UI **12 đạt** trong 40,3 giây.
4. Bổ sung hộp xác nhận đến nơi đang mở: **11 đạt, 1 thất bại**, trace phát hiện Leaflet. Chuỗi dừng trước tải; tải được chạy riêng sau đó.
5. Sau sửa vòng đời map: **12 đạt** trong 35,6 giây; không bỏ qua lỗi hoặc nới điều kiện.
6. Sau làm rõ nút Xác nhận dừng chia sẻ: **12 đạt** trong 40,3 giây. Backend bổ sung kiểm ETA trước bàn giao/đổi điểm, xóa cả mốc đến dự kiến đầu tiên theo điểm cũ.

Ảnh hồi quy đã xem lại tại `.local/uat-20261124/screens` trên máy làm việc; không đăng QR/tọa độ hoặc nhân bản bộ ảnh presentation lên public. Ảnh chia sẻ đầu chụp trúng fade; lần cuối tắt animation lúc chụp để đọc nội dung rõ ràng. Lỗi mạng được tạo chủ động trong UI; các API/backend khác chạy thật local. Tọa độ và đồng hồ trình duyệt cấu hình chỉ dùng kiểm logic, không phải nghiệm thu GPS hoặc số đo độ trễ.

## 3. Đánh giá và việc còn thiếu

**Cao — trước ca thật**

- Android thật: tự thoát gián đoạn lịch sử, Home/khóa/chuông/rung, mở đúng ca từ thông báo, tiết kiệm pin, quyền GPS, Wi-Fi/4G độc lập. Cần S22+ và Android khác; GPS đi bộ so mốc thực, không lấy sai số cảm biến thay kết quả.
- Chưa có đầu mối y tế trực/quy trình khi không ai nhận; tổ chức phải xác minh kỹ năng và phụ trách vận hành. Chưa có bằng chứng an toàn lâm sàng.
- Chưa kiểm tải cloud hoặc chứng minh maintenance/điều phối liên tục. Gói miễn phí chưa có cơ sở cam kết phản hồi khẩn cấp.
- App Check/chống lạm dụng cần kiểm cloud/thiết bị. Giữ giới hạn công suất; không xóa chặn 1.000 ứng viên để đổi lấy kết quả tìm kiếm thiếu.

**Trung bình — vòng tiếp**

- GPS sẵn sàng nền vẫn tối đa 5 phút; không bổ sung GPS nền trong vòng này.
- Theo dõi bản vá glob/minimatch tương thích Expo/ESLint; không chạy audit fix force hoặc hạ SDK. Không nhận glob từ người dùng EHIS.
- Kiểm màn ngắn/font lớn/mạng yếu trên máy thật; viewport 390×844 chưa bao quát mọi máy.
- Cần thành viên khác review; chưa có review độc lập trong phiên. Khi phát hành: backend → web → kiểm cloud → APK/QR cùng artifact → nghiệm thu máy, không ép cập nhật ca đang xử lý.

**Nhận xét:** luồng có kiểm soát đã nhất quán hơn và hồi quy tìm ra lỗi thật. Có thể tiếp tục nghiệm thu nhóm sau triển khai bản sửa/kiểm cloud. Chưa đủ bằng chứng vận hành điều phối cấp cứu chính thức.

Tham chiếu: [Leaflet 1.9.4](https://leafletjs.com/reference-1.9.4.html#map-zoomanimation), [glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249). Số kiểm thử lấy từ log/JSON phiên này, không từ các trang trên.
