# EHIS — bản đang dùng và việc tiếp theo

Cập nhật 26/11/2026. Đây là trang tra **hiện hành**. [Bắt đầu cho nhóm](START_HERE_DEMO.md) · [Tất cả tài liệu](README.md) · [Lab note](LAB_NOTES.md).

## 1. Phân biệt các bản

| Lớp | Trạng thái xác minh | Cần biết |
| --- | --- | --- |
| Source | `main`: bản **0.4.25 / code 23** (nhận ca ngay không cần thông tin bổ sung, giữ trạng thái Sẵn sàng khi chạm thông báo đẩy, deadline thống nhất cho xin quyền GPS, kế thừa GPS nền + chuông `ehis_emergency_v2`) | Push source không tự cập nhật máy đã cài |
| Backend cloud | **0.4.25** (`dpl_mSo6LV2EV59sWo7vgpEzXdks2bEt`), `cloud:probe` PASS (khớp `apiRevision`/capabilities và từ chối 401) | Vercel Node 22 (`jose@5.9.6`, `api-contract.json`) |
| Web đang bàn giao | **0.4.25** (26/11), đã đối chiếu 37 tệp HTML/JS/CSS + 4 lượt QR khớp byte trên cả 2 tên miền Hosting | Kiểm chứng cloud web/app khớp build; chưa thay cho thử điện thoại thật |
| Android tải hiện hành | **0.4.25 / code 23**, APK/QR đã xác minh (`103,032,433` byte, SHA-256 `af95e4ef...fa7a`) | Chưa cài và nghiệm thu 0.4.25 trên S22+ thật; cần cấp quyền vị trí "Cho phép mọi lúc" để dùng GPS nền |
| iPhone | Dùng app web qua trình duyệt | Chưa IPA/TestFlight; iOS native hoãn |
| Thiết bị | Có bằng chứng S22+ ở các bản cũ và thử chuông 0.4.23, giữ trong lab note | Không suy kết quả bản cũ sang APK 0.4.25 |

**Tải:** [Trang APK và QR cố định](https://ehis-next-20261021-hc03.web.app/install) · [APK 0.4.25](https://expo.dev/artifacts/eas/rtSlIwDB5NcVY9t8GbQkAeAbpddTikuW2HUctvHdXfk.apk) · [Bằng chứng lịch sử 0.4.23](testing/verification/VERIFICATION_V0_4_23.md).

**Mở hệ thống:** [App Patient/TNV](https://ehis-next-20261021-hc03-app.web.app) · [Website/người báo](https://ehis-next-20261021-hc03.web.app) · [Quản trị](https://ehis-next-20261021-hc03.web.app/admin).

**Tài khoản, nhóm duyệt/chưa duyệt, quy trình và bài manual:** chỉ tại [README riêng của nhóm](https://github.com/Hoangcamng03/EHIS-Next-Team-Access/blob/main/README.md). Không tạo bảng tra tài khoản thứ hai.

## 2. Luồng hiện hành

- Patient/TNV chọn vai trò khi đăng ký; đăng nhập mở đúng khu vực đã lưu.
- Patient lưu hồ sơ, liên hệ, chọn chia sẻ/lịch sử và tạo QR. Người báo không được đọc bệnh án từ QR.
- TNV gửi năng lực → **admin duyệt trực tiếp**. Không cần người giới thiệu. Vùng phục vụ quản lý; GPS và kỹ năng đã xác minh phục vụ điều phối.
- Người báo xác nhận ở cạnh bệnh nhân hoặc ghim/địa chỉ được xác nhận từ xa → gửi → backend xác nhận → bảng hỏi → cùng ca cập nhật.
- Một TNV phụ trách một ca. Không thể tiếp tục → mời người thay → người thay xác nhận mới chuyển quyền; không tự bỏ ca vì quá giờ.
- Hồ sơ lịch sử cần đồng ý riêng, chỉ người tham gia/chủ hồ sơ, 30 ngày sau đóng; dữ liệu vị trí/phone được dọn riêng theo chính sách.

## 3. Đã kiểm ở đâu?

- [Rà soát phần mềm 24/11](testing/verification/SYSTEM_REVIEW_2026_11_24.md): lỗi vị trí/bàn giao, 21 chương trình backend, 12 UI và tải local 32 ca/8 vùng. Số đo local không phải tải cloud hay SLA.
- [Rà soát sản phẩm và phần phát triển tiếp](development/PRODUCT_ENGINEERING_REVIEW.md): khôi phục gửi yêu cầu, GPS, quản trị, điều hướng tiếp cận, phát hành và flow chụp ảnh. Kết quả mới ở JSON liên kết trong trang đó.
- [Bằng chứng cloud 11/11](testing/verification/CLOUD_UAT_2026_11_11.md): một lượt phối hợp điện thoại/web với hồ sơ hư cấu; không nghiệm thu lâm sàng/native mới.
- CI baseline `7b3acfa`: [Check EHIS đạt](https://github.com/Hoangcamng03/EHIS-Next/actions/runs/45236296326). Đây là commit trước các sửa sản phẩm tiếp theo; không dùng thay kết quả source chưa phát hành.

## 4. Việc còn mở trước pilot

1. Người khác review bản sửa → triển khai backend trước web → thử lại cloud có đăng nhập → build APK/QR cùng artifact → thử Android thật.
2. Xác minh tự thoát, chuông Home/khóa, GPS đi bộ, quyền và mạng độc lập trên ít nhất hai Android. Phiên hiện tại chưa có điện thoại.
3. Có đầu mối trực/đội y tế xác minh năng lực, quy trình không ai nhận và bàn giao thất bại.
4. Bảo trì: workflow gần nhất được đọc bị skipped; chưa chứng minh lịch chạy ổn định. Kiểm lần dọn thành công, tồn đọng, quota và App Check. Không tự bật billing/lịch mới trong đợt rà soát.
5. Theo dõi advisory công cụ Expo/ESLint; bản rà soát trước ghi 11 moderate, 0 high/critical. Chưa có kết quả mới thay thế trong phiên sản phẩm.

**Phạm vi hiện tại:** nghiệm thu/diễn tập có kiểm soát. Chưa đủ bằng chứng tiếp nhận cấp cứu thật. Vị trí nền chỉ đủ mới tối đa 5 phút; chưa có worker điều phối/SLA liên tục; bản đồ/ETA tham khảo, không có traffic/voice.

Lịch sử chi tiết giữ tại [lab note](LAB_NOTES.md) và [STATUS của snapshot trước](https://github.com/Hoangcamng03/EHIS-Next/blob/7b3acfa4284b0b165031828b17533b63fe0d8d44/docs/STATUS.md). Không dùng hướng dẫn người giới thiệu hoặc APK cũ làm quy trình hiện hành.
