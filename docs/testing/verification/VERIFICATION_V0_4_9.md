# EHIS 0.4.9 — GPS, chuông và nhiều ca chờ

Ngày 27/10/2026. Bản sửa theo phản hồi APK 0.4.8 trên Samsung. Trạng thái source/cloud/APK/máy tra [STATUS](../../STATUS.md), lịch sử [LAB_NOTES](../../LAB_NOTES.md).

## Tiêu chí xác nhận

1. 32 Patient khác nhau báo trước khi TNV ON; khi bật, cả 32 lời mời còn hạn/gần được nhận qua SDK dù có 35 mục lịch sử mới hơn. Không có private phone/toạ độ trong alert; expired/cancelled/far không được mời.
2. ON/retry/ON lại không tạo trùng; một TNV không nhận hai ca. Ca nhận/hủy khi catch-up không được hồi sinh. Mỗi Patient/card vẫn chỉ có một ca active để chống báo trùng.
3. Cache GPS phải còn mới/đúng sai số; timeout/abort gỡ watcher, không gửi vị trí sau hủy; map không tính lại mỗi nhịp đồng hồ. Không coi test adapter là đo GPS thật.
4. First alert chuẩn bị được WAV nếu tải muộn; Im lặng/Rung vẫn cho phép playback theo Expo. Không có nút mute chuông lâu dài. Không cam kết vượt Media=0/DND/loa Bluetooth hoặc nhận nền.
5. Phiếu máy thật còn Chưa thử: cài đúng 0.4.9/code7, Samsung thử Media>0 ở Bình thường/Rung/Im lặng; âm báo mới sau khi dừng lượt trước; đo GPS ngoài trời/lạnh, 2–3 Patient đồng thời, báo trước ON, hai TNV tranh nhận. Đảo Wi-Fi/4G và lưu kết quả bằng [ACCEPTANCE_FLOW](../ACCEPTANCE_FLOW.md).

## Kết quả

Check đạt 46 unit/logic và type/lint, 10 integration; chạy bổ sung pending có ba tranh nhận và ngưỡng 101 cũng đạt. Bài scale 1.000 Auth giả/128 có phiên, 32 ca/tám vùng/32 TNV SDK, 320 API, 40 từ chối đúng quyền đạt; không phải 1.000 online. Gửi→snapshot p95 869ms, tạo 851ms, nhận 551ms trên local, không phải SLA cloud. Late32 sau35 history nhận đủ; lượt hồi quy đầu 189ms, lượt có thêm race/bối cảnh build local 2135ms, không dùng các lượt khác điều kiện để quảng cáo cải thiện tốc độ. [JSON kết quả](FIX_2026_10_27_0_4_9.json).

Browser 390px không tràn ngang ở màn đo; ba ca báo trước ON xuất hiện, chuyển ca thứ hai/đóng popup/xem danh sách, nhận đúng ca/hồ sơ/map nhúng 0,88km/~2phút, hoàn tất đóng private và OFF. Hai lời mời khác hết hạn đi vào lịch sử. Console error cuối đọc: không có. Chưa thử GPS vật lý/loa/rung/Samsung hoặc nhận nền. Ảnh fake: [chọn ca](../../assets/trial-049/switch-pending.png), [hàng đợi](../../assets/trial-049/pending-list.png), [bản đồ ca đã nhận](../../assets/trial-049/accepted-route.png). Ảnh RN ScrollView chỉ vùng đang thấy. Giới hạn pilot: catch-up <=100 ca đang chờ, tối đa 20 người đã được mời/ca, feed <=100 có cảnh báo overflow; đợt đầu chọn 5 gần nhất, bán kính 5km/hạn 10 phút. Đây không phải năng lực cloud production.

## Phát hành đã xác nhận

- Runtime c40e2f1; [CI 40513433847](https://github.com/Hoangcamng03/EHIS-Next/actions/runs/40513433847) SUCCESS cả 46 unit/logic, Android export, web build, 10 integration và scale.
- Vercel health 0.4.9, Hosting app/web đã deploy; 32 hash cuối khớp. Probe cloud hai ca báo trước ON đạt catch-up và index offered, chống trùng, một phân công, consent/private và đóng đủ hai ca. Admin thử thu hồi, login mới xác nhận không còn quyền; không đổi tài khoản demo nhóm. Lượt đầu fetch failed trước xác nhận lifecycle, cleanup admin đạt; không ghi PASS lượt đó. Kiểm tra health/Auth kết nối lại và lượt kiểm tra riêng sau đạt; tên bước lỗi đã thêm vào probe, không auto retry đăng ký/giao dịch để che lỗi.
- [APK 0.4.9/code 7](https://expo.dev/artifacts/eas/AQKpv7mXpAKGIejz4Fs6CpnA1zpFMC5l4_mWcqSM5UQ.apk) / [EAS FINISHED](https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/bb033cab-3e0b-4c2c-b9a9-c4e8734c9ba4), đúng commit/package/cloud/WAV/rung, không microphone. 103753501 byte; SHA-256 cbb03c19629fec53574da1622dd317000590a3a2b476f7c7eec07d4a6db49b8e. Chưa nghiệm thu cài/Play Protect/chữ ký/loa/GPS trên máy thật.
- [Trang cài](https://ehis-next-20261021-hc03.web.app/install) đã hiển thị đúng link 0.4.9; [ảnh cloud](../../assets/trial-049/install-cloud.png). Điện thoại chưa tự cập nhật từ việc deploy; nhóm cài đè đúng APK và thử máy. Không OTA/iOS/cửa hàng/billing.
