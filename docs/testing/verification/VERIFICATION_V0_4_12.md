# Nghiệm thu phần mềm 0.4.12 — kết quả thực

Ngày ghi: 2026-11-04T17:20:05.699Z. Kết luận **nghiệm thu một phần**. Dữ liệu giả; có thực thi Auth/Firestore/HTTP/SDK và trình duyệt thật. Không phải thử người bệnh, điện thoại hoặc giới hạn người dùng cloud. [JSON có thời điểm/hash/log và mẫu gốc](VERIFICATION_V0_4_12.json) · [704 mẫu đo CSV](VERIFICATION_V0_4_12_SAMPLES.csv). Báo cáo 04/11 trước sửa được giữ để đối chiếu.

## 1. Đã sửa

- Quản trị lọc TNV theo vùng/đơn vị, phân trang 50 người, sửa vùng, tạm dừng/khôi phục có lý do. Khóa tạm dừng khi có ca active; khôi phục giữ OFF. Vùng quản lý không giới hạn điều phối GPS 5 km.
- Chặn checklist cũ khi người giới thiệu đổi đơn vị. Lưu hồ sơ quản lý TNV được duyệt; không tự chứng nhận chức vụ hoặc năng lực y tế.
- Ba câu hỏi có biểu tượng và lựa chọn quan sát cụ thể: phản ứng, thở đều/khó/ngáp/không thấy/chưa rõ, máu không thấy/có/nhiều/chưa rõ. APK cũ vẫn gửi enum cũ được. Hiển thị thời điểm báo cáo; chỉ TNV phụ trách được xem tên/liên hệ Patient khi có consent.
- Android theo dõi đổi token, thay token đúng chủ, đăng ký lại kiểm tra lời mời còn hạn cho đúng máy, không reo lại trên máy khác. Logout chờ gỡ token. Đây là kiểm chứng mã/backend, chưa chứng minh chuông nền.
- Bỏ iframe bản đồ preview; Leaflet giữ map/marker, theo dõi tile lỗi và cho thử lại. Local demo dùng HTTP adapter giống Vercel trên loopback 5201, vẫn giữ Functions Emulator để kiểm tra riêng.
- Nâng các bản vá tương thích Expo58/RN và Firebase Admin14/Functions7; không ép downgrade framework để che audit.

## 2. Kiểm tra và tải thực

| Bài thử | Kết quả |
|---|---|
| Typecheck/lint/build backend/unit/logic | 59 test; xem exit code check-handoff trong JSON |
| Integration cuối | 13 suites PASS; có kiểm tra hai tiến trình chia quota, quyền chéo, token recovery, đơn vị thay đổi và 51 dòng phân trang |
| Nhiều ca/TNV | Kịch bản multi cuối kiểm tra nhiều lời mời/khoảng cách; nhận ca thứ hai/thứ ba bị từ chối; không đổi thành nhận nhiều ca |
| Tải portable cuối | 1000 tài khoản Auth, 128 phiên đăng nhập, 64 TNV sẵn sàng, 32 feed SDK, 32 ca đồng thời, 320 API; PASS |
| Độ trễ portable local | lời mời p95 872 ms; tạo ca p95 854 ms; nhận ca p95 665 ms; không retry tự động |
| Functions lạnh trong thử nghiệm quota đã bỏ | RECHECK; lời mời p95 19622 ms, vượt ngưỡng 15000 ms. Không coi là sửa xong |
| Audit sau vá | app 18 trung bình, web 16 trung bình, backend 0; không có high/critical tại thời điểm đo |

1.000 tài khoản không có nghĩa 1.000 người đang dùng: chỉ 128 tài khoản có phiên, 32 feed realtime và 32 ca đồng thời. Tọa độ/kịch bản giả, nhưng không dựng kết quả hoặc thời gian giả. Các lượt trước và thử nghiệm thất bại có record riêng trong JSON. Đã bỏ cohort IP vì chưa chứng minh lợi ích và có thể từ chối sớm người chung mạng; bài portable cuối đo lại hạn mức gốc. Functions tự khởi động worker theo yêu cầu là một giả thuyết có căn cứ mã CLI, chưa có phép đo A/B tách riêng từng nguyên nhân.

## 3. Trình duyệt

Đã thao tác: gửi → backend xác nhận → bảng hỏi; gửi ba quan sát không phone; TNV nhận lời mời 312 m → nhận ca → bệnh án/liên hệ/giờ cập nhật → tuyến OSRM 0,78 km khoảng 2 phút → đến nơi → xác nhận hoàn tất → dữ liệu riêng biến mất. Admin lọc vùng, chặn khóa khi đang có ca, tạm dừng và khôi phục giữ OFF. Dữ liệu ban đầu do script chuẩn bị, không tính phần seed là thao tác người dùng.

[Ảnh bảng hỏi](../../assets/verification-0-4-12/01-bystander-observations.jpg) · [Ảnh phần nút TNV đang có ca](../../assets/verification-0-4-12/02-volunteer-private-details.jpg) · [Ảnh bệnh án thực sự hiển thị ở đầu màn](../../assets/verification-0-4-12/05-volunteer-private-details-top.jpg) · [Ảnh đăng nhập cloud](../../assets/verification-0-4-12/06-cloud-volunteer.jpg) · [Ảnh admin đang có ca](../../assets/verification-0-4-12/03-admin-active-case-guard.jpg) · [Ảnh tạm dừng](../../assets/verification-0-4-12/04-suspended-volunteer.jpg). Ảnh 04 chụp trước khi rút gọn dòng lỗi phụ, không sửa ảnh để che lỗi.

