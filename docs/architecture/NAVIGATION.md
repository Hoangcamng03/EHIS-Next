**Nghiệm thu hiện tại:** [0.4.7: nhiều ca/vùng, ca active không mất sau 30 thông báo](../testing/verification/VERIFICATION_V0_4_7.md) · [GPS/mạng trên hai Android](../testing/ACCEPTANCE_FLOW.md).

Từ 0.4.6: xem [GPS foreground và đổi điểm đã xác nhận](LIVE_GPS_0_4_6.md). Mô tả GPS bấm một lần bên dưới là lịch sử trước 0.4.6.

# Bản đồ và chỉ đường

Từ web 0.4.3, thao tác **Nhận ca và mở đường đi** được backend xác nhận rồi mới mở chi tiết và tính tuyến một lần; xem [cảnh báo Volunteer](VOLUNTEER_ALERTS.md). Khi khôi phục ca đang nhận từ phiên khác vẫn có nút xem đường để người dùng chủ động. Bảng hỏi bổ sung không đổi tọa độ ca và không làm mất tuyến đang xem. Bệnh án/phone chỉ hiển thị khi có bản dữ liệu được cấp quyền phù hợp; đóng ca hoặc mất đồng bộ thì gỡ phần riêng.

TNV đã nhận ca mới được lấy điểm bệnh nhân qua API hiện có. Màn hình hiển thị A (TNV đã lưu khi bật sẵn sàng, có thể cũ) và B (điểm báo hỗ trợ). Bấm lấy GPS chỉ cập nhật điểm xuất phát cho tuyến trên thiết bị, không tự thay đổi trạng thái điều phối. Bấm xem đường gửi hai tọa độ đến OSRM demo server, nhận GeoJSON, quãng đường ô tô, thời gian không có giao thông trực tiếp và các chặng rẽ. Không vẽ đoạn nối thẳng thay cho tuyến khi dịch vụ lỗi.

Web: Leaflet từ dependency npm, giữ referrer hợp lệ cho OSM tiles, dùng cache trình duyệt. Android/iOS: WebView HTML chỉ nhúng tọa độ số đã kiểm tra, Leaflet CDN cố định 1.9.4 + SRI; User-Agent định danh EHIS, chặn điều hướng bên trong khung, chỉ dùng HTTPS. WebView cần build mới cho development binary cũ. Không cần tạo thư mục android/ios hoặc khóa Google Maps để thử phương án này. Android JS export không xác nhận WebView trên điện thoại hoạt động.

Hai thao tác Google khác nhau:

- Xem tuyến này: truyền origin/destination chính xác từ bài thử. Google có thể geocode thành địa điểm gần đó; xác nhận pin, lối vào, liên hệ người báo nếu cần.
- Dẫn đường: chỉ truyền destination và `dir_action=navigate`, không truyền origin giả/đã cũ. Google xác định vị trí/chọn xuất phát theo khả năng và quyền của thiết bị. Trên điện thoại Google Maps có thể mở ứng dụng; chưa thử thực địa chỉ dẫn giọng nói, theo dõi hoặc rerouting. Không đặt một số phút cố định là thời gian đến chắc chắn.

OSRM public demo và OSM public tiles chỉ phục vụ prototype có kiểm soát ở đây, không có SLA cấp cứu. Trước chạy người thật, cần nhà cung cấp/quyền sử dụng phù hợp, chính sách dữ liệu vị trí, consent, key hạn chế theo app/domain, ngân sách và kiểm thử thiết bị. Chưa bật billing, chưa mua dịch vụ. Không dùng public demo cho dữ liệu sức khỏe/vị trí nhạy cảm thực. Không gửi phone, tên bệnh nhân, UID hoặc mã ca tới dịch vụ bản đồ. Không có tải bản đồ offline, mô phỏng giao thông hoặc chức năng ưu tiên giao thông cho xe cấp cứu.

Lỗi đã xử lý: phân biệt đường thẳng 312m với tuyến OSRM 0,78km; nền tiles bị chặn khi web iframe thiếu referrer, chuyển Leaflet sang DOM web trực tiếp; mở Google Maps bằng link web chuẩn; không unmount tuyến khi có revision mới; timeout 15s, abort khi đổi điểm/mất kết nối/unmount và nút thử lại; chặn tọa độ và dữ liệu routing lỗi. Bản đồ/Google link chỉ nằm trong ca được phân công còn active; hoàn tất ca thì gỡ khỏi UI.

Kiểm tra: `npm run check` gồm 5 navigation tests (tọa độ/URL, thứ tự lon-lat OSRM, geometry/step, lỗi dữ liệu và hủy request). Emulator integration kiểm tra phân quyền và toàn bộ mạch hai bước. PC thử đăng nhập, ready, ca mới, bổ sung không phone/có phone, accept, route, Google, giữ route khi bổ sung, complete, dùng lại thẻ và cancel. Bản v0.3 bổ sung đăng ký Patient, hồ sơ, QR, thu hồi/cấp lại, ứng tuyển và admin duyệt TNV, arrived và lịch sử. Ảnh bằng chứng nằm ở thư mục local, không chứa credentials quản trị hoặc hồ sơ thật. Kiểm thử PC chưa thay thế nghiệm thu trên Android/iOS thật.

Tài liệu chính thức: [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started), [OSRM API](https://project-osrm.org/docs/v5.24.0/api/), [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/), [Expo WebView SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/webview/).
