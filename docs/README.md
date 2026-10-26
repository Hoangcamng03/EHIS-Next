# EHIS — danh mục tài liệu theo tám nhóm

[Về trang dự án](../README.md) · [Bắt đầu chạy demo](START_HERE_DEMO.md) · [Phiên bản hiện hành](STATUS.md)

Tài liệu được chia thành thư mục theo công việc. Bốn đầu mối giữ tại gốc docs: README, START_HERE_DEMO, STATUS và LAB_NOTES. Không cần đọc tất cả từ đầu đến cuối. **STATUS** là nơi tra phiên bản; **LAB_NOTES** ghi các lần thay đổi; tài liệu có nhãn **lịch sử** không dùng làm hướng dẫn hiện hành.

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
| [TEAM_LINKS](demo/TEAM_LINKS.md) | Một link gửi cả nhóm: đọc từ đầu, mở hệ thống, demo, theo dõi và góp ý |
| [START_HERE_DEMO](START_HERE_DEMO.md) | Lộ trình từ đầu: sản phẩm → chuẩn bị → thao tác → kiểm tra |
| [PLATFORM_ROLES](architecture/PLATFORM_ROLES.md) | Vai trò Expo, GitHub, Vercel và Firebase |

## 2. Tài khoản, chuẩn bị và chạy demo

| Trang | Nội dung |
| --- | --- |
| [MANUAL_DEMO_ACCOUNTS](demo/MANUAL_DEMO_ACCOUNTS.md) | P1/P2, V1/V2/V3, A1 và link bảng mật khẩu riêng tư |
| [DEMO_RUNBOOK](demo/DEMO_RUNBOOK.md) | Phân vai bốn người, hai Android/laptop, từng thao tác và kết quả cần thấy |
| [DEMO_TROUBLESHOOTING](demo/DEMO_TROUBLESHOOTING.md) | Tìm theo triệu chứng: đăng nhập, QR, GPS, chuông, nhận ca, bản đồ, cài đặt |

## 3. Kiến trúc, dữ liệu và tính năng

| Trang | Nội dung |
| --- | --- |
| [REPO_MAP](architecture/REPO_MAP.md) | Code phần nào ở đâu, file cấu hình và đường đi dữ liệu |
| [ARCHITECTURE](architecture/ARCHITECTURE.md) | Thành phần hệ thống, phân quyền và ranh giới dữ liệu |
| [API_CONTRACT](architecture/API_CONTRACT.md) | Giao tiếp app/frontend/web/backend và schema; kiểm tra trạng thái source trước khi áp dụng |
| [BYSTANDER_FLOW](architecture/BYSTANDER_FLOW.md) | Báo hỗ trợ hai bước và cập nhật thông tin |
| [NAVIGATION](architecture/NAVIGATION.md) | Bản đồ/chỉ đường, điều kiện và giới hạn |
| [VOLUNTEER_ALERTS](architecture/VOLUNTEER_ALERTS.md) | Tham chiếu tính năng cảnh báo từ 0.4.3, không phải báo cáo thiết bị mới |
| [LIVE_GPS_0_4_6](architecture/LIVE_GPS_0_4_6.md) | Tham chiếu thiết kế GPS foreground và xác nhận đổi điểm từ 0.4.6 |

## 4. Phát triển và cộng tác

| Trang | Nội dung |
| --- | --- |
| [LOCAL_DEVELOPMENT](development/LOCAL_DEVELOPMENT.md) | Cài/chạy local và Emulator bằng dữ liệu giả |
| [REPOSITORY_MIGRATION](development/REPOSITORY_MIGRATION.md) | Đường dẫn trước/sau, chuyển máy đang sửa code, EAS/Vercel và quay lui |
| [TEAM](development/TEAM.md) | Chia việc phát triển cho bốn thành viên và tiêu chí bàn giao |
| [CONTRIBUTING](../CONTRIBUTING.md) | Làm việc chung, nhánh Git, review và xử lý khi sửa cùng file |
| [Mobile README](../frontend/app/README.md) | App Patient/Volunteer |
| [Web README](../frontend/web/README.md) | Website người báo/quản trị |
| [Backend README](../backend/README.md) | API và kiểm tra quyền |
| [Scripts README](../scripts/README.md) | Công cụ kiểm thử, build và vận hành |

## 5. Kiểm thử và sửa lỗi

| Trang | Nội dung |
| --- | --- |
| [ACCEPTANCE_FLOW](testing/ACCEPTANCE_FLOW.md) | Flow F01–F13, phiếu Android A01–A13, điều kiện nghiệm thu |
| [PERFORMANCE_COMPARISON](testing/PERFORMANCE_COMPARISON.md) | Phương pháp và kết quả so sánh bản trước/sau cấu trúc, API/realtime/build |
| [TEST_SCENARIOS](testing/TEST_SCENARIOS.md) | Tình huống nhiều tài khoản/vị trí, đồng thời và các nhánh lỗi |
| [BUG_FIX_WORKFLOW](testing/BUG_FIX_WORKFLOW.md) | Tái hiện → sửa nguyên nhân → kiểm tra hồi quy → review → phát hành và xác minh |
| [WEB_TRIAL](testing/WEB_TRIAL.md) | Hướng dẫn nghiệm thu web có kiểm soát trước bản điện thoại |
| [SECURITY_REVIEW.json](testing/audits/SECURITY_REVIEW.json) | Kết quả rà soát bảo mật trong phạm vi/ngày ghi trong file; không phải chứng nhận |
| [SECURITY_RULES_AUDIT_2026_10_24.json](testing/audits/SECURITY_RULES_AUDIT_2026_10_24.json) | Bằng chứng rà Rules ngày 24/10, không thay rà soát các thay đổi sau đó |

