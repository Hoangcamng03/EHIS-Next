# API contract v0.4

## Bổ sung ngày 12/11/2026

- `createIncident`: tối đa 6 yêu cầu mới/thẻ trong cửa sổ trượt 60 phút; kiểm tra/ghi cùng transaction của ca và card. Retry ID cũ hoặc trở lại ca đang mở của chính phiên không tính thêm lượt. Hết lượt trả HTTP429, `details.reason = card-request-budget`. Không bỏ giới hạn tài khoản/IP hiện có. Sáu mốc thời gian là dữ liệu backend-only trên card.
- Budget IP: Vercel chỉ dùng header ingress `x-vercel-forwarded-for` hợp lệ; local/Functions dùng địa chỉ kết nối. Header thiếu/sai không được thay bằng IP proxy dùng chung. Test IP khác nhau dùng địa chỉ tài liệu, chưa nghiệm thu hai mạng cloud.
- API quản trị ngoài custom claim trong token còn đối chiếu Auth hiện hành (`admin=true`, chưa khóa). Token admin cũ bị chặn sau khi bỏ claim; cần đăng nhập lại để giao diện nhận quyền mới. Runtime dùng quyền đọc Auth đã được cấp, không bổ sung quyền tạo/sửa tài khoản.
- Server portable tự lấy danh sách export callable; không xuất scheduler/health thành callable. App Check web có điểm cấu hình key nhưng chưa bật cưỡng chế cho toàn bộ client native/web.

Chỉ các API ở mục Đã viết tồn tại. Không gọi API ở backlog như thể đã có.

## Thay đổi 0.4.13 — diễn tập có người theo dõi

- `submitBystanderReport({incidentId, submissionId, phone?, answers, meetingNote?})`: ghi chú mốc tìm bệnh nhân tùy chọn, chuỗi tối đa 240 ký tự, trim, không nhận ký tự điều khiển. Chỉ phiên tạo ca gửi; gửi lại ID với payload khác bị chặn. Bỏ trường giữ ghi chú cũ (APK cũ tương thích); `""` xóa ghi chú. Không thay vị trí đã xác nhận.
- Mỗi lần báo thay toàn bộ `answers`, không giữ chi tiết triệu chứng của bộ cũ. Web chỉ gửi `meetingNote` sau khi chỉnh ô; reload rồi chỉ trả lời câu hỏi không tự xóa ghi chú đã gửi.
- `getVolunteerIncidentDetails` thêm `meetingNote: string`, mặc định `""`; chỉ TNV đã nhận ca còn hoạt động được xem. Không thêm ghi chú vào alerts, push, bảng tổng hợp hoặc URL bản đồ. Dọn cùng tài liệu private/reporter sau đóng ca.
- `getOperationsOverview({})`: chỉ admin, read-only. Trả `checkedAtMs`, `pushEnabled`, `counts` gồm dispatching/accepted/arrived/expiredWaiting/pendingNotifications/dueNotifications/expiredPendingNotifications/failedNotifications; `oldestWaiting` tối đa năm `{incidentId,invitedCount,expiresAtMs}`. Không chứa bệnh án, người bệnh, phone hoặc GPS. Số quá hạn là phần trong tổng đang chờ, không cộng hai số thành tổng mới. Dữ liệu là ảnh chụp theo thời điểm, không phải snapshot transaction toàn hệ thống.
- `retryPendingNotifications({})`: chỉ admin; tối đa 20 job pending, lease đã đến hạn và expiresAt còn hiệu lực. Trả `{scanned,acceptedByFcm}` hoặc `{skipped:true}` trên Emulator/FCM tắt. FCM chấp nhận không chứng minh điện thoại nhận/reo. Không gia hạn lời mời, không tạo ca, không chuyển người phụ trách. Không dùng API này để giả định worker liên tục.
- Job có `leaseOwner` ngẫu nhiên và `deviceResults` chỉ chứa hash thiết bị, kết quả terminal và thời điểm. Retry bỏ thiết bị đã ghi nhận terminal; worker cũ không ghi đè lease mới. Vẫn có cửa sổ gửi lặp nếu nhà cung cấp nhận nhưng tiến trình dừng trước khi lưu receipt. Không cam kết exactly-once.
- App hiển thị sẵn sàng chỉ khi GPS máy chủ <=5 phút, không tương lai >1 phút. Mở lại app khôi phục refresh foreground của tài khoản đang ON, không tự hỏi quyền GPS. Backend vẫn quyết định đủ điều kiện điều phối; không bổ sung GPS nền.

