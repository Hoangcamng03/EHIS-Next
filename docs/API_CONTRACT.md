# API contract v0.4

Chỉ các API ở mục Đã viết tồn tại. Không gọi API ở backlog như thể đã có.

## Đã viết

Cloud API đang chạy trên Vercel; trạng thái phát hành từng thay đổi ghi trong LAB_NOTES.md. Phần lựa chọn tài khoản bên dưới thuộc source 0.4.2, chỉ coi deploy sau khi có bằng chứng trong lab note.

Region: `asia-southeast1`.

### health — HTTP GET

Không Auth. Trả `{ service: "ehis-next", status: "ok", version: "0.4.2", projectId }`. Không trả credentials hoặc dữ liệu người dùng.

### getMyAccess — callable

Cần Firebase Auth. Đầu vào rỗng. Trả uid từ token, isAdmin từ custom claim, isVerifiedVolunteer từ document server quản lý và `accountPurpose: "patient" | "volunteer" | null`. Không nhận role/verified từ client. Ưu tiên accountPurpose đã lưu trong users/{uid}; tài khoản cũ chưa lưu dùng volunteer/application tồn tại trước, rồi patient profile; không có dữ liệu thì null và UI yêu cầu hoàn tất một lần.

### setAccountPurpose — callable (0.4.2)

Cần tài khoản đăng ký, từ chối anonymous. Chỉ nhận `{ purpose: "patient" | "volunteer" }`; UID lấy từ token. Ghi bằng transaction vào users/{uid}, merge giữ field cũ, không ghi role/admin/verification. Cùng lựa chọn được thử lại an toàn; đổi lựa chọn đã lưu trả failed-precondition. Trả `{ accountPurpose }` khi đã lưu. Lựa chọn chỉ quyết định giao diện, không cấp quyền nhận ca. Tài khoản cũ có cả hai loại hồ sơ sẽ ưu tiên Volunteer nếu chưa lưu lựa chọn; nhóm hỗ trợ xử lý ngoại lệ trước nghiệm thu. Không có endpoint tự đổi đối tượng ở đợt này.

### savePatientProfile — callable

Cần tài khoản đã đăng ký; không chấp nhận anonymous. Đầu vào:

```json
{
  "fullName": "Demo Patient",
  "allergies": ["Demo allergy"],
  "emergencyContactPhone": "0900000000"
}
```

Đây là dữ liệu tổng hợp. Hàm xác định UID từ token, chỉ ghi hồ sơ UID đó, chỉ chấp nhận 3 field kể trên. Trả `{ "saved": true }`. Lỗi: unauthenticated, invalid-argument; lỗi hệ thống vẫn là lỗi, không trả saved=true.

Đây chưa phải schema hồ sơ y tế hoàn chỉnh. Khi bổ sung trường, cập nhật parser, contract và test cùng PR.

`emergencyContactPhone` vẫn là chuỗi nhưng có thể rỗng khi chưa có liên hệ. Nếu nhập thì phải đúng định dạng 8–15 chữ số, dấu + tùy chọn. Không bắt buộc Patient phải có người liên hệ mới dùng được thẻ.

### createIncident — callable

Cần Auth, cho phép anonymous. Input `{ cardId, requestId, location: { latitude, longitude } }`. Identifier 8–100 ký tự chữ/số/underscore/hyphen; không nhận reporterUid, patientId hoặc danh sách TNV từ client. Kiểm tra thẻ active và patient tồn tại. Vị trí người báo đã xác nhận đang ở cạnh bệnh nhân, không tự suy ra từ hồ sơ.

Trả `{ incidentId, status, invitedCount }` sau transaction tạo incident, vị trí riêng tư, trạng thái người báo và lời mời. `invitedCount` không phải số người đã nhận. `0` vẫn là backend đã nhận yêu cầu, UI phải nói rõ chưa có TNV phù hợp. Frontend chỉ chuyển trang sau thành công.

