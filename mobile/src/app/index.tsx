import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { AuthGate, AccountBar } from '../components/Session';
import { ui } from '../lib/ui';
import { isLocalEmulator } from '../lib/firebase';

export default function HomeScreen() {
  return <AuthGate>{() => <ScrollView contentContainerStyle={ui.page}>
    <Text style={ui.eyebrow}>EHIS · HỖ TRỢ CỘNG ĐỒNG</Text><Text style={ui.title}>Bạn muốn làm gì?</Text>
    <Text style={ui.body}>Quản lý thông tin của bạn hoặc tham gia hỗ trợ người khác. Có thể dùng cả hai khu vực bằng cùng tài khoản.</Text>
    <AccountBar />
    <Link href="/patient" asChild><Pressable style={ui.card}><Text style={ui.heading}>Bệnh nhân →</Text><Text style={ui.body}>Hồ sơ sức khỏe · thẻ QR · theo dõi ca hỗ trợ</Text></Pressable></Link>
    <Link href="/volunteer" asChild><Pressable style={ui.card}><Text style={ui.heading}>Tình nguyện viên →</Text><Text style={ui.body}>Đăng ký xét duyệt · nhận ca · đường đi · hoàn tất</Text></Pressable></Link>
    <View style={ui.notice}><Text>EHIS kết nối hỗ trợ cộng đồng, không đảm bảo có TNV tiếp nhận và không thay thế dịch vụ cấp cứu.</Text>{isLocalEmulator && <Text>Đang chạy thử bằng dữ liệu giả trên Emulator. Giữ màn hình TNV mở để nhận lời mời; chưa có thông báo đẩy khi app đóng.</Text>}</View>
  </ScrollView>}</AuthGate>;
}