Đầu mối trực chưa được nhóm cung cấp. Hai biến Hosting `NEXT_PUBLIC_DUTY_CONTACT_NAME` và `NEXT_PUBLIC_DUTY_CONTACT_PHONE` để trống; chỉ hiện nút gọi khi cả hai hợp lệ. Khi lỗi/chưa có người nhận, web nói rõ chưa cấu hình và hướng người thử tới người phụ trách tại chỗ. Không tự dùng số cá nhân hoặc 115.

## Thay đổi source 0.4.12 — vùng quản lý, quan sát và thiết bị

Trạng thái triển khai từng lớp tra [STATUS](../STATUS.md).

- `listVolunteerRoster({serviceArea?, organisation?, after?})`: chỉ admin, lọc chính xác tên vùng/đơn vị. Trả `volunteers` đã duyệt hoặc tạm dừng, tối đa 50 mỗi trang + `next` cursor; trường quản lý gồm tên, phone, địa chỉ cư trú/làm việc, phân loại, số tháng, đơn vị, vùng và trạng thái có ca. Không trả bệnh án/GPS bệnh nhân. Có index cho vùng, đơn vị và kết hợp cả hai.
- `updateVolunteerRegion({uid, serviceArea})`: chỉ admin, vùng 2..100 ký tự, audit người/thời điểm. Không thay GPS, ca đang nhận hoặc tiêu chí điều phối. Vùng phục vụ quản lý; điều phối vẫn gần nhất trong 5 km, kể cả qua ranh giới.
- `setVolunteerSuspension({uid, suspended, reason})`: chỉ admin, lý do 10..300 ký tự, chỉ hồ sơ approved/suspended. Transaction từ chối nếu có `activeIncidentId` để tránh bỏ rơi ca. Tạm dừng và khôi phục đều đặt OFF; sau khôi phục TNV phải tự bật lại. Ghi audit; không chuyển ca tự động.
- Duyệt TNV lưu tên/phone/địa chỉ/người giới thiệu cùng phân loại đã xác minh vào hồ sơ quản lý. Nếu đơn vị hiện tại của người giới thiệu khác đơn vị trong checklist, không duyệt bằng checklist cũ: phải xác nhận lại.
- `submitBystanderReport.answers` giữ ba enum cũ để APK cũ tương thích. Thêm tùy chọn `breathingDetail: difficulty | gasping | not_seen` chỉ khi `breathing=abnormal`; `bleedingDetail: small | heavy` chỉ khi `bleeding=visible`. Trường thừa/xung đột bị từ chối. Đây là điều người báo nhìn thấy, không suy ra chẩn đoán. Lựa chọn “Chưa rõ” luôn có. Số điện thoại vẫn tùy chọn.
- `getVolunteerIncidentDetails` trả thêm `reportedAtMs: number | null` từ thời gian máy chủ; TNV được phân công thấy thời điểm cập nhật. Tên và liên hệ bệnh nhân chỉ sau nhận ca + consent, không thêm vào lời mời/push công khai.
- `registerVolunteerDevice({token, enabled, replaceToken?})`: thay token thuộc đúng UID bằng transaction, không làm đầy giới hạn ba máy khi FCM đổi token; token tài khoản khác bị từ chối. Khi bật/đăng ký lại, khôi phục tối đa 100 lời mời còn hạn và ca đang phụ trách cho đúng thiết bị mới. Trả thêm `recoveryQueued`, `recoveryOverflow`; không phát lại ca đóng, GPS cũ/OFF hoặc trên thiết bị khác. Job khôi phục có ID theo hash thiết bị, không lưu token thô trong job. Native theo dõi đổi token và hủy đăng ký trước logout; không tự xin quyền khi chưa opt-in. `queued`/FCM accepted không chứng minh điện thoại đã reo.

Không thay hạn mức 120/UID/phút, 30 create/UID/phút, 600/IP/phút. Thử nghiệm chia cohort đã bỏ vì không chứng minh cải thiện tải lạnh.

## Thay đổi source 0.4.11 — xác minh đơn vị và thông báo

Trạng thái deploy tra trong [STATUS](../STATUS.md). Không suy ra source đã chạy cloud.

