import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import { travelState, type TravelProgress } from '../lib/travel-progress';
import { useAppForeground } from '../lib/use-app-foreground';
export function TravelStatusText({ progress, acceptedAtMs, connected }: { progress?: TravelProgress | null; acceptedAtMs?: number | null; connected: boolean }) {
  const [now, setNow] = useState(Date.now), foreground = useAppForeground();
  useEffect(() => { if (!foreground) return; const timer = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(timer); }, [foreground]);
  if (!connected) return <Text>Chưa xác nhận được tiến độ mới từ máy chủ.</Text>;
  const state = travelState(progress, acceptedAtMs, now);
  return <View style={{ gap: 6, padding: 12, borderRadius: 10, backgroundColor: state.needsAttention ? '#fff0ce' : '#eef5ff' }}>
    <Text style={{ fontWeight: '700' }}>{state.title}</Text>
    {progress?.etaAtMs ? <Text>Dự kiến khoảng {new Date(progress.etaAtMs).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · do TNV xác nhận, có thể đổi.</Text> : null}
    {!!progress?.firstEtaAtMs && progress.firstEtaAtMs !== progress.etaAtMs && <Text>Mốc ban đầu: {new Date(progress.firstEtaAtMs).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}.</Text>}
    {state.needsAttention && <Text>Cần người phụ trách liên hệ kiểm tra; không tự chuyển hoặc đóng ca.</Text>}
    {progress && <Text style={{ fontSize: 14 }}>{state.stale ? 'Chưa có cập nhật kết nối mới.' : `App TNV kết nối lúc ${new Date(progress.checkInAtMs).toLocaleTimeString('vi-VN')}.`} Kết nối không xác nhận GPS hoặc đã đến nơi.</Text>}
  </View>;
}
