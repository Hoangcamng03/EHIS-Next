import { useState } from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import { Button } from './ActionButton';
import { ui } from '../lib/ui';

export function InstallGuide({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return <View style={compact ? { gap: 8 } : ui.card}>{!compact && <><Text style={ui.heading}>Dùng EHIS trên điện thoại</Text><Text style={ui.body}>Mở bằng trình duyệt trên iPhone, Android hoặc máy tính. Không cần Expo Go.</Text></>}<Button title={open ? 'Ẩn hướng dẫn' : 'Cách thêm EHIS vào màn hình chính'} onPress={() => setOpen(value => !value)} color="#526f67" />{open && <>
    <Text style={ui.body}>iPhone: mở địa chỉ này bằng Safari → Chia sẻ → Thêm vào Màn hình chính → Thêm. Bật “Mở dưới dạng ứng dụng web” nếu có.</Text>
    <Text style={ui.body}>Android: mở bằng Chrome → menu ⋮ → Cài đặt ứng dụng hoặc Thêm vào màn hình chính. Tên mục phụ thuộc trình duyệt.</Text>
    <Text style={ui.body}>Nếu đang mở trong Zalo/Facebook hoặc không có mục cài, chọn mở bằng trình duyệt ngoài. Bạn vẫn có thể sử dụng trực tiếp mà không cài.</Text>
    <Text style={ui.body}>Cần Internet để lưu hồ sơ, gửi và nhận yêu cầu. Giữ giao diện tình nguyện viên mở khi sẵn sàng; chưa có thông báo nền. Đây là bản web, chưa phải ứng dụng iOS trên TestFlight/App Store.</Text>
  </>}</View>;
}