- `getMyAccess`: thêm `isReferrer`, chỉ true khi registry `volunteerReferrers/{uid}.enabled` do admin quản lý.
- `savePatientProfile`: thêm `emergencyContactName` (≤100) + `emergencyContactRelationship` (≤60). Nếu gửi một trường mới phải gửi đủ cả hai, đồng thời đủ phone/name/relationship hoặc cả ba rỗng. Client cũ bỏ cả hai vẫn sửa các trường khác được; backend chặn đổi phone khi đã có tên/quan hệ để tránh gắn sai danh tính. `getVolunteerIncidentDetails.patientProfile` trả thêm hai trường sau assignment + consent, không thêm vào offers/QR/push.
- `applyVolunteer`: chỉ nhận `fullName, phone, experience, trainingLevel, clinicalMonths, homeAddress, workAddress, serviceArea, referrerEmail`. Ba mức `first_aid | clinical_student | clinical_staff`; tháng integer 0..600, first_aid phải 0; địa chỉ ≤200, khu vực ≤100, email ≤254. Email chỉ định tài khoản đã xác minh email, không khóa, có registry enabled, không cùng UID. Ghi policyVersion=2, applicationRevision tăng, referral=null, status=pending. Gửi lại thay đơn cũ; TNV đã approved không tự đổi hồ sơ quyền qua API này. Client cũ cần dùng web/APK mới để nộp đơn mới.
- `setVolunteerReferrer`: admin-only; `{email, fullName, phone, organisation, position, verificationNote, enabled}`. Email tài khoản có thật, đã xác minh email nếu cấp quyền. Admin phải đối chiếu chức vụ qua đơn vị trước. Ghi registry + audit, không tạo claim từ client, không tự tạo account. Thu quyền không tự rút TNV đã duyệt.
- `listReferrerApplications`: input `{}`, registry enabled mỗi lần; trả organisation + tối đa 50 đơn pending chỉ định UID này. Danh sách này có địa chỉ/liên hệ nên không dùng Firestore client trực tiếp; Rules chặn registry và hồ sơ người khác.
- `submitVolunteerReferral`: `{uid, applicationRevision, decision: recommended | not_recommended, checklist: {identityChecked, affiliationChecked, trainingChecked, scopeExplained}, confirmedLevel, confirmedClinicalMonths, evidence}`. Chỉ người giới thiệu được chỉ định còn quyền, không tự giới thiệu, đơn pending đúng revision; recommended cần đủ bốn boolean true. Bằng chứng ≤500. Checklist không tự cấp quyền nhận ca.
- `reviewVolunteerApplication`: thêm applicationRevision integer≥1; admin duyệt đúng revision. Approved cần policyVersion2 + referral recommended + đủ checklist + đúng người giới thiệu đang enabled; backend đọc lại Auth để chặn tài khoản bị khóa hoặc chưa xác minh email. Ghi `verificationPolicyVersion: 2` trên volunteer, classification/clinicalMonths/serviceArea/organisation từ hồ sơ đã kiểm tra, isAvailable=false. Hồ sơ cũ thiếu revision cần gửi lại theo mẫu mới; tài khoản demo đã approved trước đây không được tự coi là xác minh chuyên môn mới.
- `registerVolunteerDevice`: `{token, enabled}`; UID từ Auth, enabled=true chỉ TNV approved. Token native FCM bounded 20..4096, tối đa 3 device/TNV, ownership hash tránh dùng chéo tài khoản; enabled=false gỡ token của chính UID. Trả `{registered, pushEnabled}`; registered không chứng minh delivery.
- `pushJobs`: queue trong transaction tạo lời mời / bổ sung / đổi điểm / ON muộn; ID băm uid+incident+kind+revision. Backend-only, tối đa 20 job/đợt, 5 attempts, lease 30s và expiration, có purgeAfter. Vercel waitUntil gửi sau response; retry phụ thuộc request tiếp theo/cron, chưa SLA hoặc worker liên tục. Chỉ generic lock-screen text và opaque incidentId; không PHI. Trạng thái accepted-by-fcm không phải delivered/read/audible. Native foreground tiếp tục dùng feed, không hai chuông.

Các đoạn mô tả 0.4 bên dưới là API trước khi thêm trường; áp dụng các ràng buộc bổ sung ở mục này. [Quy trình quản lý](../operations/VOLUNTEER_VERIFICATION.md), [thông báo Android](../operations/ANDROID_BACKGROUND_ALERTS.md).

## Đã viết

Cloud API đang chạy trên Vercel; trạng thái phát hành từng thay đổi ghi trong LAB_NOTES.md. Phần lựa chọn tài khoản bên dưới thuộc source 0.4.2, chỉ coi deploy sau khi có bằng chứng trong lab note.

Region: `asia-southeast1`.

### health — HTTP GET

Không Auth. Trả `{ service: "ehis-next", status: "ok", version: "0.4.12", projectId }`. Không trả credentials hoặc dữ liệu người dùng.

### getMyAccess — callable

