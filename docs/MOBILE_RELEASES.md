# Cập nhật đồng bộ web và app điện thoại

## Cách nhóm sử dụng

Từ bản Android **0.4.1**, EHIS được cấu hình EAS Update kênh `preview`. Cần cài APK hỗ trợ cập nhật một lần; APK 0.4.0 cũ không tự có tính năng này.

- **Sửa giao diện / JavaScript tương thích:** phát hành web và OTA từ cùng commit. App kiểm tra khi mở có Internet, tải nền và áp dụng khi mở lại; có thể cần mở lại hai lần. Không cần quét Expo Go hoặc bật laptop.
- **Đổi thư viện native, quyền, package hoặc cấu hình làm đổi fingerprint:** xuất APK mới. OTA không thay phần native. Cài đè đúng bộ ký/package thường giữ dữ liệu; chưa xác nhận điều này trên điện thoại của nhóm.
- App không tự gọi reload giữa một ca hỗ trợ. Khi đã tải cập nhật, có thông báo để người dùng hoàn tất thao tác rồi mở lại.
- Mất mạng vẫn có thể mở mã app đã lưu; đăng nhập, gửi/nhận ca và bản đồ cần Internet. Không coi OTA là thông báo cấp cứu nền.

## Trạng thái phiên bản

| Bản | Web | Android | OTA |
|---|---|---|---|
| 0.4.1 | Đang chuẩn bị phát hành đồng bộ | Cần APK mới cho onboarding + expo-updates | Cấu hình preview/fingerprint; chờ kết quả publish |
| 0.4.0 | Có các vòng cập nhật web sau build | [APK cũ](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/cf99a628-de58-4e55-b93c-f48f13178af7), chưa có onboarding mới | Chưa cấu hình trong bộ cài này |

Build/publish thành công không chứng minh đã áp dụng trên thiết bị. Báo cáo Play Protect chặn cài trước đây vẫn chưa được nghiệm thu; không tắt bảo vệ để vượt chặn.

## Quy trình dành cho người phát hành

Chuẩn bị Firebase/Vercel/Expo CLI đúng tài khoản nhóm và cloud client config. EAS project `ehiss-team/ehis-next`; channel/environment `preview`. Không dùng môi trường Emulator hoặc đưa secret backend vào EAS.

1. Hoàn thành mã, kiểm tra và commit để các artifact truy vết được cùng một snapshot.
2. Từ root, chọn một lệnh:

```powershell
# Chỉ thay đổi tương thích native runtime đang có
npm run release:preview -- --message "Mô tả thay đổi"

# Có thay đổi native hoặc cần bộ cài mới
npm run release:preview -- --message "Mô tả thay đổi" --native
```

Script kiểm tra source sạch, project/channel/env, chạy check, tính fingerprint. Chế độ OTA so fingerprint với APK preview FINISHED gần nhất và từ chối nếu khác. Chế độ native gửi build APK; sau đó build frontend, publish OTA Android và deploy hai site Hosting. OTA runtime phải trùng fingerprint. Kết quả từng bước lưu `.local/release-preview.latest.json`; thất bại thì ghi incomplete, không báo tất cả đã xong. APK gửi build phải chờ FINISHED và kiểm tra artifact riêng.

3. Xem kết quả EAS build/updates, health web và thử giao diện; tải APK/hash nếu có build mới. Ghi link bản phát hành và giới hạn vào lab note/bảng trên.
4. Trên thiết bị thử, kiểm tra đăng nhập, phiên bản, QR, TNV và hành vi sau mở lại. Chỉ sau bằng chứng thiết bị mới đánh dấu đã nhận OTA/cài APK.

Đây là lệnh phát hành có quyền của operator; CI GitHub vẫn chỉ kiểm tra, không tự lấy secret/deploy từ PR public. Không bật Blaze, nâng gói Expo/Vercel hoặc phát sinh phí tự động. EAS Free có hạn mức; nếu bị giới hạn, ghi blocker và chờ reset hoặc chọn cách build khác đã thống nhất.

## Khi cần khôi phục

Dùng EAS Update republish một update tương thích đã biết tốt; khôi phục Hosting theo phiên bản tương ứng. Không sửa runtime để ép OTA vào APK không tương thích. Đọc [hướng dẫn chính thức EAS Update](https://docs.expo.dev/eas-update/getting-started/) và [runtime versions](https://docs.expo.dev/eas-update/runtime-versions/).
