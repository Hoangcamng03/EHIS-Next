# EHIS — danh mục tài liệu theo tám nhóm

[Về trang dự án](../README.md) · [Bắt đầu chạy demo](START_HERE_DEMO.md) · [Phiên bản hiện hành](STATUS.md)

Tài liệu được chia theo công việc, giữ nguyên đường dẫn đã chia sẻ. Không cần đọc tất cả từ đầu đến cuối. **STATUS** là nơi tra phiên bản; **LAB_NOTES** ghi các lần thay đổi; tài liệu có nhãn **lịch sử** không dùng làm hướng dẫn hiện hành.

| Bạn cần làm gì? | Thứ tự đọc |
| --- | --- |
| Tham gia demo, chưa rành code | Nhóm 1 → 2; khi lỗi xem bảng xử lý ở nhóm 2 |
| Tiếp quản và sửa code | Nhóm 1 → 3 → 4 → 5 |
| Kiểm thử và ghi nhận lỗi | Nhóm 2 → 5 → ghi bằng chứng vào nhóm 8 |
| Chuẩn bị cài/phát hành | Nhóm 5 → 6 → ghi kết quả vào nhóm 8 |
| Viết báo cáo và kế hoạch | Nhóm 1 → 7 → tra bằng chứng ở nhóm 8 |

## 1. Tổng quan và bắt đầu

| Trang | Nội dung |
| --- | --- |
| [START_HERE_DEMO](START_HERE_DEMO.md) | Lộ trình từ đầu: sản phẩm → chuẩn bị → thao tác → kiểm tra |
| [PLATFORM_ROLES](PLATFORM_ROLES.md) | Vai trò Expo, GitHub, Vercel và Firebase |

## 2. Tài khoản, chuẩn bị và chạy demo

| Trang | Nội dung |
| --- | --- |
| [MANUAL_DEMO_ACCOUNTS](MANUAL_DEMO_ACCOUNTS.md) | P1/P2, V1/V2/V3, A1 và link bảng mật khẩu riêng tư |
| [DEMO_RUNBOOK](DEMO_RUNBOOK.md) | Phân vai bốn người, hai Android/laptop, từng thao tác và kết quả cần thấy |
| [DEMO_TROUBLESHOOTING](DEMO_TROUBLESHOOTING.md) | Tìm theo triệu chứng: đăng nhập, QR, GPS, chuông, nhận ca, bản đồ, cài đặt |

## 3. Kiến trúc, dữ liệu và tính năng

| Trang | Nội dung |
| --- | --- |
| [REPO_MAP](REPO_MAP.md) | Code phần nào ở đâu, file cấu hình và đường đi dữ liệu |
| [ARCHITECTURE](ARCHITECTURE.md) | Thành phần hệ thống, phân quyền và ranh giới dữ liệu |
| [API_CONTRACT](API_CONTRACT.md) | Giao tiếp app/web/backend và schema; kiểm tra trạng thái source trước khi áp dụng |
| [BYSTANDER_FLOW](BYSTANDER_FLOW.md) | Báo hỗ trợ hai bước và cập nhật thông tin |
| [NAVIGATION](NAVIGATION.md) | Bản đồ/chỉ đường, điều kiện và giới hạn |
| [VOLUNTEER_ALERTS](VOLUNTEER_ALERTS.md) | Tham chiếu tính năng cảnh báo từ 0.4.3, không phải báo cáo thiết bị mới |
| [LIVE_GPS_0_4_6](LIVE_GPS_0_4_6.md) | Tham chiếu thiết kế GPS foreground và xác nhận đổi điểm từ 0.4.6 |

## 4. Phát triển và cộng tác

| Trang | Nội dung |
| --- | --- |
| [LOCAL_DEVELOPMENT](LOCAL_DEVELOPMENT.md) | Cài/chạy local và Emulator bằng dữ liệu giả |
| [TEAM](TEAM.md) | Chia việc phát triển cho bốn thành viên và tiêu chí bàn giao |
| [CONTRIBUTING](../CONTRIBUTING.md) | Làm việc chung, nhánh Git, review và xử lý khi sửa cùng file |
| [Mobile README](../mobile/README.md) | App Patient/Volunteer |
| [Web README](../web/README.md) | Website người báo/quản trị |
| [Backend README](../functions/README.md) | API và kiểm tra quyền |
| [Scripts README](../scripts/README.md) | Công cụ kiểm thử, build và vận hành |

## 5. Kiểm thử và sửa lỗi

| Trang | Nội dung |
| --- | --- |
| [ACCEPTANCE_FLOW](ACCEPTANCE_FLOW.md) | Flow F01–F13, phiếu Android A01–A13, điều kiện nghiệm thu |
| [TEST_SCENARIOS](TEST_SCENARIOS.md) | Tình huống nhiều tài khoản/vị trí, đồng thời và các nhánh lỗi |
| [BUG_FIX_WORKFLOW](BUG_FIX_WORKFLOW.md) | Tái hiện → sửa nguyên nhân → kiểm tra hồi quy → review → phát hành và xác minh |
| [WEB_TRIAL](WEB_TRIAL.md) | Hướng dẫn nghiệm thu web có kiểm soát trước bản điện thoại |
| [SECURITY_REVIEW.json](SECURITY_REVIEW.json) | Kết quả rà soát bảo mật trong phạm vi/ngày ghi trong file; không phải chứng nhận |
| [SECURITY_RULES_AUDIT_2026_10_24.json](SECURITY_RULES_AUDIT_2026_10_24.json) | Bằng chứng rà Rules ngày 24/10, không thay rà soát các thay đổi sau đó |