Cần Firebase Auth. Đầu vào rỗng. Trả uid từ token, isAdmin từ custom claim, isVerifiedVolunteer từ document server quản lý và `accountPurpose: "patient" | "volunteer" | null`. Không nhận role/verified từ client. Ưu tiên accountPurpose đã lưu trong users/{uid}; tài khoản cũ chưa lưu dùng volunteer/application tồn tại trước, rồi patient profile; không có dữ liệu thì null và UI yêu cầu hoàn tất một lần.

### setAccountPurpose — callable (0.4.2)

Cần tài khoản đăng ký, từ chối anonymous. Chỉ nhận `{ purpose: "patient" | "volunteer" }`; UID lấy từ token. Ghi bằng transaction vào users/{uid}, merge giữ field cũ, không ghi role/admin/verification. Cùng lựa chọn được thử lại an toàn; đổi lựa chọn đã lưu trả failed-precondition. Trả `{ accountPurpose }` khi đã lưu. Lựa chọn chỉ quyết định giao diện, không cấp quyền nhận ca. Tài khoản cũ có cả hai loại hồ sơ sẽ ưu tiên Volunteer nếu chưa lưu lựa chọn; nhóm hỗ trợ xử lý ngoại lệ trước nghiệm thu. Không có endpoint tự đổi đối tượng ở đợt này.

### savePatientProfile — callable

Từ0.4.20: thêm `medicalConditions?: string[]` (tối đa20mục, mỗi mục1–100ký tự sau trim). Đây là bệnh nền/tiền sử tự khai, không phải chẩn đoán cấp cứu. Bỏ trường giữ dữ liệu cũ cho APK19 trở về trước; gửi `[]` xóa danh sách. Patient đọc hồ sơ của mình; `getVolunteerIncidentDetails.patientProfile.medicalConditions` chỉ trả cho TNV đang phụ trách khi có consent, hồ sơ cũ mặc định `[]`. Không đưa bệnh nền vào QR/offers/push/projection người báo.

Cần tài khoản đã đăng ký; không chấp nhận anonymous. Đầu vào:

```json
{
  "fullName": "Demo Patient",
  "allergies": ["Demo allergy"],
  "emergencyContactPhone": "0900000000",
  "emergencyContactName": "Người thân giả",
  "emergencyContactRelationship": "Mẹ"
}
```

Đây là dữ liệu tổng hợp. Hàm xác định UID từ token, chỉ ghi hồ sơ UID đó, chỉ chấp nhận các field kể trên. Trả `{ "saved": true }`. Ràng buộc đủ bộ liên hệ và tương thích client cũ ở mục 0.4.11. Lỗi: unauthenticated, invalid-argument; lỗi hệ thống vẫn là lỗi, không trả saved=true.

Đây chưa phải schema hồ sơ y tế hoàn chỉnh. Khi bổ sung trường, cập nhật parser, contract và test cùng PR.

`emergencyContactPhone` vẫn là chuỗi nhưng có thể rỗng khi chưa có liên hệ. Nếu nhập thì phải đúng định dạng 8–15 chữ số, dấu + tùy chọn. Không bắt buộc Patient phải có người liên hệ mới dùng được thẻ.

### createIncident — callable

Cần Auth, cho phép anonymous. Input `{ cardId, requestId, location: { latitude, longitude } }`. Identifier 8–100 ký tự chữ/số/underscore/hyphen; không nhận reporterUid, patientId hoặc danh sách TNV từ client. Kiểm tra thẻ active và patient tồn tại. Vị trí người báo đã xác nhận đang ở cạnh bệnh nhân, không tự suy ra từ hồ sơ.

Trả `{ incidentId, status, invitedCount }` sau transaction tạo incident, vị trí riêng tư, trạng thái người báo và lời mời. `invitedCount` không phải số người đã nhận. `0` vẫn là backend đã nhận yêu cầu, UI phải nói rõ chưa có TNV phù hợp. Frontend chỉ chuyển trang sau thành công.

Cùng UID + requestId + payload trả cùng ca; dùng lại ID với payload khác trả invalid-argument. Thẻ đang có ca dispatching/accepted/arrived trả already-exists mà không lộ mã ca của phiên khác. Từ 0.4.7, query bbox/timestamp mới trước giới hạn, lọc Haversine trong 5km và mời tối đa 5 TNV gần nhất. Vùng truy vấn có hơn 1000 ứng viên trả resource-exhausted với details.reason=dispatch-capacity trước ghi incident/projection/pointer. Latitude hỗ trợ -85..85, longitude -180..180; query tách ở kinh tuyến 180. lastSeen <=5 phút, không quá tương lai 1 phút; offer 10 phút. API chặn quá hạn ngay; worker ngày không phải điều phối/escalation liên tục.

