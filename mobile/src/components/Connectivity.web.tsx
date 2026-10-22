import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import { ui } from '../lib/ui';
export function Connectivity() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync(); window.addEventListener('online', sync); window.addEventListener('offline', sync);
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync); };
  }, []);
  return online ? null : <View style={ui.notice}><Text accessibilityRole="alert" style={ui.error}>Thiết bị đang mất mạng. Yêu cầu chưa được coi là gửi thành công cho đến khi máy chủ xác nhận. Kết nối lại Internet rồi thử lại.</Text></View>;
}