Cùng UID + requestId + payload trả cùng ca; dùng lại ID với payload khác trả invalid-argument. Thẻ đang có ca dispatching/accepted/arrived trả already-exists mà không lộ mã ca của phiên khác. Prototype mời tối đa 5/100 TNV eligible, bán kính 5km, lastSeen <=5 phút, offer 10 phút; chưa tự đóng ca.

### submitBystanderReport — callable

Cần đúng Auth UID tạo incident. Input:

```json
{
  "incidentId": "incident-from-createIncident",
  "submissionId": "fresh-random-id-for-this-payload",
  "phone": "",
  "answers": { "responsiveness": "unknown", "breathing": "unknown", "bleeding": "unknown" }
}
```

`phone` không bắt buộc; thiếu/null/chuỗi rỗng → null. Nếu nhập: tối đa 40 ký tự, bỏ khoảng trắng/ngoặc/chấm/gạch ngang, còn 8–15 chữ số với dấu + tùy chọn. Không xác thực sở hữu số. Không lưu phone trong URL/localStorage/log/alert công khai.

Ba câu trả lời bắt buộc, mỗi câu có `unknown`. responsiveness: responsive/unresponsive/unknown; breathing: normal/abnormal/unknown; bleeding: none_seen/visible/unknown. Đây là quan sát người chứng kiến, không chẩn đoán hay chấm điểm phân loại cấp cứu.

Trả `{ received: true, revision }`. Mỗi payload mới cần submissionId mới. Retry cùng ID + payload trả revision cũ, không ghi lặp. Trạng thái cho phép: dispatching/accepted/arrived. Cập nhật cùng incident, không tạo ca mới. Trước accept cập nhật alerts những TNV được mời; sau accept chỉ cập nhật TNV phụ trách. Phone chỉ lưu trong private/reporter. Firestore listener đang mở sẽ nhận revision mới; chưa gửi push nền.

### acceptIncident — callable

Cần TNV approved, có lời mời của chính UID, ca dispatching chưa quá offerExpiresAt và không bận ca khác. Input `{ incidentId }`. Transaction đổi phân công, khóa TNV, cập nhật trạng thái người báo, đóng lời mời TNV khác. Trả `{ incidentId, status }`; chỉ một người thắng khi nhận đồng thời. Retry người đã nhận trả cùng kết quả.

### getVolunteerIncidentDetails — callable

Input `{ incidentId }`. Mỗi lần gọi kiểm tra đúng acceptedBy UID, approved và trạng thái accepted/arrived trong transaction. Trả `{ incidentId, phone, answers, revision, location, patientProfile }`; phone/answers null nếu chưa bổ sung. `patientProfile` null nếu card.shareProfile không true; nếu có consent thì chỉ trả fullName, allergies, emergencyContactPhone của hồ sơ tự khai. Không trả hồ sơ cho người báo/TNV chưa nhận/TNV khác/bị thu hồi xét duyệt hoặc ca đã đóng. Không ghi các giá trị này vào URL bản đồ.

### setVolunteerAvailability — callable

Input `{ available: boolean, location?: {latitude, longitude} }`. UID lấy từ Auth; bắt buộc approved. Bật true yêu cầu vị trí số hữu hạn trong phạm vi hợp lệ, không được đang phụ trách ca; cập nhật lastSeenAt theo server. Tắt false không cần vị trí. Không nhận role/verified/UID từ client. Trả `{ available }`. Mobile làm mới mỗi 30 giây chỉ khi màn hình active và đã chủ động bật sẵn sàng trong phiên này; không phải GPS nền. Location là do client tự khai, chưa có xác minh chống giả mạo.

### updateIncidentLocation — callable, thêm 0.4.6

Input `{ incidentId, updateId, location: {latitude, longitude} }`; identifier như createIncident, tọa độ hữu hạn, latitude -85..85, longitude -180..180, không nhận field thừa. Auth UID phải là reporterUid của ca; chỉ sửa khi accepted/arrived và đã có acceptedBy. UI yêu cầu lấy GPS đủ mới/chính xác và xác nhận đứng cạnh bệnh nhân; backend không thể chứng minh vị trí client là thật.

