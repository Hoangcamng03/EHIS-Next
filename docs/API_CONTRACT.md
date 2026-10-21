# API contract v0.2

Chỉ các API ở mục Đã viết tồn tại. Không gọi API ở backlog như thể đã có.

## Đã viết (source; chưa deploy cloud)

Region: `asia-southeast1`.

### health — HTTP GET

Không Auth. Trả `{ service: "ehis-next", status: "ok", version: "0.1.0" }`. Không trả credentials hoặc dữ liệu người dùng.

### getMyAccess — callable

Cần Firebase Auth. Đầu vào rỗng. Trả uid từ token, isAdmin từ custom claim, isVerifiedVolunteer từ document server quản lý. Không nhận role/verified từ client.

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

Input `{ incidentId }`. Mỗi lần gọi kiểm tra đúng acceptedBy UID, approved và trạng thái accepted/arrived trong transaction. Trả `{ incidentId, phone, answers, revision, location }`; phone/answers null nếu chưa bổ sung. Không trả hồ sơ y tế. Người báo, TNV chưa nhận, TNV khác hoặc bị thu hồi xét duyệt đều bị từ chối.

### Firestore projection reads

- Người báo: `reporters/{auth.uid}/incidentStatuses/{incidentId}`: status, createdAt, invitedCount, reportSubmitted, reportRevision.
- TNV approved: `volunteers/{auth.uid}/alerts`, orderBy createdAt desc, limit 30; mỗi doc: incidentId, status offered/accepted/closed, distanceMeters, timestamps, reportRevision, answers. Không phone, vị trí chính xác hoặc danh tính bệnh nhân.
- Tất cả client-write đều bị chặn, kể cả sửa status, approved, assignment hoặc báo cáo. Gọi callable để ghi.

## Backlog cần chốt trước khi viết

issueCard/revokeCard; setAvailability; dispatchWave tối ưu theo vùng và nhiều đợt; getIncidentPatientData; getRoute; markArrived; completeIncident; reviewVolunteer; push/outbox/retry; App Check/rate limiting; audit/retention và xử lý ca hết hạn.

Quy ước: latitude/longitude là số; khoảng cách mét; thời lượng giây; thời hạn theo server. Client không gửi volunteerId để quyết định danh tính, không tự sửa acceptedBy, verified hoặc quyền admin.
