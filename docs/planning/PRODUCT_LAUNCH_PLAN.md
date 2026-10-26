# EHIS — chiến lược MVP và vận hành có kiểm soát

Ngày đánh giá: 2026-10-23. Cơ sở: web 0.4.4, STATUS và ARCHITECTURE. Đây là đề xuất, không phải chứng nhận sẵn sàng lâm sàng. Quyết định địa điểm, người chịu trách nhiệm y tế và ngân sách đang chờ chủ dự án.

## Định vị và phạm vi

Ưu tiên một cơ sở có phòng y tế/đội sơ cứu và lịch trực. EHIS hỗ trợ báo tin, chia sẻ tối thiểu theo quyền và theo dõi tiếp nhận; không hứa thay thế hệ thống cấp cứu. QR hiện chứa đường dẫn, không chứa bệnh án. Hồ sơ hiện là tự khai; chưa có bộ hướng dẫn sơ cứu được người có chuyên môn duyệt.

## Backlog theo mức ưu tiên

| ID / mức | Việc cần làm | Điều kiện hoàn tất | Chủ trì |
|---|---|---|---|
| P0-01 Cao | Thêm đường liên hệ cấp cứu/đầu mối cơ sở luôn thấy, kể cả GPS/API lỗi; hiển thị rõ chưa có người nhận | Người thử tìm đúng hành động trong 5 giây; số liên hệ được đối tác xác nhận | UX + vận hành |
| P0-02 Cao | Giám sát thời gian gửi → backend nhận → thiết bị nhận → con người nhận; escalation khi không ai nhận | Diễn tập mất mạng/khóa máy/quá hạn có đầu mối dự phòng; không coi push receipt là người nhận | Backend + mobile |
| P0-03 Cao | Sửa dispatch giới hạn 100 người, tuổi vị trí 5 phút và hết hạn 10 phút theo vùng pilot; worker xử lý theo hạn, không dựa cron ngày | Kiểm tra TNV gần không bị bỏ sót; ca quá hạn không tiếp tục chờ vô hạn; ngưỡng do đội vận hành duyệt | Backend |
| P0-04 Cao | Bản đồ có mốc địa chỉ/tầng/phòng, xử lý từ chối GPS và chỉ dẫn không có mạng | Tìm được điểm hẹn trong diễn tập; không suy đoán tuyến ô tô là đường xe máy/cấp cứu | UX + mobile |
| P0-05 Cao | Người phụ trách y tế duyệt nội dung sơ cứu ngắn, phiên bản và ngày rà soát | Có phê duyệt nội dung, thử hiểu với người không chuyên; không chẩn đoán bằng AI | Chuyên môn |
| P0-06 Cao | Xác minh năng lực TNV, phạm vi được làm, lịch trực, huấn luyện và chuyển giao | Mỗi ca trực có người chính/dự phòng; có SOP và diễn tập | Đối tác |
| P0-07 Cao | Bản đồ dữ liệu, thời hạn lưu/xóa theo loại, đồng ý chia sẻ, audit xem hồ sơ, kế hoạch sự cố | Kiểm tra thu hồi/quyền/xóa; luật sư rà Firebase Singapore, Vercel, bản đồ và truyền dữ liệu qua biên giới | Backend + pháp lý |
| P0-08 Cao | Tách fixture và tài khoản thử khỏi môi trường tiếp nhận thật; thu hồi mật khẩu dùng chung trước launch | Không còn tài khoản chung truy cập dữ liệu thật; quản trị có xác thực mạnh | Tech lead |
| P1-01 Trung bình | Push native + âm thanh/rung thật, đo nền/khóa màn hình/pin yếu | Kiểm tra thiết bị thật, receipt và escalation; chỉ phát native sau chủ dự án duyệt web | Mobile |
| P1-02 Trung bình | Quan sát lỗi, cảnh báo quota, rollback, backup/khôi phục, thử tải | Có người trực cảnh báo và chạy diễn tập khôi phục; không ghi PHI/token vào telemetry | Tech lead |
| P2-01 Thấp | NFC, AI, tích hợp bệnh viện sâu, chat/video, gamification, mở nhiều tỉnh | Hoãn đến khi pilot chứng minh nhu cầu và khả năng vận hành | Product |

## MVP giữ/cắt và flow

Giữ: hồ sơ tối thiểu, QR thu hồi được, consent, báo hai bước/phone tùy chọn, TNV đã duyệt, nhận ca nguyên tử, bản đồ, trạng thái, hủy/kết thúc, audit.

Hoãn: NFC, chẩn đoán AI, mạng xã hội, điểm thưởng, theo dõi GPS liên tục, toàn bộ bệnh án, dẫn đường giọng nói và tuyển TNV tự do toàn thành phố.

Flow đề xuất: quét QR → màn liên hệ cấp cứu + hướng dẫn đã duyệt + nút báo đội hỗ trợ → gửi vị trí có xác nhận → hiển thị backend đã nhận/chưa ai nhận → câu hỏi quan sát ngắn, phone tùy chọn → TNV xác nhận hoặc đầu mối trực xử lý → hướng dẫn điểm hẹn → bàn giao/kết thúc. Không buộc trả lời questionnaire trước đường gọi cấp cứu. Không tự tạo ca chỉ vì quét QR.

## Roadmap và cổng nghiệm thu

