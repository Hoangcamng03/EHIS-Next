# Tài liệu EHIS — đọc theo mục đích

## 1. Thành viên mới: đọc theo thứ tự

Chưa rõ các nền tảng phối hợp thế nào? Bắt đầu với [PLATFORM_ROLES.md](PLATFORM_ROLES.md). Khi phát hiện lỗi hoặc giao AI sửa, dùng [BUG_FIX_WORKFLOW.md](BUG_FIX_WORKFLOW.md). Mọi phiên có thay đổi đều cập nhật [LAB_NOTES.md](LAB_NOTES.md), bao gồm tài liệu/cấu hình và việc chưa hoàn tất.

1. [REPO_MAP.md](REPO_MAP.md): có những phần nào, code nằm đâu, luồng kết nối và môi trường.
2. [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md): cài và chạy trên máy; checkpoint cho mỗi bước.
3. [TEAM.md](TEAM.md): chia việc 4 người và phần cần phối hợp.
4. [Quy trình Git/PR](../CONTRIBUTING.md): nhánh, commit, review và xử lý file chung.
5. README module: [Mobile](../mobile/README.md), [Web](../web/README.md), [Backend](../functions/README.md), [Scripts](../scripts/README.md).

## 2. Thiết kế và hợp đồng giữa các phần

| Tài liệu | Khi nào đọc |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Hiểu vai trò, dữ liệu, quyền và các giới hạn điều phối |
| [API_CONTRACT.md](API_CONTRACT.md) | Trước khi đổi payload, API hoặc trạng thái |
| [BYSTANDER_FLOW.md](BYSTANDER_FLOW.md) | Sửa luồng gửi trước/bổ sung sau của người qua đường |
| [NAVIGATION.md](NAVIGATION.md) | Sửa bản đồ, routing, tọa độ và giới hạn dẫn đường |

## 3. Build, vận hành và thử nghiệm hiện tại

**Ưu tiên mới:** [WEB_TRIAL.md](WEB_TRIAL.md) — hoàn thiện web, nghiệm thu có kiểm soát và chờ chủ dự án duyệt trước khi phát hành Android/iOS mới. APK 0.4.1 là bản cũ; không coi nó tự có các sửa đổi web 0.4.2.

Kết quả thực của đợt mới: [VERIFICATION_V0_4_2.md](VERIFICATION_V0_4_2.md), phân biệt kiểm tra local/cloud/browser và thiết bị chưa thử.

| Tài liệu | Phạm vi |
|---|---|
| [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) | Phát triển local với dữ liệu giả trong Emulator |
| [CLOUD_TRIAL.md](CLOUD_TRIAL.md) | Firebase Spark + Vercel, Auth/Firestore/Hosting và secret backend |
| [ANDROID_TRIAL.md](ANDROID_TRIAL.md) | APK, cách cài, nhiều thiết bị, Internet và các bước nghiệm thu |
| [MOBILE_RELEASES.md](MOBILE_RELEASES.md) | Bản điện thoại mới nhất, OTA và quy trình phát hành web/Android cùng snapshot |
| [TEST_SCENARIOS.md](TEST_SCENARIOS.md) | Kịch bản nghiệp vụ và trường hợp từ chối |
| [STATUS.md](STATUS.md) | Đã có gì và còn thiếu gì |
| [VERIFICATION_V0_4.md](VERIFICATION_V0_4.md) | Bằng chứng v0.4; phân biệt build, browser và thiết bị thật |
| [SECURITY_REVIEW.json](SECURITY_REVIEW.json) | Các rủi ro đã biết; không phải chứng nhận bảo mật |
| [LAB_NOTES.md](LAB_NOTES.md) | Nhật ký thay đổi; mục tài khoản thử được highlight ở đầu |

Email/mật khẩu thử dùng chung nằm tại [repo riêng tư EHIS-Next-Team-Access](https://github.com/Hoangcamng03/EHIS-Next-Team-Access); hiện chỉ chủ dự án có quyền và sẽ tự thêm thành viên sau. Bản sao local: `.local/LAB_NOTES_PRIVATE_ACCOUNTS.md`. Không có mật khẩu hoặc service account trong các tài liệu public này.

## 4. Tài liệu lịch sử / kịch bản PC cũ

- [COMPLETE_FLOW.md](COMPLETE_FLOW.md): kịch bản đầy đủ PC local v0.3; tham khảo khi thử Emulator, không phải trạng thái triển khai cloud mới nhất.
- [TRIAL_CHECKLIST.md](TRIAL_CHECKLIST.md): checklist local v0.3.
- [VERIFICATION_V0_3.md](VERIFICATION_V0_3.md): bằng chứng ở thời điểm v0.3; không dùng để khẳng định v0.4 đã thử thiết bị.

Các đường dẫn cũ được giữ để link đã chia sẻ trong nhóm tiếp tục dùng được. Khi thêm tài liệu: chọn nhóm mục đích ở đây, ghi môi trường/phiên bản rõ và cập nhật lab note cho mọi thay đổi, gom theo mục tiêu công việc.
