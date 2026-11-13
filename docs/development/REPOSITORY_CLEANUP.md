# Cấu trúc gọn và quy tắc giữ phiên bản

Ngày 13/11/2026. Cây source chuẩn nằm trên `main`:

| Nơi lưu | Nội dung cần giữ |
| --- | --- |
| `frontend/app` | Một app React Native cho Bệnh nhân và Tình nguyện viên |
| `frontend/web` | Người báo, quản trị, người giới thiệu và trang tải |
| `backend` | Xử lý nghiệp vụ, phân quyền và điều phối |
| `scripts` | Công cụ đang dùng để kiểm tra, build và triển khai |
| `docs` | Hướng dẫn hiện hành, lab note và bằng chứng còn cần đối chiếu |
| `docs/assets/current` | Bốn ảnh giao diện cuối còn phù hợp |
| `frontend/web/public/ehis-download-qr.*` | Một QR tải phiên bản APK hiện hành, hai định dạng PNG/SVG |

## Đã làm gọn

- Trước dọn: 539 tệp Git theo dõi, tổng 14 850 575 byte; 253 tệp trong docs, 170 ảnh trong tài liệu (gồm QR).
- Bỏ 204 tệp cũ/dư thừa, tổng 11 450 322 byte: các bộ ảnh trial, perf, acceptance, flow/presentation cũ và báo cáo phiên bản đã được thay thế. Bốn ảnh cuối được chuyển sang `docs/assets/current`.
- Sau khi thêm hướng dẫn và công cụ QR: khoảng 339 tệp / 3,4 MB trong cây hiện tại, giảm khoảng 77% dung lượng tệp; docs từ 253 xuống 51 tệp, ảnh tài liệu từ 170 xuống 4. Không tính dependency/local build và không phải mức giảm toàn bộ lịch sử Git.
- Giữ báo cáo APK 0.4.22, cải thiện 12/11, UAT cloud, nghiệm thu Android gần nhất, số liệu so sánh hiệu suất và audit bảo mật. Giữ nguyên kết quả thất bại/chưa thử; không suy thành đạt sau khi dọn.
- Xóa bản QR sao chép trong docs; trang tải và tài liệu dùng chung file public. Bổ sung công cụ đồng bộ link/QR sau mỗi lần APK được kiểm tra.
- Rà mã nguồn không thấy bản backup/copy cùng nội dung cần bỏ. `*.web.tsx`, `*.native.tsx` là triển khai theo nền tảng, vẫn đang dùng. Hai hợp đồng `travel-progress.ts` được giữ tại hai ứng dụng build độc lập và có kiểm tra đồng bộ; không xóa một bên làm hỏng build.

## Xem lịch sử khi cần

[Snapshot trước dọn](https://github.com/Hoangcamng03/EHIS-Next/tree/c2bef1cfc2c3b823d19c2525303e447bc6793c22) giữ báo cáo và ảnh gốc. Các liên kết từ tài liệu còn dùng đã chuyển sang snapshot cố định; không xóa hoặc viết lại lịch sử Git. Dung lượng cây source giảm; dung lượng toàn bộ lịch sử clone không tự giảm tương ứng.

## Quy tắc từ đợt này

Kiểm tra sau dọn: lint/typecheck/build và 31 bài backend + 62 bài client đạt; dựng cloud đạt. Đã push `main` và triển khai Hosting từ 3c7c028; 36 tệp HTML/JS/CSS và bốn lượt QR PNG/SVG trên hai tên miền khớp byte. APK 0.4.22 tải lại đúng SHA-256; chưa nghiệm thu quét QR/cài đặt trên máy thật trong phiên này.

1. Sửa trực tiếp file chuẩn trên nhánh làm việc; không thêm `copy`, `final2`, `backup` vào cây source. Dùng commit để quay lại.
2. Ảnh hiện hành ghi đè theo tên chức năng; ảnh không còn đúng giao diện phải rời cây hiện tại. Giữ nguồn gốc/ngày/môi trường trong báo cáo.
3. APK thay đổi mới cần version/code và build mới. Dọn tài liệu hoặc thay trang tải không tạo APK trùng.
4. Sau verifier APK, link và QR phải được tạo cùng nhau; kiểm tra trang tải và ảnh QR trên Hosting trước khi gửi nhóm. Chỉ ghi đã cài/quét thành công khi có kiểm thử thật.
5. Mỗi phiên cập nhật [lab note](../LAB_NOTES.md), kiểm tra liên kết và các build/test liên quan trước khi push `main`.
