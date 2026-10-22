# Web 0.4.4 — Màu theo đối tượng và vòng kiểm tra hệ thống

Ngày: 2026-10-23. Phạm vi: thử nghiệm web có kiểm soát, dữ liệu giả. Backend vẫn 0.4.2; không sửa Rules/schema hoặc phát APK/OTA/iOS trong đợt này.

## Quy ước màu

| Khu vực | Màu chính | Ý nghĩa |
|---|---|---|
| Bệnh nhân | Xanh dương `#1756a9` | Hồ sơ và thẻ sức khỏe cá nhân |
| Tình nguyện viên | Xanh lá `#096951` | Sẵn sàng và hỗ trợ cộng đồng |
| Người báo tin | Cam nâu `#934500` | Gửi yêu cầu và thông tin quan sát |
| Quản trị | Tím `#6934a3` | Duyệt người tham gia |
| Yêu cầu khẩn | Đỏ `#b4232b` | Gửi yêu cầu, lời mời đang chờ tiếp nhận |

Màu luôn đi với tiêu đề/trạng thái. Không nhấp nháy, không tự phân loại cấp cứu y khoa bằng màu. Đã nhận ca chuyển về giao diện hỗ trợ/bản đồ; không tiếp tục tô đỏ các ca đã đóng. Chữ trên nút chính và chữ trạng thái trong bảng màu đạt tương phản tối thiểu 4.5:1 theo phép tính sRGB; không đồng nghĩa mọi màn hình đã được chứng nhận khả năng tiếp cận.

Mã màu app tập trung tại `mobile/src/lib/palette.ts`; CSS web có kiểm tra đồng bộ. Header và nút chính theo đối tượng đã được backend xác nhận; màu không cấp quyền.

## Lỗi đã sửa

1. **Hồ sơ chưa tải được:** trước đây vẫn mở form sau lỗi đọc; người dùng có thể nhập và ghi đè thông tin đã lưu. Nay khóa chỉnh sửa/lưu, hiện nút tải lại; chỉ mở khi đọc thành công.
2. **Lời mời hết hạn:** trước đây nhãn có thể còn “đang chờ”, trường hợp thiếu hạn có thể hiện nút nhận. Nay quá hạn/thiếu hạn/giá trị không hợp lệ đều đóng thao tác ngay ở client; backend tiếp tục quyết định phân công.
3. **Tắt âm trong lúc chờ cấp quyền:** kết quả `resume()` muộn không được ghi đè thông báo đã tắt hoặc phát bài thử/rung sau thao tác tắt đó.

## Ma trận kiểm tra

| Lớp kiểm tra | Phạm vi | Kết quả |
|---|---|---|
| Typecheck/lint | App và web; backend build | PASS |
| Unit | 6 backend + 14 điều hướng/chuông/thời hạn/màu | 20 PASS |
| Emulator 1 | Auth, owner, từ chối public/cross-user và tự cấp quyền | PASS |
| Emulator 2 | Báo trước/bổ sung, phone tùy chọn, retry, realtime, nhận đồng thời, QR, hết hạn | PASS |
| Emulator 3 | Patient, consent, duyệt TNV, đến nơi/kết thúc, thu hồi quyền riêng | PASS |
| Emulator 4 | Maintenance, retention, giữ phân công đang hoạt động, rate limit nguyên tử | PASS |
| Emulator 5 | HTTP, token, CORS, allowlist, cron secret | PASS |
| Build/deploy/browser | Hai website, flow cloud, hình ảnh | PASS trong phạm vi dưới đây |

Emulator dùng project `demo-ehis-next`, tách dữ liệu cloud. Bộ kiểm tra tự động không phải bằng chứng đã nghe loa hoặc cảm nhận rung thật. Nhánh lỗi đọc hồ sơ và race cấp quyền âm thanh được sửa qua rà soát mã; chưa có thử nghiệm tiêm lỗi vào trình duyệt cho hai nhánh này.

## Bằng chứng build / cloud / trình duyệt

