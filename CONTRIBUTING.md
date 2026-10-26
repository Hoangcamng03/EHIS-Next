# Quy trình làm việc

## Hiểu repository trước khi nhận việc

Đọc [bản đồ repo](docs/architecture/REPO_MAP.md) và README của module: [Mobile](frontend/app/README.md), [Web](frontend/web/README.md), [Backend](backend/README.md), [Scripts](scripts/README.md). Mỗi nhánh chứa toàn bộ hệ thống; chia trách nhiệm theo thư mục/file, không hiểu tên branch là một ứng dụng riêng.

`main` là nguồn chuẩn chứa toàn bộ hệ thống và cấu trúc frontend/app, frontend/web, backend. Hai nhánh phát triển trước đợt sắp xếp chỉ là lịch sử công việc, không phải nơi thành viên phải vào để tìm bản hoàn chỉnh. Với máy còn sửa source cũ, đọc [hướng dẫn chuyển cấu trúc](docs/development/REPOSITORY_MIGRATION.md) trước khi kéo thay đổi.

## Một task đến một PR

Khi sửa lỗi, theo [BUG_FIX_WORKFLOW.md](docs/testing/BUG_FIX_WORKFLOW.md): tái hiện → nguyên nhân → sửa → kiểm tra → review → phát hành → nghiệm thu. Mẫu báo lỗi ở [.github/ISSUE_TEMPLATE/bug_report.md](.github/ISSUE_TEMPLATE/bug_report.md). Mọi phiên có thay đổi (kể cả tài liệu/cấu hình/thử chưa đạt) phải cập nhật [LAB_NOTES.md](docs/LAB_NOTES.md); gom các chỉnh sửa nhỏ theo cùng mục tiêu. Không ghi secret hoặc dữ liệu bệnh nhân thật.

1. Chốt việc nhỏ trong Issue: mục tiêu, file/module, đầu vào/đầu ra, cách kiểm tra.
2. Cập nhật `main` sau khi đã commit công việc đang làm; tạo branch `feat/...` hoặc `fix/...`.
3. Chỉ sửa phạm vi liên quan. Báo người phối hợp khi sửa file chung hoặc API.
4. Commit, push branch, mở PR. Mỗi PR cần mô tả hành vi và bằng chứng kiểm tra.
5. Một thành viên khác review. Sau merge, người còn lại cập nhật main; không gửi ZIP và chép đè file.

Đợt hợp nhất cấu trúc ngày 26/10/2026 được chủ dự án yêu cầu trực tiếp đưa bản đã kiểm thử vào main. Ghi chỉ đạo đó và bằng chứng CI trong lab note; không ghi thành đã có người khác approve nếu chưa có. Quy trình review thông thường vẫn áp dụng cho công việc tiếp theo.

Người phối hợp: Backend/Rules/API — TV1; Volunteer/Maps — TV2; Mobile config/Auth/Patient — TV3; Web/Admin — TV4.

Khi cùng sửa một file, Git có thể ghép các vùng độc lập. Conflict cần đọc và kết hợp logic, không chọn toàn bộ một bên cho hết lỗi. Có thể pair bằng Live Share trên một branch; chủ phiên commit/push.

Public repo không có nghĩa ai cũng có quyền ghi. Mời collaborator bằng tài khoản riêng, không dùng chung password. Nếu gói GitHub hỗ trợ, bật PR review và status checks cho main.

## Khi thay đổi nhiều phần cùng lúc

| Thay đổi | Phải phối hợp / cập nhật |
|---|---|
| Field, API, quyền hoặc trạng thái ca | TV1 + người sửa app/web; cập nhật `docs/architecture/API_CONTRACT.md`; kiểm thử quyền và vòng đời |
| QR hoặc đường dẫn web | TV3 + TV4 + TV1 nếu đổi card semantics; thử QR mở đúng website |
| Nút/chữ/bố cục | Chủ module; thử loading/error, màn hẹp và font lớn phù hợp |
| Rule/index hoặc deployment config | TV1 + chủ module; xác nhận đúng local/cloud, không tự bật billing |
| Hướng dẫn mới / milestone | Cập nhật `docs/README.md`, module README nếu cần, và `docs/LAB_NOTES.md` |

Trong issue/PR ghi: mục tiêu, module/file, API liên quan, cách thử, kết quả và giới hạn chưa kiểm chứng. Không sửa output build hoặc `node_modules/`. Không commit `.local/`, `.env.local`, mật khẩu thử, service account hay keystore.

## Source, CI và deployment là các bước riêng

Push branch → CI kiểm tra → review → merge `main`. Phát hành frontend/web/backend hoặc build APK là bước sau theo hướng dẫn vận hành; workflow CI hiện không tự deploy. Sửa code trên GitHub không tự đổi APK đã cài.

Tên nhánh mới nên mô tả một mục tiêu như `feat/patient-profile`, `fix/volunteer-location`, `docs/onboarding`. Không đổi/xóa nhánh PR đang dùng chỉ để làm đẹp tên trong lúc review; sau merge có thể xóa nhánh công việc bằng quy trình GitHub thông thường.
