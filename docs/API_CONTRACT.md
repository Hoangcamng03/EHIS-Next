# API contract v0.1

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

## Backlog cần chốt trước khi viết

issueCard/revokeCard; createIncident có requestId chống trùng; setAvailability; dispatchWave; acceptIncident có transaction và kiểm tra lời mời; getIncidentPatientData; getRoute; markArrived; completeIncident; reviewVolunteer.

Quy ước: latitude/longitude là số; khoảng cách mét; thời lượng giây; thời hạn theo server. Client không gửi volunteerId để quyết định danh tính, không tự sửa acceptedBy, verified hoặc quyền admin.
