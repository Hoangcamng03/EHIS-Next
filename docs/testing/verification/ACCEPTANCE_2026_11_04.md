# Kiểm thử và dữ liệu nghiệm thu — 04/11/2026

**Kết luận: nghiệm thu một phần. Chưa ghi toàn hệ thống Đạt.** Nghiệp vụ chính, phân quyền, cloud flow và artifact APK đã qua các kiểm tra bên dưới. Còn kết quả tải Functions Emulator vượt ngưỡng, lỗi tải bản đồ bên ngoài, dependency advisories và phần điện thoại chưa thử.

[Số liệu JSON và dấu vết từng lượt](ACCEPTANCE_2026_11_04.json) · [550 mẫu đo CSV](ACCEPTANCE_2026_11_04_SAMPLES.csv) · [Lab note](../../LAB_NOTES.md) · [Phiếu thử điện thoại](../ACCEPTANCE_FLOW.md).

## 1. Phạm vi và cách giữ số liệu thật

- Thực chạy ngày 04/11/2026, giờ Việt Nam UTC+7; JSON lưu dấu thời gian UTC của từng bước. Source gốc `22aff2eeb1d3ffb626bd6b16758c77c5b4e54797`; runtime app/backend/web không sửa trong vòng này. APK có source `d4e65912519f46b8a572fb89732f42de167d8a27`, cùng runtime 0.4.11/code 9 đã được đối chiếu.
- Máy local: Windows x64, Node 24.21.0, Java 21, Intel i5-12450HX, 12 logical CPU, 25.463.480.320 byte RAM. Không phải máy chủ cloud; CI cấu hình Node22 không được tính là đã chạy lại trong vòng local này.
- Local chỉ dùng `demo-ehis-next`, Firebase Auth/Firestore/Functions Emulator và tài khoản/tọa độ/hồ sơ giả. Tải lớn không gửi lên cloud. Cloud flow nhỏ chỉ dùng project EHIS mới và vùng tọa độ giả tách khỏi buổi demo thường; quyền admin/referrer fixture tạm được thu hồi sau probe.
- Mỗi lượt giữ command, commit, thời điểm, exit code, thời lượng và SHA-256 log. Log đầy đủ trên máy tại `.local/acceptance-2026-11-04/`; JSON công khai là danh sách cho phép, không chép file mật khẩu, token, khóa hoặc toàn bộ fixture.
- **550 dòng CSV là mẫu thực đã ghi:** 320 lần gọi API + 32 thời gian nhận lời mời của lượt `scale-raw-samples`, và 198 lần gọi API của lượt `multi-raw-samples`. Các lượt trước chỉ giữ thống kê mà công cụ đã ghi; không tái tạo mẫu thô từ p95, không cộng thành số người đồng thời.
- Các p95/max trong lượt có mẫu thô đã được tính lại từ chính mẫu và đối chiếu. Không tăng timeout, không nới rate limit, không bỏ tình huống lỗi, không tự retry API để làm bài tải đạt.

## 2. Bảng kết quả theo lớp

