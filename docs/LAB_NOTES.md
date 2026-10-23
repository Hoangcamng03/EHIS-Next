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

## 2026-10-23 — Web 0.4.4: kiểm tra hệ thống và màu theo đối tượng

- Yêu cầu: test toàn luồng, sửa lỗi, phân biệt giao diện bằng màu và nhấn mạnh yêu cầu khẩn; chủ dự án thử web trước, chưa phát điện thoại.
- Thay đổi: Patient xanh dương, TNV xanh lá, người báo cam, quản trị tím; yêu cầu cần hỗ trợ dùng đỏ kèm chữ, không nhấp nháy. Bảng màu có kiểm tra tương phản, không suy diễn mức độ bệnh hay cấp quyền bằng màu.
- Sửa lỗi: khóa form khi chưa tải được hồ sơ + tải lại; lời mời thiếu/quá hạn không hiện thao tác nhận; kết quả cấp quyền âm thanh muộn không ghi đè thao tác tắt chuông.
- Kiểm tra: typecheck/lint/build backend PASS, 20 unit PASS; 5 bộ Emulator PASS, gồm quyền riêng, nhận ca đồng thời, consent, lifecycle, maintenance và HTTP. Lần đầu lint phát hiện cập nhật state trực tiếp trong effect; đã chuyển reset sang thao tác tải lại và chạy lại đạt. Một patch không khớp dòng nguồn, đã đọc lại rồi áp dụng; không bỏ qua kiểm tra. Rà diff phát hiện thay nhầm version dependency trong lockfile, đã phục hồi trước build, không nâng dependency.
- Hoàn tất: build và deploy hai website; source `5ac3a9b`, [CI 39827135983](https://github.com/Hoangcamng03/EHIS-Next/actions/runs/39827135983) SUCCESS. Đã thêm công cụ chỉ đọc `scripts/verify-cloud-artifacts.cjs`, chạy đạt 31 đối chiếu HTML/JS/CSS cloud/local. Không phát APK/OTA/iOS, backend vẫn 0.4.2.
- Thử cloud/browser case giả `b00b72529e…`: 1 lời mời, cảnh báo đỏ, chặn private trước nhận; bổ sung không phone và replay cùng bản 1; nhận bằng UI mở hồ sơ consent và tuyến 0.44 km; đến nơi/kết thúc bằng UI, private API 403, map đóng. TNV đã trả về không sẵn sàng; admin thử đăng nhập/tải danh sách rồi đăng xuất. Không sửa dữ liệu/phiên Patient người dùng.
- Rà màu trên 4 khu vực, lưu 7 ảnh minh chứng tại `docs/assets/trial-044/`; không chứa password/token/QR thật. Cập nhật đầu mối README, STATUS, danh mục tài liệu và hướng dẫn nghiệm thu.
- Còn thiếu: loa/rung/GPS vật lý và manual trên iPhone/Android; hai nhánh lỗi tải hồ sơ/cấp quyền âm thanh chưa được tiêm lỗi UI riêng. Giữ giới hạn chuông foreground. Build vẫn có cảnh báo icon Leaflet mặc định; marker A/B và tuyến thật đã hiển thị. Không coi kết quả này là đủ vận hành cấp cứu thật.
- Chi tiết/màu/ma trận/nghiệm thu: [VERIFICATION_V0_4_4.md](VERIFICATION_V0_4_4.md). Không ghi secrets hoặc hồ sơ thật.

## 2026-10-22 — Chuẩn bị bản chạy trực tuyến (lịch sử)

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
- Vòng cuối b161a09 đã build/deploy, HTML/entry JS hash khớp artifact; CI 39823458878 đạt. Thử ca giả thứ hai: nhận trước, xem tuyến 0,44 km, rồi bổ sung revision 1; tuyến vẫn giữ trên màn hình không bấm tính lại. Đã đóng ca và xác nhận API chặn private. Thử mute/bật lại hoạt động; để tài khoản Volunteer bàn giao không sẵn sàng khi kết thúc.
- Bổ sung hướng dẫn file/module, trạng thái 0.4.3 và ảnh minh họa public đã kiểm tra chỉ có dữ liệu/tọa độ giả; toàn bộ ảnh local ở .local/volunteer-alarm-proof. AGENTS ghi rõ phải triển khai/kiểm tra audio/haptics native trước khi phát hành như tính năng điện thoại; hiện chỉ web foreground, chưa APK/OTA/IPA hay loa/rung vật lý. Không bật billing, không cấp thêm role/admin và không thay backend/Rules.
- Kiểm tra bàn giao tài liệu đạt: 160 đường dẫn nội bộ trong 20 tài liệu, ảnh public đúng ca/tọa độ giả, git diff --check không lỗi. Source app cuối b161a09; các commit bàn giao sau đó chỉ bổ sung tài liệu/ảnh, không cần build lại runtime.

## 2026-10-23 — Đánh giá sản phẩm và kế hoạch vận hành
- Thêm PRODUCT_LAUNCH_PLAN.md: rủi ro P0, MVP giữ/hoãn, flow đề xuất, roadmap UAT, phân công 4 người, GTM và cổng pháp lý/y tế.
- Đối chiếu STATUS/ARCHITECTURE và nguồn WHO/Chính phủ. Chưa coi test web là chứng nhận vận hành thật. Ngưỡng hiệu năng là mục tiêu đề xuất, chưa đo.
- Chờ xác nhận địa điểm pilot, đầu mối y tế và ngân sách. Phiên này chỉ thay tài liệu local; chưa đổi runtime/deploy hoặc tuyên bố đã sửa các hạng mục backlog.
- Chủ dự án xác nhận chỉ diễn tập miễn phí; TNV mục tiêu tương lai là sinh viên y, hiện chưa có đầu mối chuyên môn. Đã cập nhật phạm vi này vào kế hoạch; chưa mở ca thật.

## 2026-10-23 — Chuẩn bị 0.4.5 để cài điện thoại

- Chủ dự án muốn Android qua link APK, iPhone qua cách cài dễ hiểu, chưa có Apple Developer/Google Play Console; xác nhận hoàn thiện demo rồi build điện thoại. Đợt này tiếp tục diễn tập miễn phí, chưa mở cấp cứu thật; TestFlight/Store chưa có tài khoản và link.
- Thay đổi: trang /install cố định, manifest link chưa có để null; đường gọi 115 trên trang báo/QR lỗi, tách rõ server nhận với con người nhận, xử lý thiết bị offline và nối lại trạng thái. Không gọi số khẩn cấp khi thử; không thêm hướng dẫn y khoa chưa được duyệt.
- Native: thêm expo-audio 58.0.10/haptics 58.0.7, WAV tự tạo, logic chuông hữu hạn/dừng/mute/chuyển nền, bỏ fallback trống; vô hiệu microphone/recording/background audio, dedupe location permission; fingerprint iOS và APK code 3. Referrer-Policy app chuyển no-referrer.
- Thêm kiểm tra race âm thanh và trạng thái chờ/hết hạn; build guard không cho production dùng trial; công cụ chỉ build APK thử, không tự OTA/store. Kế hoạch/nội dung cũ từ phiên trước được giữ và đưa vào cùng đợt bàn giao.
- Thử chưa đạt ban đầu: patch native có hai thao tác cùng file bị từ chối, đã áp dụng lại bằng update; lint/build bắt lỗi thiếu ngoặc JSX, đã sửa. Một check sandbox đứng lâu ở lint; chạy lại ngoài vùng hạn chế để lấy kết quả rõ ràng. Chưa bỏ qua check hoặc coi build lỗi là thành công.
- Audit mobile báo 9 high; npm update hai dependency gián tiếp không vá được. Chưa dùng force/downgrade major. Rà nguồn cảnh báo/khả năng ảnh hưởng còn mở, là blocker phát chính thức. Chi tiết và tiêu chí native/clinical ở PHONE_INSTALL_AND_LAUNCH.md.
- Kiểm tra/build/deploy/APK đang thực hiện; chưa coi loa/rung/GPS thật hoặc iOS native đã đạt. Kết quả sẽ bổ sung sau mỗi mốc xác nhận.
- Đã đạt 27 unit/logic, 5 bộ integration. Lần dùng lại Emulator không sẵn sàng sau 90 giây; khởi động mới qua test:integration rồi 5 bộ PASS và dịch vụ tự dừng. Android/iOS JS export PASS, có WAV trong gói; introspection iOS/Android không xin microphone/audio background, có quyền vị trí/rung Android. Chưa phải IPA hoặc kiểm thử thiết bị.
- Source app `7728b32`, CI 39982552257 SUCCESS. Hai website đã deploy bằng Hosting, 32 tệp HTML/JS/CSS cloud/local khớp; browser kiểm tra /install và QR thiếu mã vẫn có nút liên hệ (không bấm gọi 115). Lưu ảnh public chỉ giao diện không có dữ liệu bệnh nhân.
- EAS đã nhận APK build `a989bd07-e2a7-49f5-a6ad-197bd6997fa7`, code 3, source sạch nêu trên; đang IN_QUEUE. Thêm link tiến độ thật trên /install để nhóm có thể xem Succeeded/Install khi EAS xử lý xong. Chưa gắn APK giả hoặc APK cũ dưới nhãn bản mới. Công cụ kiểm tra artifact xác minh source/version, manifest/quyền, bundle cloud, WAV và hash trước bàn giao.
- Bàn giao web/link tiến độ source `7977971`, CI 39984732046 SUCCESS. Lần deploy link tiến độ đầu bị fetch failed; kiểm tra riêng backend HTTP 200/status ok/đúng project rồi thử lại deploy thành công. Đối chiếu lại 32 tệp PASS, browser xác nhận link EAS đúng build và lưu ảnh trang cài mới. 183 link nội bộ trong 23 tài liệu được kiểm tra không lỗi.
- Trạng thái EAS lần bàn giao vẫn IN_QUEUE sau các lần kiểm tra giãn cách; chưa có APK FINISHED để chạy verify-trial-apk hoặc cài thiết bị. Link /install và trang EAS đã cung cấp, không coi queue là lỗi code hoặc tự nâng gói trả phí. Cần theo dõi build → artifact → nghiệm thu máy thật; chưa submit cửa hàng/IPA, chưa mở vận hành cấp cứu thật.

## 2026-10-23 — 0.4.6: đổi phạm vi hỗ trợ và GPS foreground

- Chủ dự án xác nhận: bỏ đường gọi 115, tập trung TNV; chỉ theo GPS khi mở màn chỉ đường; cho người báo chủ động xác nhận điểm bệnh nhân mới. Giữ diễn tập miễn phí; không xem yêu cầu bỏ nút gọi là xác nhận đủ điều kiện tiếp nhận ca thật.
- Bỏ component/nút 115 trên QR, báo và lỗi đường dẫn. Thêm theo dõi GPS foreground, sai số/tuổi điểm, chặn fix cũ/yếu, giới hạn tính lại tuyến; map web/native giữ instance để tránh nhảy khi tọa độ đổi. Không tự kéo điểm bệnh nhân theo điện thoại người báo.
- Thêm API updateIncidentLocation có xác thực chủ phiên, chỉ accepted/arrived, chống lặp và revision vị trí riêng. Điểm chính xác giữ ở private, đúng TNV phụ trách mới đọc API; không thêm Rules/role/billing. Bổ sung web lấy GPS → xác nhận → ack; đang kiểm tra tương thích với câu hỏi/phone và ca đóng.
- Làm rõ iOS: web home screen miễn phí; Personal Team trên Mac/Xcode hết hạn provisioning 7 ngày; TestFlight cho nhóm cần Apple Developer Program. Thêm LIVE_GPS_0_4_6.md và cập nhật API/privacy.
- Lỗi trong vòng kiểm tra: export routeUpdateScript đặt nhầm trong template HTML gây lỗi cú pháp; đã tách ra đúng module. Ref WebView làm generic mặc định undefined thành props never; dùng generic unknown đúng kiểu, không bỏ typecheck. Check đã đạt 6 backend + 24 logic; integration/build/deploy đang chạy, chưa kết luận nghiệm thu điện thoại.
- APK 0.4.5 a989bd07 đã FINISHED; tải xác minh 103730873 byte, package/version/code/cloud/WAV/quyền đạt, SHA-256 b310d3d3e15631d814d6db526d1643acc499516589f6179d3c1d5b627f81a2e5. Không microphone, có rung. Đây chưa phải 0.4.6, chưa kiểm chứng cài/loa/rung/GPS trên thiết bị; không tự OTA.
- Integration lần đầu: năm bộ cũ đạt; bộ mới sai kỳ vọng HTTP 412 trong khi Firebase callable trả 400 + FAILED_PRECONDITION. Đã sửa assertion kiểm tra mã lỗi chuẩn, giữ nguyên chặn vòng đời backend, đang chạy lại. Bổ sung kiểm tra chất lượng GPS ngay lúc báo đầu tiên để không chỉ chặn điểm yếu ở bước đổi điểm.
- Kiểm tra vòng cuối: 31 unit/logic (6 backend + 25 khác) PASS; sáu bộ integration PASS với Emulator tự dừng; web/app cloud build và Android/iOS JS export PASS. Đối chiếu 189 link trong 26 tài liệu đạt; git diff --check sạch lỗi khoảng trắng. Chưa deploy 0.4.6, chưa native artifact 0.4.6 hoặc GPS thật; các mốc tiếp theo sẽ bổ sung riêng.
- 2026-10-24 (tiếp phiên): runtime 5bfd4af, CI 39992904086 SUCCESS. Backend Vercel READY/health 0.4.6; hai Hosting deploy đạt và 32 tệp cloud/local khớp. Ca giả browser/cloud: nhận → 0,44km → xác nhận đổi B → 0,72km/nhãn điểm mới; wrong reporter bị chặn và retry ack không lặp; bổ sung không phone/replay revision 2 giữ điểm; UI đến/kết thúc, private và cập nhật điểm mới bị chặn. Đã đặt fixture TNV OFF và đọc server xác nhận, không đụng hồ sơ/người dùng thật. Ảnh chỉ tọa độ giả ở docs/assets/trial-046. Công tắc GPS thật chưa bật; không claim loa/rung/GPS/native hardware đạt.
- APK 0.4.6/code 4 đã được EAS nhận: 5e60b1c0-b010-4c16-90f0-2396d0fa5159, source sạch ee73f6a694181e0b178c55fce6f281ceb9cdc87b. Trạng thái lúc nhận NEW, chưa có artifact được xác minh; giữ bằng chứng 0.4.5 riêng. Cập nhật /install dẫn đúng build 0.4.6; chưa OTA/store/IPA, chưa tự cài lên điện thoại.
- Bàn giao: /install đã deploy link tiến độ 0.4.6 đúng 5e60b1c0, browser xác nhận link và hướng dẫn iPhone. Lần kiểm tra artifact web cuối vẫn 32/32 PASS; 192 link trong 26 tài liệu không lỗi. CI cho ee73f6a: 39994078694 SUCCESS. EAS lần kiểm tra gần nhất IN_QUEUE; chưa có APK 0.4.6 FINISHED để tải xác minh. Giữ bước artifact/thiết bị và các blocker bảo mật/chuyên môn đã ghi ở PHONE_INSTALL_AND_LAUNCH.md còn mở, không tự OTA/submit/mua gói hoặc kích hoạt ca thật.
