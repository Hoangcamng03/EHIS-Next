# Nghiệm thu EHIS theo luồng — Android trước, miễn phí

Quyết định chủ dự án 2026-10-24: ưu tiên Android và web; hoãn iOS native đến khi có tài trợ. Nhóm có từ hai Android, Wi-Fi và 4G/5G. Không mua Apple Developer, bật Blaze hoặc nâng gói khi chưa được yêu cầu. iPhone vẫn có thể dùng web hiện có.

## 1. Cách đọc kết quả

Mỗi dòng có mã, dữ liệu, thao tác, điều kiện đạt và bằng chứng. Trạng thái chỉ dùng: **Đạt / Không đạt / Chưa thử / Bị chặn**. Không ghi Đạt vì source có tính năng hoặc build thành công. Kết quả vòng tự động ở `.local/multi-acceptance.json`; bản công khai chỉ ghi số lượng/tổng kết đã làm sạch, không mật khẩu/token/hồ sơ thật. Tài khoản dùng chung cloud vẫn ở repo riêng tư dẫn từ LAB_NOTES.

Các lớp phải phân biệt: logic → Emulator/API/quyền → browser → cloud diễn tập → APK artifact → điện thoại → vận hành có người phụ trách. Bằng chứng ở lớp trước không thay lớp sau. Không có bài test hữu hạn nào chứng minh ứng dụng hết mọi lỗi.

## 2. Theo flow, không bỏ bước

| Bước | Tình huống bắt buộc | Điều kiện đạt | Lớp |
| --- | --- | --- | --- |
| F01 Tạo tài khoản | Patient/TNV, email trùng, mật khẩu yếu, URL sai đối tượng, đăng nhập lại | Đúng giao diện; không tự duyệt TNV; lỗi có hướng xử lý | API + UI |
| F02 Hồ sơ và thẻ | Không phone, consent bật/tắt, hai lần cấp thẻ, thu hồi/cấp mới | Đúng chủ; QR chỉ chứa mã; thẻ thu hồi không tạo ca | API + hai máy |
| F03 Quét QR | QR hợp lệ/hỏng/thiếu mã; nhiều người quét cùng thẻ | Chỉ bấm gửi mới tạo ca; tối đa một ca active/thẻ; không lộ mã ca phiên khác | API + UI |
| F04 Báo hỗ trợ | GPS chính xác/yếu/bị từ chối; offline/timeout; bấm nhiều lần | Không báo thành công giả; retry cùng mã không trùng; rõ chưa ai nhận | Logic + UI + máy |
| F05 Chọn TNV | Bốn vùng xa nhau; gần/ngoài 5km; offline/bận/chưa duyệt/vị trí cũ; >100 ứng viên | Đúng vùng/điều kiện; không âm thầm bỏ TNV do thứ tự ID; nói rõ vượt năng lực | Emulator |
| F06 Nhiều ca | 12 bệnh nhân ở 4 vùng báo gần đồng thời; một TNV được mời hai ca | Mỗi ca tối đa một người nhận; mỗi TNV tối đa một ca active; hồ sơ không trộn | Emulator + hai máy |
| F07 Nhận/hủy | Nhiều TNV nhận; nhận và hủy cùng lúc; hết hạn khi đang bấm | Một kết quả hợp lệ; pointer thẻ/TNV/projection nhất quán | Emulator |
| F08 Bổ sung | Có/không phone, ba câu unknown, retry và cập nhật đồng thời | Phone tùy chọn; tăng revision đúng; chỉ người phụ trách nhận sau accept | Emulator + UI |
| F09 Chỉ đường | Bật/tắt GPS, mạng yếu, đổi điểm B được xác nhận, thông tin bổ sung, ca active ngoài 30 thông báo | Giữ đúng ca/điểm, không kéo B theo reporter; tắt thao tác khi chưa đồng bộ | SDK + UI + máy |
| F10 Đến/kết thúc | Người khác bấm, retry, nhận/hủy/đổi điểm sau đóng | Đúng quyền; giải phóng thẻ/TNV; không đọc/sửa private sau đóng | API + UI |
| F11 Vòng tiếp theo | Cùng thẻ báo lần nữa; mở lại app/đổi mạng/đăng xuất | Khôi phục đúng ca đang active; không hồi sinh ca cũ hoặc tự bật sẵn sàng | API + UI + máy |
| F12 Quản trị/dữ liệu | Chưa admin, tự duyệt, PATCH/DELETE trực tiếp, thu hồi TNV | Bị chặn đúng; mất quyền thì dữ liệu riêng đóng; không đưa PHI/token vào log | Rules + API + UI |
| F13 Vận hành | Quota/throttle, nhiều ca hết hạn, cron lỗi, nhà cung cấp bản đồ lỗi | Không coi hạ tầng miễn phí là SLA; có người theo dõi và quy trình xử lý | Emulator + người vận hành |

