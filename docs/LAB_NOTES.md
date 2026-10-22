# EHIS — Lab notes

Ghi **mọi phiên có thay đổi** và kết quả quan sát: code, UI, cấu hình, triển khai, tài khoản, tài liệu và việc thử chưa đạt. Gom chỉnh sửa nhỏ cùng mục tiêu vào một mục; không lưu mật khẩu, token hoặc hồ sơ sức khỏe. Các mục chưa kiểm chứng được ghi rõ; không coi build thành công là thử nghiệm thiết bị.

> [!IMPORTANT]
> **Quy định từ 2026-10-22:** mỗi thay đổi phải có lab note cùng đợt bàn giao. Ghi: lý do → phần đã đổi → kiểm tra/kết quả → bản phát hành hoặc không áp dụng → còn thiếu/bước tiếp theo. AI và thành viên đều áp dụng; xem [quy trình sửa lỗi](BUG_FIX_WORKFLOW.md) và [vai trò các nền tảng](PLATFORM_ROLES.md).

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
- Bản web 0.4.2 tự mở đúng khu vực theo lựa chọn tài khoản; tài khoản cũ suy ra từ hồ sơ hiện có hoặc hoàn tất lựa chọn một lần. APK 0.4.1 cũ vẫn theo luồng trước. Dùng hai thiết bị/hồ sơ trình duyệt riêng để thử đồng thời; các tab cùng origin dùng chung phiên cloud.
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

- Đã phát hành đồng bộ app web + OTA preview + APK 0.4.1, source commit `794bcbd4db670621b76fa9570f5b065c04e93d9a`. Build `6e645e3e-bbcc-474b-89bf-f67205bfdcd7` FINISHED; tải APK 102.066.128 byte, kiểm tra SHA-256/manifest/DEX/URL OTA/fingerprint. Link tải mới cố định trong ANDROID_TRIAL.md và MOBILE_RELEASES.md.
- EAS manifest probe đạt: runtime tương thích nhận đúng update HTTP 200; runtime khác HTTP 204. Expo Doctor 20/20; GitHub CI run 39753486305 đạt. Web hiển thị 0.4.1 và giữ phiên; chưa có bằng chứng cài/nhận OTA trên điện thoại.
- Quy trình có thêm chặn source chưa commit, fingerprint không phù hợp và versionCode native không tăng. Đã kiểm tra source guard từ chối trước publish, không làm đổi bản ghi phát hành.
- Kiểm tra sâu APK SDK 58: Android khai báo runtime bằng `file:fingerprint`, giá trị nằm trong `assets/fingerprint`; đã đọc asset và xác nhận khớp chính xác runtime OTA. Updater bật, channel preview, kiểm tra khi mở và thời gian chờ khởi động 0; không có lời gọi ép reload trong code app.

## 2026-10-22 — Chuẩn hóa giải thích hệ thống và vòng sửa lỗi

- Yêu cầu: giải thích Expo/GitHub/Vercel/Firebase cho nhóm; từ nay mọi thay đổi phải ghi lab note; đánh giá vòng AI sửa lỗi có thể mở rộng sau khi ổn định cơ bản.
- Thêm PLATFORM_ROLES.md: trách nhiệm từng dịch vụ, luồng sử dụng/phát hành và điểm bắt đầu tìm lỗi; làm rõ backend trong functions/ chạy trên Vercel, web chạy trên Firebase Hosting.
- Thêm BUG_FIX_WORKFLOW.md: phân mức theo hậu quả, Issue → tái hiện → nguyên nhân → sửa → kiểm tra → peer review → phát hành → nghiệm thu; ba lần sửa thất bại phải tổng hợp bằng chứng và đổi cách phân tích. Không sửa vô hạn, không bỏ kiểm tra/bảo mật để báo đạt.
- Đề xuất checkpoint ổn định và lộ trình quan sát lỗi → AI tạo PR nháp → phát hành có kiểm soát. Chưa tạo bot nền, tự động sửa, giám sát hoặc tự deploy; chưa xem checkpoint là chứng nhận an toàn y tế.
- Thêm mẫu Bug report, mở rộng mẫu PR; liên kết từ README/mục lục/CONTRIBUTING và đưa quy định mọi thay đổi vào AGENTS.md. Mẫu Issue/PR có thể cần merge vào nhánh mặc định trước khi GitHub tự hiện; hiện có thể sao chép dùng thủ công. PR #1 vẫn chờ review, không tự merge.
- Phạm vi vòng này chỉ tài liệu và mẫu quy trình; không đổi mã app/backend/Rules, không phát hành APK/OTA/web mới. Kiểm tra đạt: 83 đường dẫn nội bộ trong 9 tài liệu/mẫu, các lệnh check/test:integration/release:preview có trong package.json, git diff --check không lỗi. Không chạy lại build/test runtime vì không đổi runtime; Android thật vẫn chờ nghiệm thu.

## 2026-10-22 — Web 0.4.2: ghi nhớ đối tượng và nghiệm thu trước native

