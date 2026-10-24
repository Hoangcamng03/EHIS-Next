# Kết quả kiểm tra bản thử v0.3 — 2026-10-21

Môi trường: Windows, Node host 24 (Functions cấu hình Node 22), Firebase Emulator Standard, project tổng hợp demo-ehis-next. Không chạy vào database cloud. Không thử hồ sơ thật.

## Đã qua

- `npm run check`: typecheck/lint mobile/web, Functions TypeScript build, 6 kiểm tra validation và 5 kiểm tra navigation.
- `node scripts/run-integration.cjs`: cả starter, reports và lifecycle. Kiểm tra owner/cross-user, role injection, nhận ca đồng thời, consent, hết quyền truy cập khi đóng ca, thu hồi/cấp lại, đến nơi, hủy trước khi nhận và không tự điều phối cho chính Patient.
- `npm --prefix web run build`: production build thành công.
- `npx expo export --platform android --output-dir .local/android-export` trong mobile: Hermes bundle thành công, 1500 modules. Đây không phải APK.
- `npx expo install --check`: các dependency Expo khớp phiên bản.
- UI PC: đăng ký Patient → lưu hồ sơ → đồng ý chia sẻ → cấp QR; ứng tuyển TNV → quản trị duyệt → sẵn sàng; web gửi yêu cầu → backend xác nhận → bảng hỏi không phone; TNV nhận → thấy hồ sơ theo consent → tuyến OSRM trong app → đến nơi → hoàn tất. Patient và người báo thấy trạng thái tương ứng.
- Các nhánh lỗi UI: QR thu hồi bị từ chối, cấp lại ra mã mới, không có TNV, Patient hủy yêu cầu chưa nhận, chọn khu vực TNV không tự cấp quyền, rời màn hình TNV tắt trạng thái sẵn sàng, hồ sơ không số liên hệ vẫn lưu được.
- Snapshot Auth/Firestore xuất thành công và được nạp sau khi khởi động lại; đăng nhập lại tài khoản thử thấy hồ sơ, QR và lịch sử cũ. Auth Emulator có thể làm phiên cũ mất hiệu lực sau restart.

Bộ ảnh local gồm 36 bước, chỉ chứa dữ liệu giả. Không commit tài khoản demo hoặc dữ liệu Emulator lên GitHub.

## Chưa xác nhận

APK/IPA, signing/EAS project, Android/iOS thật, quét QR bằng camera điện thoại, WebView/GPS khi di chuyển, push khi đóng app, offline, cloud deployment và GitHub CI của commit mới. Trạng thái CI phải xem theo đúng commit trên PR.

Cloud Functions hiện yêu cầu Node 22 nhưng máy local đang dùng Node 24; cần chạy CI Node 22 và thiết bị trước khi phát hành. Firebase CLI báo SDK Functions có bản mới; không tự nâng major khi chưa kiểm tra tương thích. Các advisory dependency và hạn chế triển khai thực địa vẫn được ghi trong SECURITY_REVIEW.json và COMPLETE_FLOW.md.