## 3. Bộ tự động nhiều tài khoản

`npm run test:integration` chạy cả bộ cũ và mô phỏng mới. Tất cả host khóa loopback và project `demo-ehis-next`; không nhận cờ đổi sang cloud. Có tài khoản Auth thật trong Emulator, không chỉ đổi tên trên giao diện. Các con số tài khoản/ca/API và kết quả thực được ghi khi chạy xong; 1001 bản ghi dùng riêng để thử giới hạn, không phải 1001 người dùng thật hoặc bằng chứng tải production.

Mã mới: GEO-101, ZONE-12, RACE-6, TOP5, DATELINE, RETRY-8, BUSY, CANCEL, REVISION, ELIGIBILITY, PRIVACY, PURPOSE, NAT, CAPACITY; chi tiết nằm ở `scripts/smoke-multi-incident.cjs`. Vòng mở rộng đạt 14 nhóm, 215 tài khoản Auth giả và 181 lượt API. `smoke-active-alert.cjs` dùng Firebase client SDK thật: 35 thông báo mới → ca active cũ, ngắt/kết nối lại SDK, bản cập nhật và thu hồi quyền. Đo thời gian API trên Emulator chỉ giúp tìm hồi quy; không dùng p95 local để quảng cáo tốc độ cloud hoặc thời gian đến.

## 4. Buổi nghiệm thu hai Android — người thật, dữ liệu giả

Chuẩn bị: ghi model/Android/browser/APK/version, Wi-Fi/4G, quyền vị trí, âm lượng và pin. Dùng tên QA, dị ứng giả, không nhập bệnh án/số thật. Không lái xe khi thao tác máy. Chia bốn người: A Patient/người báo; B TNV1; C TNV2 trên máy thứ hai hoặc browser độc lập; D quan sát, ghi lỗi/thời gian. Các tab cùng origin dùng chung Auth, không xem là hai người độc lập.

1. A tạo Patient, lưu hồ sơ và phát hành QR. B/C đăng ký TNV; admin duyệt tài khoản thử. Đăng xuất/đăng nhập lại từng đối tượng.
2. Một máy Wi-Fi, máy còn lại 4G: B bật sẵn sàng/cho phép GPS/thử chuông. A quét QR và gửi; ghi lúc bấm, ack, popup, bấm nhận và ack nhận. Chỉ người nhận được mở hồ sơ/điểm.
3. B đi bộ an toàn ngoài trời với màn chỉ đường mở; A đứng cạnh điểm bệnh nhân giả. Ghi sai số, tuổi fix, pin A/B. A xác nhận điểm mới; B kiểm tra tuyến đổi đúng. Tắt GPS rồi từ chối quyền: có hướng xử lý, không giữ nhãn GPS trực tiếp giả.
4. Đổi Wi-Fi↔4G, bật chế độ máy bay giữa gửi/ack và nhận/ack, mở lại app. Đối chiếu server chỉ có một ca và một người nhận. Không thử bằng cách chỉ tắt Wi-Fi khi 4G vẫn còn rồi kết luận offline.
5. Hai TNV nhận cùng ca; hai Patient báo gần đồng thời; một TNV thử nhận hai ca; hai reporter quét một thẻ; không TNV; từ chối/thu hồi quyền. Đảo vai máy A/B và lặp lại.
6. Khóa màn hình/đưa app nền: ghi thực tế có nhận cảnh báo hay không. Bản foreground hiện tại **không được đánh dấu đạt tiếp nhận nền**. Đây là blocker nếu kế hoạch vận hành đòi TNV nhận ca khi khóa máy.
7. Đến/kết thúc, thử mở lại ca cũ và xem dữ liệu riêng, tạo ca kế tiếp, tắt sẵn sàng. Xác nhận trên server, không chỉ nhìn màu công tắc.

Mỗi tình huống ghi: ID, version, người thử, thiết bị/mạng, giờ, bước, mong đợi, thực tế, ảnh đã ẩn dữ liệu, Issue, kết quả sau sửa. Lỗi P0/P1 dừng nhánh thử bị ảnh hưởng. Sau sửa chạy lại tình huống lỗi và phần liên quan; một thành viên khác chạy vòng độc lập. Không ghi Đạt trước khi nhóm thực hiện.