Lưu ý source09/11: cùng UID+requestId+payload đang chạy được gộp trong một process để giảm tranh khóa. Không cache sau hoàn tất; Firestore receipt/transaction vẫn quyết định giữa các instance. Mỗi HTTP request vẫn qua Auth/budget; khác payload cùng ID trả invalid-argument. Hết256key đang xử lý trả resource-exhausted, details.reason=create-busy; retry giữ nguyên requestId/payload. Không phải cam kết giao đúng một lần; tra STATUS để phân biệt source và backend đã deploy.

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

Trả `{ received: true, revision }`. Mỗi payload mới cần submissionId mới. Retry cùng ID + payload trả revision cũ, không ghi lặp. Trạng thái cho phép: dispatching/accepted/arrived. Cập nhật cùng incident, không tạo ca mới. Trước accept cập nhật alerts những TNV được mời; sau accept chỉ cập nhật TNV phụ trách. Phone chỉ lưu trong private/reporter. Firestore listener đang mở nhận revision mới; từ 0.4.11 backend xếp thêm job thông báo Android như đầu tài liệu.

### acceptIncident — callable

Cần TNV approved, có lời mời của chính UID, ca dispatching chưa quá offerExpiresAt và không bận ca khác. Input `{ incidentId }`. Transaction đổi phân công, khóa TNV, cập nhật trạng thái người báo, đóng lời mời TNV khác. Trả `{ incidentId, status }`; chỉ một người thắng khi nhận đồng thời. Retry người đã nhận trả cùng kết quả.

### getVolunteerIncidentDetails — callable

Input `{ incidentId }`. Mỗi lần gọi kiểm tra đúng acceptedBy UID, approved và trạng thái accepted/arrived trong transaction. Trả `{ incidentId, phone, answers, revision, location, patientProfile }`; phone/answers null nếu chưa bổ sung. `patientProfile` null nếu card.shareProfile không true; nếu có consent thì chỉ trả fullName, allergies, medicalConditions, emergencyContactPhone/name/relationship của hồ sơ tự khai. Không trả hồ sơ cho người báo/TNV chưa nhận/TNV khác/bị thu hồi xét duyệt hoặc ca đã đóng. Không ghi các giá trị này vào URL bản đồ.

### setVolunteerAvailability — callable

Input `{ available: boolean, location?: {latitude, longitude} }`. UID lấy từ Auth; bắt buộc approved. Bật true yêu cầu vị trí số hữu hạn trong phạm vi hợp lệ, không được đang phụ trách ca; cập nhật lastSeenAt theo server. Tắt false không cần vị trí. Không nhận role/verified/UID từ client. Từ 0.4.9 trả `{ available, matchedCount }`. Khi chuyển OFF→ON, vị trí trước đã quá 5 phút hoặc di chuyển >=250m, transaction tìm thêm ca dispatching chưa nhận/còn hạn, trong 5km, không phải Patient tự nhận; đưa đúng revision/answers hiện tại vào lời mời, giữ phone/vị trí riêng. Không gia hạn ca hoặc tạo ca mới. Đợt đầu vẫn tối đa 5 TNV; bổ sung giới hạn tổng 20 người/ca và không gửi lặp cho UID đã mời. Quét tối đa 100 ca còn chờ trên pilot bằng index status/offerExpiresAt; vượt trả resource-exhausted/reason=pending-dispatch-capacity trước ghi availability/lời mời, không cắt âm thầm. Mọi reads trước writes để tranh nhận/hủy/bổ sung được retry nhất quán. Không quét lại trên heartbeat 30 giây không đổi vùng. Mobile làm mới mỗi 30 giây chỉ khi màn hình active và đã chủ động bật sẵn sàng trong phiên này; không phải GPS nền. Location là do client tự khai, chưa có xác minh chống giả mạo.

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
- TNV approved: `volunteers/{auth.uid}/alerts`, lịch sử orderBy createdAt desc/limit 30, từ 0.4.9 thêm listener status==offered/orderBy createdAt desc/limit 101; hiển thị tối đa 100 lời mời và cảnh báo nếu vượt, ca active ghim bằng listener riêng. Index alerts(status ASC, createdAt DESC) phải READY trước frontend mới. Không để lịch sử mới đẩy lời mời còn hạn ra ngoài danh sách. Mỗi doc: incidentId, status offered/accepted/closed, distanceMeters, timestamps, reportRevision, answers. Không phone, vị trí chính xác hoặc danh tính bệnh nhân.
- Tất cả client-write đều bị chặn, kể cả sửa status, approved, assignment hoặc báo cáo. Gọi callable để ghi.

