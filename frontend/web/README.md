# Web — người qua đường và quản trị

**Phụ trách:** TV4. Website Next.js có người quét QR không cần tài khoản đăng nhập, quản trị có claim và người quản lý giới thiệu được backend xác minh. Đây là website khác bản app React Native xuất ra web ở `frontend/app/`.

## Trang và file

| URL | Chức năng | File trang / phần xử lý |
|---|---|---|
| `/` | Giới thiệu và mở app | [src/app/page.tsx](src/app/page.tsx) |
| `/card?id=...` | Xác nhận ở cạnh bệnh nhân, vị trí, gửi yêu cầu | [src/app/card/page.tsx](src/app/card/page.tsx), [RequestHelp.tsx](src/components/RequestHelp.tsx) |
| `/report?id=...` | Ba câu hỏi, phone tùy chọn, theo dõi ca | [src/app/report/page.tsx](src/app/report/page.tsx), [BystanderReport.tsx](src/components/BystanderReport.tsx) |
| `/admin` | Đăng nhập quản trị, tải và xét đơn TNV | [src/app/admin/page.tsx](src/app/admin/page.tsx), [AdminDashboard.tsx](src/components/AdminDashboard.tsx) |
| `/referrer` | Người quản lý xem đơn được giao, điền checklist riêng | [src/app/referrer/page.tsx](src/app/referrer/page.tsx), [ReferrerDashboard.tsx](src/components/ReferrerDashboard.tsx) |
| `/privacy` | Mô tả dữ liệu và giới hạn | [src/app/privacy/page.tsx](src/app/privacy/page.tsx) |

- [PublicRoute.tsx](src/components/PublicRoute.tsx): đọc/kiểm tra ID từ query trước khi hiện trang nghiệp vụ.
- [DemoLocation.tsx](src/components/DemoLocation.tsx): tọa độ giả cho buổi chạy thử.
- [firebase-client.ts](src/lib/firebase-client.ts): cấu hình Firebase, phiên người báo/quản trị riêng và gọi API cloud/local.
- [globals.css](src/app/globals.css), [layout.tsx](src/app/layout.tsx): giao diện chung và metadata.
- [next.config.ts](next.config.ts): chế độ static export và chuyển URL cũ; cấu hình Hosting cuối cùng nằm ở `../firebase.json`.

## Luồng và vận hành

QR → `/card` → anonymous Auth → xác nhận vị trí → `createIncident` → **backend ack** → `/report` → `submitBystanderReport` → listener cập nhật ca. Không chờ TNV bấm nhận mới mở bảng hỏi. Website người báo không đọc hồ sơ sức khỏe Patient.

Admin có phiên Auth riêng trong web, quyền thực do backend kiểm tra claim. Giao diện không tự cấp admin hoặc approved. Trước khi đổi câu hỏi/URL, phối hợp TV1 và TV3 theo [API contract](../../docs/architecture/API_CONTRACT.md).

Từ **root**: `npm run web` (local port 3100). Trong **frontend/web/**: `npm run lint`, `npm run typecheck`, `npm run build`. Chuẩn bị local theo [hướng dẫn](../../docs/development/LOCAL_DEVELOPMENT.md).

Cloud build qua `npm run cloud:build` ở root: Next.js xuất tĩnh tới `frontend/web/.next-cloud`. Firebase Hosting phục vụ site người báo/quản trị; không cần chạy `next start` cho bản cloud này. Build local bình thường và cloud export dùng hai cấu hình khác nhau. [Triển khai cloud](../../docs/operations/CLOUD_TRIAL.md).
