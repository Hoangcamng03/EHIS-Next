# Cài và thử Android — EHIS 0.4.1

**[Tải APK mới nhất: EHIS 0.4.1](https://expo.dev/artifacts/eas/A843wAUos26XMQ22xgAHE6StP5qC0C6_cw5fyf_raKY.apk)** — khoảng 102 MB, versionCode 2. [Trang build đã hoàn tất](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/6e645e3e-bbcc-474b-89bf-f67205bfdcd7); [quy trình cập nhật và lịch sử](MOBILE_RELEASES.md).

1. Tải APK trên điện thoại Android rồi mở file. Nếu Android yêu cầu quyền cài từ trình duyệt/tệp, chỉ cấp cho nguồn đang dùng để cài bản của nhóm; có thể tắt lại sau khi cài. Nếu Play Protect chặn, dừng và lưu thông báo chi tiết; không tắt Play Protect/Auto Blocker để vượt chặn. Build thành công không thay kiểm tra an toàn hoặc nghiệm thu thiết bị.
2. Nếu đã cài 0.4.0, cần cài bộ 0.4.1 một lần để có onboarding và EAS Update. Giữ cùng package/ký; ưu tiên cài đè, không gỡ app trước để tránh mất dữ liệu local. Việc cài đè/giữ phiên trên máy nhóm chưa được kiểm chứng.
3. Mở EHIS Next, kiểm tra dòng **EHIS 0.4.1**. Không cần Expo Go, Metro QR hoặc laptop. Gửi/nhận ca, đăng nhập và bản đồ cần Wi-Fi/4G/5G; mất mạng không được coi là gửi thành công.
4. Tài khoản có sẵn: chọn **Đã có tài khoản? Đăng nhập**. Email/mật khẩu thử ở [repo riêng tư của nhóm](https://github.com/Hoangcamng03/EHIS-Next-Team-Access), hiện chỉ chủ dự án có quyền. Danh mục: [LAB_NOTES.md](LAB_NOTES.md).
5. Người mới chọn **Bệnh nhân** hoặc **Tình nguyện viên**, đọc mô tả rồi đăng ký email. Có thể Đổi lựa chọn trước khi gửi. Sau tạo tài khoản app vào đúng khu vực; chọn TNV không tự cấp quyền nhận ca. Chỉ nhập thông tin giả.
6. Patient lưu hồ sơ, chọn consent và cấp QR. TNV dùng tài khoản khác trên thiết bị khác, gửi đơn, được admin duyệt rồi bật sẵn sàng. Thử vị trí giả A: 10.7769, 106.7009; giữ màn TNV mở. GPS thật chỉ bật khi người dùng tự đồng ý quyền vị trí.
7. Thiết bị/trình duyệt khác quét QR, xác nhận cạnh bệnh nhân và dùng vị trí giả B: 10.779, 106.699. Bấm gửi → chờ backend ack → trả lời ba câu, bỏ trống phone vẫn gửi được.
8. TNV nhận ca/bổ sung, xem đường đi trong EHIS, xác nhận đến nơi và kết thúc qua hai bước. Người báo/Patient nhận trạng thái đóng; TNV không còn xem hồ sơ riêng.
9. Với cập nhật giao diện tương thích sau này: mở app có Internet để tải, hoàn tất thao tác rồi đóng hẳn/mở lại để áp dụng; có thể cần mở lại hai lần. App không tự reload ca đang chạy. Nếu đổi native runtime, tải APK mới theo MOBILE_RELEASES.md.
10. Ghi model máy, Android, phiên bản, bước và ảnh lỗi. Không đưa mật khẩu/hồ sơ thật vào issue public. Thử mất mạng trước gửi phải có lỗi/chờ, không báo giả thành công.

Dùng hai thiết bị/hồ sơ trình duyệt riêng cho hai tài khoản; các tab app web cùng origin chia sẻ phiên cloud. Web HTTPS trên iPhone không thay cho build/signing/kiểm tra iOS native; chưa có IPA/TestFlight.

SHA-256 APK 0.4.1: `cb8c76bcf350af47b453071d2078488f3d6d9f2eb014dab04af0f751940846c8`. Source commit `794bcbd4db670621b76fa9570f5b065c04e93d9a`; native fingerprint `60be4f048122470351bfde1bf494fa80b951eb07`. Chưa xác nhận cài/chạy trên điện thoại thật.

## Bản cũ để đối chiếu

APK 0.4.0: build cf99a628-de58-4e55-b93c-f48f13178af7; chưa có onboarding/OTA mới. SHA-256 `c351199f2ce2752d75f5f069a30a4b75e2089f1514b48f773840b5351b92b413`. APK cũ upload từ working tree trước commit, dashboard ghi commit nền e2b809f; APK 0.4.1 được build từ commit sạch nêu trên.
