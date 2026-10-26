# Chuyển sang cấu trúc repository mới — 26/10/2026

## 1. Đường dẫn thay đổi

| Trước | Sau | Trách nhiệm |
| --- | --- | --- |
| mobile/ | frontend/app/ | Patient/TNV và build Expo |
| web/ | frontend/web/ | Người báo, quản trị và trang cài |
| functions/ | backend/ | API, nghiệp vụ, phân quyền và test backend |
| docs nhiều file cùng cấp | docs/demo, architecture, development, testing, operations, planning | Tài liệu theo công việc |

Đầu mối giữ nguyên: [README](../../README.md), [docs/README](../README.md), [START_HERE_DEMO](../START_HERE_DEMO.md), [STATUS](../STATUS.md), [LAB_NOTES](../LAB_NOTES.md). Thư mục source đổi không đổi địa chỉ app/web, Firebase project, API/schema, package ID hoặc phiên bản APK.

## 2. Thành viên đang có code trên máy

1. Ghi lại nhánh/commit và lưu công việc đang sửa bằng commit riêng hoặc stash, gồm file mới. Không dùng reset --hard hoặc xóa thư mục để ép đồng bộ.
2. Fetch và đọc PR di chuyển. Với source sạch, chuyển sang nhánh đã bàn giao; không merge tùy tiện vào bản có thay đổi local.
3. Cài dependency theo lockfile ở ba đường dẫn mới, chạy setup:local và doctor:local. Node 22, Java 21. Không copy node_modules/build output vào Git.
4. Các file môi trường trên máy cũ: app chuyển vào frontend/app, web vào frontend/web; backend/.vercel là liên kết Vercel trên từng máy. Chỉ người vận hành mới chuyển cấu hình riêng; không in secret hoặc đưa vào commit. Mẫu env hiện hành nằm trong module.
5. Khôi phục công việc dang dở theo bảng đường dẫn, review diff và chạy test trước khi ghép. Bản UI 0.4.8 ở checkout cũ chưa được áp vào đợt sắp xếp; không coi source mất chỉ vì đổi cây thư mục.

## 3. Các lệnh thay tên

| Trước | Nay |
| --- | --- |
| npm run mobile | npm run app |
| npm run mobile:web | npm run app:web |
| npm run functions:build | npm run backend:build |

Các lệnh check, test:integration, web, setup:local và cloud:* giữ tên, đường dẫn bên trong đã đổi. EAS build chạy từ frontend/app; hook pre-install trỏ ../../scripts. Firebase config dùng source backend và hai thư mục artifact frontend mới.

## 4. Cấu hình triển khai ngoài Git

Script Vercel đã dùng backend làm thư mục chạy. Nếu project có liên kết Git tự deploy, người vận hành phải kiểm tra Root Directory trong Vercel trước khi hợp nhất: từ functions sang backend; giữ Build Command npm run build, không xoay secret hoặc tạo project khác. Nếu chỉ dùng CLI, liên kết lại đúng project từ backend khi cần deploy; không deploy để thử thao tác sắp xếp.

Giữ package ID/EAS project, Firebase project/Hosting site và backend URL. Đổi source không cần phát APK/OTA hay deploy dữ liệu. Build web/Android JS kiểm tra khả năng đóng gói; cloud đang chạy vẫn là bản cũ đến khi có đợt phát hành riêng.

Tham chiếu: [Expo monorepos](https://docs.expo.dev/guides/monorepos/), [Vercel monorepos](https://vercel.com/docs/monorepos). Không nâng dependency/framework trong đợt đổi đường dẫn.

## 5. Dọn file và quay lui

Đã bỏ hai entry mẫu Expo App.tsx/index.ts vì main đang là expo-router/entry, ModuleOverview chưa từng được import, splash-icon không được cấu hình, CSS/SVG mẫu Next.js không được import và .gitkeep thừa cạnh file backend public có sẵn. Sáu tài liệu cũ bị lặp/đã thay thế được lấy từ lịch sử Git khi cần. Các bản đồ native/web, file .web.tsx, audit, test, Rules và lockfile vẫn có mục đích riêng, không xóa theo tên giống nhau.

Nếu regression do di chuyển, chặn hợp nhất/phát hành, sửa đường dẫn và chạy lại lớp bị ảnh hưởng; chưa sửa được thì quay lui commit sắp xếp qua PR, không xóa dữ liệu cloud. Các sửa UI chưa phát hành được giữ riêng để tiếp tục sau đợt này.
