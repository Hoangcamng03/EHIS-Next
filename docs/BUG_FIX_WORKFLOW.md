# Quy trình sửa lỗi và cải tiến EHIS

Áp dụng cho người và AI, từ ngày 2026-10-22. Đây là quy trình nhóm được đề xuất và ghi thành hướng dẫn; chưa có bot tự theo dõi, tự sửa hoặc tự deploy chạy nền. Không phải chứng nhận phần mềm y tế.

## 1. Mục tiêu và cách tổ chức

Mỗi lỗi có một GitHub Issue làm hồ sơ theo dõi: ai phụ trách, tái hiện thế nào, ảnh hưởng gì, sửa ở PR nào và kiểm tra nào xác nhận. AI có thể hỗ trợ phân tích, sửa và chạy kiểm tra trong phiên được giao. Thành viên khác review thay đổi và người thử thiết bị xác nhận kết quả thực.

Đường đi chuẩn: **Issue → tái hiện → tìm nguyên nhân → sửa → kiểm tra → review → phát hành → thử thực tế → đóng Issue**. Nếu kiểm tra thất bại, quay lại phân tích cùng Issue; không tạo Issue mới để che lịch sử lỗi.

## 2. Phân mức ảnh hưởng

| Mức | Ví dụ EHIS | Cách xử lý |
|---|---|---|
| P0 — chặn thử nghiệm | Lộ dữ liệu; sai bệnh nhân/vị trí; hiện đã gửi trong khi backend chưa nhận; người không có quyền nhận ca | Ngừng luồng bị ảnh hưởng, ghi nhận bằng chứng tối thiểu và giữ bản an toàn; người phụ trách xem ngay trước khi thử tiếp |
| P1 — lỗi luồng chính | Không đăng nhập, không gửi/nhận ca, crash; không có cách thay thế phù hợp | Ưu tiên trước tính năng mới; thử lại toàn luồng liên quan |
| P2 — lỗi có cách thay thế | Bố cục khó đọc, thông báo khó hiểu, nút phụ không chạy | Đưa vào đợt sửa gần nhất, kiểm tra người dùng hiểu cách xử lý |
| P3 — cải tiến | Tối ưu số thao tác hoặc sắp xếp tài liệu | Backlog theo lợi ích, không chen ngang sửa lỗi chặn |

Phân mức theo hậu quả, không chỉ theo số dòng code. Nhóm phải xác nhận mức thực tế. Không đưa hồ sơ thật, vị trí thật hay secret vào Issue/ảnh public.

## 3. Một vòng sửa lỗi cụ thể

| Bước | Người/AI cần làm | Đầu ra để chuyển bước |
|---|---|---|
| 1. Ghi nhận | Mở mẫu Bug report, ghi phiên bản, thiết bị, môi trường, bước bấm, mong đợi và thực tế | Người khác có thể làm lại hoặc biết chính xác dữ liệu còn thiếu |
| 2. Tái hiện | Thử với dữ liệu giả trên bản lỗi; lỗi ngẫu nhiên ghi số lần/thời điểm | Bằng chứng trước sửa; nếu chưa tái hiện, giữ trạng thái cần bằng chứng |
| 3. Phân tích | Theo luồng UI → API → Auth/quyền → Firestore hoặc bản đồ; viết giả thuyết và cách kiểm tra | Nguyên nhân có bằng chứng, không chỉ đoán từ thông báo |
| 4. Sửa nhỏ | Sửa nguyên nhân trong module đúng; cập nhật API contract nếu đổi giao tiếp | Diff có thể review; không tắt Rules/validation hoặc xóa test cho qua |
| 5. Kiểm chứng | Thử lại bước gây lỗi, kiểm tra hồi quy phù hợp và luồng bị ảnh hưởng | Kết quả quan sát cùng bản sửa; build qua chưa đủ |
| 6. Review | Mở PR, link Issue, lab note, bằng chứng và rủi ro còn lại; nhờ người khác xem | Người review hiểu nguyên nhân, ảnh hưởng và cách quay lui |
| 7. Phát hành | Theo hướng dẫn module; thay đổi app phải phát hành web + Android cùng đợt | Ghi riêng commit, web, API/Rules nếu đổi, OTA/APK và trạng thái |
| 8. Nghiệm thu | Thử trên môi trường đích và điện thoại nếu lỗi thuộc Android | Đạt tiêu chí chấp nhận; chưa có thiết bị thì chờ nghiệm thu, không đóng sớm |

