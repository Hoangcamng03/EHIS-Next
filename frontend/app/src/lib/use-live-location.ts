import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { usableFix, type LocationFix } from './live-location';

export function useLiveLocation(enabled: boolean) {
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const [fix, setFix] = useState<LocationFix | null>(null), [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [stage, setStage] = useState<'permission' | 'services' | 'watching'>('permission');
  useEffect(() => { const listener = AppState.addEventListener('change', value => setForeground(value === 'active')); return () => listener.remove(); }, []);
  useEffect(() => {
    if (!enabled || !foreground) return;
    let cancelled = false, subscription: Location.LocationSubscription | undefined, received = false;
    let firstFixTimer: ReturnType<typeof setTimeout> | undefined;
    function receive(value: Location.LocationObject) {
      if (cancelled) return;
      const next = { point: { latitude: value.coords.latitude, longitude: value.coords.longitude }, accuracy: value.coords.accuracy ?? Infinity, timestamp: value.timestamp };
      if (!usableFix(next, Date.now())) { setError('GPS chưa đủ chính xác hoặc điểm đã cũ. Ra nơi thoáng và kiểm tra quyền vị trí chính xác.'); return; }
      received = true; clearTimeout(firstFixTimer);
      setFix(previous => !previous || next.timestamp > previous.timestamp ? next : previous); setError('');
    }
    async function start() {
      setError('');
      setStage('permission');
      // Cover native permission/services startup too, not just the watcher.
      firstFixTimer = setTimeout(() => { if (!cancelled && !received) setError('Chưa lấy được GPS mới sau 15 giây. Kiểm tra vị trí chính xác, ra nơi thoáng hoặc thử lại GPS.'); }, 15000);
      let permission = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;
      if (permission.status !== 'granted' && permission.canAskAgain) permission = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (permission.status !== 'granted') throw new Error('permission');
      setStage('services');
      if (!await Location.hasServicesEnabledAsync()) throw new Error('services');
      if (cancelled) return;
      setStage('watching');
      // Show a recent accurate fix immediately while the foreground watcher warms up.
      void Location.getLastKnownPositionAsync({ maxAge: 15000, requiredAccuracy: 100 }).then(value => {
        if (value) receive(value);
      }).catch(() => undefined);
      // A stationary volunteer still needs a fresh timestamp. A distance filter can
      // suppress updates until movement and leave every cached fix older than 15s.
      const result = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 0 }, receive,
        () => { if (!cancelled) setError('GPS bị gián đoạn. Kiểm tra quyền vị trí rồi thử lại GPS.'); });
      if (cancelled) result.remove(); else subscription = result;
    }
    void start().catch(() => { if (!cancelled) { clearTimeout(firstFixTimer); setError('Chưa bật được GPS. Kiểm tra quyền vị trí, bật định vị rồi thử lại GPS.'); } });
    return () => { cancelled = true; clearTimeout(firstFixTimer); subscription?.remove(); };
  }, [enabled, foreground, attempt]);
  return { fix, error, foreground, stage, retry: () => setAttempt(value => value + 1) };
}
