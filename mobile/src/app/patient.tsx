import { ModuleOverview } from '../components/ModuleOverview';
export default function PatientScreen() {
  return <ModuleOverview title="Bệnh nhân" owner="TV3" tasks={[
    'Đăng nhập và quản lý phiên người dùng',
    'Nhập và cập nhật hồ sơ qua savePatientProfile',
    'Cấp cardId và hiển thị QR',
    'Thu hồi thẻ, ghi URL lên NFC sau khi kiểm tra thiết bị',
  ]} />;
}