| Lớp | Quan sát thực | Kết quả |
| --- | --- | --- |
| Môi trường | Node/Java/dependency/local config đúng demo project | Đạt |
| Mã nguồn | Typecheck, lint, build backend; ban đầu 52 test, sau bổ sung kiểm tra ARSC là **17 backend + 39 logic/tool = 56 test**, không skip | Đạt |
| Nghiệp vụ tích hợp | 12 suites: starter, reports, lifecycle, maintenance, portable, location-updates, multi-incident, active-alert, budget-queue, pending-dispatch, verification, push | Đạt |
| Nhiều tài khoản | 15 tình huống: 222 Auth, lượt trong full suite 199 API; lượt bổ sung mẫu thô 198 API. Có race một TNV/ba ca, gửi lặp, sai vùng, hết hạn, chia sẻ, sửa điểm, thu hồi, Rules và giới hạn >1.000 ứng viên | Đạt |
| Tải HTTP portable | Ba lượt riêng; mỗi lượt 1.000 Auth, 128 phiên, 872 fixture offline/pending, 64 TNV sẵn sàng, 32 SDK feeds, 32 ca/tám vùng, 320 API | Đạt trong phạm vi local |
| Tải Functions Emulator | Cùng workload, cả tám bước nghiệp vụ xong nhưng vượt ngưỡng độ trễ 15 giây | **Cần kiểm tra lại; không đạt hiệu năng** |
| Build | Next static + Expo web, Android Hermes JS export | Đạt; JS export không phải thử điện thoại |
| Cloud thực | Health/project, từ chối không Auth; người quản lý → checklist → admin; hai ca trước ON → hai lời mời, không trùng, một ca/TNV, consent, đóng ca/khóa dữ liệu riêng | Đạt với dữ liệu giả, không phải tải lớn cloud |
| Hosting | 35 file HTML/JS/CSS đang chạy khớp SHA-256 với artifact local có sẵn trước rebuild | Đạt; chỉ áp dụng snapshot đã đối chiếu |
| Trình duyệt | Cloud đăng nhập sai/đúng vai, lưu và tải lại liên hệ; local xác minh, hai ca trước ON, chọn ca, nhận một/chặn ca hai, route, đến/kết thúc/hủy | Nghiệp vụ đạt; bản đồ có lỗi riêng bên dưới |
| FCM | Runtime/payload được HTTP200 trong `validate_only:true` | Đạt kiểm tra cấu hình; **không có gửi/nhận điện thoại** |
| APK | EAS FINISHED, manifest/package/version, không quyền microphone, có rung/thông báo, FCM service, âm đúng bytes và target cloud | Đạt artifact; chưa kiểm tra chứng chỉ ký/thiết bị |
| Dependency audit | App 24 mục (1 low/21 moderate/2 high), web16 moderate, backend9 moderate | **Chưa đạt audit sạch** |
| Điện thoại thật | Chuông, rung, Home/khóa/Im lặng/DND, GPS vật lý, chuyển mạng Wi-Fi/4G và chạy hai máy | **Chưa thử trong vòng này** |

## 3. Kết quả tải — từng lượt, không chọn riêng lượt nhanh

| Lượt | Đường chạy local | p95 nhận lời mời | Max nhận lời mời | Kết quả |
| --- | --- | --- | --- | --- |
| scale-1 | Portable HTTP, adapter dùng cho Vercel | 968 ms | 983 ms | Đạt |
| scale-2 | Portable HTTP | 1.005 ms | 1.019 ms | Đạt |
| scale-functions | Functions Emulator front door | 20.011 ms | 20.080 ms | RECHECK |
| scale-raw-samples | Portable HTTP, có 320 mẫu API + 32 mẫu lời mời | 969 ms | 1.001 ms | Đạt |

Mỗi lượt tạo mới 1.000 Auth trên Emulator cô lập; không phải 1.000 người cùng thao tác và không phải 4.000 người đồng thời. Ba lượt portable đo cùng workload; lượt cuối chỉ thêm ghi mẫu thô, giữ nguyên assertion/ngưỡng. 32 ca được gửi đồng thời qua API và 32 client SDK thật theo dõi Firestore. Tọa độ và bệnh án là fixture có chủ đích, không phải dữ liệu người bệnh thật.

Ngưỡng công cụ đã có là **mọi max của nhóm đo <15.000 ms**, lấy theo timeout ngắn của client, chưa phải SLA y tế được nghiệm thu. Functions Emulator có p95 createIncident 19.937 ms, max finishIncident 24.772 ms. Cả tám bước nghiệp vụ đã qua nhưng kết quả tổng vẫn RECHECK/exit lỗi; không sửa thành Đạt. Backend cloud hiện chạy Express/Vercel, không triển khai Functions. Chưa xác lập nguyên nhân gốc của chênh lệch, chưa suy ra tải cực đại của cloud từ hai đường local này. Phần cuối lượt multi bổ sung chạy chồng build nên **không dùng thời lượng multi làm benchmark**; các lượt scale chạy tách khỏi build/check nặng.

## 4. Giao diện — các bước đã thực bấm

