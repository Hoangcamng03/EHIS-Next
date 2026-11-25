import { Text } from './AppText';
import { Button } from './ActionButton';
import { ToggleRow } from './ToggleRow';
import { InfoDisclosure } from './InfoDisclosure';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import * as Location from 'expo-location';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseClient, readableError, updateAvailability } from '../lib/firebase';
import { enableNativePush } from '../lib/native-push';
import { startBackgroundLocation, stopBackgroundLocation } from '../lib/background-location';
import { LocationMap } from './LocationMap';
import { MapPoint } from '../lib/map';
import { firstUsableLocation, withinLocationDeadline } from '../lib/location-request';
import type { LocationFix } from '../lib/live-location';
import { availabilityState } from '../lib/availability';
import { shouldSyncAvailability } from '../lib/availability-sync';

type Volunteer = {
  verificationStatus: string;
  isAvailable: boolean;
  activeIncidentId?: string | null;
  location?: MapPoint;
  lastSeenAt?: { toMillis(): number };
};
export async function currentLocationFix(askPermission: boolean, signal?: AbortSignal) {
  const deadline = Date.now() + 12000;
  const remaining = () => Math.max(1, deadline - Date.now());
  const permission = await withinLocationDeadline(
    askPermission
      ? Location.requestForegroundPermissionsAsync()
      : Location.getForegroundPermissionsAsync(),
    signal,
    remaining(),
  );
  if (permission.status !== 'granted') throw new Error('location-permission');
  if (!(await withinLocationDeadline(Location.hasServicesEnabledAsync(), signal, remaining())))
    throw new Error('location-disabled');
  const fix = (value: Location.LocationObject): LocationFix => ({
    point: { latitude: value.coords.latitude, longitude: value.coords.longitude },
    accuracy: value.coords.accuracy ?? Infinity,
    timestamp: value.timestamp,
  });
  const result = await firstUsableLocation(
    {
      last: async () => {
        const value = await Location.getLastKnownPositionAsync({
          maxAge: 10000,
          requiredAccuracy: 30,
        });
        return value ? fix(value) : null;
      },
      watch: (receive, fail) =>
        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 0,
          },
          (value) => receive(fix(value)),
          fail,
        ),
    },
    signal,
    remaining(),
  );
  return result;
}
export async function currentLocation(askPermission: boolean, signal?: AbortSignal) {
  return (await currentLocationFix(askPermission, signal)).point;
}
export function VolunteerAvailability({
  uid,
  now,
  paused = false,
  prepareAlerts,
}: {
  uid: string;
  now: number;
  paused?: boolean;
  prepareAlerts?: () => Promise<unknown>;
}) {
  const [volunteer, setVolunteer] = useState<Volunteer>();
  const [verifiedFromServer, setVerifiedFromServer] = useState(false);
  const [source, setSource] = useState<'gps' | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const epoch = useRef(0);
  const locationRequest = useRef<AbortController | null>(null);
  const availabilityWrite = useRef<Promise<unknown> | null>(null);
  const lastSent = useRef<{ point: MapPoint; at: number } | null>(null);
  const [phase, setPhase] = useState('');
  const [pushWarning, setPushWarning] = useState('');
  const [latestFix, setLatestFix] = useState<LocationFix | null>(null);
  useEffect(
    () => () => {
      epoch.current += 1;
      locationRequest.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (paused) {
      epoch.current += 1;
      locationRequest.current?.abort();
    }
  }, [paused]);
  useEffect(
    () =>
      onSnapshot(
        doc(firebaseClient().db, `volunteers/${uid}`),
        { includeMetadataChanges: true },
        (snapshot) => {
          setVerifiedFromServer(!snapshot.metadata.fromCache);
          setVolunteer(snapshot.exists() ? (snapshot.data() as Volunteer) : undefined);
        },
        (err) => {
          setVerifiedFromServer(false);
          setError(readableError(err));
        },
      ),
    [uid],
  );
  const refresh = useCallback(
    async (askPermission: boolean, force = false) => {
      const startedAt = epoch.current;
      locationRequest.current?.abort();
      const abort = new AbortController();
      locationRequest.current = abort;
      if (askPermission) setPhase('Đang lấy vị trí · tối đa 12 giây…');
      const fix = await currentLocationFix(askPermission, abort.signal);
      const location = fix.point;
      if (startedAt !== epoch.current || firebaseClient().auth.currentUser?.uid !== uid) return;
      setLatestFix(fix);
      if (!shouldSyncAvailability(lastSent.current, location, Date.now(), force || askPermission))
        return;
      if (askPermission) setPhase('Đang tìm ca gần bạn…');
      const write = updateAvailability({ available: true, location });
      availabilityWrite.current = write;
      await write;
      lastSent.current = { point: location, at: Date.now() };
    },
    [uid],
  );
  useEffect(() => {
    if (
      paused ||
      !verifiedFromServer ||
      !volunteer?.isAvailable ||
      volunteer.activeIncidentId ||
      volunteer.verificationStatus !== 'approved'
    )
      return;
    let inFlight = false,
      cancelled = false;
    const tick = async (force = false) => {
      if (AppState.currentState !== 'active' || inFlight) return;
      const refreshEpoch = epoch.current;
      inFlight = true;
      try {
        await refresh(false, force);
        if (!cancelled) setError('');
      } catch {
        if (!cancelled && refreshEpoch === epoch.current)
          setError('Chưa làm mới vị trí. Kiểm tra kết nối và bấm bật sẵn sàng lại.');
      } finally {
        inFlight = false;
      }
    };
    const interval = setInterval(() => {
      void tick();
    }, 30000);
    const resume = AppState.addEventListener('change', (state) => {
      if (state === 'active') void tick(true);
      else locationRequest.current?.abort();
    });
    // Restore foreground refresh after reopening an already-available account; never prompt for permission here.
    if (!source) void tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
      resume.remove();
      locationRequest.current?.abort();
    };
  }, [
    source,
    volunteer?.isAvailable,
    volunteer?.activeIncidentId,
    volunteer?.verificationStatus,
    verifiedFromServer,
    refresh,
    paused,
  ]);
  async function enable() {
    // Called inside the user's tap, before awaiting GPS, to satisfy autoplay policy.
    void prepareAlerts?.().catch(() => undefined);
    setPushWarning('');
    if (Platform.OS === 'android') {
      void enableNativePush()
        .then((status) => {
          if (/Chưa có quyền|bị tắt|im lặng|chưa bật/i.test(status)) setPushWarning(status);
        })
        .catch(() =>
          setPushWarning(
            'Chưa xác nhận được thông báo nền Android. Kiểm tra quyền thông báo và âm lượng chuông.',
          ),
        );
    }
    epoch.current += 1;
    // Avoid starting a second foreground GPS request while enabling readiness.
    setSource('gps');
    setBusy(true);
    setError('');
    try {
      await refresh(true);
      if (Platform.OS === 'android') {
        const bg = await startBackgroundLocation().catch(() => ({
          enabled: false,
          message: 'Chưa bật được GPS nền. Khi khóa màn hình quá 5 phút có thể cần mở lại app.',
        }));
        if (!bg.enabled && bg.message) setPushWarning((prev) => prev || bg.message);
      }
      setError('');
    } catch (err) {
      setError(
        err instanceof Error && err.message.startsWith('location-')
          ? 'Chưa lấy được GPS. Cho phép vị trí, kiểm tra dịch vụ định vị và thử lại.'
          : readableError(err),
      );
    } finally {
      setBusy(false);
      setPhase('');
    }
  }
  async function disable() {
    epoch.current += 1;
    locationRequest.current?.abort();
    setBusy(true);
    setSource(null);
    setError('');
    // A heartbeat already sent to the server must finish before OFF, so it cannot turn readiness back on.
    try {
      await stopBackgroundLocation();
      await availabilityWrite.current?.catch(() => undefined);
      await updateAvailability({ available: false });
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }
  const approved = verifiedFromServer && volunteer?.verificationStatus === 'approved';
  const state = availabilityState(volunteer, verifiedFromServer, paused, now);
  return (
    <View
      style={{
        gap: 10,
        padding: 12,
        backgroundColor: state.ready ? '#d9f3e2' : state.kind === 'stale' ? '#fff3d1' : '#edf1f3',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: state.ready ? '#167447' : state.kind === 'stale' ? '#8b6100' : '#879a9c',
      }}
    >
      <ToggleRow
        right
        accessibilityLabel="Sẵn sàng nhận yêu cầu hỗ trợ"
        label={
          busy
            ? phase || 'Đang xác nhận…'
            : !verifiedFromServer
              ? 'Đang đồng bộ…'
              : !approved
                ? 'Chờ duyệt tài khoản'
                : volunteer?.activeIncidentId
                  ? 'Đang phụ trách ca'
                  : paused
                    ? 'Tạm mất đồng bộ'
                    : state.kind === 'stale'
                      ? 'Cần làm mới vị trí'
                      : state.ready
                        ? '● Đang sẵn sàng'
                        : '○ Chưa sẵn sàng'
        }
        value={state.ready}
        disabled={paused || busy || !approved || !!volunteer?.activeIncidentId}
        onValueChange={(value) => {
          if (value) void enable();
          else void disable();
        }}
      />
      <Text style={{ fontSize: 13, color: '#405e54' }}>
        {state.ready ? 'Nhận yêu cầu gần bạn' : 'Bật khi bạn có thể đến hỗ trợ'}
      </Text>
      {latestFix && (
        <Text style={{ fontSize: 13 }}>
          GPS · sai số thiết bị báo ±{Math.round(latestFix.accuracy)} m
        </Text>
      )}
      {volunteer?.isAvailable && !volunteer.activeIncidentId && approved && (
        <Text accessibilityRole={state.kind === 'stale' ? 'alert' : undefined}>
          {state.ageSeconds === null
            ? 'Chưa xác nhận được thời điểm GPS.'
            : `Vị trí cập nhật ${state.ageSeconds < 60 ? `${state.ageSeconds} giây` : `${Math.floor(state.ageSeconds / 60)} phút`} trước.`}
          {state.kind === 'stale' ? ' Chưa được chọn cho ca mới; mở GPS để làm mới.' : ''}
        </Text>
      )}
      {state.kind === 'stale' && (
        <Button
          variant="quiet"
          title="Tắt trạng thái sẵn sàng"
          onPress={disable}
          disabled={paused || busy}
        />
      )}
      <InfoDisclosure title="Vị trí và tìm ca">
        <Text>
          Kiểm tra GPS mỗi 30 giây khi app mở; gửi khi di chuyển từ 100 m hoặc sau tối đa 90 giây
          đứng yên. Tìm ca trong 5km, kể cả ca báo trước còn hạn. Điểm cũ quá 5 phút không được chọn
          cho ca mới.
        </Text>

        {volunteer?.isAvailable && (
          <Button
            variant="quiet"
            loading={busy}
            title={busy ? 'Đang cập nhật…' : 'Làm mới vị trí'}
            onPress={enable}
            disabled={paused || busy || !approved || !!volunteer?.activeIncidentId}
          />
        )}
        {verifiedFromServer && volunteer?.location && (
          <>
            <Button
              variant="quiet"
              title={showLocation ? 'Ẩn bản đồ vị trí của tôi' : 'Xem vị trí tôi đã gửi'}
              onPress={() => setShowLocation((value) => !value)}
              color="#526f67"
            />
            {showLocation && (
              <LocationMap point={volunteer.location} title="Vị trí TNV đã gửi lên máy chủ" />
            )}
          </>
        )}
      </InfoDisclosure>
      {!!pushWarning && (
        <Text accessibilityRole="alert" style={{ color: '#9f2424', fontSize: 13 }}>
          {pushWarning}
        </Text>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: '#9f2424' }}>
          {error}
        </Text>
      )}
    </View>
  );
}