1. Tuần 1: chọn cơ sở, người phụ trách, sơ đồ trách nhiệm, hazard log, phạm vi dữ liệu; chưa mở ca thật.
2. Tuần 2–3: giải quyết P0 kỹ thuật/UX, nội dung có duyệt, telemetry không chứa bệnh án; tuyển đội hạt giống theo lịch trực thay vì số đăng ký.
3. Tuần 4: UAT 12–20 người gồm người ít quen công nghệ; ít nhất 30 diễn tập trên thiết bị/mạng khác nhau. Thử khóa máy, GPS sai, không ai nhận, hai người nhận, API timeout, QR thu hồi, báo nhầm, người đã nhận mất liên lạc.
4. Tuần 5–6: diễn tập kín tại cơ sở, họp rà từng ca và lỗi. Chỉ mở pilot ca thật sau khi có người chịu trách nhiệm y tế, SOP, rà pháp lý, vận hành dự phòng và các lỗi P0 đóng.

Mục tiêu UAT đề xuất (chưa đo): ≥90% hoàn thành gửi tin không cần hướng dẫn; p95 backend xác nhận ≤3 giây sau payload sẵn sàng, p95 cập nhật foreground ≤5 giây trên mạng thử đã định nghĩa; không mất/nhân đôi phân công, không lộ dữ liệu trái quyền. Đo cold start và timeout riêng. Ngưỡng con người tiếp nhận/đến nơi do đối tác xác lập từ diễn tập, không quảng cáo như SLA. Dừng pilot nếu lộ dữ liệu, mất yêu cầu không escalation hoặc phát hiện nội dung chỉ dẫn không an toàn.

Nhóm 4 người: (1) Product/UX, kịch bản và báo cáo UAT; (2) mobile, thiết bị và thông báo; (3) backend, quyền, dispatch và đo thời gian; (4) QA/vận hành, đối tác và tài liệu. Người phụ trách y tế và luật sư là vai trò bổ sung; sinh viên không tự thay thế các vai trò này.

## Go-to-market — chuẩn bị, chưa ưu tiên bán

Giả thuyết khách hàng trả tiền đầu tiên: cơ sở quản lý cộng đồng có đội sơ cứu. Người dùng cuối là người hưởng lợi; cần kiểm chứng willingness-to-pay qua phỏng vấn, chưa chốt giá.

- Nhà đầu tư: bằng chứng cải thiện tiếp nhận trong vùng có đội phản ứng, khả năng triển khai lặp lại và chi phí mỗi cơ sở; chưa tuyên bố giảm tử vong.
- Bệnh viện/cơ sở: thông tin tối thiểu theo quyền, quy trình chuyển giao và truy vết; chưa hứa tích hợp HIS/EHR.
- Người dùng: không cần app để báo tin, QR không công khai bệnh án, biết có ai thực sự nhận.
- Deck 10 trang: vấn đề; địa điểm/khách hàng; flow; demo; khác biệt; bằng chứng UAT; an toàn/dữ liệu; mô hình và chi phí; roadmap/đội; đề nghị hợp tác. Không bịa TAM, traction hoặc hiệu quả lâm sàng.

## Pháp lý và vận hành ca thật

Trước launch: xác định bên kiểm soát/xử lý dữ liệu; rà consent và căn cứ xử lý khẩn; đánh giá nghĩa vụ chuyển dữ liệu qua biên giới, lưu/xóa và thông báo sự cố; xác định phạm vi hoạt động TNV và phân loại sản phẩm theo mục đích sử dụng; ký phân công trách nhiệm, chuyển giao và bảo hiểm thích hợp. Checkbox miễn trừ không thay cho các bước này. Không tự khẳng định có miễn trách nhiệm chung cho TNV.

Trong ca: nhận → xác nhận con người → điều phối dự phòng nếu không phản hồi → hỗ trợ trong phạm vi năng lực → bàn giao đơn vị phù hợp → ghi nhận sự kiện tối thiểu → review sau ca. Giữ bằng chứng sự cố theo quy trình đã được duyệt; không xóa tự động dữ liệu đang phải bảo toàn.

Nguồn để đội chuyên môn/pháp lý rà tiếp:
- WHO community responders: https://www.who.int/teams/integrated-health-services/clinical-services-and-systems/emergency-and-critical-care/community-based-care
- Luật 91/2025/QH15: https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroup=
- Quy định sức khỏe: https://xaydungchinhsach.chinhphu.vn/quy-dinh-bao-ve-du-lieu-ca-nhan-doi-voi-thong-tin-suc-khoe-va-trong-hoat-dong-kinh-doanh-bao-hiem-119250725170233556.htm

Không thay code điều phối/ngưỡng y khoa dựa trên giả định chưa thống nhất. Tự sửa lỗi kỹ thuật có bằng chứng và kiểm thử; hỏi quyết định khi thay phạm vi hỗ trợ, dữ liệu, chi phí hoặc trách nhiệm. Mọi phiên thay đổi ghi LAB_NOTES.md.

## Quyết định chủ dự án sau trao đổi
- Giai đoạn hiện tại: chỉ diễn tập phần mềm, dữ liệu giả, giữ hạ tầng miễn phí; nhóm kỹ thuật y sinh phát triển và thử nghiệm.
- Nhóm TNV mục tiêu về sau là sinh viên trường y; chưa có đội ngũ hoặc người phụ trách chuyên môn. Không coi tư cách sinh viên y là đủ xác nhận năng lực cấp cứu.
- Chưa chốt địa điểm pilot. Liên hệ đối tác sau khi phần mềm đạt tiêu chí UAT; đề xuất trao đổi yêu cầu sớm để tránh xây sai flow, không đồng nghĩa tiếp nhận ca thật.
- Thay tiêu chí không lỗi tuyệt đối bằng: không còn lỗi P0/P1 đã biết, kịch bản trọng yếu đạt, lỗi còn lại có người phụ trách, có đường dự phòng và bằng chứng thiết bị.