1. Cloud: mật khẩu sai bị từ chối có hướng khôi phục. Patient đăng nhập từ `/volunteer` tự về `/patient`. Màn đăng ký giải thích hai đối tượng trước nhập thông tin. Viewport thực của cloud là 468×844.
2. Cloud: chỉ nhập tên liên hệ thì bị từ chối; nhập đủ tên/quan hệ/phone giả, lưu và reload vẫn còn đúng dữ liệu.
3. Local: TNV mới không có công tắc sẵn sàng trước khi duyệt; admin không bấm duyệt khi chưa có checklist. Người quản lý đăng nhập riêng, tick bốn mục và gửi căn cứ giả; admin xác nhận, app nhận quyền qua realtime.
4. Web QR thiếu mã hiện hướng dẫn, không có nút báo thành công. Hai thẻ khác nhau gửi tại hai tọa độ giả khi TNV OFF; backend xác nhận rồi mới mở bước bổ sung. Gửi ba câu Không rõ và bỏ trống phone thành công.
5. TNV ON muộn nhận đủ hai lời mời **351m và 1.133m**, chuyển xem từng ca. Nhận ca P1 mở đúng hồ sơ/liên hệ; nút nhận ca P2 bị khóa. Người báo không cung cấp phone thì app hiển thị đúng như vậy.
6. Leaflet hiện marker và OSRM trả tuyến tham khảo **0,53km/~2 phút**; một phần tile không tải, có cảnh báo. Không coi đây là đo thời gian di chuyển thật hoặc GPS vật lý.
7. Đã đến → xác nhận hoàn tất → hồ sơ riêng/route biến mất, TNV OFF; người báo nhận trạng thái kết thúc và form bị khóa. Ca P2 còn chờ được người báo xác nhận hủy. Các fixture có đăng nhập đều đã đăng xuất; tài khoản demo ổn định của nhóm không bị xóa/đổi mật khẩu.

Local app thực ở 1280×720; yêu cầu viewport390px chưa áp dụng cho tab nền này. Không ghi đạt 390px hay Android từ ảnh desktop. Cập nhật điểm qua API đã thử; cập nhật GPS qua thao tác web/đi bộ thực tế vẫn chưa thử.

| Bằng chứng giao diện thật, dữ liệu giả | Ảnh |
| --- | --- |
| Chọn đối tượng đăng ký cloud | [Màn đăng ký](../../assets/acceptance-2026-11-04/signup-cloud.jpg) |
| Patient cloud lưu/tải lại liên hệ | [Hồ sơ](../../assets/acceptance-2026-11-04/patient-cloud.jpg) |
| Người quản lý checklist riêng | [Checklist](../../assets/acceptance-2026-11-04/referrer-local.jpg) |
| Bổ sung ba câu, không phone | [Bảng hỏi](../../assets/acceptance-2026-11-04/report-observations.jpg) |
| ON muộn nhận hai ca/khoảng cách | [Hai lời mời](../../assets/acceptance-2026-11-04/two-offers-local.jpg) |
| Route và cảnh báo tile chưa tải | [Bản đồ chưa hoàn toàn đạt](../../assets/acceptance-2026-11-04/route-partial-local.jpg) |
| Kết thúc, form khóa | [Trạng thái cuối](../../assets/acceptance-2026-11-04/completed-local.jpg) |

## 5. Lượt thất bại và sửa công cụ — giữ lịch sử

