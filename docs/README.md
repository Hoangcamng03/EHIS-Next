# EHIS — bắt đầu ở đây

## Thành viên chạy demo: đọc ba trang này trước

1. [START_HERE_DEMO](START_HERE_DEMO.md): hiểu vai trò, địa chỉ, tài khoản và thiết bị từ đầu.
2. [DEMO_RUNBOOK](DEMO_RUNBOOK.md): phân vai bốn người, thao tác từng bước và checkpoint.
3. [DEMO_TROUBLESHOOTING](DEMO_TROUBLESHOOTING.md): đăng nhập, QR, GPS, chuông, bản đồ và đóng ca.

Bản cloud/APK đang dùng là **0.4.7**. Source 0.4.8 còn ở local/chưa phát hành. [Tài khoản demo mới](MANUAL_DEMO_ACCOUNTS.md) dùng được trên bản hiện hành; mật khẩu ở repo riêng tư.

## Đợt hiện tại: trình thầy và midterm

- [MIDTERM_DEMO](MIDTERM_DEMO.md): kịch bản, chuẩn bị bốn người và kế hoạch cuối kỳ.
- [VERIFICATION 0.4.8](VERIFICATION_V0_4_8.md): ghi chú bản sửa local/chưa phát hành, không phải trạng thái app trên điện thoại.
- [STATUS](STATUS.md): phiên bản đã phát hành; [LAB_NOTES](LAB_NOTES.md): mọi thay đổi, việc chưa đạt.
- [ACCEPTANCE_FLOW](ACCEPTANCE_FLOW.md): flow F01–F13 và phiếu hai Android A01–A13.
- [Trang cài](https://ehis-next-20261021-hc03.web.app/install): bản APK đã xác minh, tách riêng với source đang sửa.

## Thành viên mới

Đọc [vai trò nền tảng](PLATFORM_ROLES.md) → [bản đồ repo](REPO_MAP.md) → [chạy local](LOCAL_DEVELOPMENT.md) → [chia việc](TEAM.md) → [Git/review](../CONTRIBUTING.md).

## Khi sửa code hoặc triển khai

| Công việc | Tài liệu |
| --- | --- |
| Thiết kế/quyền/dữ liệu | [ARCHITECTURE](ARCHITECTURE.md), [API_CONTRACT](API_CONTRACT.md) |
| App Patient/TNV | [Mobile README](../mobile/README.md) |
| Người báo/admin | [Web README](../web/README.md), [BYSTANDER_FLOW](BYSTANDER_FLOW.md) |
| Backend | [Functions README](../functions/README.md), [CLOUD_TRIAL](CLOUD_TRIAL.md) |
| GPS/bản đồ | [NAVIGATION](NAVIGATION.md), [LIVE_GPS](LIVE_GPS_0_4_6.md) |
| Lỗi/kiểm tra | [BUG_FIX_WORKFLOW](BUG_FIX_WORKFLOW.md), [TEST_SCENARIOS](TEST_SCENARIOS.md) |
| Android/phát hành | [ANDROID_TRIAL](ANDROID_TRIAL.md), [MOBILE_RELEASES](MOBILE_RELEASES.md), [Scripts](../scripts/README.md) |
| Kế hoạch sản phẩm | [PRODUCT_LAUNCH_PLAN](PRODUCT_LAUNCH_PLAN.md) |

## Tài khoản và lịch sử

Email/mật khẩu dùng chung chỉ ở [repo riêng tư của nhóm](https://github.com/Hoangcamng03/EHIS-Next-Team-Access), hiện chủ dự án quản lý quyền. Không chép secret hoặc hồ sơ thật vào tài liệu public.

Các báo cáo 0.3–0.4.7 giữ để đối chiếu lịch sử, không phải kết quả mới: [0.4.7](VERIFICATION_V0_4_7.md), [0.4.4](VERIFICATION_V0_4_4.md), [0.4.2](VERIFICATION_V0_4_2.md), [0.3](VERIFICATION_V0_3.md). Mục cũ trong tài liệu phát hành luôn phải đọc kèm mốc mới ở đầu file.