## 6. Cài đặt, phát hành và vận hành

| Trang | Nội dung |
| --- | --- |
| [STATUS](STATUS.md) | **Đầu mối tra phiên bản:** source, cloud, APK và máy thật được ghi riêng |
| [PHONE_INSTALL_AND_LAUNCH](PHONE_INSTALL_AND_LAUNCH.md) | Android/web/iPhone dùng cách nào, chuẩn bị và giới hạn |
| [ANDROID_TRIAL](ANDROID_TRIAL.md) | Cài APK và nghiệm thu thiết bị |
| [MOBILE_RELEASES](MOBILE_RELEASES.md) | Dành cho người phát hành: điều kiện, build, kiểm chứng, trang tải và quay lui |
| [CLOUD_TRIAL](CLOUD_TRIAL.md) | Cấu hình/triển khai Firebase Spark + Vercel, quyền và kiểm tra cloud |

## 7. Báo cáo và kế hoạch phát triển

| Trang | Nội dung |
| --- | --- |
| [MIDTERM_DEMO](MIDTERM_DEMO.md) | Chuẩn bị trình thầy, kịch bản midterm, chia việc và mốc cuối kỳ |
| [PRODUCT_LAUNCH_PLAN](PRODUCT_LAUNCH_PLAN.md) | Phạm vi MVP, rủi ro, kế hoạch vận hành/chuyên môn và pitching để dùng sau |

## 8. Nhật ký, bằng chứng và lịch sử

### 8.1. Nhật ký và bằng chứng cần tra trước

| Trang | Cách đọc |
| --- | --- |
| [LAB_NOTES](LAB_NOTES.md) | Mọi phiên thay đổi, cả việc chưa đạt; mục tài khoản ở đầu trang |
| [VERIFICATION_V0_4_7](VERIFICATION_V0_4_7.md) | Bằng chứng bản 0.4.7 đã bàn giao; thử điện thoại vẫn là lớp riêng |
| [VERIFICATION_V0_4_8](VERIFICATION_V0_4_8.md) | **Local/chưa phát hành**, còn thiếu UI và kiểm chứng các lớp tiếp theo |

### 8.2. Bằng chứng các mốc cũ — dùng để đối chiếu

| Trang | Phạm vi lịch sử |
| --- | --- |
| [VERIFICATION_V0_4_4](VERIFICATION_V0_4_4.md) | Màu theo vai trò và kiểm chứng 0.4.4 |
| [VERIFICATION_V0_4_2](VERIFICATION_V0_4_2.md) | Định tuyến đối tượng và kiểm chứng 0.4.2 |
| [VERIFICATION_V0_4](VERIFICATION_V0_4.md) | Kiểm chứng mốc 0.4 |
| [VERIFICATION_V0_3](VERIFICATION_V0_3.md) | Kiểm chứng local 0.3 |
| [COMPLETE_FLOW](COMPLETE_FLOW.md) | Flow local cũ; nghiệm thu mới dùng nhóm 5 |
| [TRIAL_CHECKLIST](TRIAL_CHECKLIST.md) | Checklist local cũ; không thay phiếu Android hiện hành |

### 8.3. Bản sao tài liệu trước đợt sắp xếp 25/10

Những file này giữ nguyên nội dung cũ để truy vết, có thể chứa nhiều câu “mới nhất” ở các thời điểm khác nhau. Các trang hiện hành tương ứng nằm tại nhóm 6.

| Bản sao lịch sử | Trang dùng hiện nay |
| --- | --- |
| [STATUS_HISTORY](STATUS_HISTORY.md) | STATUS, nhóm 6 |
| [ANDROID_TRIAL_HISTORY](ANDROID_TRIAL_HISTORY.md) | ANDROID_TRIAL, nhóm 6 |
| [MOBILE_RELEASES_HISTORY](MOBILE_RELEASES_HISTORY.md) | MOBILE_RELEASES, nhóm 6 |
| [PHONE_INSTALL_AND_LAUNCH_HISTORY](PHONE_INSTALL_AND_LAUNCH_HISTORY.md) | PHONE_INSTALL_AND_LAUNCH, nhóm 6 |

**Quy tắc thêm tài liệu:** chọn một trong tám nhóm theo mục đích chính, thêm vào bảng tương ứng, dẫn về STATUS nếu nhắc phiên bản và ghi LAB_NOTES. Mật khẩu chỉ ở repo riêng tư. Giữ tên/đường dẫn tài liệu đã chia sẻ; nội dung cũ cần có nhãn lịch sử, không xen lẫn chỉ dẫn hiện hành.
