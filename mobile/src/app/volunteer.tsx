import { ModuleOverview } from '../components/ModuleOverview';
export default function VolunteerScreen() {
  return <ModuleOverview title="Tình nguyện viên" owner="TV2" tasks={[
    'Đăng ký xét duyệt; quyền do backend kiểm tra',
    'Bật sẵn sàng và cập nhật vị trí',
    'Nhận lời mời và tiếp nhận ca bằng transaction',
    'Bản đồ, hồ sơ được cấp quyền, đến nơi và hoàn thành',
  ]} />;
}