### Khi chưa sửa được

Mỗi lần thất bại phải bổ sung một bằng chứng hoặc loại được một giả thuyết. Sau **3 lần sửa không đạt cùng lỗi**, dừng cách sửa hiện tại, tổng hợp những gì đã thử và phân tích lại nguyên nhân; yêu cầu người phụ trách cùng kiểm tra hoặc bổ sung log/tái hiện tối thiểu. Đây là điểm đổi cách làm, không phải tuyên bố bỏ lỗi.

Nếu thiếu tài khoản, quyền, thiết bị hoặc dịch vụ ngoài ngừng hoạt động: đánh dấu **bị chặn**, ghi ai cần làm gì để tiếp tục. Không giả lập kết quả đạt. Chỉ thử lại cùng một lệnh khi có lý do cho rằng điều kiện đã thay đổi. Không lặp deploy cloud để đoán lỗi; ưu tiên local/Emulator trước.

## 4. Chọn kiểm tra theo thay đổi

- Chữ/bố cục: đọc hiểu, nút/loading/error, màn hình nhỏ và cỡ chữ lớn; ghi ảnh trước/sau phù hợp. Không cần viết test chỉ để sao chép nội dung UI.
- Logic app/web/backend: `npm run check`; test hồi quy có ý nghĩa nếu có thể tự động hóa và test luồng bị ảnh hưởng.
- API/quyền/trạng thái ca: thêm `npm run test:integration` với Emulator và tình huống bị từ chối; kiểm tra nhận ca đồng thời/gửi lặp nếu liên quan.
- Web/build/config: build đúng module theo [local development](LOCAL_DEVELOPMENT.md) hoặc [cloud trial](CLOUD_TRIAL.md).
- Android/native/OTA: [Android trial](ANDROID_TRIAL.md) và [mobile releases](MOBILE_RELEASES.md); tách build thành công, đã publish, đã cài, đã nhận OTA và đã chạy luồng.
- Chỉ sửa tài liệu: kiểm tra link, lệnh, tên file và tính nhất quán; không phát hành APK/web mới khi không đổi runtime.

Chạy bộ kiểm tra phù hợp một lần sau sửa; chỉ mở rộng/lặp lại khi có lỗi mới, thay đổi mới hoặc nghi vấn còn lại. Không dùng một dòng "all tests pass" thay cho danh sách phạm vi đã kiểm tra.

## 5. Khi nào coi là hoàn tất?

1. Nguyên nhân và bước lỗi được ghi; trường hợp gây lỗi đạt tiêu chí mong đợi sau sửa.
2. Luồng liên quan và trường hợp quyền/lỗi phù hợp vẫn đúng; không có lỗi P0/P1 mới do bản sửa.
3. PR đã được thành viên khác review; commit và đầu ra phát hành được nhận diện rõ.
4. Môi trường đích được thử. Android chưa thử máy thật thì ghi **chờ nghiệm thu Android**.
5. Lab note cập nhật và Issue liên kết bằng chứng. Nếu lỗi quay lại, mở lại Issue hoặc link lỗi hồi quy tới hồ sơ cũ.

Với thay đổi chỉ tài liệu, mục phát hành/thiết bị ghi "không áp dụng". Quay lui cần kiểm tra tương thích schema và API; không xóa dữ liệu để quay lui. OTA chỉ quay về bản phù hợp runtime/channel; xem [mobile releases](MOBILE_RELEASES.md).

## 6. Mẫu giao việc cho AI

> Xử lý Issue #... trong phạm vi ... . Đọc AGENTS.md và tài liệu module. Tái hiện lỗi bằng dữ liệu giả, ghi nguyên nhân và tiêu chí đạt; sửa ít nhất cần thiết, chạy kiểm tra phù hợp và thử lại luồng liên quan. Nếu thất bại, tiếp tục phân tích dựa trên bằng chứng; sau 3 lần sửa không đạt hãy tổng hợp và đổi giả thuyết. Không hạ bảo mật hoặc sửa test để che lỗi. Cập nhật LAB_NOTES.md, báo rõ đã kiểm chứng/chưa kiểm chứng. Chuẩn bị PR để người khác review; phát hành theo quy trình đã được giao, không tự nhận điện thoại đã cập nhật.

