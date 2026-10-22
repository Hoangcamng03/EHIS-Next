# Kiểm chứng web 0.4.2 — đợt thử có kiểm soát

Ngày 2026-10-22. Mục tiêu: lưu đối tượng tài khoản, mở đúng giao diện sau đăng nhập và chuẩn bị nghiệm thu web trước native. Không phải nghiệm thu bệnh án/cấp cứu thật. Quy trình thử bằng tay: [WEB_TRIAL.md](WEB_TRIAL.md).

## Kết quả đã quan sát

| Phạm vi | Cách kiểm tra | Kết quả |
|---|---|---|
| Mã nguồn | npm run check; sau tinh chỉnh UI chạy lại typecheck/lint mobile | Đạt; backend build, 6 unit và 5 navigation checks |
| Tích hợp local | Năm suite trên Emulator đang có, dữ liệu giả | Đạt starter/reports/lifecycle/maintenance/portable; thêm persistence/idempotency/injection/không tăng quyền |
| Cloud account | Auth mới thật, setAccountPurpose, signIn lại, đọc owner users, anonymous và payload sai | Đạt patient/volunteer lưu đúng; không tự có admin/approved; từ chối đổi lựa chọn đã lưu |
| Cloud toàn luồng | Hồ sơ/QR → xét duyệt → báo/bổ sung không phone → nhận/đến/kết thúc → chặn đọc riêng | Đạt với dữ liệu giả; dùng quyền admin thử đã có, không tạo admin mới |
| Browser Patient | Signup UI → tự vào Patient → logout/login → mở nhầm URL Volunteer | Đạt; không cần chọn lại; quay về Patient |
| Browser Volunteer | Signup từ URL Patient → Volunteer → logout/login → reload | Đạt; chỉ thấy form ứng tuyển; giữ phiên và lựa chọn |
| Phục hồi lỗi tải tài khoản | Gặp timeout thật khi Volunteer mở URL Patient; bấm thử lại | Phục hồi và chuyển về Volunteer; chưa xác định nguyên nhân timeout hạ tầng/mạng từ một lần quan sát |
| UI | Rà screenshot rồi thu gọn hướng dẫn cài ở màn đã login | Đã sửa, build/phát lại; hướng dẫn đầy đủ mở bằng nút |
| Web assets đã phát | HTML tiếng Việt, manifest standalone, PNG 180/192/512 và MIME | Đạt; không thêm service worker lưu hồ sơ/ca offline |
| CI | GitHub Actions run 39807656045, commit 1eb1f04d5c1627b3e5be08127167e3e68108d7df | Đạt; mốc trước sửa tiêu đề khi tải tài khoản chưa xong |

Một lần timeout là bằng chứng cần theo dõi, không đủ để kết luận dịch vụ luôn chậm hoặc lỗi đã biến mất. UI không cho vào dashboard khi chưa xác nhận lựa chọn; có thử lại và không yêu cầu tạo lại tài khoản. Sau quan sát, sửa thêm tiêu đề để chỉ hiện Patient/Volunteer khi tài khoản được xác nhận đúng khu vực. Bản sửa header commit `2549dcefc49fef272414a3e0fa8f7bc4a5cb8645` đã build/phát lại; browser mở URL Patient bằng tài khoản Volunteer hiển thị EHIS khi tải rồi tự quay về Volunteer đúng. HTML trên Hosting đã được so khớp chính xác với artifact cuối.

## Bằng chứng và nguồn

- Backend 0.4.2 đã READY từ commit `20b81ea`; hai Hosting đã phát. Source UI đầu `20b81ea`, tiếp theo `1eb1f04` gồm website hướng dẫn và thu gọn UI. Kết quả sửa tiêu đề/commit cuối xem [LAB_NOTES.md](LAB_NOTES.md).
- Bằng chứng local, Git bỏ qua: `.local/account-proof-042.private.json`, `.local/cloud-flow-042.private.json`, `.local/ui-account-proof-042.private.json` và `.local/web-042-proof/`. Các file private có thông tin đăng nhập fixture, không commit/chia sẻ công khai. Tài khoản bàn giao ổn định vẫn ở repo riêng tư theo link trong lab note.
- Ảnh 01–08 ghi chọn đối tượng, Patient signup/relogin/redirect, Volunteer signup/relogin/reload và hướng dẫn cài. Ảnh 09 ghi timeout, không dùng ảnh lỗi để tuyên bố redirect đạt. Ảnh 10 ghi phục hồi, ảnh 11 ghi Volunteer redirect đúng trên bản cuối.
- Build lại từng gặp EPERM ở thư mục Next sinh tự động; chạy lại với quyền phù hợp đạt. Lần khởi động Emulator mới báo cổng đã dùng; đã dùng Emulator có sẵn, không dừng dịch vụ người dùng.

## Chưa xác nhận và điều kiện tiếp theo

- Chưa thử Safari/iPhone thật, cài biểu tượng màn hình chính trên iPhone/Android, quyền GPS/mất mạng bằng thiết bị thật ở phiên này. Không khẳng định mọi trình duyệt đều đạt.
- Chưa phát APK/OTA mới hoặc IPA/TestFlight; APK gần nhất 0.4.1 chưa có sửa đổi web 0.4.2. Chờ chủ dự án duyệt web theo quyết định mới.
- Chưa mở công khai, thu bệnh án thật, có thông báo nền hoặc bảo đảm tiếp nhận cấp cứu. App Check cưỡng chế/chống bot/giám sát và quy trình dữ liệu thật vẫn cần hoàn thiện trước mở rộng.
- Bộ kiểm tra bảo đảm phạm vi đã thử, không chứng minh tìm hết lỗi. Ghi lỗi mới theo [BUG_FIX_WORKFLOW.md](BUG_FIX_WORKFLOW.md), giữ issue mở đến khi nghiệm thu đúng môi trường.