- Chủ dự án chốt **hoàn thiện web có kiểm soát trước**, sau khi duyệt mới đưa lên Android/iOS. Đã cập nhật AGENTS/README/MOBILE_RELEASES/WEB_TRIAL; không phát APK hoặc OTA trong đợt này.
- Phát hiện nguyên nhân đăng nhập hỏi lại: lựa chọn signup chỉ ở ref trong phiên, chưa lưu server. Thêm setAccountPurpose và getMyAccess.accountPurpose; transaction chỉ lưu patient/volunteer theo UID, không cấp admin/approved, không nhận UID/role tùy ý. Giữ dữ liệu users cũ khi merge.
- Session chờ xác nhận server, có thử lại khi lỗi; đăng nhập tự mở đúng khu vực, URL sai khu vực chuyển lại. Bỏ nút chuyển khu vực. Tài khoản cũ suy ra từ hồ sơ/application, nếu trống thì chọn một lần; accountPurpose đã lưu không tự đổi trong đợt thử này.
- Thêm xác nhận đã đọc thông tin thử nghiệm trước đăng ký, lỗi email đã dùng/mạng/quá nhiều lần thử rõ hơn; cảnh báo mất mạng. Diễn đạt là đăng ký đợt thử có hướng dẫn với dữ liệu lưu thật; vẫn dùng dữ liệu giả khi nghiệm thu, không nhận cấp cứu thật.
- Thêm manifest, icon web và hướng dẫn thêm màn hình chính iPhone/Android ở cả trước/sau đăng nhập; không có IPA/TestFlight hay service worker lưu hồ sơ offline. Browser/thiết bị chưa thử phải để chờ, không hứa mọi trình duyệt đều đạt.
- Cloud UI không còn thao tác nhập tọa độ giả; chỉ Emulator cho phép. Không thay đổi quyền thẻ/ca, giới hạn dispatch hoặc thông báo nền.
- Kiểm tra đã đạt: npm run check (lint/typecheck/build backend/11 unit checks), build hai bản web; năm suite integration trên Emulator có sẵn, gồm bổ sung purpose, từ chối field injection, lưu lặp an toàn và không tăng quyền. Lần khởi động Emulator mới báo cổng đang dùng; không dừng dịch vụ của người dùng, chuyển sang kiểm tra trên Emulator đang chạy bằng kết nối được cấp phép.
- Đang chuẩn bị triển khai backend/web và kiểm tra browser/cloud. Chưa coi source/build là deploy hoặc nghiệm thu iPhone/Android; kết quả thực sẽ được bổ sung sau.
- Đã triển khai backend READY và hai Hosting; cloud kiểm tra lưu lựa chọn/đăng nhập lại/owner-read/không tăng quyền đạt. Chạy lại toàn luồng cloud hồ sơ giả → QR → duyệt TNV bằng admin thử đã có → báo/bổ sung không phone → nhận/đến/kết thúc → chặn đọc riêng sau đóng đạt. Không cấp quyền admin mới.
- Browser đăng ký Patient và đăng nhập lại vào đúng giao diện. Khi xem ảnh thấy khối hướng dẫn cài đặt chiếm nhiều diện tích trước form; thu gọn khối này ở màn đã đăng nhập, giữ hướng dẫn đầy đủ khi mở. Đang kiểm tra và phát lại UI gọn hơn; chưa phát native.
- Typecheck/lint mobile sau thu gọn đạt. Lần build lại web gặp EPERM khi ghi thư mục sinh tự động; chạy lại với quyền cần thiết đạt cả hai bản web, không xóa source hoặc dừng dịch vụ khác. Các cảnh báo đường dẫn icon mặc định của Leaflet CSS còn xuất hiện khi export; bản đồ dùng marker riêng, chưa xem cảnh báo là lỗi tuyến đường đã tái hiện.
- Browser đã thử signup Volunteer từ URL Patient và tự vào Volunteer, chỉ thấy form ứng tuyển, chưa có quyền nhận ca. Patient mở URL Volunteer được chuyển về Patient. Tiếp tục xác nhận đăng nhập lại Volunteer và bản UI đã phát cuối trước bàn giao.
- Vòng UI thu gọn đã deploy, kiểm tra HTML/manifest/icon thật đạt; Volunteer logout/login/reload giữ đúng giao diện. CI commit 1eb1f04 đạt run 39807656045. Bằng chứng tổng hợp tại VERIFICATION_V0_4_2.md.
- Khi Volunteer mở nhầm URL Patient, gặp một lần timeout tải tài khoản. Dashboard bị chặn đúng; bấm thử lại phục hồi và quay về Volunteer. Phát hiện tiêu đề theo URL vẫn có thể hiện Bệnh nhân lúc tải/lỗi; đã sửa header chỉ hiện đối tượng sau khi server xác nhận đúng. Đang build/phát lại phần header, chưa kết luận timeout hạ tầng đã hết hoặc nghiệm thu thiết bị.
- Bản header cuối `2549dcefc49fef272414a3e0fa8f7bc4a5cb8645` đã build/phát lên Hosting; đã kiểm tra browser từ URL Patient về Volunteer đúng, tiêu đề khi tải là EHIS. HTML remote khớp artifact cuối; manifest/icon đạt. Typecheck/lint mobile sau sửa header đạt; kiểm tra 140 link nội bộ/18 tài liệu đạt. Lần export app trong môi trường giới hạn gặp EPERM artifact; chạy lại có quyền đạt, không sửa source để né lỗi.
- Bàn giao web 0.4.2 và backend 0.4.2 cho nhóm nghiệm thu; không phát APK/OTA/IPA. Chưa thử Safari/iPhone thật, cài biểu tượng trên điện thoại hoặc push/GPS nền. Một timeout đã phục hồi vẫn được ghi nhận để theo dõi. Ảnh theo bước ở .local/web-042-proof, báo cáo ở VERIFICATION_V0_4_2.md; không đưa mật khẩu fixture vào repo public. Tài khoản bàn giao ổn định ở repo riêng tư cũ; fixture của probe không coi là tài khoản dùng chung mới.

