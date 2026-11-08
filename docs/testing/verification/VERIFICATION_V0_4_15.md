# Kiểm chứng 0.4.15 — tiến độ, câu trả lời và font

Phạm vi: diễn tập có kiểm soát bằng dữ liệu giả. [Số liệu và hash log](VERIFICATION_V0_4_15.json) · [Trạng thái phát hành hiện tại](../../STATUS.md) · [Hướng dẫn giải đáp Phúc Nguyên](../../operations/REPORT_UPDATES_AND_ARRIVAL.md).

## 1. Thay đổi cần kiểm chứng

- Nhận ca không đồng nghĩa đang đi. TNV xác nhận số phút đến dự kiến, báo trở ngại; giữ mốc ETA ban đầu kể cả khi đổi giờ. Cảnh báo quá mốc hoặc thiếu cập nhật, không tự chuyển/đóng ca.
- Chỉ TNV phụ trách đúng lượt phân công được cập nhật. Hai thiết bị sửa ETA cạnh tranh được chặn; retry không kéo dài ETA. Heartbeat không gia hạn ETA, không phải GPS.
- Người báo phải bấm Gửi; nhãn bản nháp/chưa gửi, số phiên bản, thời điểm máy chủ lưu và app TNV tải được tách riêng. Tải được không chứng minh con người đã đọc.
- Handover xóa tiến độ/xác nhận tải của lượt cũ. Người cũ mất quyền; Patient/người báo không nhận nhầm tiến độ cũ.
- Font hệ thống hỗ trợ tiếng Việt cho chữ, input, nút, header, web và chữ do app tạo trong bản đồ. Không dùng font CDN. Không đổi nhãn raster của nhà cung cấp bản đồ.

## 2. Kết quả local thực

| Lớp | Kết quả | Giới hạn |
| --- | --- | --- |
| Lint/type/unit/logic |74 test (22 backend +52 logic); xem lượt cuối trong JSON | Source không chứng minh máy thật |
| Integration |16 suites PASS ở integration-2, 17:05:49–17:11:25 UTC07/11 | Auth/Functions/Firestore Emulator |
| Tiến độ + SDK |15 snapshot máy chủ của người báo,8 snapshot TNV; hai ETA cạnh tranh trả200/400 | Đồng hồ cũ trong integration là fixture được khai báo |
| Tải portable |1000 Auth giả,128 phiên,32 SDK feed,32 ca/8 vùng,320 API,40 từ chối dự kiến;0 retry tự động | Không phải1000 người đồng thời; không đo SLA cloud |
| Lời mời local |32 mẫu: p50=1030ms, p95=1682ms, max=1713ms | Không đối chiếu cặp baseline trong vòng này, không tuyên bố nhanh hơn |
| Browser thao tác thật |Patient/QR → báo → TNV ON muộn → nhận → ETA → sửa câu trả lời lần2 → app nhận/receipt2 → trở ngại/đổi ETA → đến/hoàn tất | Dữ liệu/vị trí giả; không phải Android vật lý |

Browser đã quan sát cảnh báo **quá mốc ETA ban đầu bằng thời gian thực** lúc17:23:46.213 UTC07/11, dù ETA hiện tại đã đổi sang tương lai. Admin tải lại mới nhận dữ liệu mới; cảnh báo theo đồng hồ không được gọi là giám sát server liên tục. Ca chỉ kết thúc sau TNV bấm xác nhận hoàn tất.

## 3. Lỗi đã tìm và sửa

- Trang app web cũ có body Times New Roman. Đã sửa template public/index.html của Expo single output; file +html thử nghiệm không được dùng đã bỏ. DOM mới dùng chung system font; ảnh thực có dấu tiếng Việt.
- Bật sẵn sàng bằng vị trí giả từng kích hoạt GPS thừa do snapshot về trước nguồn vị trí. Đã sửa thứ tự và thử OFF/ON lại, nhận đúng ca cũ, không còn thông báo GPS sai.
- Giữ check-1 FAIL (lời mô tả không khớp nghĩa test); sửa copy, không nới test. Lỗi kiểu ref/hook dependency đã sửa. Lỗi focus/clipboard của công cụ được ghi riêng, không gán thành lỗi app.
- Dừng tiến trình UI lần đầu bị hạn chế quyền truy vấn; lần được cấp quyền đã dừng đúng các tiến trình tự mở. Không dừng dịch vụ khác.

## 4. Điều kiện bàn giao

Ngày08/11: runtime source0eb17de đã lên main; backend15 deploy/health/project/401 PASS; luồng2 ca cloud giả PASS46.748s, gồm ETA/firstETA/receipt/bàn giao/reset/thu quyền fixture tạm. Hai Hosting15 deploy PASS,38 HTML/JS/CSS khớp build. [CI42447024274](https://github.com/Hoangcamng03/EHIS-Next/actions/runs/42447024274) SUCCESS gồm check/Android export/web build/integration/scale.

[APK392b6d6b](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/392b6d6b-4e9f-4541-9956-fae90b954fbb) FINISHED,0.4.15/code13 đúng source0eb17de. Artifact verifier PASS08/11 05:01:16 UTC:102912725 bytes, package com.hoangcamng.ehisnext, đúng backend, tài nguyên âm báo/FCM, không có microphone permission. SHA256: `fa4a4df0bf0e11bfa9d8eb84f08357bc4babd538e8c4a53b31020283b93e1ff9`. Chưa kiểm chứng chữ ký/cài/thiết bị. Manifest trang tải chỉ đổi sau kết quả này; xác minh link online ghi trong JSON sau deploy cuối.

Build-4/deployweb-2 PASS; artifacts-2 xác minh lại38 file. Trang cài online PASS05:04:01.837 UTC08/11, dẫn đúng APK15 đã xác minh và backend15. Không có OTA hoặc tự cài trên điện thoại. Commit tài liệu/manifest sau runtime không được coi là một APK khác.

Cloud/backend/APK/CI chỉ được ghi đạt khi có kết quả thực trong JSON và STATUS. Link APK cũ được giữ cho tới khi APK15 build xong và kiểm tra artifact đạt. Chưa có phiếu thiết bị thật: không ghi font/GPS/chuông/nền hoặc khả năng đến đúng giờ đã đạt. Chưa tiếp nhận cấp cứu thật.
