# Backend — API EHIS và quyền truy cập

**Phụ trách:** TV1. Đây là phần xử lý nghiệp vụ và phân quyền dùng chung cho app/web, được đổi tên từ `functions/` ngày 26/10/2026. **Backend cloud hiện là Node/Express chạy Vercel Hobby**; Firebase Spark cung cấp Auth/Firestore/Hosting. Emulator vẫn dùng callable Firebase để kiểm tra local.

## File theo trách nhiệm

| File | Trách nhiệm |
|---|---|
| [src/index.ts](src/index.ts) | Khởi tạo Admin SDK; health; quyền hiện tại; hồ sơ; tạo ca; kết nối các API xuất ra |
| [src/reports.ts](src/reports.ts) | Bổ sung tình trạng; nhận ca; đọc chi tiết có quyền; sẵn sàng và kết thúc |
| [src/lifecycle.ts](src/lifecycle.ts) | Cấp/thu hồi thẻ; ứng tuyển/xét duyệt TNV; đến nơi; Patient hủy ca |
| [src/profile.ts](src/profile.ts) | Kiểm tra và chuẩn hóa hồ sơ Patient |
| [src/reportValidation.ts](src/reportValidation.ts) | Kiểm tra câu trả lời/phone/vị trí và dữ liệu người báo |
| [src/guards.ts](src/guards.ts) | Yêu cầu Auth và giới hạn thao tác trước handler |
| [src/maintenance.ts](src/maintenance.ts) | Hết hạn ca và dọn dữ liệu riêng; lịch Firebase chỉ tùy chọn |
| [server.cjs](server.cjs) | Express: giới hạn body, allowlist API, wrapper kiểm tra token, cron secret |
| [api/index.js](api/index.js) | Adapter/đường dẫn vào Vercel |
| [vercel.json](vercel.json) | Build Node, vùng chạy, route và cron hằng ngày |
| [test/](test) | Unit tests validation |

## API chạy qua đâu?

Cloud: app/web → `POST /api/<operation>` trên Vercel → wrapper Firebase xác thực ID token → guard → handler kiểm tra quyền/input/giao dịch → Firestore. `GET /api/health` là kiểm tra dịch vụ; không thay cho thử toàn luồng. `GET /internal/maintenance` cần `CRON_SECRET`, không gọi bằng token của người dùng.

Local: Firebase Emulator nạp `lib/index.js` sau khi TypeScript build. `lib/` là file sinh tự động, sửa mã trong `src/`. [Contract API](../docs/architecture/API_CONTRACT.md) và [mô hình dữ liệu](../docs/architecture/ARCHITECTURE.md) là đầu mối phối hợp với TV2/TV3/TV4.

Trong **backend/**: `npm run build`, `npm test`. Từ **root**: `npm run check`, `npm run test:integration`. Các smoke tests nằm trong `../scripts/` và cần Emulator đúng project demo.

Admin SDK vượt qua Firestore Rules: mọi handler phải tự kiểm tra danh tính, ownership, assignment, consent và trạng thái. Runtime chỉ giữ service account trong secret Vercel; không đưa vào `frontend/app/`, `frontend/web/`, EAS hoặc Git. Quy trình deploy có quyền riêng trong [scripts/README.md](../scripts/README.md), [CLOUD_TRIAL.md](../docs/operations/CLOUD_TRIAL.md). Không chạy deploy Firebase Functions để thay thế Vercel trên Spark.
