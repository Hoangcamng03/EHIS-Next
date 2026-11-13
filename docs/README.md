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
| [VOLUNTEER_VERIFICATION](operations/VOLUNTEER_VERIFICATION.md) | Người quản lý xác minh TNV, checklist, phân loại và duyệt hai bước |
| [ANDROID_BACKGROUND_ALERTS](operations/ANDROID_BACKGROUND_ALERTS.md) | Cấu hình thông báo Home/khóa màn hình, giới hạn GPS và bài thử máy thật |
| [REPORT_UPDATES_AND_ARRIVAL](operations/REPORT_UPDATES_AND_ARRIVAL.md) | Giải đáp Phúc Nguyên: ETA, kiểm tra tiến độ, gửi/nhận bản trả lời và font tiếng Việt |
| [HANDOVER_AND_MAINTENANCE](operations/HANDOVER_AND_MAINTENANCE.md) | Bàn giao có xác nhận, lịch sử, GPS mới và dọn dữ liệu nhiều trang |
| [BYSTANDER_FLOW](architecture/BYSTANDER_FLOW.md) | Báo hỗ trợ hai bước và cập nhật thông tin |
| [NAVIGATION](architecture/NAVIGATION.md) | Bản đồ/chỉ đường, điều kiện và giới hạn |
| [VOLUNTEER_ALERTS](architecture/VOLUNTEER_ALERTS.md) | Tham chiếu tính năng cảnh báo từ 0.4.3, không phải báo cáo thiết bị mới |
| [LIVE_GPS_0_4_6](architecture/LIVE_GPS_0_4_6.md) | Tham chiếu thiết kế GPS foreground và xác nhận đổi điểm từ 0.4.6 |

## 4. Phát triển và cộng tác

| Trang | Nội dung |
| --- | --- |
| [LOCAL_DEVELOPMENT](development/LOCAL_DEVELOPMENT.md) | Cài/chạy local và Emulator bằng dữ liệu giả |
| [REPOSITORY_MIGRATION](development/REPOSITORY_MIGRATION.md) | Đường dẫn trước/sau, chuyển máy đang sửa code, EAS/Vercel và quay lui |
| [REPOSITORY_CLEANUP](development/REPOSITORY_CLEANUP.md) | Phần đã dọn, cấu trúc chuẩn, quy tắc ảnh và QR; xem lịch sử ở snapshot Git |
| [TEAM](development/TEAM.md) | Chia việc phát triển cho bốn thành viên và tiêu chí bàn giao |
| [CONTRIBUTING](../CONTRIBUTING.md) | Làm việc chung, nhánh Git, review và xử lý khi sửa cùng file |
| [Mobile README](../frontend/app/README.md) | App Patient/Volunteer |
| [Web README](../frontend/web/README.md) | Website người báo/quản trị |
| [Backend README](../backend/README.md) | API và kiểm tra quyền |
| [Scripts README](../scripts/README.md) | Công cụ kiểm thử, build và vận hành |

## 5. Kiểm thử và sửa lỗi


| Trang | Nội dung |
| --- | --- |
| [VERIFICATION_V0_4_22](testing/verification/VERIFICATION_V0_4_22.md) | APK mới cho thay đổi giao diện đã duyệt; trạng thái build/artifact/thiết bị tách riêng |
| [VERIFICATION_V0_4_22.json](testing/verification/VERIFICATION_V0_4_22.json) | Bằng chứng tải APK thật, phiên bản và SHA-256; chưa nghiệm thu thiết bị |
| [Đối chiếu góp ý và cải thiện12/11](testing/verification/PRODUCT_REVIEW_2026_11_12.md) | UI, bảo mật, kiểm thử; phần làm được miễn phí và điều kiện còn thiếu |
| [Bằng chứng cải thiện12/11](testing/verification/PRODUCT_REVIEW_2026_11_12.json) | Số liệu chạy local, lỗi giữ lại, hash source/ảnh và các mục chưa kiểm chứng |
| [CLOUD_UAT_2026_11_11](testing/verification/CLOUD_UAT_2026_11_11.md) | Hồ sơ hư cấu trên Firebase thật, phối hợp điện thoại và ảnh cloud mới |
| [CLOUD_UAT_2026_11_11.json](testing/verification/CLOUD_UAT_2026_11_11.json) | Số liệu setup/API/ca điện thoại, phạm vi và việc còn mở |
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
| [Ảnh hiện hành](assets/README.md) | Bốn ảnh giao diện cuối, nguồn QR duy nhất và đường dẫn ảnh lịch sử |
| [ACCEPTANCE_ANDROID_2026_11_08](testing/verification/ACCEPTANCE_ANDROID_2026_11_08.md) | Hai Android thực, tải local/cloud, lỗi GPS và các điều kiện chưa nghiệm thu |
| [ACCEPTANCE_ANDROID_2026_11_08.json](testing/verification/ACCEPTANCE_ANDROID_2026_11_08.json) | Record/log hash/số đo thật; phân biệt unit mock, API và máy thật |
| [PERFORMANCE_2026_10_26.json](testing/verification/PERFORMANCE_2026_10_26.json) | Số tổng hợp trước/sau tối ưu, hash source và giới hạn phép đo local |

### 8.2. Lịch sử ngoài cây hiện tại

Các bộ ảnh cũ, bản sao và báo cáo phiên bản đã thay thế nằm trong [snapshot trước dọn](https://github.com/Hoangcamng03/EHIS-Next/tree/c2bef1cfc2c3b823d19c2525303e447bc6793c22/docs). Xem phạm vi và quy tắc ở [báo cáo dọn repository](development/REPOSITORY_CLEANUP.md). Không thêm bản sao toàn file để giữ lịch sử.

**Thêm tài liệu:** chọn đúng thư mục theo công việc, thêm một mục vào danh mục và ghi lab note. Hướng dẫn hiện hành dẫn về STATUS; ảnh và báo cáo đã bị thay thế dùng Git để truy vết.
