# Kiểm chứng0.4.16 — chuông Android sau thử S22+

[Trạng thái hiện hành](../../STATUS.md) · [Số liệu/log](VERIFICATION_V0_4_16.json) · [Bài kiểm tra USB](../../operations/ANDROID_TRIAL.md#5-phối-hợp-kiểm-thử-qua-usb--samsung-galaxy).

## Lỗi thật và nguyên nhân

S22+ SM-S906E/Android16 cài đè0.4.7→0.4.15, mở app/điều khiển UI thành công. Ở tài khoản TNV, chuông báo chưa chuẩn bị; người cầm máy không nghe hoặc chưa xác định. Log riêng EHIS có FileNotFoundException `/assets_emergencytone` ENOENT. Đối chiếu resource table của APK15: không có alias assets_emergencytone, nhưng named raw emergency_tone có. Tài nguyên có bytes không chứng minh player dùng đúng đường dẫn; giữ kết quả âm thanh15 **FAIL**.

## Sửa gì

- Android dùng URI của named raw resource emergency_tone mà plugin thông báo đã nhúng, thay cho alias Metro không tồn tại. iOS giữ asset cũ; không thêm dependency hoặc quyền.
- Verifier APK từ code14 bắt buộc bundle dùng đúng URI theo package và named raw resource tồn tại trong APK; tiếp tục kiểm tra tone bytes/backend/version/FCM.
- Metadata0.4.16/code14; backend chỉ đổi health version cho đồng bộ, không đổi xử lý ca, dữ liệu hoặc IAM/billing. Không tự tăng âm lượng, đổi chế độ im lặng/DND hoặc cấp quyền Android.

## Điều kiện ghi đạt

Source check/web build đạt trước EAS. APK build FINISHED và verifier đạt trước cài đè; người dùng không có ca active/TNV OFF. Trên S22+ mới phải thấy chuông sẵn sàng, không có lỗi đường dẫn mới, và người cầm máy xác nhận nghe/rung. Các bài Home/khóa/Im lặng, Media=0/DND và GPS phải ghi riêng; không suy từ chuông thử foreground.

Kết quả đang cập nhật theo JSON/STATUS. Chưa có kết quả máy của16 thì vẫn **Chưa thử**, không đổi FAIL15 thành PASS vì code sửa hoặc build thành công.
