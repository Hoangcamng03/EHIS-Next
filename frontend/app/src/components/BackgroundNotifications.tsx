import { useState } from 'react';
import { Platform, View } from 'react-native';
import { Text } from './AppText';
import { Button } from './ActionButton';
import { enableNativePush } from '../lib/native-push';
import { ui } from '../lib/ui';
export function BackgroundNotifications() {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('Bật thông báo trên thiết bị này để nhận yêu cầu khi bấm Home hoặc khóa màn hình.');
  if (Platform.OS !== 'android') return null;
  async function enable() { setBusy(true); try { setMessage(await enableNativePush()); } catch { setMessage('Chưa đăng ký được. Kiểm tra mạng, quyền thông báo và phiên bản APK rồi thử lại.'); } finally { setBusy(false); } }
  return <View style={ui.card}><Text style={ui.heading}>Thông báo khi khóa màn hình</Text><Text style={ui.caption} accessibilityLiveRegion="polite">{message}</Text><Button title="Bật / kiểm tra thông báo Android" loading={busy} disabled={busy} onPress={enable} /><Text style={ui.caption}>Ca mới chỉ tìm bạn trong 5 phút từ lần GPS gần nhất. Mở app để làm mới. Âm báo còn phụ thuộc cài đặt âm thanh và pin của Android.</Text></View>;
}