## Backlog cần chốt trước khi viết

dispatchWave tối ưu theo vùng và nhiều đợt; routing production; push/outbox/retry; App Check cưỡng chế và giám sát vận hành. v0.4 đã có rate limiting cơ bản, retention riêng và worker hằng ngày; xem phần cuối tài liệu.

Quy ước: latitude/longitude là số; khoảng cách mét; thời lượng giây; thời hạn theo server. Client không gửi volunteerId để quyết định danh tính, không tự sửa acceptedBy, verified hoặc quyền admin.

## Patient / quyền TNV / vòng đời v0.3

Các API dưới đây yêu cầu tài khoản đã đăng ký, không nhận anonymous, lấy UID từ token. Input thừa field bị từ chối.

- `issuePatientCard({shareProfile: boolean})`: bắt buộc đã lưu hồ sơ của UID. Transaction tạo cardId ngẫu nhiên 24 byte và pointer `patientCards/{uid}`. Trả `{cardId, active: true, shareProfile}`. Gọi lặp/đồng thời với cùng lựa chọn trả thẻ active hiện có. Muốn đổi consent thì thu hồi và phát hành thẻ mới; không đổi âm thầm thẻ đang có. QR chỉ do client ghép website đã cấu hình + `/card?id=cardId`.
- `revokePatientCard({cardId})`: đúng Patient chủ thẻ; chặn khi ca dispatching/accepted/arrived còn active. Gỡ active và cập nhật pointer; retry idempotent. Có thể hủy ca chưa nhận trước rồi thu hồi. Thẻ cũ không tạo được ca mới; phát hành lại được mã mới.
- `applyVolunteer`: dùng đầy đủ schema 0.4.11 ở đầu trang. Đơn mới/sửa tăng revision và xóa referral trước khi chờ xác minh lại; không tự tạo approved.
- `listVolunteerApplications({})`: chỉ token.admin true, tối đa 50 pending; trả uid, fullName, phone, experience. Không cho client query toàn bộ applicants bằng Rules.
- `reviewVolunteerApplication`: thêm applicationRevision và checklist người quản lý theo schema 0.4.11 ở đầu trang. Chỉ token.admin true; đơn pending, đúng revision và TNV không có ca active. Transaction đổi application và volunteers.verificationStatus, đặt isAvailable=false, audit hành động. Không có API tự cấp claim admin; bootstrap local bằng script Emulator, cloud bằng scripts/cloud-access.cjs admin <UID> từ operator tin cậy.
- `markIncidentArrived({incidentId})`: chỉ TNV approved phụ trách, ca accepted → arrived; lặp arrived idempotent. Cập nhật projection Patient/người báo/alert TNV. Đây là xác nhận chủ động, không phải bằng chứng GPS đã tới.
- `cancelPatientIncident({incidentId})`: chỉ Patient chủ ca, chỉ dispatching chưa acceptedBy; lặp cancelled idempotent. Đóng ca, cập nhật projections và giải phóng thẻ. Người báo vẫn dùng finishIncident outcome cancelled theo quyền cũ.

Thêm owner reads `patientCards/{uid}`, `volunteerApplications/{uid}`, `patients/{uid}/incidentStatuses` (createdAt desc, limit 30). Không thêm bất kỳ client write nào. Projection Patient chỉ chứa trạng thái, thời gian, invitedCount; không phone người báo, vị trí chính xác hoặc hồ sơ TNV. create/accept/arrived/completed/cancelled/expired cập nhật projection tương ứng. Các ca cũ trước v0.3 không được tự backfill.

## Hosting API v0.4

Các callable nghiệp vụ đi qua POST /api/<operation>, body {data: payload}, Bearer Firebase ID token. Token thiếu/sai trả 401. Cloud dùng HTTPS + httpsCallableFromURL. Giao diện local 0.4.12 dùng `http://127.0.0.1:5201/api` cùng adapter HTTP, chỉ khi project demo và USE_EMULATORS=true; bộ integration vẫn gọi Functions Emulator để kiểm tra riêng. GET /api/health trả version runtime và projectId. Chỉ allowlist được định tuyến, JSON tối đa 32KB; tên endpoint lạ trả 404.

Mỗi callable có hạn theo phút: 120/UID, riêng createIncident 30/UID, 600/IP băm; vượt trả resource-exhausted. _requestLimits chỉ backend truy cập. App Check chỉ cưỡng chế nếu được cấu hình/bật, hiện chưa bật.