## Đợt web 0.4.3 — Sẵn sàng, chuông/rung và cảnh báo hỗ trợ

- Yêu cầu mới: Volunteer cần thấy rõ tính khẩn cấp, bật/tắt sẵn sàng, chuông ngắn/rung nhẹ, nhận ca rồi xem hồ sơ/map/đường đi. Tiếp tục hoàn thiện web trước, chưa phát native.
- Tham khảo AlertModal và home của bản source cũ đang lưu local ở ehis-rebuild; chỉ đọc, không sao chép credential/quyền hoặc bộ đếm 30 giây tự decline sang hệ thống mới. Lời mời vẫn dùng hạn và trạng thái backend hiện tại.
- Giữ mốc phát cảnh báo là người báo bấm gửi và backend tạo lời mời, không phát chỉ vì mở QR. Hồ sơ tự khai/vị trí riêng chỉ sau backend xác nhận đúng TNV nhận ca và consent; trước nhận chỉ dùng projection quan sát/khoảng cách.
- Thêm công tắc sẵn sàng theo xác nhận server, khối trạng thái lớn, popup đỏ, chuông mới tối đa 6 giây và bổ sung mới 2 giây; chống lặp theo incident/revision trong phiên. Có thử chuông/mute/dừng và rung tùy hỗ trợ; chuẩn bị audio không chặn bật GPS. Chuyển nền/mất đồng bộ dừng tín hiệu; chưa có push nền.
- Nhận ca thành công ưu tiên chi tiết lên đầu, tính tuyến OSRM một lần sau thao tác nhận; thêm tải lại chi tiết và không hiển thị dữ liệu riêng cũ như hiện tại khi thiếu đồng bộ/revision. Thu gọn bản đồ vị trí bản thân để dễ thấy điều khiển chính.
- Đối chiếu ảnh lỗi đăng nhập trước: tài khoản đó nằm trong complete-demo.json (Emulator); thử cloud trả INVALID_LOGIN_CREDENTIALS. Tài khoản Volunteer CLOUD bàn giao đăng nhập đạt, approved=true, không có admin. Cải thiện thông báo sai credential để phân biệt môi trường; không đổi mật khẩu hoặc chép tài khoản local sang cloud.
- Đã thêm 6 kiểm tra tín hiệu: mới/cập nhật/dedupe/hết hạn/nhiều lời mời/lịch audio hữu hạn/dừng/audio chưa chạy. npm run check đạt 6 backend + 11 frontend/navigation checks. Lần lint đầu phát hiện setState đồng bộ trong effect; đã đổi sang state khởi tạo/selection suy ra, giữ nguyên luật lint. Đang kiểm tra cuối mobile và chuẩn bị build/deploy/browser; chưa coi đã nghe chuông hoặc rung trên máy thật.
- Đã phát web từ source 568b11f; CI run 39820869927 đạt. Browser quan sát thử chuông chạy, sẵn sàng xác nhận, popup mới khi backend mời đúng 1 TNV, bổ sung/replay cùng revision 1, nhận ca → hồ sơ giả đúng consent → tự mở tuyến 0,44 km/khoảng 2 phút → đến nơi → kết thúc. API từ chối private trước nhận và sau đóng; công tắc OFF được kiểm tra bằng đọc server (không ghi đè để làm đạt).
- Rà lại yêu cầu giữ tuyến khi có bổ sung: tách map đã được cấp quyền khỏi phần hồ sơ/phone đang chờ revision mới, tránh unmount/tính lại tuyến không cần thiết. Popup phân biệt thông tin tình trạng bổ sung với yêu cầu ban đầu. Đang build và kiểm tra vòng bổ sung sau nhận ca; chưa phát native hoặc coi loa/rung vật lý đã nghiệm thu.
