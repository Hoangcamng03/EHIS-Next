# Chạy thử trên máy tính trước, Android sau

## Phạm vi đã kiểm tra

Chạy thử có kiểm soát bằng dữ liệu tổng hợp, backend Firebase Emulator. Web người báo và khu vực TNV dùng chung các callable, Rules và cấu trúc dữ liệu của app. Khu vực TNV có thể chạy trên trình duyệt từ chính source React Native; đây chưa phải kết quả thử APK trên điện thoại.

## 1. Chuẩn bị một lần

Dùng nhánh của PR #1, không phải main trước khi merge. Node 22.13+ (khuyến nghị Node 22 LTS) và Java 21+. Từ thư mục gốc EHIS-Next:

```powershell
npm --prefix mobile ci
npm --prefix web ci
npm --prefix functions ci
npm run setup:local
npm run doctor:local
```

**Đạt khi:** doctor hiện toàn bộ `OK`. setup chỉ tạo file môi trường còn thiếu; không ghi đè cấu hình đang có và không tạo cloud. Nếu doctor báo cloud/môi trường sai, kiểm tra `.env.local` theo `.env.example` trước khi thử. Không sao chép credentials quản trị vào web/mobile.

Nếu thiếu Java, cài JDK 21 từ nhà cung cấp chính thức rồi đặt JAVA_HOME; cũng có thể ghi đường dẫn máy mình trong `.local/runtime.json`: `{"javaHome":"C:/path/to/jdk-21"}`. File này không được commit. Máy hiện tại đã được trỏ đến Java 21 có sẵn; không sửa môi trường của dự án cũ.

## 2. Bật ba phần trong ba terminal riêng

Terminal A:

```powershell
npm run emulators
```

**Đạt khi:** thấy `All emulators ready` và đủ 9 functions. UI backend: http://127.0.0.1:4100. Lần khởi động đầu/cài CLI có thể chậm; chưa bấm gửi trong khi chỉ mới thấy cổng đang mở. CLI được cố định phiên bản, discovery được chờ tối đa 60 giây.

Terminal B:

```powershell
npm run web
```

**Đạt khi:** web chạy http://localhost:3100.

Terminal C:

```powershell
npm run mobile:web
```

**Đạt khi:** mở http://localhost:8082/volunteer thấy màn hình đăng nhập TNV. Lần biên dịch đầu có thể chậm; các lần sau dùng bộ nhớ đệm. Đây là cách kiểm tra mạch nghiệp vụ mà chưa cần Expo Go, USB hay APK.

Nếu port bị chiếm, dừng tiến trình EHIS trước đó đúng terminal; không tắt mọi tiến trình Node/Java trên máy. Trong trường hợp restart Emulator, tài khoản/dữ liệu cũ không được mặc định giữ lại.

Sau khi sửa backend, dừng rồi khởi động lại Terminal A để chắc chắn nạp source đã biên dịch mới. Nếu giao diện đang mở vẫn giữ phiên bản cũ, reload trang/khởi động lại terminal tương ứng; không coi một tiến trình đang chạy trước khi sửa là bằng chứng source cuối đã chạy.

## 3. Tạo bộ dữ liệu giả

Terminal D tại root:

```powershell
npm run trial:seed
```

Mở `.local/report-demo.json`: lấy `webUrl`, `mobileWebUrl`, email và password **chỉ dành cho Emulator**. Không dùng dữ liệu người thật. Mỗi lần seed sinh bộ dữ liệu mới, không xóa các ca cũ. Nếu Emulator vừa khởi động lại, seed lại và đăng xuất tài khoản cũ trên màn hình TNV.

## 4. Thử đúng thứ tự

| Bước | Thao tác | Kết quả cần thấy |
|---|---|---|
| 1 | Đăng nhập TNV bằng tài khoản giả | Hiện email; chưa bật sẵn sàng |
| 2 | TNV bấm **Bật sẵn sàng bằng vị trí giả** | Hiện **Đã bật sẵn sàng** |
| 3 | Mở webUrl; đánh dấu đang ở cạnh bệnh nhân giả và **THỬ NGHIỆM LOCAL: dùng vị trí giả** | Nút gửi được bật |
| 4 | Bấm **Gửi yêu cầu hỗ trợ** | Web tự sang bước 2 sau backend xác nhận; TNV thấy **Thông báo ban đầu** |
| 5 | Bỏ trống số điện thoại; chọn đủ 3 câu hỏi rồi gửi | Cùng ca TNV hiện **Thông tin bổ sung · bản 1** |
| 6 | TNV bấm **Tiếp nhận ca** | Web báo đã có TNV nhận; TNV thấy **SĐT người báo: Không cung cấp** |
| 7 | Web nhập số giả 0900000000, gửi bổ sung | Cùng ca hiện bản 2; TNV phụ trách xem được số giả |
| 8 | TNV bấm **Kết thúc phiên hỗ trợ** | Web báo kết thúc, khóa gửi; TNV trở về chưa sẵn sàng |
| 9 | TNV bật sẵn sàng lại, mở lại cùng webUrl và gửi ca mới | Tạo ca mới; ca cũ vẫn kết thúc, thẻ/TNV không bị kẹt |
| 10 | Trước khi TNV nhận ca mới, người báo bấm hủy | Web/TNV đóng ca đó; không cần tạo thẻ khác để tiếp tục thử |

