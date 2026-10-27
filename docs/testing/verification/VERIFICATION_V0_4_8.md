# EHIS 0.4.8 — sắp xếp giao diện và bản trình midterm

Source chuẩn bị 0.4.8/code 6. **Tra [STATUS](../../STATUS.md) để biết cloud/APK đã phát hành đến đâu**; source, deploy và cài trên máy là các mốc riêng. Chưa có phiếu máy thật thì không coi đã nghiệm thu Android.

Ngày 27/10/2026. Android miễn phí + web; diễn tập dữ liệu giả. [Kịch bản trình thầy và hướng cuối kỳ](../../planning/MIDTERM_DEMO.md) · [Trang link chung](../../demo/TEAM_LINKS.md).

## Thay đổi cần review

- Đăng nhập mặc định; đăng ký chọn Bệnh nhân/Tình nguyện viên trước khi nhập thông tin. Đăng nhập tự vào đúng khu vực, không cấp quyền từ lựa chọn UI.
- Ba cấp nút: thao tác chính có nền màu vai trò; thao tác phụ có viền; tác vụ đọc/cài đặt nhẹ hơn. Hủy/vô hiệu hóa có cảnh báo đỏ; hoàn tất ca dùng màu TNV và có xác nhận.
- Patient: yêu cầu đang diễn ra → QR đang dùng → chỉnh hồ sơ → lịch sử thu gọn → tài khoản/cài đặt. Chưa có thẻ thì lưu hồ sơ trước tạo QR. So sánh bản đang sửa với snapshot đã lưu, không cho tạo QR khi có thay đổi chưa lưu.
- TNV: cảnh báo/ca đang nhận trước; tùy chọn, lịch sử và tài khoản sau. Bản đồ trong app giữ vị trí chính; các chặng và Google Maps nằm trong mục tùy chọn.
- Người báo: ba câu quan sát trước, số điện thoại tùy chọn sau; đủ ba đáp án mới gửi. Hủy chưa nhận là khu vực riêng và cần xác nhận. Không đổi nguyên tắc gửi trước/bổ sung sau.
- Quản trị: xem đơn → chọn quyết định → xác nhận, có quay lại. Quyền backend không đổi.
- Không đổi Rules, IAM, schema, billing hoặc tạo tài khoản cloud mới trong phần sửa UI. Tài khoản QA local và cloud luôn tách riêng.

## Kiểm chứng và phát hành

Kết quả logic/type/lint, chín integration, bài scale riêng, browser, cloud và APK được ghi tại [LAB_NOTES](../../LAB_NOTES.md). Chưa có số đo thiết bị mới thì giữ Chưa thử trong [phiếu Android](../ACCEPTANCE_FLOW.md). Build thành công không chứng minh cài/apply trên máy. Số liệu hai lớp gọi, hash source và dependency ở [MIDTERM_2026_10_27.json](MIDTERM_2026_10_27.json).

Các giới hạn giữ nguyên: nhận nền chưa được xác minh; hiệu năng tải lớn và advisory dependency còn mở; GPS/loa/rung cần thử thiết bị; chưa có đơn vị y tế phụ trách ca thật. Không mô tả bản midterm là vận hành cấp cứu chính thức.

## Mốc đã quan sát ở local

| Lớp | Kết quả đợt 27/10 |
| --- | --- |
| Unit/logic, type/lint | 40 bài và type/lint đạt; có hồi quy hồ sơ sửa chưa lưu. Vòng cuối sau vá dependency tra lab note/CI |
| Hồi quy | Chín bộ đạt; riêng 14 nhóm đa ca/vùng gồm 215 Auth giả, 181 API ở lượt đầu đợt này |
| Scale Functions Emulator | 1.000 Auth giả, 32 ca/tám vùng, 320 API, đúng dữ liệu/quyền; nhiều p95 17–20 giây, không đạt mốc thời gian chờ app |
| Scale HTTP wrapper dùng cho Vercel | Cùng workload trên loopback, 320 API gồm 40 từ chối đúng quyền; lượt đầu p95 tạo 607 ms, nhận 463 ms, hoàn tất 409 ms |
| Browser | Đăng ký/consent, sai mật khẩu/tự định tuyến, profile không phone/dirty, QR, pending/duyệt, ON, báo/ack/bổ sung, cảnh báo/nhận/map, đến/hoàn tất và khóa private/form đều thử |
| Build | Next production, Expo web local đạt; export sạch cache hiển thị đúng 0.4.8. Android/CI/cloud/APK ghi riêng khi có kết quả |
| Máy thật | Chưa có phiếu nghiệm thu mới của nhóm; không suy ra từ browser/Emulator hoặc APK |

### Cách đọc bài scale

