# EHIS Next

Bản khởi đầu **viết mới** cho nhóm Capstone 4 người: một app mobile, một website và backend Firebase riêng. Không sao chép source, dữ liệu hoặc định danh của nhóm trước.

## Tài nguyên của nhóm

- GitHub public: https://github.com/Hoangcamng03/EHIS-Next
- Firebase: https://console.firebase.google.com/project/ehis-next-20261021-hc03/overview
- Firebase project ID: `ehis-next-20261021-hc03`
- Android package / iOS bundle ID: `com.hoangcamng.ehisnext`
- Project Emulator: `demo-ehis-next` — dữ liệu local không tự xuất hiện trên cloud.
- `.env.example` dùng demo local; `.env.cloud.example` là mẫu riêng cho cloud. Không trộn project ID của hai môi trường.

## Hiện có gì?

- Mobile Expo SDK 58 + TypeScript + Expo Router: trang chính và khung Patient/Volunteer; nút thử health endpoint thật.
- Web Next.js: trang chính, khung `/c/[cardId]` và `/admin`. Các trang ghi rõ chức năng chưa triển khai, không gửi báo sự cố thật.
- Functions: `health`, `getMyAccess`, `savePatientProfile` có xác thực, allow-list dữ liệu và validation.
- Firestore Rules mặc định đóng; bệnh nhân chỉ đọc hồ sơ chính mình. Không client nào tự gán role/verified.
- Profile validation tests, cấu hình Emulator, EAS build profiles và kiểm tra CI.

**Chưa hoàn thành:** Auth UI, QR/NFC, tạo/nhận ca, bản đồ, push, duyệt TNV, audit đầy đủ, APK và kiểm thử thiết bị. Functions chưa triển khai cloud; việc tạo Firebase project không đồng nghĩa đã tạo Firestore database hoặc bật Auth providers.

## Cài thư viện (mỗi máy)

Cần Git, Node.js tương thích các package hiện tại; Java 21 cho Emulator. Dùng npm và giữ các lockfile. Chạy từ root repo:

```powershell
npm --prefix mobile ci
npm --prefix web ci
npm --prefix functions ci
```

## Chạy từng phần

Website:

```powershell
npm run web
```

Mở địa chỉ localhost được in trong terminal. Đây là website local, chưa phải website public.

Backend local (terminal riêng):

```powershell
npm run emulators
```

Emulator UI: http://127.0.0.1:4100. Auth: 9199, Firestore: 8180, Functions: 5101. Các port khác bản Rebuild để giảm nhầm lẫn. Nếu đang có Emulator project khác, dừng nó trước.

Mobile: copy `mobile/.env.example` thành `mobile/.env.local`, chỉnh `EXPO_PUBLIC_HEALTH_URL` theo mạng của máy rồi chạy:

```powershell
npm run mobile
```

Lệnh trên nhắm development build. Nếu chỉ thử khung giao diện với Expo Go tương thích SDK, dùng `npm --prefix mobile run go`. Expo Go khác SDK không phải lỗi nghiệp vụ.

Trên điện thoại thật, `127.0.0.1` là điện thoại, không phải laptop. Thay host của health URL bằng IP LAN laptop, kết nối cùng mạng và chỉ mở firewall cho mạng riêng khi cần. Local HTTP chỉ phục vụ phát triển; APK demo độc lập dùng HTTPS cloud.

Health URL local:
`http://127.0.0.1:5101/demo-ehis-next/asia-southeast1/health`

Health thành công chỉ chứng minh endpoint hoạt động; không chứng minh Auth, Firestore hoặc luồng ca đã chạy.

## Kiểm tra trước PR

```powershell
npm run check
npm --prefix web run build
npm run test:integration
```

## Build APK sau khi có EAS project của nhóm

Tại `mobile/`, đăng nhập và liên kết EAS project mới của nhóm, không dùng owner/project ID cũ:

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

`preview` xuất APK có code đóng gói; `development` dùng để lập trình; `production` xuất AAB Android. Chưa có EAS project hoặc signing trong lần khởi tạo repo này. Nếu dùng biến môi trường, cấu hình cả môi trường EAS preview, không chỉ `.env.local` trên máy.

Backend/web phải chạy cloud thì APK mới dùng toàn luồng khi laptop tắt. Firebase Functions cần Blaze để deploy; không bật thanh toán tự động. iOS cần cấu hình signing riêng; không cài APK trên iPhone.

## Làm việc nhóm

- Repo public cho phép xem/clone, không tự cấp quyền push. Chủ repo mời từng GitHub username làm collaborator.
- Một nhánh cho một việc nhỏ; PR vào `main`; có người khác review trước khi merge.
- Xem [phân công](docs/TEAM.md), [kiến trúc](docs/ARCHITECTURE.md), [API contract](docs/API_CONTRACT.md), [kịch bản kiểm tra](docs/TEST_SCENARIOS.md).
- Không đưa credentials quản trị, token, keystore, file `.env` hoặc dữ liệu y tế thật lên repo.
- Dependency từ các template chính thức vẫn có thể có advisory; xem `docs/STATUS.md` trước khi phát hành. Không chạy `npm audit fix --force` vì có thể đổi major SDK hoặc downgrade framework.
