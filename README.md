# EHIS Next

Bản khởi đầu **viết mới** cho nhóm Capstone 4 người: một app mobile, một website và backend Firebase riêng. Không sao chép source, dữ liệu hoặc định danh của nhóm trước.

## Tài nguyên của nhóm

- GitHub public: https://github.com/Hoangcamng03/EHIS-Next
- Firebase: https://console.firebase.google.com/project/ehis-next-20261021-hc03/overview
- Firebase project ID: `ehis-next-20261021-hc03`
- Android package / iOS bundle ID: `com.hoangcamng.ehisnext`
- Project Emulator: `demo-ehis-next` — dữ liệu local không tự xuất hiện trên cloud.
- `.env.example` dùng demo local; `.env.cloud.example` là mẫu riêng cho cloud. Không trộn project ID của hai môi trường.

## Bản thử v0.3 có gì?

- Đăng ký/đăng nhập chung; chọn Patient hoặc TNV trong một app, không tự cấp quyền khi chọn vai trò.
- Patient lưu hồ sơ tối thiểu, phát hành QR, chọn quyền chia sẻ, thu hồi/cấp lại, xem trạng thái và lịch sử; hủy ca nhầm trước khi được nhận.
- TNV gửi đơn, quản trị duyệt trên web, bật sẵn sàng, nhận ban đầu/bổ sung, nhận ca, xem thông tin được phép, bản đồ/tuyến trong EHIS, xác nhận đến nơi và kết thúc.
- Người qua đường mở QR bằng website; backend ack trước bảng hỏi, phone tùy chọn; không công khai hồ sơ sức khỏe.
- Rules chặn mọi client write; các giao dịch và quyền riêng tư được kiểm tra ở backend. Các bộ kiểm thử starter, reports, lifecycle và navigation.
- Emulator lưu/khôi phục snapshot. PC local tách phiên theo tab, nên thử Patient và TNV đồng thời được.

**Bắt đầu tại [luồng hoàn chỉnh và cách chạy](docs/COMPLETE_FLOW.md).** Bộ tài khoản giả gồm quản trị tạo bằng `npm run trial:prepare`, lưu trong `.local/complete-demo.json`. Snapshot trước khi tắt cưỡng bức bằng `npm run trial:snapshot`.

Đây là bản chạy thử có kiểm soát trên PC, chưa phải bản đã phát hành. Chưa có APK/IPA/signing hoặc cloud Functions/Hosting được deploy, push/GPS nền, dẫn đường liên tục, NFC trên thiết bị, App Check/throttle hoặc retention production. Không đưa dữ liệu thật vào bản này. [Trạng thái](docs/STATUS.md), [bản đồ](docs/NAVIGATION.md), [review bảo mật](docs/SECURITY_REVIEW.json).

## Cài thư viện (mỗi máy)

Cần Git, Node.js tương thích các package hiện tại; Java 21 cho Emulator. Dùng npm và giữ các lockfile. Chạy từ root repo:

```powershell
npm --prefix mobile ci
npm --prefix web ci
npm --prefix functions ci
npm run setup:local
npm run doctor:local
```

## Chạy từng phần

Website: copy `web/.env.example` thành `web/.env.local`, rồi chạy:

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

Để thử luồng TNV trên máy tính trước khi có APK: `npm run mobile:web`, mở http://localhost:8082/volunteer. Web người báo chạy http://localhost:3100. Tạo dữ liệu bằng `npm run trial:seed`, mở `.local/report-demo.json` để lấy tài khoản/URL local; xem TRIAL_CHECKLIST để thao tác đúng thứ tự. Chưa cần Expo Go hoặc USB cho cách thử này.

Trên điện thoại thật, `127.0.0.1` là điện thoại, không phải laptop. Thay `EXPO_PUBLIC_EMULATOR_HOST` và host của health URL bằng IP LAN laptop; Emulator cũng cần bind LAN phù hợp. Kết nối cùng mạng và chỉ mở firewall cho mạng riêng khi cần. Local HTTP chỉ phục vụ phát triển; APK demo độc lập dùng HTTPS cloud. GPS web trên điện thoại cần HTTPS; không coi một URL HTTP LAN là đủ để thử QR/GPS.

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
