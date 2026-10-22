# Bản đồ repository và cách vận hành EHIS

## 1. Nhánh Git khác thư mục code như thế nào?

- **Repository `EHIS-Next`**: toàn bộ dự án của nhóm, viết mới độc lập với source nhóm cũ.
- **Nhánh**: một phiên bản của toàn bộ repository. Khi checkout nhánh khác, Git có thể đổi đồng thời app, web, backend, cấu hình và tài liệu.
- **Thư mục**: ranh giới module trong một phiên bản, ví dụ `mobile/`, `web/`, `functions/`.
- **Pull request (PR)**: tập thay đổi được đề nghị đưa từ nhánh phát triển vào nhánh tích hợp; review không đồng nghĩa đã merge hoặc đã deploy.

Kiểm tra ngày 2026-10-22: `main` ở commit nền `5108318`; nhánh `feat/bystander-two-step-report` chứa các vòng phát triển sau đó, gồm cả app, web, backend và cloud v0.4, đang nằm trong [PR #1](https://github.com/Hoangcamng03/EHIS-Next/pull/1). Tên nhánh mô tả đầu việc ban đầu, không giới hạn loại file bên trong.

Sau khi PR được review và merge, `main` sẽ có cả cấu trúc/tài liệu này. Nhánh công việc mới đặt theo mục tiêu nhỏ như `feat/patient-profile`, `fix/volunteer-location`, `docs/onboarding`; vẫn chứa cả repo nhưng PR chỉ nên sửa phạm vi cần thiết. [Quy trình nhóm](../CONTRIBUTING.md).

## 2. Những gì phải build và triển khai

| Thành phần | Số lượng / giao diện | Source | Đầu ra | Chạy ở đâu |
|---|---|---|---|---|
| Mobile | Một app; Patient + Volunteer | `mobile/` | Preview APK; production AAB theo cấu hình; iOS cần signing riêng | Android; iOS chưa phát hành |
| App web | Hai khu vực giống app, dùng cùng source | `mobile/` | Expo web static | Firebase Hosting site có hậu tố `-app` |
| Website | Người báo qua QR + quản trị | `web/` | Next.js static export | Firebase Hosting site chính |
| Backend | Một API nghiệp vụ dùng chung | `functions/` | TypeScript → `lib/`; Express/Vercel entry | Vercel Hobby cloud; Firebase Emulator local |
| Dữ liệu | Một Firebase project cloud riêng | File cấu hình ở root | Auth provider, Rules và indexes | Firebase Auth + Firestore Standard Singapore |

Không cần build APK riêng cho Patient và Volunteer. Người qua đường mở website không cần cài app. Người quản trị vào `/admin`, không có một app quản trị native riêng. Firebase console là công cụ quản lý hạ tầng, không phải giao diện quản trị nghiệp vụ của thành viên thông thường.

## 3. Tìm và sửa đúng file

| Mục tiêu | Màn hình / giao diện | Backend / dữ liệu | Người phối hợp |
|---|---|---|---|
| Chọn mục đích / đăng ký / đăng nhập / chuyển khu vực | `mobile/src/components/PurposeChoices.tsx`, `mobile/src/lib/account-purpose.ts`, `mobile/src/components/Session.tsx`, `mobile/src/app/index.tsx` | Firebase Auth, `getMyAccess`; lựa chọn không tự cấp quyền | TV3 + TV1 |
| Hồ sơ và QR Patient | `mobile/src/app/patient.tsx` | `savePatientProfile` trong `functions/src/index.ts`; card APIs trong `lifecycle.ts` | TV3 + TV1 + TV4 nếu đổi URL |
| TNV ứng tuyển / được duyệt | `VolunteerApplication.tsx`; `web/src/components/AdminDashboard.tsx` | `applyVolunteer`, `reviewVolunteerApplication` trong `lifecycle.ts` | TV2 + TV4 + TV1 |
| TNV sẵn sàng / vị trí | `mobile/src/components/VolunteerAvailability.tsx` | `setVolunteerAvailability` trong `reports.ts`; `volunteers` | TV2 + TV1 |
| Quét QR, gửi trước | `web/src/components/RequestHelp.tsx` | `createIncident` trong `index.ts` | TV4 + TV1 |
| Bổ sung không cần phone | `web/src/components/BystanderReport.tsx` | `submitBystanderReport` trong `reports.ts`; validation riêng | TV4 + TV2 + TV1 |
| Nhận, đến nơi, hoàn tất | `mobile/src/app/volunteer.tsx` | `reports.ts`, `lifecycle.ts`; transaction và projections | TV2 + TV1 |
| Bản đồ / tuyến | `IncidentNavigation.tsx`, `RouteMap.tsx`, `RouteMap.web.tsx`, `src/lib/directions.ts` trong mobile | OSRM / OSM; không cấp quyền riêng bằng bản đồ | TV2 |
| Quyền đọc trực tiếp | Client listeners trong app/web | `firestore.rules` | TV1 + người sửa listener |
| Giới hạn / hết hạn / dọn riêng | Thông báo UI khi bị từ chối | `functions/src/guards.ts`, `maintenance.ts`, `server.cjs` | TV1 |
| Nút, chữ, bố cục | Mobile: `ActionButton`, `AppText`, `ui.ts`; web: `globals.css` | Không thay payload nếu chỉ đổi hiển thị | TV2/TV3/TV4 |

Đường dẫn đầy đủ: [Mobile README](../mobile/README.md), [Web README](../web/README.md), [Backend README](../functions/README.md). API và dữ liệu chi tiết: [API_CONTRACT.md](API_CONTRACT.md), [ARCHITECTURE.md](ARCHITECTURE.md).

## 4. Cấu hình và dữ liệu

| File / thư mục | Ý nghĩa | Người thay đổi |
|---|---|---|
| `firebase.json` | Emulator ports, Hosting sites/artifact paths, Auth config; còn cấu hình source Functions để dùng local | TV1, phối hợp TV4/TV3 khi đổi build web |
| `.firebaserc`, `firebase.apps.json` | Định danh project/app Firebase | TV1; kiểm tra project trước mọi deploy |
| `firestore.rules`, `firestore.indexes.json` | Quyền truy cập trực tiếp và index | TV1 |
| `mobile/app.json`, `mobile/eas.json` | Package ID, quyền native, EAS project và profile APK/AAB | TV3 |
| `web/next.config.ts` | Dev/production local và cloud static export | TV4 |
| `functions/vercel.json` | Backend build, routing, vùng và cron Vercel | TV1 |
| `.env.example`, `.env.cloud.example` trong module | Mẫu biến môi trường; không phải cấu hình thực đã nạp | Người sở hữu module |
| `.env.local`, `.env.cloud.local` | Giá trị trên từng máy; Git bỏ qua | Không commit; phân biệt local/cloud |
| `.local/` | Credentials, tài khoản thử, snapshot, ảnh và artifact riêng trên máy triển khai | Không có khi clone mới; không push |
| `node_modules/`, `.next/`, `.next-cloud/`, `lib/`, app export | Dependency / output sinh tự động | Không sửa như source; không commit |

Firestore là nơi lưu dữ liệu cloud; repo Git lưu code/cấu hình chứ không chứa database đang chạy. Firebase Auth lưu tài khoản; hồ sơ, QR pointer, TNV, ca và projections lưu ở Firestore. Mật khẩu không lưu trong profile Firestore. Backend Admin SDK kiểm tra quyền riêng, vì Rules không bảo vệ thao tác Admin SDK.

## 5. Chuỗi vận hành từ đầu tới cuối

1. Patient đăng nhập app, lưu hồ sơ qua API và cấp thẻ. QR chỉ chứa URL thẻ, không nhúng hồ sơ y tế.
2. TNV gửi đơn; admin đăng nhập web và duyệt. TNV bật sẵn sàng, gửi vị trí và giữ màn hình mở trong bản thử.
3. Người qua đường quét QR → web tạo phiên ẩn danh → xác nhận đang cạnh bệnh nhân → gửi yêu cầu/vị trí.
4. Backend xác thực, kiểm tra thẻ, chọn TNV phù hợp và ghi ca/lời mời. Khi ack thành công, web sang bảng hỏi.
5. Người báo trả lời ba câu, có thể bỏ phone. Backend cập nhật cùng ca; listener của TNV nhận revision mới.
6. TNV nhận bằng transaction; đúng người phụ trách mới gọi được chi tiết riêng. Consent Patient quyết định phần hồ sơ chia sẻ.
7. TNV xem tuyến trong EHIS, xác nhận đến nơi rồi kết thúc. Patient/người báo có projection trạng thái riêng.
8. Đóng ca chấm dứt quyền xem chi tiết riêng. Cron hằng ngày dọn dữ liệu đủ hạn theo giới hạn đã ghi trong [CLOUD_TRIAL.md](CLOUD_TRIAL.md).

## 6. Local, cloud và bản đã cài là ba việc khác nhau

| Môi trường | Dữ liệu / backend | Mục đích |
|---|---|---|
| Local | `demo-ehis-next`, Emulator Auth 9199 / Firestore 8180 / Functions 5101 | Sửa code, test bằng dữ liệu giả; cần máy phát triển |
| Cloud | `ehis-next-20261021-hc03`, Firebase Spark + Vercel Hobby | Dữ liệu tập trung, HTTPS, thử nhiều thiết bị |
| APK đã build | Code đóng gói của một snapshot và môi trường EAS preview | Mở độc lập laptop; ghi/đọc/gửi ca vẫn cần Internet |

Push code lên GitHub không tự làm APK đã cài đổi phiên bản. Sửa mobile cần build/phân phối bản phù hợp; sửa web/backend cần deploy đúng phần sau kiểm tra. CI kiểm tra code, không tự deploy cloud trong workflow hiện tại. [Scripts và lệnh](../scripts/README.md).

## 7. Nhịp làm việc của nhóm

Mỗi task ghi: mục tiêu người dùng → module/file → API/dữ liệu liên quan → cách thử → bằng chứng. TV1 giữ contract/quyền; TV2 Volunteer/Maps; TV3 Auth/Patient/build; TV4 web/admin. Nếu cùng sửa file, trao đổi phạm vi hàm/component trước; dùng Git/PR để hợp nhất. [TEAM.md](TEAM.md), [CONTRIBUTING.md](../CONTRIBUTING.md).