Trả `{received:true, revision, locationRevision}`. Ghi đè private/location, tăng reportRevision và locationRevision riêng, giữ phone/answers, chỉ báo lại TNV phụ trách. Không đưa tọa độ vào projection/alert/audit/event, không lưu lịch sử điểm. Event chỉ chứa fingerprint chống lặp và revision. Cùng UID/updateId/payload trả ack cũ kể cả sau đóng, không ghi lại; payload khác cùng ID trả invalid-argument. Phiên khác permission-denied, chưa nhận/đã đóng failed-precondition. Trước nhận phải hủy/gửi lại để chọn TNV theo điểm mới.

getVolunteerIncidentDetails thêm `locationRevision` (ca cũ mặc định 0). Alert của TNV phụ trách và trạng thái người báo thêm locationRevision. Client phải ẩn điểm cũ khi revision vị trí chưa khớp. Mọi ghi client trực tiếp vẫn bị Rules từ chối; rate limit callable hiện có áp dụng.

### finishIncident — callable

Input `{ incidentId, outcome: "completed" | "cancelled" }`. completed: chỉ acceptedBy còn approved, ca accepted/arrived. cancelled: chỉ reporterUid khi ca dispatching chưa acceptedBy. Transaction đóng ca/projection/alerts, giải phóng activeIncidentId trên thẻ nếu còn đúng ca đó, giải phóng TNV và đặt offline khi completed. Retry cùng outcome bởi chủ thể hợp lệ là idempotent. Sau đóng, API thông tin riêng tư bị từ chối; đặt purgeAfter sau 24 giờ; cron hằng ngày dọn private/location, private/reporter và answers trong alerts, có thể trễ vì quota/backlog.

### Khôi phục và hết hạn

Cùng reporter UID mở một tab mới với requestId khác có thể nhận lại mã ca đang active của chính mình. Người khác không nhận được mã đó. Khi create mới gặp ca dispatching đã quá 10 phút, transaction đóng ca cũ là expired và tạo ca mới; không tự hết hạn ca đã accepted. Ngoài dọn theo yêu cầu, worker trên Vercel chạy hằng ngày; hạn nhận vẫn được kiểm tra ngay tại API. Retry requestId cũ của ca dispatching quá hạn trả status expired. Trạng thái người báo có thêm offerExpiresAt để UI chặn gửi muộn; backend cũng chặn bổ sung quá hạn. Web xóa cache vị trí/request sau ack, vẫn giữ payload chưa được ack để retry an toàn.

Backend lưu `reporters/{uid}/requestReceipts/{hash(requestId)}` (client không đọc/ghi) với fingerprint + incidentId. Vì vậy retry một request đã khôi phục ca của tab khác vẫn trả chính ca đó kể cả sau khi ca đóng, không âm thầm tạo ca mới khi ack trước bị mất. Payload khác dùng lại cùng requestId bị từ chối.

### Firestore projection reads

- Người báo: `reporters/{auth.uid}/incidentStatuses/{incidentId}`: status, createdAt, invitedCount, reportSubmitted, reportRevision.
- TNV approved: `volunteers/{auth.uid}/alerts`, orderBy createdAt desc, limit 30; mỗi doc: incidentId, status offered/accepted/closed, distanceMeters, timestamps, reportRevision, answers. Không phone, vị trí chính xác hoặc danh tính bệnh nhân.
- Tất cả client-write đều bị chặn, kể cả sửa status, approved, assignment hoặc báo cáo. Gọi callable để ghi.

## Backlog cần chốt trước khi viết

dispatchWave tối ưu theo vùng và nhiều đợt; routing production; push/outbox/retry; App Check cưỡng chế và giám sát vận hành. v0.4 đã có rate limiting cơ bản, retention riêng và worker hằng ngày; xem phần cuối tài liệu.

Quy ước: latitude/longitude là số; khoảng cách mét; thời lượng giây; thời hạn theo server. Client không gửi volunteerId để quyết định danh tính, không tự sửa acceptedBy, verified hoặc quyền admin.

## Patient / quyền TNV / vòng đời v0.3

