import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { usableFix, type LocationFix } from './live-location';

export function useLiveLocation(enabled: boolean) {
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const [fix, setFix] = useState<LocationFix | null>(null), [error, setError] = useState('');
  useEffect(() => { const listener = AppState.addEventListener('change', value => setForeground(value === 'active')); return () => listener.remove(); }, []);
  useEffect(() => {
    if (!enabled || !foreground) return;
    let cancelled = false, subscription: Location.LocationSubscription | undefined;
    async function start() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (permission.status !== 'granted') throw new Error('permission');
      const result = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 3 }, value => {
        if (cancelled) return;
        const next = { point: { latitude: value.coords.latitude, longitude: value.coords.longitude }, accuracy: value.coords.accuracy ?? Infinity, timestamp: value.timestamp };
        if (!usableFix(next, Date.now())) { setError('GPS chưa đủ chính xác hoặc điểm đã cũ. Ra nơi thoáng và kiểm tra quyền vị trí chính xác.'); return; }
        setFix(previous => !previous || next.timestamp > previous.timestamp ? next : previous); setError('');
      }, () => { if (!cancelled) setError('GPS bị gián đoạn. Kiểm tra quyền vị trí và bật lại cập nhật.'); });
      if (cancelled) result.remove(); else subscription = result;
    }
    void start().catch(() => { if (!cancelled) setError('Chưa bật được GPS. Cho phép vị trí rồi tắt/bật lại cập nhật.'); });
    return () => { cancelled = true; subscription?.remove(); };
  }, [enabled, foreground]);
  return { fix, error, foreground };
}
