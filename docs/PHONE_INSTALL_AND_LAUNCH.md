**Cập nhật 0.4.6:** bỏ nút 115 theo phạm vi TNV; có GPS foreground và người báo xác nhận đổi điểm. Xem [luồng mới và cách cài iPhone](LIVE_GPS_0_4_6.md). Phần 0.4.5 bên dưới giữ làm lịch sử; không áp dụng lại nút 115. APK 0.4.5 đã FINISHED và xác minh artifact, chưa nghiệm thu thiết bị; chưa có GPS 0.4.6.

# EHIS 0.4.5 — Cài điện thoại và các mốc phát hành

Ngày 2026-10-23: chủ dự án chưa có Apple Developer/Google Play Console, muốn link cài đơn giản. Tiếp tục diễn tập miễn phí, hoàn thiện demo rồi build điện thoại. Người dùng mục tiêu TNV là sinh viên y; chưa có đơn vị phụ trách y tế. Không xem đây là quyết định mở tiếp nhận ca thật.

## Link cho người thử

Trang cố định: https://ehis-next-20261021-hc03.web.app/install

- Android: trang hiển thị APK khi có build FINISHED đã xác minh artifact. Chạy độc lập, không cần Expo Go/laptop; vẫn cần Internet cho dữ liệu. Không yêu cầu tắt Play Protect.
- iPhone/iPad: Safari → mở app → Chia sẻ → Thêm vào Màn hình chính. Đây là web trên màn hình chính, không phải IPA, không bảo đảm cảnh báo nền.
- iOS native về sau: tài khoản Apple Developer, ký app → upload App Store Connect → TestFlight → link mời. Không có tệp APK dùng cho iPhone. TestFlight khác App Store chính thức.
- Google Play Console cần khi đưa AAB lên Google Play; không cần chỉ để nhóm cài APK trực tiếp. Nhóm chưa cần mở tài khoản cửa hàng cho đợt diễn tập hiện tại.

## Đợt mã 0.4.5

- Web: đường gọi 115 luôn có trên trang QR/bổ sung và liên kết không hợp lệ; không phụ thuộc Auth/GPS/backend. Không gọi trong diễn tập. Nguồn số cấp cứu: https://capcuu115hanoi.com/lien-he/ và https://xaydungchinhsach.chinhphu.vn/tong-dai-so-112-tiep-nhan-24-7-cac-thong-tin-ve-su-co-thien-tai-tham-hoa-119250902150528929.htm
- Trạng thái phân biệt backend nhận với TNV nhận; nhắc khi chờ, hết hạn, không có TNV. Không tuyên bố có điều phối dự phòng tự động. Browser báo offline thì khóa gửi/hủy, nối lại listener khi online. `navigator.onLine` không chứng minh backend truy cập được; chỉ xác nhận sau API/snapshot server.
- Native: expo-audio/haptics, âm gốc WAV đi kèm, tối đa 6s yêu cầu/2s bổ sung/1s thử; dừng khi chuyển nền, mute hoặc unmount. Kiểm tra logic hủy async; cần nghiệm thu loa/rung thật, mức âm lượng và thiết bị. Không phải thông báo đẩy nền.
- Không xin microphone/ghi âm/audio background. Dedupe quyền vị trí; fingerprint iOS và Android; APK mới versionCode 3. Native module mới cần binary mới, không dùng OTA để thay APK 0.4.1.
- Hook build chặn Emulator và chặn production trỏ tài nguyên trial. Chưa tạo backend/database production hoặc bật billing.

## Kỹ thuật build thử

Sau source sạch, `npm run check` và CI đạt, người được chủ dự án giao phát hành chạy `node scripts/build-trial-android.cjs start`; xem tiến độ bằng `node scripts/build-trial-android.cjs status`. Script chỉ build preview APK; không phát OTA hoặc submit store. Kết quả local `.local/android-trial-build.json`, ghi lab note riêng cho start/FINISHED/artifact/device.

Trang tải lấy link từ `web/src/config/releases.json`. Chỉ điền APK version/link khi build FINISHED và tải kiểm tra được artifact. TestFlight/Store để null đến khi có link thật. Build mới chưa được coi đã cài trên máy. Bộ guard không thay thế duyệt bảo mật, pháp lý hoặc y khoa.

## Checklist nghiệm thu thiết bị (chưa hoàn tất)