Tối ưu 26/10: trong mỗi process, các transaction budget dùng cùng IP/phút (hoặc UID khi không có IP) đi qua hàng đợi ngắn trước khi chạm Firestore để giảm tranh chấp/retry. Firestore transaction vẫn kiểm tra và tăng nguyên tử mọi counter, kể cả giữa các process/instance; không cấp thêm quota hoặc bỏ kiểm tra. Hàng đợi giữ tối đa 256 khóa, 64 lượt/khóa, chờ tối đa hai giây; quá tải trả resource-exhausted với details.reason=request-budget-busy. Chỉ transaction budget được xếp hàng; nghiệp vụ ca và phân quyền giữ nguyên, không tuần tự hóa cả luồng.

GET /internal/maintenance yêu cầu Bearer CRON_SECRET, không dùng token client. Từ0.4.14: lịch hằng ngày và admin chạy tay dùng chung khóa55s, nhiều trang50 ca/200 counter-push mỗi trang, tối đa50 trang/nhóm và ngân sách35s kiểm tra trước mỗi trang (không phải hard timeout). Lưu trạng thái complete/partial/failed ở _operations/maintenance; busy không ghi đè kết quả. Không purge ca accepted/arrived. Index incidents(status, offerExpiresAt) đã deploy.

## Feed TNV 0.4.7

Client đọc volunteers/{uid}.activeIncidentId từ owner snapshot và theo dõi riêng alert đó bên cạnh 30 alert gần nhất. Chỉ khóa mở thao tác khi owner approval và các stream cần thiết được xác nhận từ server. Quyền/backend không thay bởi đường dẫn hoặc pin UI. Khi nhận snapshot thu hồi quyền, xóa feed; không cam kết thu hồi ngay trên thiết bị đang offline hoặc xóa dữ liệu đã được người dùng xem/chụp lại.


## Phục hồi và bàn giao 0.4.14

- getBystanderReport({incidentId}): đúng reporterUid/phiên sở hữu, ca còn sống; trả phone/answers/meetingNote/revision/reportedAtMs của chính người gửi, không trả vị trí hay hồ sơ Patient. Ca đóng trả failed-precondition; không sở hữu trả permission-denied.
- submitBystanderReport thêm expectedRevision tùy chọn cho tương thích APK cũ. Client mới gửi revision đã đọc; sai trả failed-precondition reason=report-conflict. submissionId/fingerprint idempotent được kiểm tra trước revision để retry mất phản hồi không tạo bản mới. Cập nhật báo cáo pending handover chỉ gửi quan sát tối thiểu cho người được đề nghị.
- listHandoverCases({after?}): admin,25 ca accepted/arrived mỗi trang. listHandoverCandidates({incidentId}): admin, tối đa50 gần nhất trong5km, approved/ON/rảnh/GPS<=5phút, không trả tọa độ. Tái sử dụng index latitude/longitude/lastSeenAt hiện có; không giới hạn ca theo serviceArea.
- proposeIncidentHandover({incidentId,targetUid,requestId,reason}): admin,reason10–300 ký tự,requestId idempotent. Tạo handoverRequests/{requestId}, pointer pending5phút và alert tối thiểu. Không đổi acceptedBy/quyền riêng tư/activeIncidentId. Tổng người từng được mời giới hạn40 để giới hạn transaction cleanup; dispatch thông thường vẫn20.
- acceptIncidentHandover({incidentId,handoverId}): chỉ TNV được đề nghị,approved/ON/rảnh/GPS mới/trong5km. Kiểm tra lại proposal và người cũ; nguyên tử chuyển acceptedBy/active pointers, thu quyền cũ, cập nhật projections và lịch sử. Retry nhận thành công idempotent. Endpoint acceptIncident cũ không chuyển quyền bàn giao.
- cancelIncidentHandover({incidentId,handoverId}): admin, hủy pending và đóng alert mục tiêu; giữ người cũ. finishIncident đóng pending trong cùng transaction. Không có auto-close accepted hoặc auto-transfer khi hết5phút.
- listHandoverHistory({incidentId,after?}): admin,25 bản ghi/trang, lý do/tên từ-đến/trạng thái/thời điểm; pending hết hạn hiển thị expired. Client không được đọc trực tiếp subcollection. auditLogs thêm accept/private-read/propose/transfer/cancel metadata, không ghi payload sức khỏe hay phone. Chưa có chính sách lưu audit/lịch sử dài hạn đủ cho dữ liệu thật.
- runMaintenanceNow({}): admin, wrapper45s, dùng chung hàm dọn có ngân sách; không nhận cutoff do client tự chọn. getOperationsOverview bổ sung kết quả dọn gần nhất. Không phát sinh quyền IAM mới.
- listVolunteerRoster bổ sung checkedAtMs,lastSeenAtMs,locationFresh,readyForDispatch, không trả tọa độ. UI giảm theo tuổi GPS bằng đồng hồ local, không poll cloud mỗi10s. TNV heartbeat foreground lấy GPS30s nhưng ghi khi>=100m hoặc>=90s; resume/làm mới gửi chủ động.

