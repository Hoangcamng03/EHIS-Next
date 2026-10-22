# EHIS — Lab notes

Ghi thay đổi quan trọng và kết quả quan sát, không lưu mật khẩu, token hoặc hồ sơ sức khỏe. Các mục chưa kiểm chứng được ghi rõ; không coi build thành công là thử nghiệm thiết bị.

## TÀI KHOẢN CHẠY THỬ — MỤC BÀN GIAO

> [!IMPORTANT]
> **TÀI KHOẢN + MẬT KHẨU: [mở repo riêng tư EHIS-Next-Team-Access](https://github.com/Hoangcamng03/EHIS-Next-Team-Access).** Đăng nhập GitHub bằng tài khoản được cấp quyền. Repo hiện chỉ dành cho chủ dự án; chủ dự án sẽ tự thêm thành viên sau. Link hiện 404 nếu chưa có quyền hoặc đăng nhập sai tài khoản.
>
> **Dùng tài khoản CLOUD dưới đây cho APK và app web HTTPS.** Đã xác minh đăng nhập/quyền ngày 2026-10-22. Mật khẩu nằm trong README của repo riêng tư; bản sao local là `.local/LAB_NOTES_PRIVATE_ACCOUNTS.md`. Không đăng mật khẩu vào repo public này.

| Đối tượng | Email đăng nhập | Cách dùng |
|---|---|---|
| Bệnh nhân (Patient) | `ehis-trial-patient-55d75d60@example.test` | Đã có hồ sơ giả và QR |
| Tình nguyện viên (Volunteer) | `ehis-trial-volunteer-6f4ed08b@example.test` | Đã được duyệt; bật sẵn sàng để thử |
| Quản trị (Admin) | `ehis-trial-admin-bf2d0ccb@example.test` | Chỉ nhóm quản trị; đăng nhập web /admin |

- App: https://ehis-next-20261021-hc03-app.web.app; quản trị: https://ehis-next-20261021-hc03.web.app/admin.
- Patient và TNV đăng nhập ở app, sau đó chọn đúng khu vực. Dùng hai thiết bị/hồ sơ trình duyệt riêng để thử đồng thời; các tab cùng origin dùng chung phiên cloud.
- Người quét QR **không cần tài khoản đăng nhập**; Firebase tạo phiên ẩn danh để theo dõi yêu cầu.
- Tài khoản Emulator trong `.local/complete-demo.json` và `.local/report-demo.json` chỉ dùng cho local, không đăng nhập được vào APK cloud. Đã gom thông tin vào file nội bộ; chưa xác minh lại Emulator trong lần cập nhật này.
- Tài khoản sinh ngẫu nhiên trong integration/probe không được coi là tài khoản bàn giao ổn định. Khi thêm tài khoản thử dùng chung, cập nhật danh sách này và file mật khẩu nội bộ; không ghi token hoặc khóa service account.

## 2026-10-22 — Chuẩn bị bản chạy trực tuyến

- Kiểm tra: app và web hiện vẫn dùng `demo-ehis-next`, dữ liệu ở Emulator. Bản v0.3 có luồng Patient → QR → web → TNV → hoàn tất; chưa deploy cloud.
- Nhóm chọn Cloud Firestore **Standard**, vùng **Singapore / asia-southeast1**, project riêng `ehis-next-20261021-hc03`.
- Nhóm giữ Firebase Functions và sẽ tự liên kết Blaze khi đến bước cần thanh toán. Chưa bật billing hoặc dùng database của dự án cũ.
- Mục tiêu vòng này: tạo database thật và Rules; chuẩn bị Auth/backend/web HTTPS; cải thiện thao tác và khả năng đọc; kiểm tra lại bằng dữ liệu thử. Mỗi mục bên dưới chỉ ghi hoàn tất sau khi có kết quả thực.
- Ban đầu Firebase CLI tải qua npm bị treo, một bản trong cache thiếu dependency. Đang kiểm tra bản CLI đầy đủ trước khi thao tác cloud; chưa xem lỗi CLI là đã tạo database.
- Đã dùng Firebase CLI 15.34.0 đầy đủ: tạo `(default)` Standard tại Singapore thành công; kết quả trả về `freeTier: true`. Rules và indexes ban đầu đã deploy; Auth email/password và anonymous đã bật. Đã tạo site Hosting riêng cho giao diện app, chưa coi việc tạo site là đã phát hành app.
- Đang tách website thành bản xuất tĩnh cho Firebase Hosting, giảm nhu cầu chạy máy chủ web riêng. URL mới dùng `/card?id=...` và `/report?id=...`; cấu hình chuyển tiếp URL cũ để tránh làm hỏng thẻ đã cấp.
- Giao diện: thêm nút lớn tối thiểu 56px, chữ nút 18px, trạng thái khóa rõ; tăng chữ nội dung và form; thêm hiện/ẩn mật khẩu, quên mật khẩu và xác nhận trước hủy/kết thúc ca. Các mục này đang chờ kiểm tra UI cuối.
- Backend: bổ sung giới hạn thao tác theo tài khoản/IP đã băm, tác vụ hết hạn ca và xóa thông tin riêng sau 24 giờ. Đang kiểm thử; lịch tự động chỉ có hiệu lực khi host hỗ trợ và đã triển khai.
- **Điều chỉnh theo câu hỏi mới của nhóm:** tạm dừng hướng Blaze. Đang so sánh Spark + backend Vercel Hobby; chưa liên kết thanh toán, chưa triển khai Functions hoặc chuyển thông tin quản trị sang nhà cung cấp khác.
- **Nhóm đã chọn Spark + Vercel Hobby.** Đã thêm HTTP adapter Node/Express cho cùng nghiệp vụ; kiểm thử xác nhận vẫn dùng wrapper xác thực token Firebase, không bỏ qua bằng `.run()`. Cấu hình Vercel có cron hằng ngày phù hợp gói Hobby; không deploy lịch 2 phút.
- Kết quả đã đạt: `npm run check`, production build web và 5 nhóm integration (starter, reports, lifecycle, maintenance, portable). Bài thử bảo trì đã được thu hẹp để chỉ chủ động đổi hạn dữ liệu của chính fixture.
- Kiểm tra cloud độc lập đã đạt: anonymous Auth thật; owner-read được kiểm tra; đọc người khác/thẻ và client-write trực tiếp đều bị Rules từ chối. Tài khoản ẩn danh probe đã được yêu cầu xóa sau thử; chưa coi đây là thử toàn luồng backend cloud.
- Đã xác nhận bằng API: billing vẫn **false**, database Standard/Singapore/free tier. Sau khi nhóm cho phép rõ phạm vi, đã tạo `ehis-runtime` và khóa local được Git bỏ qua, chỉ cấp `roles/datastore.user` trên project mới. Chưa coi đã lưu secret vào Vercel khi chưa có kết quả CLI.
- Đã khôi phục cấu hình Java local sau một lỗi cập nhật đường dẫn và xác nhận Emulator nạp được snapshot cũ. Không sửa project cũ; chỉ dùng JDK đã có trên máy để chạy công cụ local.

- Backend Vercel đã READY, health đúng project và API thiếu token trả 401. Khóa runtime/cron đã lưu bằng secret; không đưa vào frontend/EAS/Git.
- Luồng cloud thật đã PASS toàn bộ từ hồ sơ, QR, duyệt TNV đến bổ sung không phone/nhận/đến nơi/kết thúc và mất quyền đọc riêng sau đóng. Tất cả dữ liệu là giả. Endpoint bảo trì có secret đã kiểm tra 401/200; index đã sẵn sàng.
- Hai Hosting đã phát hành. Sửa đường dẫn artifact Next.js từ web/out sang web/.next-cloud; thêm bỏ qua artifact sinh tự động trong lint để chỉ kiểm tra mã nguồn. Build, lint/typecheck và 11 unit tests đã đạt sau sửa.
- Expo CLI đã đăng nhập và tạo dự án nhóm ehiss-team/ehis-next. Đã tải cấu hình client preview, tạo signing Android và gửi build APK cf99a628-de58-4e55-b93c-f48f13178af7; chưa coi APK đã hoàn tất hoặc đã thử thiết bị khi chưa có kết quả.

- Kiểm tra UI cloud đã đi hết ca 84c83c1253 bằng tài khoản giả: gửi trước/ack/bổ sung không phone/nhận/tuyến OSRM 0,78 km/đến nơi/xác nhận kết thúc. Sau đóng, UI gỡ hồ sơ riêng và bản đồ. Đã lưu ảnh từng bước ở .local/cloud-proof-20261022.
- GitHub Actions run 39729774930 đạt toàn bộ, gồm Android JS export, web production build và năm integration suites trên Node 22; commit 26f0b565543d96362e8010991dba6ce00cfc6a6e. Billing kiểm tra lại vẫn false.

- APK EAS đã FINISHED: build cf99a628-de58-4e55-b93c-f48f13178af7. Đã tải bộ cài 100.235.444 byte; kiểm tra archive có AndroidManifest/DEX/bundle nhúng và đúng backend/project cloud. SHA-256 lưu trong ANDROID_TRIAL.md. Chưa cài/chạy trên điện thoại, không coi build thành công là nghiệm thu thiết bị. Dashboard dùng Git commit nền vì upload snapshot trước commit; đã ghi rõ nguồn trong hướng dẫn.
- Mở lại Patient cloud thấy hồ sơ đã sửa và hai ca completed được giữ trên Firestore. Đã thử đăng nhập/tải danh sách quản trị rồi đăng xuất; phiên người báo vẫn tách riêng.
- Rà nhật ký APK: Expo Doctor 19/20, còn cảnh báo 5 package có patch mới trong SDK 58; Gradle/đóng gói đã thành công. Đã ghi phiên bản cụ thể trong VERIFICATION_V0_4.md để nhóm theo dõi, chưa coi đã cập nhật hoặc đã thử thiết bị.

## 2026-10-22 — Tổ chức repository để nhóm tiếp quản

- Xác minh GitHub có `main` bản nền và `feat/bystander-two-step-report` chứa toàn bộ các vòng phát triển mới, không chỉ website người báo. PR #1 là nơi tích hợp; chưa merge hoặc đổi/xóa nhánh đang review.
- Viết lại README gốc thành điểm bắt đầu: sản phẩm/giao diện, sơ đồ thư mục, luồng dữ liệu, link chạy thử và trình tự học/làm việc.
- Thêm README trong mobile, web, functions và scripts: trách nhiệm, file cần sửa, cách chạy/build và phần cần phối hợp. Giữ đường dẫn module/cấu hình build hiện có.
- Thêm REPO_MAP, LOCAL_DEVELOPMENT và mục lục docs phân loại thiết kế/vận hành/kiểm chứng/lịch sử. Cập nhật CONTRIBUTING về branch, review, file chung và phân biệt source–CI–deployment.
- Ghi nhận ảnh người dùng: APK đã tải nhưng Play Protect chặn cài; chưa nghiệm thu Android thật. Việc tổ chức tài liệu không thay đổi APK/backend đang chạy.
- Kiểm tra bộ tài liệu tiếp quản: 123 đường dẫn nội bộ và 16 lệnh root đều khớp file/script hiện có; không có lỗi đường dẫn hoặc mật khẩu thử trong các file chuẩn bị push. Vòng tổ chức này chỉ thay đổi 11 file Markdown.

## 2026-10-22 — Tài khoản riêng tư và chọn mục đích trước đăng ký

- Theo lựa chọn của chủ dự án, đã tạo `Hoangcamng03/EHIS-Next-Team-Access` và xác minh `private: true` trước/sau khi lưu bảng tài khoản + mật khẩu. Chỉ chứa thông tin đăng nhập thử (cloud/local); không có service account, token hạ tầng hoặc khóa ký. Hiện không mời thêm thành viên theo yêu cầu của chủ dự án.
- README và mục tài khoản cố định trong lab note public dẫn tới repo riêng tư. Người chưa có quyền sẽ thấy 404; không đưa mật khẩu vào public Git history.
- Luồng mở app khi chưa đăng nhập: chọn Bệnh nhân hoặc Tình nguyện viên kèm giải thích → form email/mật khẩu → tạo tài khoản → vào đúng khu vực. Cho phép đổi lựa chọn trước khi gửi; đăng nhập tài khoản có sẵn đi theo lối riêng.
- Lựa chọn là mục đích điều hướng, không cấp role/approved. TNV mới vẫn phải nộp đơn và chờ xét duyệt. Một tài khoản vẫn có thể dùng hai khu vực sau này.
- Kiểm chứng: đã signup Patient mới rồi tự vào `/patient`; signup TNV mới từ trang `/patient` rồi tự vào `/volunteer`, chỉ thấy nộp đơn. Cả hai tài khoản được Auth/API xác nhận chưa có quyền admin/approved; thông tin đăng nhập lưu thêm trong repo riêng tư.
- Kiểm tra mã, build cloud web và Android/Hermes export đạt. App web đã được phát hành; chưa xuất APK mới cho onboarding, nên APK tải trước đó không tự có giao diện này. Ảnh thử ở `.local/signup-proof-20261022`.

## 2026-10-22 — Đồng bộ bản điện thoại sau mỗi cập nhật app

- Theo yêu cầu mới, mỗi thay đổi app cần bàn giao đồng thời web và Android, có trạng thái riêng từng đầu ra; không báo điện thoại đã cập nhật chỉ vì web deploy xong.
- Chuẩn bị 0.4.1 (Android versionCode 2), cài expo-updates SDK 58, cập nhật các patch Expo tương thích bằng công cụ chính thức. EAS Update dùng preview và runtime fingerprint, áp dụng ở lần mở lại; không ép reload ca đang chạy.
- Thêm lệnh release:preview kiểm tra cùng commit/env, chặn OTA nếu fingerprint khác APK đã hoàn thành và ghi kết quả từng bước. Đang chuẩn bị build APK mới và publish OTA; kết quả thực bổ sung sau khi kiểm chứng.