1. Android cài APK và mở khi laptop tắt; iPhone mở từ biểu tượng web. Đăng nhập mở đúng đối tượng; QR mở web bên ngoài.
2. TNV đã duyệt bật sẵn sàng, cho phép GPS khi cần, thử chuông rồi nhận ca giả từ thiết bị khác.
3. Thử âm lượng thấp, silent mode, bật/tắt rung, tắt âm, chuyển nền/khóa máy và quay lại. Ghi rõ chuông foreground; không kỳ vọng ca đến khi đóng app.
4. Từ chối GPS/mất mạng: không hiện thành công giả, đường liên hệ trợ giúp còn thấy khi trang đã tải. Trang chưa tải lần nào khi offline không hoạt động; chưa có offline service worker.
5. Bổ sung không phone, nhận đồng thời, bản đồ, đến nơi/kết thúc, private đóng; không gọi 115 trong buổi thử.

## Cổng trước tiếp nhận thật / cửa hàng

Chưa đạt: đơn vị phụ trách y tế, TNV được xác minh và SOP, đầu mối dự phòng trực, thông báo nền có xác nhận/đo trên máy thật, điều phối/tác vụ hết hạn phù hợp, audit truy cập hồ sơ đầy đủ, UAT/load/rollback, rà dữ liệu và trách nhiệm, môi trường production tách tài khoản thử, cách yêu cầu xóa tài khoản trong app/web theo chính sách store, liên hệ hỗ trợ công khai và rà advisory dependency. Không xóa cảnh báo thử nghiệm để tạo cảm giác đã đạt.

Google Play yêu cầu khai báo ứng dụng sức khỏe và đường xóa tài khoản cho ứng dụng có tạo tài khoản. Chưa submit trước khi thực hiện và rà phù hợp:
- https://support.google.com/googleplay/android-developer/answer/14738291?hl=en
- https://support.google.com/googleplay/android-developer/answer/13327111?hl=en
- https://developer.apple.com/testflight/
- https://docs.expo.dev/build/setup/

## Kết quả của đợt này

Source app `7728b327957b91c01bc0f17248190363bfd94711`. Check: 27 bài unit/logic PASS, 5 bộ integration PASS sau khi khởi động Emulator mới; Android và iOS JS/Hermes export PASS (không phải IPA). Introspection xác nhận iOS không microphone/audio background, Android không microphone, có vị trí/rung. [CI 39982552257](https://github.com/Hoangcamng03/EHIS-Next/actions/runs/39982552257) SUCCESS. Hai website đã deploy, 32 đối chiếu HTML/JS/CSS cloud/local khớp; browser mở trang /install và QR lỗi vẫn hiện đường liên hệ. Không bấm gọi 115, không thử gửi GPS thật.

APK build [a989bd07](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/a989bd07-e2a7-49f5-a6ad-197bd6997fa7) đã được EAS nhận, trạng thái quan sát gần nhất IN_QUEUE. Trang /install có link tiến độ; link APK trực tiếp chỉ điền khi kiểm tra FINISHED và artifact. Chưa xác nhận cài thiết bị. Không phát OTA, không submit store, không đổi backend/Rules/billing.

Web/link tiến độ source `79779715be90307ea0a49c2fd6f06778a1a8573c` đã deploy, [CI 39984732046](https://github.com/Hoangcamng03/EHIS-Next/actions/runs/39984732046) SUCCESS và 32 đối chiếu artifact đạt lần cuối. Một lần deploy lỗi kết nối đã được kiểm tra lại health 200 rồi deploy thành công. Đường dẫn EAS được kiểm tra trên browser; trạng thái queue không phải xác nhận đã có tệp APK. Công cụ verify-trial-apk đã chuẩn bị/kiểm tra cú pháp nhưng chưa chạy với artifact mới vì build chưa hoàn tất.

Ảnh kiểm tra: [trang cài](assets/trial-045/install.jpg), [QR lỗi vẫn có trợ giúp](assets/trial-045/invalid-qr-help.jpg).

Audit mobile báo 9 high từ node-forge/grpc và chuỗi phụ thuộc. `npm update node-forge @grpc/grpc-js` không có bản vá tương thích được áp dụng; không hạ Expo/Firebase về major cũ theo gợi ý audit. Giữ là blocker bảo mật cho phát hành chính thức; đánh giá khả năng ảnh hưởng runtime/tooling với maintainer trước khi đóng.