- Source giao diện: `5ac3a9beb88f9960d7c9ff5c2db9bd5fb79d2636`. [GitHub CI run 39827135983](https://github.com/Hoangcamng03/EHIS-Next/actions/runs/39827135983) SUCCESS, gồm check, Android JS export, web build và 5 bộ integration. Android JS export không phải APK/kiểm thử điện thoại.
- Cloud build Next/Expo thành công; deploy cả hai Firebase Hosting thành công. Backend project/health đúng, API thiếu token trả 401. Không thay backend, Rules, billing hoặc tạo quyền mới.
- `node scripts/verify-cloud-artifacts.cjs`: PASS **31** lần kiểm tra HTML/JS/CSS, SHA-256 của tệp đang phục vụ khớp artifact local. Có thể chạy lại sau build/deploy; bằng chứng máy lưu `.local/cloud-artifact-proof.json` (không thay thế bài thử nghiệp vụ).
- Case cloud giả `b00b72529e…`: backend mời đúng 1 TNV, từ chối hồ sơ trước nhận; UI hiện cảnh báo đỏ. Thử chuông thấy trạng thái đang phát; chưa xác minh loa vật lý.
- Bổ sung không phone nhận revision 1; gửi lại cùng submission không tăng bản. UI hiển thị ba quan sát và bản 1.
- Bấm nhận trên UI → backend xác nhận → hồ sơ giả theo consent, phone null, tự mở OSRM 0.44 km/khoảng 2 phút; bấm đã đến → xác nhận kết thúc trên UI → map/hồ sơ biến mất, API private trả 403.
- Đã trả TNV về không sẵn sàng; không để ca giả mở. Giữ nguyên phiên/dữ liệu Patient đang có, không gửi yêu cầu từ QR của người dùng.
- Patient mở thẳng đúng khu vực, header/nền xanh dương, version 0.4.4. TNV xanh lá. Người báo có nền cam, nút gửi đỏ chỉ mở khi xác nhận đứng cạnh bệnh nhân; bài thử UI này không bấm gửi/GPS. Admin tím: đăng nhập, tải danh sách không lỗi, rồi đăng xuất; không duyệt thêm ai.
- Cảnh báo build Leaflet về ảnh icon mặc định vẫn còn; app dùng marker A/B riêng, cả hai và tuyến đã hiển thị trong ảnh. Không tuyên bố loại bỏ toàn bộ cảnh báo dependency/build.

Ảnh thật của bản web (thông tin giả; ảnh Patient chỉ lưu phần đầu, không chứa QR/điện thoại):

| Màn hình | Ảnh |
|---|---|
| Patient xanh dương | [Xem ảnh](assets/trial-044/patient.jpg) |
| Volunteer xanh lá, đã tắt sẵn sàng sau thử | [Xem ảnh](assets/trial-044/volunteer.jpg) |
| Người báo cam, nút gửi đỏ | [Xem ảnh](assets/trial-044/reporter.jpg) |
| Quản trị tím | [Xem ảnh](assets/trial-044/admin.jpg) |
| Thử chuông trên web | [Xem ảnh](assets/trial-044/volunteer-ready.jpg) |
| Cảnh báo khẩn | [Xem ảnh](assets/trial-044/emergency-request.jpg) |
| Tuyến đường sau nhận | [Xem ảnh](assets/trial-044/accepted-route.jpg) |

## Chủ dự án nghiệm thu

1. Mở app web, tải lại trang; kiểm tra phiên bản 0.4.4. Patient có header xanh dương, TNV xanh lá; đăng nhập mở thẳng đúng khu vực.
2. Dùng hai thiết bị/hồ sơ trình duyệt. Patient lưu dữ liệu giả, phát QR; TNV đã duyệt bật sẵn sàng, bấm thử chuông và giữ trang phía trước.
3. Quét QR: chỉ mở trang cam, chưa báo động. Khi bấm gửi và backend xác nhận, TNV nhận cảnh báo đỏ. Bổ sung ba câu hỏi không cần phone.
4. TNV nhận ca: xem hồ sơ theo quyền chia sẻ, bản đồ và tuyến đường; cập nhật bổ sung không làm mất bản đồ. Xác nhận đến nơi → kết thúc → thông tin riêng đóng.
5. Thử tắt sẵn sàng, từ chối GPS, mất mạng, tải lại, lời mời quá hạn, tắt âm. Ghi thiết bị/trình duyệt/thời điểm/bước tái hiện/kết quả vào [lab note](LAB_NOTES.md).

Giới hạn còn lại: không bảo đảm chuông khi khóa màn hình/đóng tab; chưa thử speaker/rung/GPS thật trên iPhone/Android trong vòng này. OSRM/OSM cần mạng, không phải dẫn đường giọng nói hoặc định vị nền. Web được duyệt rồi mới chuẩn bị phát hành native.
