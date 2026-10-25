# Phát hành EHIS — dành cho người phụ trách

## 1. Xác định phiên bản và phạm vi

Xem [STATUS](STATUS.md) và [LAB_NOTES](LAB_NOTES.md). Mốc 25/10: web/backend/APK bàn giao 0.4.7; source UI 0.4.8 còn local. GitHub có tài liệu 0.4.8 không có nghĩa source/binary hoặc máy người dùng đã cập nhật.

Được phép chuẩn bị/build APK preview sau kiểm chứng code/web cho diễn tập Android miễn phí. Chưa tự OTA, submit cửa hàng, iOS native, bật billing hoặc mở tiếp nhận ca thật. Không dùng release:preview như bước mặc định: helper đó có thể publish OTA, vượt phạm vi đợt này.

## 2. Trước khi gửi bản build

- Đúng project trial ehis-next-20261021-hc03, cấu hình cloud và môi trường preview; không dùng Emulator hoặc project cũ.
- Source được review/commit sạch, version và Android versionCode phù hợp. Đọc [quy trình sửa lỗi](BUG_FIX_WORKFLOW.md), [local](LOCAL_DEVELOPMENT.md), [cloud](CLOUD_TRIAL.md) và README module.
- Chạy kiểm tra phù hợp, build web/Android JS, UI và cloud bằng dữ liệu giả; ghi riêng kết quả. Secrets/keystore không vào GitHub public.

## 3. Tạo APK diễn tập

Người triển khai đã có CLI/quyền vận hành mới dùng các lệnh từ thư mục gốc repo:

```powershell
npm run check
npm run test:integration
node scripts/build-trial-android.cjs start
node scripts/build-trial-android.cjs status
```

Script kiểm tra source/version và gửi build preview; không tự cài lên máy. Chỉ sau trạng thái FINISHED khớp source/version mới chạy:

```powershell
node scripts/verify-trial-apk.cjs
```

Verifier kiểm tra cấu trúc, package/version, cấu hình cloud, WAV/quyền và SHA-256; không phải nghiệm thu chữ ký/Play Protect/phần cứng. Chưa FINISHED thì chỉ cung cấp link tiến độ, không gắn APK cũ dưới tên mới.

## 4. Phát hành web và trang tải

Thay web/src/config/releases.json sau khi có artifact được xác minh; không ghi URL chưa tồn tại. Build lại đúng artifact cloud, deploy theo [CLOUD_TRIAL](CLOUD_TRIAL.md) và đối chiếu bằng scripts/verify-cloud-artifacts.cjs. Backend/index/Rules chỉ triển khai khi có thay đổi tương ứng đã kiểm tra, không thay quyền/billing như bước mặc định.

Ghi commit, link build/APK, versionCode, hash, web/backend, kiểm tra và phần chưa đạt vào lab note. Cập nhật STATUS một lần theo bằng chứng, các trang khác dẫn về đó. Thao tác sửa tài liệu đơn thuần không cần build APK/deploy lại.

## 5. Người dùng cài và nghiệm thu

Nhóm thực hiện [ANDROID_TRIAL](ANDROID_TRIAL.md) và [ACCEPTANCE_FLOW](ACCEPTANCE_FLOW.md). Chỉ đánh dấu máy đã cập nhật sau khi người thử xác nhận phiên bản. Không reload/đổi bản giữa ca. Cài/apply thành công, loa/rung/GPS và nhận nền là các mốc khác nhau.

## 6. Khi lỗi hoặc cần quay lui

Giữ bản đã biết tốt và bằng chứng. Chưa phát hành xong thì ghi incomplete; ghi rõ phần nào đã lên cloud. Đánh giá tương thích API/schema trước khi quay lui; không xóa dữ liệu hay tắt Rules. OTA cần phê duyệt riêng và phải đúng runtime; không dùng để thay native binary hoặc né bước thử thiết bị.

Các mốc APK/OTA và lệnh cũ được giữ nguyên trong [MOBILE_RELEASES_HISTORY](MOBILE_RELEASES_HISTORY.md); không dùng lịch sử như chỉ thị phát hành hiện tại.
