# Demo web hai bước → TNV

**Hướng dẫn chạy thử cập nhật:** xem [TRIAL_CHECKLIST.md](https://github.com/Hoangcamng03/EHIS-Next/blob/f921d33/docs/TRIAL_CHECKLIST.md), gồm cách thử cả hai phía trên máy tính trước, các kết quả cần thấy và điều kiện chuyển sang APK Android.

## Mạch hoạt động

1. QR chứa URL `/c/{cardId}` của thẻ backend đã cấp. Bản này chưa có chức năng phát hành QR/NFC; dùng fixture local để thử.
2. Người qua đường xác nhận đang ở cùng bệnh nhân, bấm **Gửi yêu cầu hỗ trợ**. Trình duyệt xin GPS và tạo phiên anonymous. Chưa hỏi số điện thoại hay tình trạng ở bước này.
3. Backend kiểm tra thẻ, tạo ca và lời mời TNV; trả xác nhận. Web chuyển ngay `/report/{incidentId}`. Không đợi TNV bấm nhận. Mất mạng/chưa có xác nhận thì hiển thị lỗi và giữ trang đầu để thử lại cùng mã chống trùng.
4. Trang hai theo dõi trạng thái; hỏi số điện thoại **tùy chọn**, rồi ba câu trắc nghiệm: phản hồi khi gọi, nhịp thở quan sát được, chảy máu bên ngoài. Mỗi câu có **Không rõ**.
5. Gửi bổ sung không tạo ca mới. Backend lưu revision mới; TNV nhận nội dung trên lời mời/ca cũ. Bỏ trống số điện thoại vẫn gửi thành công. Không trả lời đủ ba câu thì chưa gửi.
6. Chỉ TNV đã nhận ca mới được gọi API lấy số liên hệ và tọa độ. Người báo không đọc được hồ sơ y tế. Thông tin là quan sát tự khai, không phải đánh giá y khoa.
7. TNV kết thúc phiên hỗ trợ → giải phóng thẻ và TNV. Người báo có thể hủy trước khi có người nhận. Cùng thẻ có thể dùng cho ca mới sau đó; thao tác retry cũ vẫn trả đúng ca cũ.

## Chạy local từng bước

Cài dependency ba module theo README. Java 21 và Node tương thích đã có trên máy. Dùng dữ liệu giả; không dùng Firebase cũ.

**Terminal 1 — backend:**

```powershell
npm run emulators
```

Đợi có đủ 9 functions trong log. Emulator UI `http://127.0.0.1:4100`; Auth 9199, Firestore 8180, Functions 5101. Không cần bật Blaze cho bước local.

**Terminal 2 — dữ liệu demo:** chọn tọa độ vị trí đang thử (ví dụ dưới đây là tọa độ giả). TNV demo được đặt tại đây; GPS của người báo cần nằm trong 5km để có lời mời.

```powershell
node scripts/seed-report-demo.cjs 10.875 106.8
```

Mở `.local/report-demo.json` trên máy: có hai URL, email và mật khẩu TNV giả mới tạo. File bị Git bỏ qua; script cố định loopback + demo project nên không ghi cloud. Đăng nhập TNV và bật sẵn sàng bằng vị trí giả trước khi gửi yêu cầu. Mỗi lần seed sinh thẻ/TNV mới, không xóa ca cũ. Emulator restart có thể mất dữ liệu; seed lại và đăng xuất tài khoản cũ.

**Terminal 3 — web:** copy `.env.example` → `.env.local` trong web, giữ project `demo-ehis-next` và USE_EMULATORS=true.

```powershell
npm run web
```

Mở localhost mà web in ra + webPath trong file demo; không dùng thẻ preview ở trang chủ để kỳ vọng gửi được. Bật quyền vị trí khi chính bạn thử ở cạnh bệnh nhân giả. GPS web cần secure context: localhost trên laptop hoặc HTTPS; HTTP qua IP LAN trên điện thoại thường không đủ. Chưa có tunnel/HTTPS và routing emulator cho điện thoại tự động trong bản này.

Nếu chưa muốn dùng GPS thật, chọn chế độ vị trí giả ở trang thẻ (chỉ hiện với demo project + Emulator), cùng tọa độ với nút vị trí giả của TNV. Không gửi vị trí giả tới môi trường cloud.

**Terminal 4 — mobile:** copy frontend/app/.env.example → .env.local, chạy development build theo README, mở khu vực Volunteer. Đăng nhập bằng tài khoản tổng hợp trong file demo. Giữ màn hình mở, gửi bước 1 trên web: thấy **Thông báo ban đầu**. Gửi bước 2 không có phone: cùng ca hiện **Thông tin bổ sung · bản 1**. Nhận ca: số liên hệ hiển thị **Không cung cấp**. Gửi bản bổ sung có số: TNV phụ trách đọc được qua API.

Cách dễ thử trên máy tính trước: `npm run app:web`, mở http://localhost:8082/volunteer. Bấm bật sẵn sàng trước bước gửi; sau nhận ca dùng **Kết thúc phiên hỗ trợ** rồi bật lại sẵn sàng để thử ca tiếp theo.

Trên Android emulator, đổi EXPO_PUBLIC_EMULATOR_HOST từ 127.0.0.1 sang địa chỉ host phù hợp (Android Studio thường 10.0.2.2). Trên điện thoại thật cần LAN host và các Emulator bind LAN/firewall đúng mạng riêng; chưa có kiểm thử thiết bị trong PR này. Expo Go phải đúng SDK, development build là phương án phát triển chính. Chưa có APK/IPA được xuất.

## Kiểm tra tự động, không cần GPS thật

```powershell
npm run check
npm --prefix frontend/web run build
npm run test:integration
```

Tắt Emulator đang chạy trước `test:integration` vì lệnh tự khởi động cùng các port. Kiểm thử dùng tọa độ tổng hợp và Firebase client listener thật: nhận revision 0 rồi 1 trên cùng doc, phone không bắt buộc, chống lặp, chặn đọc chéo, một TNV thắng khi nhận đồng thời, cập nhật sau accept và thu hồi quyền.

## Các giới hạn cần làm tiếp

- **Realtime hiện tại chỉ khi client kết nối**. Chưa có push FCM/APNs khi app đóng; không tuyên bố TNV chắc chắn đã nhìn thấy tin chỉ từ việc backend trả thành công.
- Dispatch prototype quét tối đa 100 TNV eligible, chọn tối đa 5 trong 5km, vị trí mới <=5 phút. Có heartbeat khi màn hình active, hủy/kết thúc ca, giải phóng thẻ và dọn dispatch hết hạn khi có create mới. Chưa có nhiều đợt, tìm kiếm địa lý quy mô lớn, scheduler hoặc GPS nền.
- Chưa có đăng ký/duyệt TNV, cấp QR/NFC, hồ sơ bệnh nhân cho TNV, bản đồ, audit đầy đủ, rate-limit/App Check hoặc chính sách xóa thông tin liên hệ. Cần bổ sung trước phát hành rộng.
- Dữ liệu báo cáo gắn phiên Auth trình duyệt. Chuyển trình duyệt/xóa dữ liệu phiên không cấp quyền lại bằng URL. Bản nháp phone chỉ ở bộ nhớ trang; chưa lưu/khôi phục bản nháp khi đóng trang.
- Firebase cloud chưa provision Auth/Firestore/Functions/hosting. Cài app độc lập không làm backend local tiếp tục chạy khi tắt laptop. Triển khai cloud là một bước riêng cần chốt ngân sách.
- Rules prototype mặc định chặn, chỉ mở đọc projection theo chủ sở hữu/verification. Cần review và kiểm chứng lại trước chia sẻ rộng; xem API_CONTRACT và TEST_SCENARIOS.