Hai lựa chọn vị trí giả chỉ xuất hiện khi config trỏ đúng `demo-ehis-next` + Emulator. Nếu thử GPS thật, cả hai phía phải ở gần nhau (bán kính 5km), cho phép vị trí và dùng localhost/HTTPS trên web. Không đổi Rules sang public để làm demo.

Giữ màn hình TNV mở: vị trí được làm mới mỗi phút khi ứng dụng active. Sau khi refresh trang/mở lại app, bấm sẵn sàng lại để khởi động làm mới vị trí. Dữ liệu vị trí cũ quá 5 phút không được chọn cho ca mới. Chưa có push nền khi app bị đóng.

## 5. Thử mất kết nối

Chỉ trong phiên Emulator dữ liệu giả: dừng Terminal A. Web/TNV phải báo chờ kết nối, chặn thao tác dựa trên trạng thái cũ sau khi SDK phát hiện mất kết nối. Không coi thông tin đã lưu trên màn hình là ca mới được máy chủ xác nhận. Gửi yêu cầu mới khi server tắt phải hiện lỗi, không tự sang bảng hỏi hoặc báo thành công. Phát hiện mất kết nối có độ trễ; callable cũng có timeout và mã chống trùng.

Khởi động lại A, seed lại nếu dữ liệu đã mất, đăng xuất/đăng nhập TNV bằng bộ fixture mới. Bản này không có hàng đợi tự gửi yêu cầu cấp cứu khi offline.

## 6. Kiểm tra tự động

Tắt Terminal A trước khi chạy lệnh tích hợp vì lệnh tự dùng cùng các port:

```powershell
npm run check
npm --prefix web run build
npm run test:integration
```

Kiểm thử kiểm tra cả đường bị từ chối: tự sửa/xóa status/role, đọc chéo/public, nhận ca không có lời mời, hai TNV nhận đồng thời, bổ sung sau đóng ca và thu hồi quyền. Các kết quả này không chứng minh push nền hoặc hiệu năng trên điện thoại.

## 7. Android: mở offline khác với làm việc offline

APK có thể đóng gói giao diện và mở mà không cần Expo Go/Metro. Gửi yêu cầu, xác thực mới và nhận cập nhật vẫn cần kết nối backend. Tắt Internet/không có backend thì không thể gửi cấp cứu hoặc bảo đảm TNV nhận tin.

Để cài APK trực tiếp, không bắt buộc tài khoản Google Play. Có thể cần cho phép cài ứng dụng từ nguồn tải xuống trên điện thoại. Chỉ cấp cho nguồn cụ thể, sau khi đã có APK của nhóm.

Hiện chưa có EAS project/signing hay APK. Trình tự tiếp theo:

1. Người giữ tài khoản Expo tự đăng nhập trong terminal `mobile/`: `npx eas-cli@latest login`.
2. Tạo/liên kết **EAS project mới của nhóm**: `npx eas-cli@latest init`. Không dùng project nhóm cũ; không chia sẻ mật khẩu hoặc signing key lên GitHub.
3. Chốt đường kết nối backend trước khi build. Với APK preview độc lập, dùng Firebase/cloud HTTPS đã provision và cấu hình môi trường EAS preview. Cloud hiện chưa triển khai; Functions cloud yêu cầu Blaze, cần quyết định ngân sách riêng. Không build với demo-key/127.0.0.1 rồi kỳ vọng chạy khi laptop tắt.
4. Nếu muốn thử toàn luồng không dùng cloud/billing, cần development build + backend Emulator có đường kết nối từ Android (USB adb reverse hoặc LAN, cùng cấu hình HTTP dành riêng môi trường phát triển). Máy hiện chưa có adb; chưa coi hướng này là đã cấu hình hay đã kiểm chứng. Backend và laptop phải tiếp tục chạy.
5. Sau khi môi trường/signing đã sẵn sàng: `npx eas-cli@latest build --platform android --profile preview`, tải APK, cài và chạy lại bảng ở bước 4 bằng hai thiết bị/phiên phù hợp.

**Chỉ xác nhận Android đạt khi:** mở app không qua Expo Go, đăng nhập, bật sẵn sàng, QR/web gửi → nhận cả hai bản tin, kết thúc và thử ca tiếp theo; mất mạng không báo thành công giả; mở lại app khôi phục phiên đúng. Việc export JS hoặc build web không thay thế kiểm tra này.