**Chưa đạt:** ảnh nền OSM trong trình duyệt thử vẫn không tải sau retry; có cảnh báo thay vì báo bản đồ đã sẵn sàng. Tuyến OSRM trả về không chứng minh ảnh nền tốt. Override 390px không có hiệu lực (DOM thực 1265px); chưa xác nhận responsive 390px trong phiên này, không gán nhãn screenshot điện thoại.

## 4. Phát hành và việc còn thiếu

Trạng thái được cập nhật trong JSON release và [STATUS](../../STATUS.md), không suy từ việc commit hoặc export. Cloud/APK/thiết bị là ba lớp riêng. Giữ nguyên APK 0.4.11 cho tới khi 0.4.12 build FINISHED và artifact được đối chiếu.

| Ưu tiên | Việc còn mở / hành động tiếp |
|---|---|
| Cao | Nhóm thử ít nhất hai Android: cấp quyền, Home/khóa, Samsung im lặng/rung, token/logout/login, GPS trước/sau 5 phút, hai máy giành cùng ca. Ghi thời gian thật; chưa có máy nối để nghiệm thu |
| Cao | Kiểm tra OSM/routing trên Wi-Fi và 4G; xác định nhà cung cấp/hạn mức dự phòng trước ca thật; không proxy tùy tiện hoặc cam kết dịch vụ miễn phí luôn sẵn sàng |
| Cao | Người phụ trách y tế phải duyệt câu hỏi, checklist, phạm vi TNV và quy trình bàn giao. Phần mềm không xác minh người quản lý ngoài đời |
| Trung bình | Advisory trung bình còn lại: kiểm tra đường phụ thuộc và nâng framework có kế hoạch; audit hiện còn nonzero, không dùng force để downgrade |
| Trung bình | Tải cloud/giám sát/quota/chống lạm dụng/push retry có bảo đảm và vận hành người trực chưa nghiệm thu; local không thay SLA |
| Thấp | Native iOS hoãn đến khi có tài khoản/ký và ngân sách; không có IPA mới |

Không công bố vận hành cấp cứu thật từ báo cáo này. Mục tiêu được kiểm tra là diễn tập có kiểm soát với dữ liệu giả.

## 5. Cập nhật phát hành ngày 05/11/2026 (giờ Việt Nam)

- Backend 0.4.12 đã READY và qua health/version/401 + hai lượt cloud flow. Lượt bổ sung kiểm tra index vùng/đơn vị/kết hợp đều truy vấn được, tạm dừng–khôi phục, quan sát chi tiết, hai ca trước ON, chặn ca thứ hai và private consent. Dọn quyền admin/người giới thiệu tạm sau mỗi probe. Tài khoản probe không phải tài khoản bàn giao.
- **Lỗi phát hiện sau deploy đầu:** HTTP500 do ERR_REQUIRE_ESM trong Firebase Admin14 → jwks-rsa4 → jose6. Đọc runtime log dashboard, tái hiện bằng Node tắt require-module (exit1), bật lại theo cấu hình [Vercel chính thức](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration#experimental-nodejs-require-of-es-module) (exit0), triển khai lại bằng scripts/vercel.cjs. Không sửa IAM/tắt Auth/downgrade để che lỗi. Deployment khắc phục: dpl_8m5vBvcLaAzJDVF6GHtp6NiBP7o9. Chốt cloud mới kiểm tra cả phiên bản backend khớp frontend và báo rõ lỗi health không phải JSON.
- Hai Hosting site đã lên 0.4.12; đối chiếu **38 HTML/JS/CSS** khớp artifact. Browser cloud đăng nhập TNV giả vào đúng giao diện OFF, phiên bản0.4.12; đã chờ đăng xuất hoàn tất mới ghi PASS. Lần đóng tab sớm khi đang logout không tính đạt. Trang thẻ HTTPS đã mở; không cấp GPS thật hoặc gửi thêm ca từ trình duyệt cloud.
- FCM validate-only HTTP200; **không phải** gửi/nhận trên thiết bị. Firebase Spark, Standard Singapore, không billing.
- APK0.4.12/code10 từ bc3f2be: [theo dõi build thật](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/99728b3e-d0d1-455e-abd9-ad4a0c0dd561); trạng thái mới nhất trong JSON release. Chỉ thay link cài sau FINISHED + verifier artifact. Trang cài được sửa để có link APK0.4.11 đã xác minh trước đó trong lúc chờ, không gán nhãn nó thành0.4.12.
- Ảnh02 chỉ chụp phần nút bên dưới màn, không dùng làm chứng cứ bệnh án. Ảnh05 chụp đúng bệnh án ở đầu màn trên một ca giả sau đó; ảnh/record được giữ đúng bước, không chỉnh ảnh để dựng kết quả. Có thêm ca tự hết hạn khi chờ hạ tầng (web khóa gửi/nhận) và ca chọn “Chưa rõ” cả ba câu, TNV nhận đúng cập nhật.
