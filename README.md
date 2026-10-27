# EHIS Next — thẻ sức khỏe và hỗ trợ cộng đồng

Một repository cho toàn bộ dự án Capstone bốn người: app Bệnh nhân/Tình nguyện viên, web người báo/quản trị, backend và tài liệu.

**Nguồn chuẩn của nhóm là [nhánh main](https://github.com/Hoangcamng03/EHIS-Next/tree/main).** Mở trang gốc repository hoặc clone mặc định để thấy cấu trúc này; không cần chuyển sang nhánh tính năng cũ.

**Gửi cho cả nhóm: [Trang link chung — bắt đầu, demo và góp ý](docs/demo/TEAM_LINKS.md).** Có thứ tự đọc, link mở app/cài Android, tài khoản riêng, phân vai và nơi ghi lỗi/góp ý.

**Chạy demo:** [Bắt đầu từ đây](docs/START_HERE_DEMO.md) → [phân vai và thao tác](docs/demo/DEMO_RUNBOOK.md) → [xử lý vướng mắc](docs/demo/DEMO_TROUBLESHOOTING.md).

**Tra cứu:** [Tất cả tài liệu](docs/README.md) · [Phiên bản/việc còn thiếu](docs/STATUS.md) · [Lab note](docs/LAB_NOTES.md).

## 1. Cấu trúc chính

```text
EHIS-Next/
├── frontend/               Giao diện người dùng
│   ├── app/                React Native/Expo: Patient + Volunteer; Android và app web
│   └── web/                Next.js: người báo qua QR, quản trị và trang cài
├── backend/                API Node/Express, nghiệp vụ và kiểm tra quyền
├── docs/                   Hướng dẫn, kiến trúc, kiểm thử, vận hành và báo cáo
├── scripts/                Công cụ local, test, cloud và phát hành
├── .github/                CI, mẫu Issue và mẫu pull request
├── firebase.json           Hosting, Emulator và đường dẫn backend
├── firestore.rules         Quyền đọc/ghi trực tiếp của client
├── firestore.indexes.json  Index truy vấn
├── package.json            Lệnh điều phối từ root
└── CONTRIBUTING.md         Quy trình làm việc chung
```

| Bạn cần sửa gì? | Đọc và làm việc tại |
| --- | --- |
| Patient, TNV, đăng nhập, QR và bản đồ trong app | [frontend/app](frontend/app/README.md) |
| Người báo, bảng hỏi, quản trị hoặc trang tải | [frontend/web](frontend/web/README.md) |
| Tài khoản, phân quyền, chọn TNV, nhận/kết thúc ca | [backend](backend/README.md) |
| Build, test, môi trường và phát hành | [scripts](scripts/README.md) |
| Hướng dẫn và bằng chứng | [docs](docs/README.md) |

Patient và TNV là hai khu vực trong **một app**. App web xuất từ frontend/app dùng chung source mobile; website người báo/quản trị ở frontend/web là phần riêng. [Bản đồ file chi tiết](docs/architecture/REPO_MAP.md).

## 2. Mở bản đang bàn giao

| Phần | Địa chỉ |
| --- | --- |
| App Patient/TNV trên web | [Mở app](https://ehis-next-20261021-hc03-app.web.app) |
| Người báo | Quét QR Patient; [trang giới thiệu](https://ehis-next-20261021-hc03.web.app) |
| Quản trị | [Mở /admin](https://ehis-next-20261021-hc03.web.app/admin) |
| Android | [Trang cài APK](https://ehis-next-20261021-hc03.web.app/install) |
| Tài khoản demo | [Hướng dẫn tài khoản](docs/demo/MANUAL_DEMO_ACCOUNTS.md); mật khẩu chỉ ở repo riêng tư |

Đợt UI 27/10/2026: 0.4.10/code 8 thu gọn chữ/hướng dẫn, cải thiện nút và công tắc; giữ các sửa GPS/chuông/nhiều ca của backend 0.4.9. Có kiểm tra luồng trên màn nhỏ; xem trạng thái build/APK hiện hành bên dưới. **Tra STATUS để biết bản cloud/APK thực đã bàn giao.** Push source không tự cập nhật điện thoại; chỉ ghi máy đã cập nhật sau khi người thử xác nhận cài đúng bản.

## 3. Bắt đầu phát triển

[Cài/chạy local](docs/development/LOCAL_DEVELOPMENT.md) → [chia việc](docs/development/TEAM.md) → [Git và review](CONTRIBUTING.md). Dùng Node 22 và Java 21 theo CI.

```powershell
npm --prefix frontend/app ci
npm --prefix frontend/web ci
npm --prefix backend ci
npm run setup:local
npm run check
```

Gọi lệnh từ thư mục gốc; tham gia demo cloud không cần cài các công cụ phát triển. Main là nhánh tích hợp; bản đề xuất thay đổi phải qua CI và review trước khi hợp nhất. Thư mục phân chia chức năng, nhánh Git là phiên bản của cả repository.

## 4. Nguyên tắc vận hành và tài liệu

Firebase Spark lưu Auth/Firestore và phục vụ Hosting; backend chạy Vercel Hobby. Đợt hiện tại là diễn tập dữ liệu giả có kiểm soát, ưu tiên Android miễn phí + web; iOS native hoãn. Internet cần cho gửi/nhận ca và bản đồ. Chưa nghiệm thu vận hành cấp cứu thật.

Mỗi phiên thay đổi ghi LAB_NOTES. Kiểm tra source, build, deploy và thiết bị là các lớp riêng. Không đưa mật khẩu, token, service account, keystore, file môi trường hoặc bệnh án thật vào Git. File sinh tự động không phải source. Tài liệu cũ được truy từ lịch sử Git thay vì giữ nhiều bản sao trong cây hiện hành.
