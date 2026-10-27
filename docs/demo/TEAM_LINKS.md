# EHIS — trang chung cho cả nhóm

[Về dự án](../../README.md) · [Tất cả tài liệu](../README.md) · [Phiên bản hiện hành](../STATUS.md)

Gửi link trang này cho thành viên mới. Đọc từ mục 1 đến 4 để hiểu và chạy demo; các mục sau dùng khi cần kiểm thử, góp ý hoặc sửa code. Các link source đều dùng main. Không cần tài khoản Firebase/Vercel/Expo hoặc cài môi trường lập trình để tham gia demo cloud.

## 1. Bắt đầu theo thứ tự

| Thứ tự | Mở trang | Bạn cần biết sau khi đọc |
| --- | --- | --- |
| 1 | [Bắt đầu từ đầu](../START_HERE_DEMO.md) | Các đối tượng, luồng hỗ trợ, chuẩn bị thiết bị và tài khoản |
| 2 | [Trạng thái phiên bản](../STATUS.md) | Source, web và APK nào đã có; phần nào còn chưa nghiệm thu |
| 3 | [Tài khoản demo](MANUAL_DEMO_ACCOUNTS.md) | P1/P2, V1/V2/V3 và A1 dùng làm gì; cách lấy mật khẩu riêng |
| 4 | [Kịch bản phối hợp bốn người](DEMO_RUNBOOK.md) | Ai bấm gì, đúng thứ tự nào, người khác phải thấy gì |
| 5 | [Xử lý vướng mắc](DEMO_TROUBLESHOOTING.md) | Cách xử lý khi gặp lỗi đăng nhập, QR, GPS, chuông hoặc bản đồ |

Checkpoint: mỗi người nói được vai trò mình, mở đúng màn hình và biết khi nào được bấm gửi/nhận/kết thúc. Chưa cần đọc toàn bộ tài liệu kỹ thuật.

## 2. Link mở hệ thống và cài điện thoại

