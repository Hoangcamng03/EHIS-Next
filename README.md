# EHIS Next — thẻ sức khỏe và hỗ trợ cộng đồng

Repository chứa **toàn bộ hệ thống** của nhóm Capstone bốn người: một app Bệnh nhân/Tình nguyện viên (TNV), website người báo/quản trị và backend lưu dữ liệu tập trung tại Firebase.

**Thành viên mới:** [Bắt đầu từ đầu](docs/START_HERE_DEMO.md) → [phối hợp chạy demo](docs/DEMO_RUNBOOK.md) → [xử lý vướng mắc](docs/DEMO_TROUBLESHOOTING.md).

**Tra cứu:** [Danh mục đầy đủ theo tám nhóm](docs/README.md) · [Phiên bản và việc còn thiếu](docs/STATUS.md) · [Nhật ký thay đổi](docs/LAB_NOTES.md).

Mốc 25/10/2026: bản bàn giao web/backend/APK **0.4.7**; source sửa **0.4.8 còn local, chưa phát hành**. Phạm vi là diễn tập có kiểm soát bằng dữ liệu giả để trình thầy/lớp. Chưa nghiệm thu vận hành cấp cứu thật. Các lần cập nhật sau tra tại STATUS.

## 1. Tổng quan và bắt đầu

- [Hiểu sản phẩm, vai trò và luồng từ đầu](docs/START_HERE_DEMO.md).
- [Expo, GitHub, Vercel và Firebase làm gì?](docs/PLATFORM_ROLES.md).

| Giao diện | Dành cho | Đường dẫn |
| --- | --- | --- |
| App EHIS | Bệnh nhân và TNV, tự vào đúng khu vực sau đăng nhập | [Mở app web](https://ehis-next-20261021-hc03-app.web.app) |
| Web báo hỗ trợ | Người qua đường, không tự tạo tài khoản | Quét QR Patient; [trang giới thiệu](https://ehis-next-20261021-hc03.web.app) |
| Quản trị | Người được cấp quyền duyệt TNV | [Mở quản trị](https://ehis-next-20261021-hc03.web.app/admin) |
| Cài trên điện thoại | Android APK; iPhone dùng web | [Trang cài cố định](https://ehis-next-20261021-hc03.web.app/install) |

## 2. Tài khoản, chuẩn bị và chạy demo

[Bộ tài khoản và cách phân vai](docs/MANUAL_DEMO_ACCOUNTS.md) → [kịch bản bốn người](docs/DEMO_RUNBOOK.md) → [bảng xử lý vướng mắc](docs/DEMO_TROUBLESHOOTING.md). Email/mật khẩu/QR chỉ ở [repo riêng tư](https://github.com/Hoangcamng03/EHIS-Next-Team-Access), hiện chủ dự án quản lý quyền. Tài khoản GitHub khác tài khoản đăng nhập EHIS.

## 3. Kiến trúc, dữ liệu và tính năng

| Thành phần | Code và hướng dẫn | Vai trò |
| --- | --- | --- |
| App React Native/Expo | [mobile/](mobile/README.md) | Hai khu vực Patient và Volunteer, build Android và app web |
| Website Next.js | [web/](web/README.md) | Quét QR, báo hỗ trợ, bổ sung và quản trị |
| Backend Node/Express | [functions/](functions/README.md) | Xử lý nghiệp vụ, token và quyền; đang chạy Vercel Hobby |
| Firebase | [Kiến trúc](docs/ARCHITECTURE.md) | Auth, Firestore Standard Singapore và Hosting trên Spark |
| Công cụ và tài liệu | [scripts/](scripts/README.md), [docs/](docs/README.md) | Kiểm tra, vận hành, hướng dẫn và bằng chứng |

[Bản đồ repository](docs/REPO_MAP.md) · [API và dữ liệu](docs/API_CONTRACT.md) · [Luồng người báo](docs/BYSTANDER_FLOW.md) · [Bản đồ/chỉ đường](docs/NAVIGATION.md).

Luồng chính: Patient lưu hồ sơ và phát hành QR → người báo mở QR, xác nhận vị trí rồi gửi → backend xác nhận, web mở bảng hỏi → TNV phù hợp nhận cảnh báo → một TNV nhận ca, xem thông tin theo quyền/consent → chỉ đường, xác nhận đến và kết thúc. TNV phải được duyệt và bật sẵn sàng trước khi gửi. Thao tác dữ liệu cần Internet.

## 4. Phát triển và cộng tác

[Chạy local](docs/LOCAL_DEVELOPMENT.md) → [chia việc nhóm](docs/TEAM.md) → [nhánh, review và hợp nhất code](CONTRIBUTING.md). Đọc README module trước khi sửa; thay API cần thống nhất giữa các phần.

Nhánh phát triển hiện dùng là `feat/bystander-two-step-report`, chứa cả hệ thống; tên nhánh xuất phát từ việc đầu tiên. [PR #1](https://github.com/Hoangcamng03/EHIS-Next/pull/1) đang chờ review, chưa hợp nhất vào `main`. Không hiểu tên nhánh là chỉ chứa web người qua đường.

## 5. Kiểm thử và sửa lỗi

[Flow nghiệm thu và phiếu Android](docs/ACCEPTANCE_FLOW.md) → [các tình huống thử](docs/TEST_SCENARIOS.md) → [vòng lặp sửa lỗi](docs/BUG_FIX_WORKFLOW.md). [Nghiệm thu web](docs/WEB_TRIAL.md) là bước riêng trước bản điện thoại; build thành công không thay thử thiết bị.

## 6. Cài đặt, phát hành và vận hành

[Trạng thái hiện hành](docs/STATUS.md) → [cách dùng điện thoại](docs/PHONE_INSTALL_AND_LAUNCH.md) → [cài/nghiệm thu Android](docs/ANDROID_TRIAL.md). Người phụ trách triển khai đọc [phát hành](docs/MOBILE_RELEASES.md) và [cloud](docs/CLOUD_TRIAL.md).

Ưu tiên Android miễn phí + web, hoãn iOS native đến khi có tài trợ. Không tự OTA/cửa hàng/bật billing. Backend trong thư mục `functions/` hiện được triển khai trên Vercel, không phải Firebase Functions.

## 7. Báo cáo và kế hoạch phát triển

[Trình thầy, midterm và đầu việc cuối kỳ](docs/MIDTERM_DEMO.md) · [kế hoạch sản phẩm/vận hành/pitching](docs/PRODUCT_LAUNCH_PLAN.md).

## 8. Nhật ký, bằng chứng và lịch sử

Mọi phiên thay đổi phải ghi [LAB_NOTES](docs/LAB_NOTES.md): lý do, phần đã đổi, kết quả kiểm tra, trạng thái phát hành và việc còn thiếu. [Bằng chứng 0.4.7](docs/VERIFICATION_V0_4_7.md) khác [bản sửa local 0.4.8](docs/VERIFICATION_V0_4_8.md). Các mốc cũ được phân riêng trong [danh mục tài liệu](docs/README.md).

Không đưa mật khẩu, token, khóa service account, keystore, file môi trường hoặc bệnh án thật vào Git. Giữ nguyên liên kết tài liệu đã chia sẻ; thêm hướng dẫn hiện hành vào đúng nhóm và tách nội dung cũ thành lịch sử có nhãn rõ.
