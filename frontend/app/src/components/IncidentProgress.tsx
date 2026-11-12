import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import { TextInput } from './AppTextInput';
import { ConfirmAction } from './ConfirmAction';
import { Button } from './ActionButton';
import { callable, firebaseClient, readableError } from '../lib/firebase';
import { useAppForeground } from '../lib/use-app-foreground';
import { travelState, type TravelProgress } from '../lib/travel-progress';
export function IncidentProgress({
  incidentId,
  assignmentAtMs,
  progress,
  connected,
  now,
}: {
  incidentId: string;
  assignmentAtMs: number;
  progress?: TravelProgress | null;
  connected: boolean;
  now: number;
}) {
  const [minutes, setMinutes] = useState('10'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [syncError, setSyncError] = useState('');
  const checkInAtMs = progress?.checkInAtMs;
  const foreground = useAppForeground(),
    pending = useRef(false),
    attempt = useRef<{ fingerprint: string; updateId: string } | null>(null);
  async function send(action: 'going' | 'blocked', obstacle?: string) {
    if (!connected || busy) return;
    const payload = {
        incidentId,
        assignmentAtMs,
        action,
        expectedProgressRevision: progress?.revision || 0,
        ...(action === 'going' ? { etaMinutes: Number(minutes) } : { obstacle }),
      },
      fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = {
        fingerprint,
        updateId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
    setBusy(true);
    setError('');
    try {
      await callable(
        firebaseClient().functions,
        'updateIncidentProgress',
      )({ ...payload, updateId: attempt.current.updateId });
      attempt.current = null;
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!connected || !foreground || checkInAtMs === undefined) return;
    let cancelled = false;
    const ping = async () => {
      if (pending.current) return;
      pending.current = true;
      try {
        await callable(firebaseClient().functions, 'updateIncidentProgress', { timeout: 10000 })({
          incidentId,
          assignmentAtMs,
          action: 'heartbeat',
          updateId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        });
        if (!cancelled) setSyncError('');
      } catch {
        if (!cancelled)
          setSyncError('Chưa xác nhận được kết nối. Kiểm tra mạng; giờ dự kiến không tự gia hạn.');
      } finally {
        pending.current = false;
      }
    };
    const timer = setInterval(() => {
      void ping();
    }, 90000);
    if (Date.now() - checkInAtMs >= 90000) void ping();
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [connected, foreground, checkInAtMs, incidentId, assignmentAtMs]);
  const handoverWaiting =
    progress?.obstacle === 'cannot_continue' &&
    typeof progress.handoverExpiresAtMs === 'number' &&
    progress.handoverExpiresAtMs > now;
  const state = travelState(progress, assignmentAtMs, now);
  return (
    <View
      style={{
        gap: 10,
        padding: 12,
        borderRadius: 12,
        backgroundColor: state.needsAttention ? '#fff0ce' : '#eef5ff',
      }}
    >
      <Text style={{ fontWeight: '700' }}>{state.title}</Text>
      {!!progress?.etaAtMs && (
        <Text>
          Dự kiến:{' '}
          {new Date(progress.etaAtMs).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          · do bạn xác nhận
        </Text>
      )}
      {!!progress?.firstEtaAtMs && progress.firstEtaAtMs !== progress.etaAtMs && (
        <Text>
          Mốc ban đầu:{' '}
          {new Date(progress.firstEtaAtMs).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          · vẫn được giữ khi đổi giờ.
        </Text>
      )}
      <Text>Số phút dự kiến đến (1–120)</Text>
      <TextInput
        accessibilityLabel="Số phút dự kiến đến"
        value={minutes}
        onChangeText={setMinutes}
        keyboardType="number-pad"
        maxLength={3}
        editable={!busy}
        style={{
          borderWidth: 1,
          borderColor: '#5f7c70',
          padding: 12,
          borderRadius: 8,
          backgroundColor: '#fff',
        }}
      />
      <Button
        title={progress ? 'Cập nhật giờ đến' : 'Xác nhận lên đường'}
        onPress={() => send('going')}
        disabled={
          !connected ||
          busy ||
          handoverWaiting ||
          !/^\d+$/.test(minutes) ||
          Number(minutes) < 1 ||
          Number(minutes) > 120
        }
      />
      <Button
        variant="secondary"
        title="Báo chậm đường"
        onPress={() => send('blocked', 'traffic')}
        disabled={!connected || busy || handoverWaiting}
      />
      <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#879a9c' }}>
        <ConfirmAction
          title={
            handoverWaiting && !!progress?.handoverInvitedCount
              ? 'Đang chờ người nhận thay'
              : progress?.obstacle === 'cannot_continue'
                ? 'Tìm lại người thay'
                : 'Không thể tiếp tục'
          }
          explanation="Hệ thống sẽ mời TNV khác đủ điều kiện. Ca chỉ chuyển khi có người mới xác nhận nhận bàn giao."
          onConfirm={() => send('blocked', 'cannot_continue')}
          disabled={!connected || busy || (handoverWaiting && !!progress?.handoverInvitedCount)}
        />
      </View>
      {progress?.obstacle === 'cannot_continue' && (
        <Text accessibilityLiveRegion="polite">
          {handoverWaiting
            ? progress.handoverInvitedCount
              ? `Đã mời ${progress.handoverInvitedCount} TNV. Đang chờ người nhận thay.`
              : 'Chưa có TNV sẵn sàng phù hợp. Hệ thống sẽ kiểm tra khi TNV khác bật Sẵn sàng; bạn có thể thử tìm lại.'
            : 'Lời mời chưa có hoặc đã hết hạn. Bấm tìm lại hoặc liên hệ quản trị.'}{' '}
          Bạn chưa được giải phóng ca cho đến khi bàn giao thành công.
        </Text>
      )}
      <Text style={{ fontSize: 14 }}>
        Dự kiến, không phải bảo đảm đến đúng giờ. Mạng/4G không xác nhận bạn đã di chuyển. Kết nối
        được kiểm tra khi màn này mở; không theo dõi GPS nền.
      </Text>
      {(state.overdue || state.stale) && (
        <Text accessibilityRole="alert">
          Cần cập nhật tiến độ hoặc liên hệ quản trị để bàn giao; ca vẫn do bạn phụ trách.
        </Text>
      )}
      {!!error && <Text accessibilityRole="alert">{error}</Text>}
      {!!syncError && <Text accessibilityRole="alert">{syncError}</Text>}
    </View>
  );
}