| Link | Ai mở / dùng khi nào | Lưu ý |
| --- | --- | --- |
| [App Patient/TNV trên web](https://ehis-next-20261021-hc03-app.web.app) | Bệnh nhân và tình nguyện viên | Đăng nhập bằng tài khoản EHIS; hệ thống tự mở khu vực đã đăng ký |
| [Trang cài APK Android](https://ehis-next-20261021-hc03.web.app/install) | Người cài app Android | APK độc lập, không cần Expo Go; số bản đang bàn giao tra STATUS |
| [Website người qua đường](https://ehis-next-20261021-hc03.web.app) | Xem trang giới thiệu | Để báo một bệnh nhân cụ thể, quét QR đang hoạt động; trang chủ không thay QR |
| [Web quản trị](https://ehis-next-20261021-hc03.web.app/admin) | A1 / người được cấp quyền admin | Duyệt TNV khi chạy bài ứng tuyển; chọn vai trò không tự cấp quyền |
| [Cách dùng trên điện thoại](../operations/PHONE_INSTALL_AND_LAUNCH.md) | Android, iPhone/iPad | iPhone hiện dùng web, có thể thêm biểu tượng lên màn hình chính; chưa IPA/TestFlight |
| [Bảng tài khoản riêng tư](https://github.com/Hoangcamng03/EHIS-Next-Team-Access) | Chủ dự án và thành viên được cấp quyền | Chứa email/mật khẩu/QR thử; không đưa vào slide, Issue hoặc ảnh public |

Nếu bảng riêng tư hiện 404: chủ dự án phân tài khoản qua kênh riêng hoặc tự cấp quyền phù hợp. Không dùng chung tài khoản GitHub của chủ repo. Tài khoản GitHub đọc tài liệu và tài khoản EHIS đăng nhập app là hai loại khác nhau. Tài khoản thử có thể đã đổi trạng thái sau buổi trước; cần kiểm tra lại.

## 3. Phân vai với hai Android và một laptop

| Thành viên | Thiết bị / tài khoản | Công việc |
| --- | --- | --- |
| A — Patient/điều phối | Laptop, P1 | Mở QR và hồ sơ giả, ra hiệu chuyển bước; chuẩn bị admin riêng trước buổi |
| B — TNV chính | Android 1, V1 | Bật sẵn sàng, thử chuông, nhận ca, xem đường và kết thúc |
| C — người báo | Android 2, camera/trình duyệt | Quét QR, xác nhận vị trí, gửi và trả lời bảng hỏi; không cần đăng nhập EHIS |
| D — quan sát | Phiếu ghi / laptop | Ghi bản app, thời gian, kết quả, lỗi; vòng V2 làm riêng nếu chưa có thiết bị thứ ba |

Hai TNV cùng lúc cần hai phiên độc lập và thêm nơi báo tin. Không dùng hai tab cùng app trong cùng hồ sơ trình duyệt làm hai người độc lập vì phiên cloud có thể dùng chung. Chi tiết bố trí và phương án thiếu GPS trong [runbook](DEMO_RUNBOOK.md).

## 4. Buổi demo đầu tiên

1. **Trước buổi:** A đọc STATUS, phân tài khoản; cả nhóm mở runbook. Patient có QR hoạt động, chỉ dữ liệu giả. Chuẩn bị Internet, vị trí và âm lượng.
2. **Sẵn sàng:** B dùng V1 đã duyệt, bật sẵn sàng trước khi C gửi, thử chuông và giữ màn TNV mở.
3. **Báo:** C quét QR P1, xác nhận đang cạnh bệnh nhân giả, bấm gửi. Chờ máy chủ xác nhận rồi mới coi là đã gửi; đây chưa phải TNV đã nhận.
4. **Bổ sung:** C trả lời ba câu quan sát, có thể bỏ phone. B thấy thông tin cập nhật của cùng ca.
5. **Tiếp nhận:** B nhận ca, xem hồ sơ theo quyền chia sẻ và tuyến trong app; xác nhận đến nơi rồi kết thúc.
6. **Đối chiếu:** A/C thấy trạng thái ca đã kết thúc, B không còn xem thông tin riêng của ca. Tắt sẵn sàng, ghi kết quả; không xóa Firestore để đặt lại demo.

Tập một vòng theo [runbook](DEMO_RUNBOOK.md) trước, rồi mới thêm tình huống tranh ca/mất mạng. Không dùng hồ sơ thật. GPS/chuông/rung phải kiểm tra từng máy; giữ màn TNV mở phía trước, chưa coi nhận nền/khóa máy là đã đạt. Bản cloud cần Internet. Nếu mạng lỗi khi trình, dùng video đã ghi và nói rõ đó là bản ghi.

## 5. Kiểm thử, xem xét và góp ý

| Nhu cầu | Link | Cách dùng |
| --- | --- | --- |
| Chạy theo flow, ghi nghiệm thu | [ACCEPTANCE_FLOW](../testing/ACCEPTANCE_FLOW.md) | Điền Đạt / Không đạt / Chưa thử / Bị chặn và bằng chứng |
| Thử nhiều người/vị trí/nhánh lỗi | [TEST_SCENARIOS](../testing/TEST_SCENARIOS.md) | Chọn bài mở rộng sau vòng chính; chia ai thử và phiên bản |
| Gửi lỗi | [Mở mẫu báo lỗi](https://github.com/Hoangcamng03/EHIS-Next/issues/new?template=bug_report.md) | Ghi bước tái hiện, mong đợi/thực tế, thiết bị/mạng/bản app |
| Góp ý giao diện/tính năng/quy trình | [Mở mẫu góp ý](https://github.com/Hoangcamng03/EHIS-Next/issues/new?template=feature_request.md) | Nêu ai gặp khó, ở bước nào, đề xuất và tiêu chí cải thiện |
| Theo dõi việc đã báo | [Danh sách Issues](https://github.com/Hoangcamng03/EHIS-Next/issues) | Tìm trước khi tạo để tránh trùng; bổ sung kết quả thử vào Issue cũ |
| Xem thay đổi code đang đề nghị | [Pull requests](https://github.com/Hoangcamng03/EHIS-Next/pulls) | Xem phạm vi, diff và bằng chứng; PR không đồng nghĩa đã phát hành |
| Hiểu vòng sửa lỗi | [BUG_FIX_WORKFLOW](../testing/BUG_FIX_WORKFLOW.md) | Tái hiện → phân tích → sửa → hồi quy → review → phát hành/nghiệm thu riêng |

Tạo Issue cần đăng nhập GitHub và có quyền thao tác tương ứng. Nếu chưa thao tác được, gửi nội dung cho người điều phối ghi giúp; việc mở mẫu chưa tự gửi Issue.

Mỗi lỗi/góp ý ghi tối thiểu: **vai trò → bước → phiên bản/thiết bị → mong đợi → thực tế → đề xuất hoặc tiêu chí đạt**. Mỗi Issue một vấn đề để dễ theo dõi; gộp các lần tái hiện cùng lỗi vào một Issue. Repo public: che mật khẩu, token, QR riêng, số liên lạc, vị trí và hồ sơ thật trước khi đăng ảnh.

Cuối buổi: D tổng hợp bài đạt/chưa đạt, người phụ trách và bước tiếp theo. Người sửa ghi phiên thay đổi trong [LAB_NOTES](../LAB_NOTES.md). Không ghi Đạt chỉ vì máy người khác đã chạy hoặc kiểm thử tự động đã qua.

## 6. Theo dõi tiến độ và bằng chứng

| Trang | Dùng để xem |
| --- | --- |
| [STATUS](../STATUS.md) | Đầu mối bản đã phát hành và việc còn thiếu |
| [LAB_NOTES](../LAB_NOTES.md) | Lý do, phạm vi, kiểm chứng, việc chưa xong của từng phiên |
| [GitHub Actions](https://github.com/Hoangcamng03/EHIS-Next/actions) | CI theo commit; tick xanh không chứng minh máy đã cài bản mới |
| [Lịch sử main](https://github.com/Hoangcamng03/EHIS-Next/commits/main/) | Ai thay đổi gì và khi nào |
| [Kiểm chứng 0.4.9](../testing/verification/VERIFICATION_V0_4_9.md) | Bản sửa GPS/chuông/nhiều ca/ON muộn, cloud/APK; còn nghiệm thu Samsung/Android |
| [So sánh hiệu suất 26/10](../testing/PERFORMANCE_COMPARISON.md) | Số đo local trước/sau tối ưu; không dùng làm cam kết tốc độ cloud |
| [Kế hoạch midterm/cuối kỳ](../planning/MIDTERM_DEMO.md) | Kịch bản trình thầy và phần phát triển tiếp |

## 7. Dành cho thành viên tiếp quản code

Đọc [bản đồ file](../architecture/REPO_MAP.md) → [cài môi trường local](../development/LOCAL_DEVELOPMENT.md) → [chia việc bốn người](../development/TEAM.md) → [quy trình Git/review](../../CONTRIBUTING.md).

| Phần | Source / tài liệu |
| --- | --- |
| App Patient/TNV | [frontend/app](../../frontend/app/README.md) |
| Website người báo/admin | [frontend/web](../../frontend/web/README.md) |
| API/quyền/nghiệp vụ | [backend](../../backend/README.md) |
| Công cụ test/build/triển khai | [scripts](../../scripts/README.md) |
| Luồng hệ thống và dữ liệu | [ARCHITECTURE](../architecture/ARCHITECTURE.md), [API_CONTRACT](../architecture/API_CONTRACT.md) |
| Vai trò Expo/GitHub/Vercel/Firebase | [PLATFORM_ROLES](../architecture/PLATFORM_ROLES.md) |
| Tất cả tài liệu còn lại | [Danh mục tám nhóm](../README.md) |

Người tham gia demo không cần mở console. Người vận hành được cấp quyền mới dùng [Firebase project](https://console.firebase.google.com/project/ehis-next-20261021-hc03/overview), [Expo/EAS project](https://expo.dev/accounts/ehiss-team/projects/ehis-next) hoặc [Vercel dashboard](https://vercel.com/dashboard) rồi chọn đúng project EHIS. Link không tự cấp quyền; đọc [CLOUD_TRIAL](../operations/CLOUD_TRIAL.md) và [MOBILE_RELEASES](../operations/MOBILE_RELEASES.md) trước thao tác triển khai. Không đổi secret/billing/dữ liệu để tự xử lý một lỗi demo.

**Ranh giới phiên bản:** source trên main không đồng nghĩa cloud/APK đã cập nhật. Tra STATUS ở đầu mỗi buổi. Hiện ưu tiên Android và web cho diễn tập; chưa app iOS native và chưa nghiệm thu vận hành cấp cứu thật.