128 tài khoản có phiên (32 Patient, 32 người báo, 64 TNV) và 872 tài khoản nền offline/pending. **Không phải 1.000 người online đồng thời.** Tám vùng độc lập, 32 create cùng lúc, tám replay cùng mã không tạo trùng; 32 bổ sung xen kẽ có/không phone, 32 phân công, 16 đổi điểm xác nhận, 32 đến/kết thúc, kiểm tra pointer và chặn private sau đóng. Không retry tự động để che lỗi. Vòng cuối bổ sung 32 client TNV SDK thật đăng nhập riêng, nghe snapshot server và xác nhận đúng bốn lời mời cùng vùng, rồi trạng thái completed. P95 gửi → snapshot 1120 ms, tạo 1094 ms, nhận 671 ms, hoàn tất 728 ms; max mọi thao tác thành công dưới 15 giây. Đây là workload có thêm client realtime, không so trực tiếp tốc độ với lượt API-only ở bảng trên.

Giữ cả kết quả Functions Emulator và portable. Cùng nghiệp vụ/guard/Auth/Firestore, khác lớp HTTP; Functions front door có độ trễ cao hơn ở tải này. Portable phản ánh đường chạy Vercel hiện tại phù hợp hơn, vẫn không phải đo cloud. Bài scale kiểm tra max HTTP thành công dưới 15 giây theo timeout ngắn nhất của app; đây không phải mục tiêu đủ nhanh cho cấp cứu. Vòng cuối sau thay dependency và hash source nằm trong JSON tổng hợp. Không tạo 1.000 tài khoản hoặc thử tải bản đồ/cloud miễn phí.

### Giao diện và bằng chứng

Patient, TNV và reporter đã đo viewport 390 px không tràn ngang ở màn quan sát. Bản đồ đang hỗ trợ thử desktop: A/B, tuyến nhúng 0,78 km/~2 phút, danh sách rẽ trong mục tùy chọn. Không bật GPS thật hoặc xác minh loa/rung vật lý. TNV pending không có công tắc; duyệt/hủy/hoàn tất có xác nhận. Ca đóng xóa profile/map; reporter phone/gửi đều disabled. Đăng nhập lại tự mở vai trò; Patient đi URL TNV tự trở lại Patient. TNV hẹp/reporter không console error ở lần đọc cuối.

Ảnh chỉ fixture giả: [đăng nhập](../../assets/trial-048/login.jpg), [Patient QR](../../assets/trial-048/patient-qr.jpg), [admin xác nhận](../../assets/trial-048/admin-confirm.jpg), [cảnh báo](../../assets/trial-048/volunteer-alert.jpg), [tuyến nhúng](../../assets/trial-048/volunteer-route.jpg), [TNV màn hẹp](../../assets/trial-048/volunteer-phone.jpg), [bảng hỏi](../../assets/trial-048/reporter-supplement.jpg), [ca đóng](../../assets/trial-048/closed-report.jpg). Ảnh app chụp vùng cuộn đang thấy, không coi fullPage là toàn bộ ScrollView.

### Dependency và việc còn mở

Đợt rà đầu npm audit --omit=dev: backend 0 high/8 moderate, web 4 high, app 8 high; một advisory có thể kéo nhiều package. Pin override gRPC bắc cầu của @firebase/firestore lên 1.13.6, giữ Firebase/Expo chính. Rà lại: web 0 vulnerability; app còn 4 high ở expo/@expo/cli/node-forge/zod; backend giữ 8 moderate, không high. Hồi quy, SDK, scale sau vá đã đạt. Không force hạ Firebase về 9/Expo về 54.

[Advisory gRPC](https://github.com/advisories/GHSA-m9gg-hp2v-232j) nêu bản vá 1.13.6. [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv) chưa có bản vá trong advisory; [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) yêu cầu 4.6.6, trong khi Expo/lint đang yêu cầu nhánh 3. Không ép Zod 4 khi chưa chứng minh tương thích. EHIS không trực tiếp import các API đó trong giao diện; chưa chứng minh không còn rủi ro toolchain. Giữ đánh giá dependency, cold start/quota/nhiều instance và mạng di động cho mốc tiếp theo; không dùng dữ liệu y tế thật.

Trước trình thầy, nhóm chạy runbook và hai vòng độc lập với >=2 Android, Wi-Fi/4G, điền A01–A13, chuẩn bị video dự phòng và công bố giới hạn foreground/Internet. Sau midterm: phản hồi thầy → lỗi P0/P1 → máy thật/GPS/nền → hiệu năng cloud/dependency → báo cáo cuối kỳ. Bản nháp 25/10 còn trong lịch sử Git; không dùng kết quả cũ thay đợt này.