## 7. Phát triển tự động hóa theo giai đoạn

| Giai đoạn | Làm gì | Điều kiện chuyển tiếp đề xuất |
|---|---|---|
| Hiện tại | Issue/mẫu PR/lab note, AI sửa trong phiên được giao, CI kiểm tra; con người review và thử máy | Nhóm hiểu và thực hiện được quy trình; chưa dựng bot tự sửa nền |
| Ổn định cơ bản | Nghiệm thu APK trên Android, QR trên máy khác; thử mạng yếu/mất mạng và khôi phục; kiểm tra quyền, gửi lặp, tranh ca | Không còn P0/P1 đang mở trong phạm vi thử; các kịch bản lõi đạt 2 đợt độc lập, một đợt do thành viên khác chạy; có bằng chứng quay lui phù hợp |
| Theo dõi lỗi | Đánh giá crash reporting/log đã loại dữ liệu riêng, gắn version và mã tương quan; phân loại lỗi lặp | Có người phụ trách dữ liệu/log, thời hạn lưu và cách phản hồi; chưa coi đã cài công cụ |
| AI tạo bản sửa | Bot được giao Issue đã phân loại → nhánh riêng → test → PR nháp; tối đa 3 lượt thử mỗi lượt chạy | Chỉ tự xử lý phạm vi rủi ro thấp, giới hạn thời gian/chi phí/quyền, có nhật ký và người duyệt |
| Tự động hóa phát hành có kiểm soát | Tăng tự động hóa sau review, health check và chiến lược quay lui đã diễn tập | Có môi trường thử riêng, kiểm tra thiết bị và trách nhiệm rõ; thay đổi phân quyền/dữ liệu y tế vẫn cần người review |

Hai đợt đạt là checkpoint nội bộ để bắt đầu thử có kiểm soát, không chứng minh an toàn lâm sàng hoặc đủ điều kiện vận hành cấp cứu thật. Tự động hóa giúp giảm việc lặp, không bảo đảm AI tìm thấy mọi lỗi.

## 8. Nhóm 4 người thao tác ở đâu?

- Người phát hiện bất kỳ: GitHub → Issues → New issue → Bug report. Ghi bằng ngôn ngữ người dùng, không bắt buộc biết file code.
- Chủ module theo [TEAM.md](TEAM.md): nhận Issue, khoanh vùng và sửa; nếu đổi API thì phối hợp TV1.
- Người review: một thành viên khác; không tự review thay vai trò người thử độc lập.
- Người thử: dùng [TEST_SCENARIOS.md](TEST_SCENARIOS.md), [ANDROID_TRIAL.md](ANDROID_TRIAL.md), ghi thiết bị/phiên bản/kết quả.
- Trạng thái ghi ở Issue: **Mới → Đang phân tích → Đang sửa → Chờ review → Chờ nghiệm thu → Hoàn tất**; **Bị chặn** kèm lý do. Chưa tạo GitHub Project hoặc labels tự động; có thể ghi trạng thái trong nội dung Issue trước.

## 9. Lab note bắt buộc cho mọi thay đổi

Mỗi phiên công việc có thay đổi đều cập nhật [LAB_NOTES.md](LAB_NOTES.md): code, UI, cấu hình, triển khai, tài khoản, tài liệu và thử chưa thành công. Gom các chỉnh sửa nhỏ cùng mục tiêu vào một mục; không cần một dòng cho từng lần gõ phím. Kết quả chưa đạt vẫn ghi rõ.

Mẫu mục: **Ngày — mục tiêu; Issue/PR; lý do; module/file; thay đổi; kiểm tra + kết quả; đầu ra/phát hành hoặc không áp dụng; còn thiếu + người/bước tiếp theo**. File public chỉ chứa dữ liệu giả và bằng chứng đã làm sạch; mật khẩu thử dẫn tới repo riêng tư. Quy định này có trong AGENTS.md và mẫu PR.
