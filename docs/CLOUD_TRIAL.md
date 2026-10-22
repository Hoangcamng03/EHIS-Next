# Chạy thử trực tuyến — Spark + Vercel Hobby

## Quyết định của nhóm (2026-10-22)

- Firebase project riêng `ehis-next-20261021-hc03`; không chuyển dữ liệu từ dự án cũ.
- Firestore `(default)` **Standard**, **asia-southeast1 / Singapore**, đã tạo; free tier được xác nhận. Billing chưa liên kết.
- Email/password cho app, anonymous cho người quét thẻ; đã bật trên Firebase thật.
- Firebase Hosting phục vụ hai bản tĩnh: website người báo/quản trị và giao diện Patient/Volunteer xuất từ cùng mã React Native.
- Backend Node.js chạy trên **Vercel Hobby** để tránh Blaze. `functions/` giữ tên thư mục từ bản trước nhưng không có nghĩa phải deploy Firebase Functions.

## Dòng dữ liệu

App/web → endpoint callable HTTPS trên Vercel → xác thực Firebase ID token → kiểm tra quyền/input/trạng thái → Firestore thật → các listener có quyền đọc nhận cập nhật.

Không nới Rules để cho client tự phân công ca, ghi verified/admin hoặc đọc hồ sơ người khác. Backend dùng HTTP wrapper kiểm tra token; không gọi `.run()` để bỏ qua xác thực. Endpoint bảo trì dùng secret riêng, không public.

## Cấu hình và triển khai

1. Đăng nhập Firebase CLI bằng tài khoản chủ project. Chọn **Hobby cá nhân** trên Vercel, không nâng Pro hoặc liên kết Blaze.
2. Deploy backend từ **thư mục `functions/`**; Node 22; `npm run build`; cấu hình `vercel.json` ở cùng thư mục. Runtime cần `EHIS_SERVICE_ACCOUNT_JSON` và `CRON_SECRET` dài ít nhất 32 ký tự. Không đưa hai giá trị này vào app, web, repo hoặc chat.
3. Service account runtime chỉ được cấp `roles/datastore.user` trên project EHIS mới; không cấp Owner/Editor. Đây vẫn là khóa bí mật có quyền dữ liệu: lưu trong môi trường bảo mật Vercel và thu hồi khi không dùng.
4. Sau khi URL backend hoạt động, chạy tại repo root:

```powershell
npm run cloud:configure -- https://TEN-BACKEND.vercel.app/api
npm run cloud:build
npm run cloud:probe
npm run cloud:deploy-web
```

`cloud:configure` lấy cấu hình client từ đúng project và tạo `.env.cloud.local` được Git bỏ qua; không ghi đè cấu hình demo. `cloud:build` xuất web Next.js tĩnh và Expo web. `cloud:deploy-web` kiểm tra đúng project trong health và từ chối API không đăng nhập trước khi phát hành.

URL đã deploy và kiểm tra ngày 2026-10-22:

- Web: `https://ehis-next-20261021-hc03.web.app`
- App web: `https://ehis-next-20261021-hc03-app.web.app`

QR mới dùng `/card?id=...`; trang theo dõi dùng `/report?id=...`. Firebase Hosting/Next dev có chuyển tiếp URL cũ `/c/:cardId`, `/report/:incidentId`. Điều này giúp host tĩnh, không cần SSR hoặc máy chủ Next.js luôn chạy.

## Quản trị

Người quản trị đăng ký bằng tài khoản của mình trên app. Chủ project xác nhận UID và chạy `node scripts/cloud-access.cjs admin <UID>` từ môi trường operator tin cậy. Script dùng quyền Firebase CLI của người vận hành, không có API tự cấp admin. Đăng nhập lại để nhận claim mới. Không chuyển tài khoản demo Emulator lên cloud.

## Giới hạn miễn phí

- Lời mời có hạn 10 phút; backend kiểm tra trước khi nhận hoặc gửi bổ sung, không dựa vào giao diện. Hết hạn giải phóng thẻ khi tạo lại yêu cầu; bảo trì nền cũng xử lý ca hết hạn.
- Vercel Hobby dùng cron hằng ngày, không có lịch 2 phút. Thông tin riêng của ca được đặt hạn dọn sau 24 giờ; thực tế thường 24–48 giờ hoặc lâu hơn nếu tác vụ lỗi/hết hạn mức/backlog. Giới hạn xử lý mỗi lần: 50 ca hết hạn, 50 ca dọn dữ liệu, 200 bộ đếm cũ. Cần theo dõi trước khi tăng số ca.
- Giới hạn server theo phút: 120 thao tác/tài khoản, 30 lần tạo yêu cầu/tài khoản, 600 thao tác/IP đã băm. Không phải chống bot toàn diện; tài khoản ẩn danh mới có thể vượt giới hạn tài khoản. App Check chưa được bật nếu chưa cấu hình provider; không mô tả hệ thống đã chống lạm dụng hoàn toàn.
- Quota miễn phí có thể làm dịch vụ tạm ngừng khi hết hạn mức; không có cam kết cấp cứu hoặc đảm bảo luôn có người tiếp nhận.
- Không có push/GPS nền, dẫn đường liên tục hoặc NFC trên thiết bị. Giữ màn hình TNV mở trong bài thử. Web/app cloud vẫn cần Internet.

## Nghiệm thu trước khi mời nhóm thử

Chỉ đánh dấu sau kiểm tra thực: health đúng project; API không auth bị từ chối; Patient cloud lưu và mở lại hồ sơ; QR HTTPS mở trên thiết bị khác; quản trị duyệt TNV; gửi ban đầu rồi bổ sung không phone; nhận ca → tuyến đường → đến nơi → hoàn tất; hết quyền đọc riêng sau đóng ca; ca hết hạn không nhận được; không có TNV thông báo đúng. Chạy lint/typecheck, integration và build trước mỗi bản. Kết quả thực và phần còn chờ được ghi ở LAB_NOTES.md.

APK là bước riêng: cần tài khoản Expo/EAS của nhóm, môi trường preview trỏ backend cloud và signing. App web chạy trên điện thoại chưa đồng nghĩa APK/IPA đã được kiểm thử.

APK preview đã FINISHED và kiểm tra artifact. Xem [cài/thử Android](ANDROID_TRIAL.md) để tải và thao tác; chưa có bằng chứng chạy trên Android thật.