Các API dưới đây yêu cầu tài khoản đã đăng ký, không nhận anonymous, lấy UID từ token. Input thừa field bị từ chối.

- `issuePatientCard({shareProfile: boolean})`: bắt buộc đã lưu hồ sơ của UID. Transaction tạo cardId ngẫu nhiên 24 byte và pointer `patientCards/{uid}`. Trả `{cardId, active: true, shareProfile}`. Gọi lặp/đồng thời với cùng lựa chọn trả thẻ active hiện có. Muốn đổi consent thì thu hồi và phát hành thẻ mới; không đổi âm thầm thẻ đang có. QR chỉ do client ghép website đã cấu hình + `/card?id=cardId`.
- `revokePatientCard({cardId})`: đúng Patient chủ thẻ; chặn khi ca dispatching/accepted/arrived còn active. Gỡ active và cập nhật pointer; retry idempotent. Có thể hủy ca chưa nhận trước rồi thu hồi. Thẻ cũ không tạo được ca mới; phát hành lại được mã mới.
- `applyVolunteer({fullName, phone, experience})`: tên 1–100 ký tự, phone định dạng 8–15 chữ số với dấu + tùy chọn, kinh nghiệm tự khai 1–500 ký tự. Ghi `volunteerApplications/{uid}` pending. Đơn pending gửi lặp giữ nguyên; không tự tạo approved. Đơn rejected có thể nộp lại.
- `listVolunteerApplications({})`: chỉ token.admin true, tối đa 50 pending; trả uid, fullName, phone, experience. Không cho client query toàn bộ applicants bằng Rules.
- `reviewVolunteerApplication({uid, decision})`: chỉ token.admin true; decision approved/rejected, đơn phải pending và TNV không có ca active. Transaction đổi application và volunteers.verificationStatus, đặt isAvailable=false, audit hành động. Không có API tự cấp claim admin; bootstrap local bằng script Emulator, cloud bằng scripts/cloud-access.cjs admin <UID> từ operator tin cậy.
- `markIncidentArrived({incidentId})`: chỉ TNV approved phụ trách, ca accepted → arrived; lặp arrived idempotent. Cập nhật projection Patient/người báo/alert TNV. Đây là xác nhận chủ động, không phải bằng chứng GPS đã tới.
- `cancelPatientIncident({incidentId})`: chỉ Patient chủ ca, chỉ dispatching chưa acceptedBy; lặp cancelled idempotent. Đóng ca, cập nhật projections và giải phóng thẻ. Người báo vẫn dùng finishIncident outcome cancelled theo quyền cũ.

Thêm owner reads `patientCards/{uid}`, `volunteerApplications/{uid}`, `patients/{uid}/incidentStatuses` (createdAt desc, limit 30). Không thêm bất kỳ client write nào. Projection Patient chỉ chứa trạng thái, thời gian, invitedCount; không phone người báo, vị trí chính xác hoặc hồ sơ TNV. create/accept/arrived/completed/cancelled/expired cập nhật projection tương ứng. Các ca cũ trước v0.3 không được tự backfill.

## Hosting API v0.4

Các callable nghiệp vụ đi qua POST /api/<operation>, body {data: payload}, Bearer Firebase ID token. Token thiếu/sai trả 401. Production dùng httpsCallableFromURL; Emulator dùng httpsCallable như trước. GET /api/health trả version runtime và projectId. Chỉ allowlist được định tuyến, JSON tối đa 32KB; tên endpoint lạ trả 404.

Mỗi callable có hạn theo phút: 120/UID, riêng createIncident 30/UID, 600/IP băm; vượt trả resource-exhausted. _requestLimits chỉ backend truy cập. App Check chỉ cưỡng chế nếu được cấu hình/bật, hiện chưa bật.

GET /internal/maintenance yêu cầu Bearer CRON_SECRET, không dùng token client. Chạy hằng ngày: tối đa 50 dispatch hết hạn, 50 ca đủ hạn purgeAfter, 200 counter cũ. Không purge ca accepted/arrived. Index incidents(status, offerExpiresAt) đã deploy.