## 6. Cài đặt, phát hành và vận hành

| Trang | Nội dung |
| --- | --- |
| [STATUS](STATUS.md) | **Đầu mối tra phiên bản:** source, cloud, APK và máy thật được ghi riêng |
| [PHONE_INSTALL_AND_LAUNCH](operations/PHONE_INSTALL_AND_LAUNCH.md) | Android/frontend/web/iPhone dùng cách nào, chuẩn bị và giới hạn |
| [ANDROID_TRIAL](operations/ANDROID_TRIAL.md) | Cài APK và nghiệm thu thiết bị |
| [MOBILE_RELEASES](operations/MOBILE_RELEASES.md) | Dành cho người phát hành: điều kiện, build, kiểm chứng, trang tải và quay lui |
| [CLOUD_TRIAL](operations/CLOUD_TRIAL.md) | Cấu hình/triển khai Firebase Spark + Vercel, quyền và kiểm tra cloud |

## 7. Báo cáo và kế hoạch phát triển

| Trang | Nội dung |
| --- | --- |
| [MIDTERM_DEMO](planning/MIDTERM_DEMO.md) | Chuẩn bị trình thầy, kịch bản midterm, chia việc và mốc cuối kỳ |
| [PRODUCT_LAUNCH_PLAN](planning/PRODUCT_LAUNCH_PLAN.md) | Phạm vi MVP, rủi ro, kế hoạch vận hành/chuyên môn và pitching để dùng sau |

## 8. Nhật ký, bằng chứng và lịch sử

### 8.1. Nhật ký và bằng chứng cần tra trước

| Trang | Cách đọc |
| --- | --- |
| [LAB_NOTES](LAB_NOTES.md) | Mọi phiên thay đổi, cả việc chưa đạt; mục tài khoản ở đầu trang |
| [PERFORMANCE_2026_10_26.json](testing/verification/PERFORMANCE_2026_10_26.json) | Số tổng hợp trước/sau tối ưu, hash source và giới hạn phép đo local |
| [VERIFICATION_V0_4_7](testing/verification/VERIFICATION_V0_4_7.md) | Bằng chứng bản 0.4.7 đã bàn giao; thử điện thoại vẫn là lớp riêng |
| [VERIFICATION_V0_4_8](testing/verification/VERIFICATION_V0_4_8.md) | **Local/chưa phát hành**, còn thiếu UI và kiểm chứng các lớp tiếp theo |

### 8.2. Bằng chứng các mốc cũ — dùng để đối chiếu

| Trang | Phạm vi lịch sử |
| --- | --- |
| [VERIFICATION_V0_4_4](testing/verification/VERIFICATION_V0_4_4.md) | Màu theo vai trò và kiểm chứng 0.4.4 |
| [VERIFICATION_V0_4_2](testing/verification/VERIFICATION_V0_4_2.md) | Định tuyến đối tượng và kiểm chứng 0.4.2 |
| [VERIFICATION_V0_4](testing/verification/VERIFICATION_V0_4.md) | Kiểm chứng mốc 0.4 |
| [VERIFICATION_V0_3](testing/verification/VERIFICATION_V0_3.md) | Kiểm chứng local 0.3 |
| [COMPLETE_FLOW cũ](https://github.com/Hoangcamng03/EHIS-Next/blob/f921d33/docs/COMPLETE_FLOW.md) | Flow local cũ; nghiệm thu mới dùng nhóm 5 |
| [TRIAL_CHECKLIST cũ](https://github.com/Hoangcamng03/EHIS-Next/blob/f921d33/docs/TRIAL_CHECKLIST.md) | Checklist local cũ; không thay phiếu Android hiện hành |

### 8.3. Nội dung đã bỏ khỏi cây hiện tại

Bốn bản sao *_HISTORY, COMPLETE_FLOW và TRIAL_CHECKLIST cũ đã bỏ vì trùng lặp hoặc thay bằng flow nghiệm thu hiện hành. Nội dung vẫn có trong [snapshot trước sắp xếp](https://github.com/Hoangcamng03/EHIS-Next/tree/f921d33/docs), dùng để truy vết. Không thêm bản sao toàn file chỉ để lưu lịch sử; dùng Git và lab note.

**Quy tắc thêm tài liệu:** chọn đúng thư mục demo, architecture, development, testing, operations hoặc planning; thêm một mục vào bảng tương ứng và ghi LAB_NOTES. Trạng thái phiên bản dẫn về STATUS. File verification/audit có bằng chứng riêng được giữ; dữ liệu trùng hoặc hướng dẫn đã thay thế không để lẫn với hướng dẫn hiện hành.
