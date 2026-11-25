# EHIS — rà soát sản phẩm và hướng phát triển

Cập nhật 25/11/2026. Dựa trên source, kiểm thử local và CI đã đọc; không chấm phần trăm hoàn thiện hoặc suy diễn nghiệm thu y tế. [Bản đang dùng](../STATUS.md) · [Bằng chứng vòng này](../testing/verification/PRODUCT_QUALITY_2026_11_24.json) · [Nhật ký](../LAB_NOTES.md).

## 1. Nhận xét từ trong ra ngoài

EHIS đã có nghiệp vụ liên thông, phân quyền server, xử lý tranh nhận ca và kiểm thử nhiều tầng. Điểm cần phát triển nhất là cách xử lý trạng thái bất thường, quản lý phát hành và vận hành có người chịu trách nhiệm. Nhóm nên tiếp tục trên kiến trúc hiện tại để giữ các kiểm tra quyền/tranh ca đã có.

| Lớp | Nên giữ | Cần phát triển |
| --- | --- | --- |
| Giao diện | Màu theo vai trò, nút tối thiểu 48, điều hướng đáy | Mỗi màn có một việc chính; giải thích dài nằm trong mục mở. Phân biệt đang gửi, đã ghi nhận, đã nhận ca, đã đến; không chỉ dùng màu. |
| Tiếp cận | Chữ cho phép phóng to, nhãn/loading/error | Đã sửa cấu trúc tab, selected, liên kết nội dung, focus và bàn phím; thêm kiểm màn 320×640. Vẫn cần TalkBack/font lớn trên máy thật. |
| Bệnh nhân | Hồ sơ tự khai, tên/quan hệ/số liên hệ, chia sẻ/lịch sử tách riêng | Giữ thông tin tối thiểu; thử thông tin dài/chưa lưu/thu hồi QR khi có ca. Không trình bày hồ sơ tự khai thành chẩn đoán. |
| Người báo | Không cài app; gửi trước, bổ sung sau; báo từ xa | Đã sửa kiểm tra lại ngay khi mất phản hồi, khóa điểm đang chờ, khôi phục sau reload, hủy lấy GPS. Lỗi mạng không được biến thành yêu cầu mới. |
| Tình nguyện viên | Admin duyệt kỹ năng; một ca/người; bàn giao có xác nhận | Ưu tiên điểm đến, tình trạng mới, hành động đến nơi. GPS nền, chuông và tự thoát cần đo trên nhiều Android. |
| Quản trị | Checklist danh tính/đơn vị/đào tạo/phạm vi; vùng và bàn giao | Đã tách lỗi kiểm tra quyền khỏi không có quyền, thêm thử lại. Cần người trực và quy trình khi không ai nhận. |
| Backend | Kiểm quyền handler, transaction, idempotency, giới hạn tìm kiếm | Giữ giới hạn an toàn. Health/phiên bản không chứng minh toàn luồng Auth/Firestore/push; bổ sung hợp đồng API cho phát hành. |
| Dữ liệu/bảo mật | Không cho client ghi; private qua API; lịch sử có đồng ý/thời hạn | Chưa cách ly nhiều tổ chức: admin hiện quản lý một project. App Check/chống lạm dụng cần nghiệm thu cloud; không suy từ test local. |
| GPS/bản đồ | Nguồn điểm và xác nhận đổi điểm rõ; giới hạn tuổi/sai số cảm biến | OSRM/OSM/ETA chỉ tham khảo, không có traffic/SLA. Cần đi bộ ngoài trời/so mốc, cổng/tầng/tòa nhà, mất quyền và sai vị trí. |
| Thông báo | Tách feed, tải bản mới và FCM acceptance; có outbox | Chưa cam kết mọi máy reo trong Home/khóa/tiết kiệm pin/DND; cần phiếu thiết bị và đầu mối khi gửi thất bại. |
| Code | frontend/app, frontend/web, backend rõ; kiểm shared contracts | Patient/Volunteer còn lớn/nhiều state. Tách dần theo phần màn/hook sau khi có hồi quy; không vừa đổi UX, schema, thư viện trong một đợt. |
| Kiểm thử | Unit, Rules, API, browser, tải và bằng chứng riêng | Đã mở rộng lỗi mạng/GPS/quyền/tab và flow chụp ảnh từ đăng ký. Cần người khác nghiệm thu; chưa chạy phải ghi chưa thử. |
| Phát hành | Project/môi trường/fingerprint/artifact/QR được kiểm | Đã chặn backend thiếu khả năng API dù trùng version; backend trước web/APK. Phân biệt source, CI, deploy, cài máy và vận hành. |
| Tài liệu | Có danh mục, lab note và tài khoản riêng | Rút STATUS về hiện hành; bỏ điểm nhấn phiên bản cũ ở README. Tài khoản/manual vẫn chỉ một README riêng. |

## 2. Phần đã phát triển trong vòng này

