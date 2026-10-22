# Cài và thử Android v0.4

> Bản hiện có và cơ chế cập nhật mới xem [MOBILE_RELEASES.md](MOBILE_RELEASES.md). Các link v0.4.0 bên dưới là bộ cài ban đầu; không tự nhận những thay đổi web xuất bản sau đó.

1. Trên điện thoại Android, mở trang build của nhóm: https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/cf99a628-de58-4e55-b93c-f48f13178af7. Build này đã Finished. Tải APK (khoảng 100 MB); đây là APK universal cho buổi thử.
2. Mở file APK. Nếu Android hỏi quyền cài từ trình duyệt/tệp, chỉ cấp cho nguồn bạn đang dùng để cài bản EHIS do nhóm kiểm tra; có thể tắt lại sau khi cài. Không tắt Play Protect hoặc bỏ qua cảnh báo phần mềm độc hại; dừng và báo lại nguyên văn nếu gặp cảnh báo đó.
3. Mở biểu tượng **EHIS Next**. Bản preview đóng gói sẵn mã, không cần Expo Go, quét mã Metro hoặc bật laptop. Vẫn cần Wi-Fi/4G/5G cho đăng nhập, Firestore, gửi/nhận ca và bản đồ. Bản thử chưa có quy trình gửi cấp cứu ngoại tuyến; mất mạng không được coi là gửi thành công.
4. Đăng ký tài khoản thử bằng email của bạn; chỉ nhập tên/hồ sơ giả. Chọn **Bệnh nhân**, lưu hồ sơ tối thiểu, chọn quyền chia sẻ rồi phát hành QR. Đóng/mở lại app để kiểm tra giữ phiên và hồ sơ.
5. Dùng thiết bị thứ hai cho TNV: đăng ký tài khoản riêng, chọn **Tình nguyện viên**, gửi đơn với thông tin thử. Người quản trị được chủ project cấp quyền đăng nhập `/admin` trên website rồi tải và duyệt đơn; chọn khu vực TNV không tự cấp quyền.
6. TNV bật sẵn sàng bằng **vị trí giả** trong buổi thử, giữ màn hình mở. Mặc định A: 10.7769, 106.7009. Khi kiểm tra GPS thật, người dùng tự chọn GPS và tự cấp quyền vị trí; kiểm tra đó là điểm hiện tại của TNV.
7. Thiết bị thứ ba (hoặc trình duyệt khác) quét QR bệnh nhân. Chọn xác nhận ở cạnh bệnh nhân và **vị trí giả** B: 10.779, 106.699. Bấm gửi; chỉ sau máy chủ xác nhận mới sang bảng hỏi. Bỏ trống phone, chọn đủ ba câu và gửi bổ sung.
8. TNV thấy ca và bản bổ sung, nhận ca, xem đường đi trong EHIS, xác nhận đến nơi rồi kết thúc qua hai bước. Người báo và bệnh nhân phải nhận trạng thái đóng; TNV không còn xem hồ sơ riêng của ca.
9. Thử mất mạng trước gửi: phải hiện lỗi/chờ, không báo giả là đã gửi. Kết nối lại, thử lại theo hướng dẫn; ghi model máy, phiên bản Android, bước, thời gian và ảnh lỗi. Không gửi khóa, mật khẩu hoặc hồ sơ thật trong issue.

Trên trình duyệt cùng origin, app cloud dùng cùng phiên giữa các tab; dùng hai thiết bị/hồ sơ trình duyệt riêng cho hai tài khoản. Tài khoản giả dùng kiểm tra tự động nằm trong `.local/cloud-demo.json` của máy triển khai, không có trong GitHub; không dùng tài khoản quản trị chung cho người ngoài nhóm.

Không có IPA/TestFlight trong vòng này. iPhone có thể thử giao diện web HTTPS; điều đó không thay cho build/signing và kiểm tra iOS native.

Bộ cài đã xác nhận ngày 2026-10-22: [tải APK](https://expo.dev/artifacts/eas/KiU9EZG6JXihj4DMCR5wIfSO_H_INXJdqpvFajRRsUo.apk). SHA-256: `c351199f2ce2752d75f5f069a30a4b75e2089f1514b48f773840b5351b92b413`. EAS project: ehiss-team/ehis-next. Bộ cài được build từ snapshot v0.4 trong lúc working tree chưa commit, nên dashboard ghi Git commit nền e2b809f; mã nguồn v0.4 sau đó lưu ở commit 26f0b56 (khác biệt sau upload thuộc nhãn web, lint và tài liệu). Chưa kiểm tra cài trên thiết bị.
