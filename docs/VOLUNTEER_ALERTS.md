# Cảnh báo yêu cầu hỗ trợ cho Volunteer — web 0.4.3

## Luồng để nhóm hiểu và chạy thử

1. Volunteer đăng nhập bằng tài khoản **cloud đã được duyệt**. Tài khoản Emulator không dùng trên web cloud; mật khẩu thử ở repo riêng tư được dẫn trong [lab note](LAB_NOTES.md).
2. Bật công tắc **Sẵn sàng nhận yêu cầu hỗ trợ**, cho phép vị trí và đợi máy chủ xác nhận. UI hiển thị ĐANG SẴN SÀNG/CHƯA SẴN SÀNG/ĐANG PHỤ TRÁCH CA; không báo sẵn sàng chỉ vì vừa bấm nút.
3. Bấm **Bật và thử chuông · 1 giây**; người thử tự kiểm tra loa/âm lượng. Chọn rung nhẹ nếu trình duyệt hỗ trợ. Bật sẵn sàng cũng chuẩn bị audio trong thao tác người dùng, nhưng lỗi audio không chặn việc lấy GPS/gửi trạng thái.
4. Patient cấp QR. Người qua đường quét QR để mở web, xác nhận đang cạnh bệnh nhân và **bấm gửi yêu cầu**. Quét đơn thuần không tạo ca, không reo chuông.
5. Khi backend xác nhận ca và gửi lời mời hợp lệ cho TNV, web Volunteer ở phía trước hiện hộp cảnh báo đỏ, tình trạng quan sát, khoảng cách đường thẳng và hạn lời mời. Chuông mới tối đa **6 giây**, rung hai nhịp ngắn nếu thiết bị cho phép.
6. Người báo gửi bảng hỏi bổ sung: cùng ca cập nhật; mỗi revision mới phát chuông **2 giây** khi Volunteer đang theo dõi ca hoặc sẵn sàng. Snapshot lặp/metadata/kết nối lại cùng revision không reo lại trong cùng phiên.
7. Volunteer bấm **Nhận ca và mở đường đi**. Chỉ khi backend xác nhận nhận thành công mới mở chi tiết ở đầu trang. Hiện hồ sơ tự khai nếu Patient đồng ý chia sẻ; điện thoại người báo nếu có; bản đồ A→B và tuyến OSRM tự tính một lần sau thao tác nhận. Không tự báo đã nhận nếu có TNV khác nhận trước.
8. Xác nhận đã đến/kết thúc ca theo nút hiện có. Kết thúc làm đóng quyền xem riêng; muốn nhận ca mới cần bật sẵn sàng lại.

## Những chi tiết cần biết khi nghiệm thu

- Trước khi nhận: chỉ tình trạng quan sát và khoảng cách trong projection được cấp quyền. Không gửi bệnh án/vị trí chính xác/phone tới toàn bộ TNV. QR chỉ chứa mã thẻ, không chứa bệnh án.
- Hạn lời mời lấy từ backend, hiển thị đếm ngược gần đúng theo đồng hồ thiết bị. Không lấy bộ đếm 30 giây riêng để tự từ chối/đóng ca như một số mẫu UI cũ.
- **Đã xem · đóng cảnh báo và dừng chuông** chỉ đóng popup, không nhận/từ chối/hủy ca; lời mời còn hạn vẫn ở danh sách. Lời mời hết hạn hoặc người khác nhận sẽ đóng popup. Không dùng nháy màn hình liên tục.
- **Tắt âm chuông** giữ cảnh báo hình ảnh; rung có lựa chọn riêng. **Dừng chuông hiện tại** không tắt chuông của lần yêu cầu sau. Rời trang, mất đồng bộ, tắt sẵn sàng hoặc hết ca sẽ dừng tín hiệu đang chạy khi không còn ca hoạt động.
- Phần vị trí của TNV được thu gọn sau nút **Xem vị trí tôi đã gửi**; bản đồ ca đang phụ trách được ưu tiên phía trên. Chi tiết ca có nút tải lại khi lỗi; khi chưa có bản đúng revision, không hiện hồ sơ/phone cũ như bản hiện tại. Bảng hỏi bổ sung không đổi tọa độ ca, nên giữ bản đồ/tuyến đã xác nhận trong khi tải phần bổ sung để không mất tuyến; mất đồng bộ hoặc đóng ca thì gỡ phần riêng.
- Tuyến đường trong EHIS dùng OSM/OSRM, không tính kẹt xe hoặc tự dẫn đường liên tục khi di chuyển. OSRM nhận hai tọa độ khi nhận ca và mở tuyến. Có nút tính lại và phương án mở Google Maps nếu dịch vụ lỗi. Xem [NAVIGATION.md](NAVIGATION.md).

## Giới hạn web và kế hoạch native

Chuông web cần tương tác người dùng để mở audio. Trình duyệt có thể treo trang/âm thanh khi chuyển tab, khóa màn hình hoặc tắt app; chức năng hiện tại chỉ nghiệm thu ở **trang đang mở phía trước**, không phải push nền. Khi quay lại trang, lời mời mới còn hạn được xử lý theo dữ liệu server; không hứa đánh thức điện thoại.

Vibration API không hoạt động trên mọi trình duyệt/thiết bị; có API cũng không chứng minh motor rung thực tế. iPhone/Safari không được hứa rung từ web. Thông báo UI không thay cho người kiểm tra loa/rung trên điện thoại.

Đợt này chưa phát APK/OTA/IPA. Module native dùng giao diện dự phòng, không tự nhận đã có audio/haptics native. Sau khi chủ dự án duyệt web, cần triển khai audio/haptics và push theo nền tảng, ký/build và thử foreground/background trên Android/iOS thật trước khi mô tả là tính năng đã hoạt động.

Tài liệu nền tảng: [Web Audio và thao tác người dùng](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate).

## Mã nằm ở đâu?

| Phần | File |
|---|---|
| Công tắc sẵn sàng/GPS | `mobile/src/components/VolunteerAvailability.tsx` |
| Hộp cảnh báo, nhận ca và thứ tự hiển thị | `mobile/src/app/volunteer.tsx` |
| Chính sách mới/cập nhật/chống reo lặp | `mobile/src/lib/alert-policy.ts` |
| Audio hữu hạn, dừng và âm lượng | `mobile/src/lib/emergency-audio.ts` |
| Browser audio/rung/visibility | `mobile/src/lib/use-emergency-signal.web.ts` |
| Dự phòng native chưa phát hành | `mobile/src/lib/use-emergency-signal.ts` |
| Tính tuyến sau nhận ca | `mobile/src/components/IncidentNavigation.tsx` |
| Kiểm thử hồi quy tín hiệu | `scripts/test-emergency-alerts.cjs` |

## Bộ bài thử

Kiểm tra: bật/tắt chỉ đổi sau xác nhận; từ chối GPS không báo sẵn sàng giả; quét QR chưa gửi không tạo cảnh báo; gửi mới hiện popup; cùng revision không reo lại; bổ sung mới phát 2 giây; dừng/mute hoạt động; lời mời hết hạn/người khác nhận đóng popup; nhận thành công mở map/profile đúng consent; mạng lỗi không lộ dữ liệu cũ như hiện tại. Thử thêm trình duyệt không hỗ trợ audio/rung và chuyển nền trên thiết bị thật.

Kết quả từng vòng được ghi riêng trong [LAB_NOTES.md](LAB_NOTES.md). Unit test kiểm tra lịch phát và dedupe, không chứng minh loa/rung vật lý. Chỉ dùng tình huống và hồ sơ giả trong đợt thử có kiểm soát.
