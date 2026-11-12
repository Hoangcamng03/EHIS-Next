# Android 0.4.22 — thay đổi đã duyệt

Ngày 13/11/2026. APK Android 0.4.22 / code 20 chứa thay đổi giao diện đã duyệt trong [báo cáo cải thiện](PRODUCT_REVIEW_2026_11_12.md). Backend/API vẫn 0.4.21; không đổi dữ liệu, quyền hoặc billing.

## Tải và cài

- [Tải APK 0.4.22](https://expo.dev/artifacts/eas/B_yFAptjy1mzBuchHzK-JnV8OyfWyB2k6_1SELMkADw.apk) · [Build EAS](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/3d7867f6-1285-4bff-825d-379e7fe61fab) · [Trang cài cố định](https://ehis-next-20261021-hc03.web.app/install).
- Hoàn tất ca đang xử lý, tắt Sẵn sàng rồi cài đè. Không gỡ ứng dụng/xóa dữ liệu. Kiểm tra phiên bản trong Thông tin ứng dụng.
- Package giữ com.hoangcamng.ehisnext, sử dụng cấu hình ký EAS hiện có. Không cần Expo Go; gửi/nhận dữ liệu cần Internet.

## Bằng chứng đã đạt

| Lớp kiểm tra | Kết quả |
| --- | --- |
| Android export với cấu hình cloud | PASS; Hermes bundle 5,3 MB |
| Preflight | PASS; 31 bài backend, 62 bài client, lint/typecheck |
| EAS | FINISHED; source 8ba06d19c58433a742846e6be6c769afd2629e41, version/code đúng |
| APK thực tải về | PASS; 102727729 byte, package/version/code, cloud target, tài nguyên chuông, quyền thông báo/rung, không quyền microphone |
| SHA-256 | e9864909a003bda8687607c329360aae337e44051f450490664e474ca5cb6496 |
| Điện thoại 0.4.22 | CHƯA THỬ; chưa xác nhận cài đè, chuông, GPS hoặc luồng native |

[Số liệu gốc](VERIFICATION_V0_4_22.json). Chưa coi build hoặc artifact đạt là nghiệm thu thiết bị. Các mục tự thoát gián đoạn/GPS di chuyển/offline và nghiệm thu trước còn mở. Không OTA hoặc iOS/cửa hàng trong đợt này. Việc trang tải đã cập nhật phải đối chiếu STATUS và lab note sau triển khai Hosting.