1. Khôi phục yêu cầu ngay khi chưa rõ kết quả: giữ ID/điểm/địa chỉ, khóa sửa, khôi phục sau tải lại. Kiểm dữ liệu session bị hỏng; không lưu số điện thoại trong nháp này. Từ chối một lần retry không chứng minh lần gửi trước chưa được lưu, nên không xóa yêu cầu chưa rõ kết quả.
2. Hủy chờ GPS: dừng watcher, chặn callback muộn, không gọi tạo ca. Sau khi đã gửi backend không có nút hủy GPS gây hiểu nhầm là đã hủy ca.
3. Lỗi kiểm tra quyền quản trị có nút thử lại; không gán nhầm thành không có quyền.
4. Tab có nhóm/nhãn, selected và liên kết nội dung; trái/phải, Home/End chuyển focus, Enter chọn. Có kiểm màn nhỏ.
5. Health khai báo apiRevision/capabilities; web/APK/OTA preflight kiểm trước phát hành. Probe chỉ đọc cloud đã chặn backend hiện tại thiếu contract mới: đúng mong đợi, không phải server sập.
6. `npm run capture:flow` chạy UI local từ đăng ký/duyệt đến QR/báo/nhận/cập nhật/kết thúc, nhiều ca, bật muộn và bàn giao; lưu ảnh theo thứ tự. Chỉ chốt đạt nếu đi hết; không tạo tài khoản Firebase cloud.
7. Bỏ chuỗi ngoài Text gây cảnh báo che điều hướng ở màn tài khoản Patient. Giữ xác nhận đã lưu bảng hỏi khi chưa có TNV nhận; vẫn tách khỏi xác nhận tải/nhận ca. Bộ ảnh cuối có 30 bước, nền OSM/tuyến OSRM thật; vị trí trình duyệt được cấu hình và không dùng làm nghiệm thu GPS.

Kết quả thực và các lần chưa đạt nằm trong JSON bằng chứng; danh sách tính năng không phải phiếu nghiệm thu.

## 3. Thứ tự làm tiếp — nhóm bốn người

| Ưu tiên | Đầu ra | Phụ trách đề xuất | Hoàn tất khi |
| --- | --- | --- | --- |
| Cao | Review, backend → web → cloud có đăng nhập | TV1 backend + TV4 web; người khác review | Đúng contract/project; báo→nhận→bàn giao→đóng đã thử trên cloud |
| Cao | Nghiệm thu Android, tự thoát còn mở | TV2 TNV + TV3 Patient/APK | Hai Android; Home/khóa/âm báo/GPS/đổi mạng độc lập; ghi thiết bị và kết quả thật |
| Cao | Đầu mối khi không ai nhận/không thể tiếp tục | Nhóm cùng tổ chức | Người chịu trách nhiệm, giờ trực, phạm vi và liên hệ được phép công khai |
| Cao | Bảo trì/quota | TV1 | Lịch thực chạy, lần thành công gần nhất và tồn đọng được kiểm. Hai workflow maintenance đọc được của baseline bị skipped; chưa tự bật lịch vòng này. |
| Cao | Pilot với một đơn vị | TV1 + tổ chức | Xác minh kỹ năng thật, phân quyền/dữ liệu/phạm vi thống nhất; diễn tập không cấp phép hành nghề |
| Trung bình | Tách màn/hook và style | TV2 + TV3 + TV4 | PR nhỏ, hồi quy giữ luồng; không tạo bản sao file để sửa |
| Trung bình | Theo dõi lỗi/phiên bản và quay lui | TV1 + TV2 | Log không có PHI/phone/GPS/token; có thời hạn lưu và diễn tập phát hiện/quay lui |
| Trung bình | Dependency | Người phát hành | Nâng tương thích và build/test lại; còn advisory thì ghi rõ, không audit fix force |
| Thấp | iOS native, nhiều tổ chức, traffic/voice, NFC | Sau nghiệm thu Android | Có nhu cầu, ngân sách, người vận hành và tiêu chí riêng |

## 4. Quy trình nhóm và AI

**Ghi vấn đề → tái hiện → tiêu chí đạt → sửa nhỏ → test hồi quy/luồng liên quan → người khác review → phát hành đúng môi trường → kiểm bản đã phát → lab note.**

- Mỗi Issue có phiên bản, bối cảnh, bước lỗi, mong đợi và bằng chứng; không đưa bí mật vào public.
- TV1 giữ API/Rules, TV2 TNV/map/notification, TV3 Patient/Auth/APK, TV4 reporter/admin/bằng chứng. Đổi contract phải thống nhất trước ghép.
- AI làm trong phạm vi/tiêu chí đã giao. Ba lượt sửa cùng lỗi không đạt thì đổi giả thuyết. Review độc lập và nghiệm thu thiết bị/chuyên môn thuộc con người; không hứa hết mọi lỗi.
- [Tài khoản, nhóm đã duyệt/chưa duyệt và bài manual](https://github.com/Hoangcamng03/EHIS-Next-Team-Access/blob/main/README.md) chỉ ở một nơi. Bộ ảnh kỹ thuật không tạo runbook tài khoản thứ hai.

## 5. Điều kiện bàn giao cho tổ chức

Pilot cần không còn lỗi nghiêm trọng trong phạm vi chốt, lượt nghiệm thu thiết bị độc lập, đầu mối trực, xử lý không có TNV/bàn giao thất bại/mất mạng, bảo trì, quyền dữ liệu và quay lui. Spark/Vercel miễn phí phục vụ phát triển/diễn tập có kiểm soát; chưa có số liệu để cam kết công suất hoặc thời gian phản hồi cấp cứu.

Tham chiếu: [W3C — Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/). Đây là rà soát nội bộ theo bằng chứng, không phải kiểm toán độc lập hoặc chứng nhận y tế.