Hướng dẫn người dùng: [Bàn giao và kiểm tra vận hành](../operations/HANDOVER_AND_MAINTENANCE.md). Xem STATUS để phân biệt source và bản đã triển khai.


## Tiến độ và xác nhận tải từ mã0.4.15

- updateIncidentProgress({incidentId,assignmentAtMs,updateId,action,etaMinutes?,obstacle?,expectedProgressRevision?}): đúng approved/TNV activeIncidentId/acceptedBy và acceptedAt.toMillis của lượt nhận; chỉ trạng thái accepted. going: ETA nguyên1–120 phút, expectedProgressRevision bắt buộc; blocked: obstacle traffic/vehicle/cannot_continue/other; heartbeat: không nhận ETA/revision/obstacle. Từ chối khóa lạ.
- Bản tiến độ state/etaAtMs/firstEtaAtMs/revision/updatedAtMs/checkInAtMs không chứa GPS/phone/hồ sơ. FirstETA giữ qua sửa giờ/báo trở ngại; ETA đặt theo giờ server, heartbeat không gia hạn. Explicit action có idempotency fingerprint chuẩn hóa và optimistic revision; heartbeat không lưu event và giới hạn ghi mỗi60s. Client chỉ gửi heartbeat90s khi foreground/màn ca mở; không tăng reportRevision hoặc rung chuông vì heartbeat.
- Ghi incident và owner alert/projections reporter+Patient trong transaction; events explicit/audit chỉ backend. Giữ số điện thoại/hồ sơ ở private như trước. Thêm assignmentAtMs vào getVolunteerIncidentDetails; listHandoverCases thêm travelProgress, không thêm tọa độ.
- acknowledgeIncidentReport({incidentId,assignmentAtMs,revision}): chỉ TNV approved/current assignment, accepted hoặc arrived; số bản1..reportRevision. Lưu max revision đã được app xác nhận, không lùi số bản, trả acknowledgedRevision. Reporter projection có volunteerLoadedRevision/volunteerLoadedAtMs. Đây là dữ liệu app tự xác nhận, không chứng minh con người đọc.
- Khi nhận/bàn giao: reset tiến độ và xác nhận tải, reporter acceptedAt đồng bộ server timestamp. Người cũ không thể gửi ETA/ack bằng token lượt cũ; người mới không kế thừa ETA/ack. Không tự chuyển/đóng ca khi trễ; arrived/completed chặn cập nhật tiến độ.
- Không thêm client write/Rules/index/IAM/billing. Dữ liệu tiến độ events/audit vẫn là metadata chưa có chính sách retention production; không dùng ca thật.

[Hướng dẫn gửi/nhận và giờ đến](../operations/REPORT_UPDATES_AND_ARRIVAL.md). Bản cũ chưa có xác nhận tải không được coi là TNV chưa đọc; chỉ hiện Chưa có xác nhận.

## 0.4.21 — Không thể tiếp tục và bàn giao tự động

`updateIncidentProgress` với `action: blocked, obstacle: cannot_continue` tạo đề nghị tự động trong cùng transaction với tiến độ: giữ người cũ cho tới khi người mới nhận, mời tối đa5TNV approved/sẵn sàng/GPS≤5phút/trong5km/không bận/không phải Patient. Lời mời5phút, cùng updateId không tạo thêm đề nghị. Không có ứng viên thì ghi trạng thái chờ rõ ràng, không đóng ca. TNV bật Sẵn sàng muộn được kiểm tra các handover còn hạn, tối đa100ca/20người một đề nghị/40người đã mời mỗi ca. Hết hạn phải bấm tìm lại; chưa có worker điều phối liên tục.

`handover.targetUids` bổ sung nhóm nhận, tương thích `targetUid` đơn của quản trị. `acceptIncidentHandover` vẫn transaction kiểm tra thành viên/GPS/quyền/assignment; hai người tranh chỉ một thắng. Người cũ được giải phóng và mất quyền riêng, mọi lời mời còn lại đóng, reporter/Patient cập nhật. Outbox push không chứa bệnh án; FCM acceptance không chứng minh máy đã reo. `going` bị chặn khi đang chờ đề nghị tự động; quản trị có thể hủy đề nghị trước khi TNV tiếp tục. Không tự giải phóng ca chỉ vì ETA trễ.
