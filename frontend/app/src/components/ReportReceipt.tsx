import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import { Button } from './ActionButton';
import { callable, firebaseClient } from '../lib/firebase';
import { useAppForeground } from '../lib/use-app-foreground';
export function ReportReceipt({ incidentId, assignmentAtMs, revision, enabled }: { incidentId: string; assignmentAtMs: number; revision: number; enabled: boolean }) {
  const foreground = useAppForeground(), [retry, setRetry] = useState(0), [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled || !foreground || revision < 1) return;
    let cancelled = false;
    callable(firebaseClient().functions, 'acknowledgeIncidentReport', { timeout: 10000 })({ incidentId, assignmentAtMs, revision }).then(() => { if (!cancelled) setFailed(false); }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [enabled, foreground, incidentId, assignmentAtMs, revision, retry]);
  return <View><Text style={{ fontSize: 14 }}>App đang hiển thị bản {revision}. Xác nhận tải không đồng nghĩa bạn đã đọc/đánh giá y khoa.</Text>{failed && <Button variant="secondary" title="Gửi lại xác nhận tải bản này" onPress={() => setRetry(n => n + 1)} />}</View>;
}