## 5. Cổng đưa vào sử dụng

- **Diễn tập phần mềm:** flow trọng yếu không còn P0/P1 đã biết, kiểm tra tự động/UI đạt, hai Android nghiệm thu, quy trình quay lui và người hỗ trợ rõ.
- **Tiếp nhận ca thật:** cần thêm đầu mối chuyên môn/đơn vị phụ trách, TNV được xác minh/huấn luyện, khả năng tiếp nhận và dự phòng khi mất mạng/khóa máy/không ai nhận, rà dữ liệu/đồng ý/xóa và bảo mật, giám sát hạn mức/sự cố, nghiệm thu thực địa. Nhóm hiện chưa có bằng chứng đạt các điều kiện này.
- Không xóa chữ diễn tập hoặc đổi nhãn thành chính thức chỉ để vượt cổng. Vấn đề ngoài code được giữ thành blocker và có chủ trì trong [kế hoạch sản phẩm](PRODUCT_LAUNCH_PLAN.md).

Kết quả từng đợt và quyết định phát hành xem [LAB_NOTES.md](LAB_NOTES.md) và [STATUS.md](STATUS.md).

## 6. Phiếu điền khi thử hai Android

Sao chép phần này vào bản ghi riêng của buổi thử. Ghi ngày/người thử; máy A/B (model, Android, phiên bản APK/code, browser nếu dùng web), mạng ban đầu, quyền GPS, âm lượng và cỡ chữ. Không ghi mật khẩu hoặc dữ liệu người bệnh thật. Máy tính có thể giữ vai Patient/người báo để hai điện thoại dành cho hai TNV; đảo vai ở vòng sau.

| Mã | Bài trên máy thật | Kết quả hiện tại | Bằng chứng / Issue |
| --- | --- | --- | --- |
| A01 | Đăng ký/đăng nhập lại Patient và TNV, TNV chờ duyệt | Chưa thử | — |
| A02 | QR → gửi/ack → báo thêm không phone → chuông/rung → nhận/map → đến/kết thúc | Chưa thử | — |
| A03 | Hai TNV bấm nhận một ca cùng lúc | Chưa thử | — |
| A04 | Hai Patient khác nhau báo gần đồng thời, ở hai vị trí khác nhau | Chưa thử | — |
| A05 | Hai người báo quét một thẻ, bấm lặp khi chờ ack | Chưa thử | — |
| A06 | Mất mạng lúc gửi và lúc nhận, nối lại/đổi Wi-Fi↔4G | Chưa thử | — |
| A07 | GPS từ chối, độ chính xác kém hoặc điểm quá cũ | Chưa thử | — |
| A08 | Đi bộ theo GPS foreground, reporter xác nhận đổi điểm; mất dịch vụ bản đồ | Chưa thử | — |
| A09 | Mở lại app/đổi tài khoản khi có ca; kiểm tra đúng người/ca | Chưa thử | — |
| A10 | Đưa nền/khóa màn hình rồi có yêu cầu mới | Chưa thử; chưa hỗ trợ tiếp nhận nền được xác minh | — |
| A11 | Không TNV gần; TNV tắt/bận/chưa duyệt; thu hồi quyền trong ca | Chưa thử | — |
| A12 | Đóng ca → dữ liệu riêng bị khóa → cùng thẻ thử ca kế tiếp | Chưa thử | — |
| A13 | Màn nhỏ/cỡ chữ lớn: nút, popup, bàn phím, kéo trang và lỗi có đọc được không | Chưa thử | — |

Cho mỗi vòng A02/A04/A06, cùng một người dùng đồng hồ bấm giờ hoặc video hai máy để ghi các khoảng: bấm gửi→ack; ack→cảnh báo; bấm nhận→ack; xác nhận đổi điểm→map đổi. Không trừ hai đồng hồ điện thoại chưa đồng bộ. Ghi số mẫu, lần chậm nhất, lỗi và điều kiện mạng; chưa có SLA được phê duyệt, không lấy một lượt nhanh làm nghiệm thu hiệu năng. Nếu máy không cài được APK do Play Protect, ghi Bị chặn và dùng web để thử UI; bài APK/phần cứng vẫn Chưa thử, không tắt bảo vệ để điền Đạt.