- Cloud probe đầu `fetch failed`; cùng phép kiểm tra qua môi trường cho phép truy cập mạng đạt. Emulator lần đầu không mở được cổng trong môi trường hạn chế; lần chạy được cấp quyền đạt đủ 12 suites. Đây là lỗi môi trường thực hiện, không đếm là lỗi nghiệp vụ đã được sửa.
- Android JS export lần đầu Hermes bị `permission denied` khi ghi thư mục tạm; lần được cấp quyền ghi đạt. Không giảm tối ưu hoặc bỏ Hermes để lấy Đạt.
- APK verifier đầu báo thiếu `res/raw/emergency_tone.wav`. APK thực chứa âm ở `res/_X.wav`, bảng `resources.arsc` vẫn ánh xạ tên raw `emergency_tone`. Đã sửa công cụ đọc bảng tài nguyên theo [định dạng AOSP](https://android.googlesource.com/platform/frameworks/base/+/master/libs/androidfw/include/androidfw/ResourceTypes.h), đồng thời bắt buộc bytes trùng âm gốc. Bốn test mới kiểm tra compact/full/sparse/offset16, sai tên và dữ liệu hỏng. Không thay âm/giảm điều kiện để cho qua.
- Hai assertion UI ban đầu sai kỳ vọng: một dùng thông báo cũ, một đọc diff thiếu phần không đổi. Đã kiểm tra lại bằng thông báo thực và full snapshot; JSON giữ cả lần sai và lần xác nhận sau, không tính chúng là hai lỗi app.
- Tải Functions Emulator vượt ngưỡng được giữ RECHECK. OSM iframe từ chối kết nối khi đổi tọa độ ở hai thẻ; route của TNV có tile lỗi. Chưa xác lập nguyên nhân do mạng/trình duyệt/nhà cung cấp; **chưa sửa hay ghi map Đạt**.

## 6. APK và phần cần thử tiếp

[APK 0.4.11/code9](https://expo.dev/artifacts/eas/QwcNvHO809CxVl4cVWy9HMVG9C5bP8PdHp_eNnsvlxk.apk) · [Trang build EAS](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/1fb30d53-b177-4584-acd8-1c4be02eedf5).

Artifact **104.408.061 bytes**, SHA-256 `bec4fd154630f60f2a59c0bef1bfd2d9fe153f44bfa6a8da31147531535fc183`; package `com.hoangcamng.ehisnext`. Đây là bản build đã có, không tạo APK mới, phát OTA hay tự cài vào máy trong vòng này. Trang cài cloud vẫn là trang tiến độ cũ; link artifact được xác minh nằm ở báo cáo này/STATUS. Không deploy thay đổi giao diện trong phiên kiểm thử.

| Ưu tiên | Việc tiếp theo | Điều kiện để đóng |
| --- | --- | --- |
| Cao | Thử A01–A13 với ≥2 Android; Home/khóa/Im lặng, Wi-Fi và 4G, GPS thực | Có model/Android/version, video/thời gian đo cùng đồng hồ, kết quả từng tình huống; không ghi từ build |
| Cao | Rà/nâng dependency theo tương thích, tập trung Zod/Expo CLI; kiểm lại cả ba cây | Giải thích advisory còn lại và chạy hồi quy; không `audit fix --force` để ép Expo58 về51 hoặc nâng major Firebase mù quáng |
| Trung bình | Tái hiện lỗi preview/tile trên mạng và trình duyệt khác, kiểm tra dịch vụ bản đồ/fallback | Ảnh/log trước/sau, map tải được hoặc thông báo/fallback đạt tiêu chí đã chốt |
| Trung bình | Phân tích queue/cold start của Functions Emulator nếu dùng đường này cho demo tải | Cùng workload/ngưỡng; giữ số chưa đạt để đối chiếu; không suy ra Functions cloud từ local |
| Trung bình | Tải cloud có kế hoạch quota và giám sát | Chưa thực hiện tải lớn trên Spark/Vercel; cần phạm vi được chốt riêng |

Các cảnh báo audit đếm package bị ảnh hưởng, có thể cùng một advisory lan lên nhiều package; không gọi tổng cộng là 49 lỗ hổng độc lập. `npm explain` xác nhận Zod3 đi qua Expo CLI/eslint; không đồng nghĩa đã kiểm chứng mọi rủi ro bundle/runtime. Giữ kết luận **chưa đủ bằng chứng nghiệm thu toàn hệ thống hoặc vận hành cấp cứu thật**.

## 7. Chạy lại

Từ root theo hướng dẫn [local development](../../development/LOCAL_DEVELOPMENT.md): `npm run doctor:local`, `npm run check`, `npm run test:integration`, `npm run test:multi`, `npm run test:scale`. Bài scale mặc định dùng portable; chọn `$env:EHIS_SCALE_TRANSPORT='functions'` trong PowerShell riêng để đo front door và bỏ biến khi quay về portable. Dừng Emulator demo trước khi chạy suite tự mở Emulator; không chạy load cùng build/Metro nặng. Lưu mỗi lượt ra thư mục mới, không ghi đè bằng chứng cũ.

`cloud:probe`, flow probe, FCM validate-only, đối chiếu artifact và EAS là các bước có truy cập mạng/quyền riêng; không chạy như unit test của thành viên mới. [Scripts](../../../scripts/README.md) giải thích phạm vi. Không đưa fixture/mật khẩu/khóa vào báo cáo công khai.
