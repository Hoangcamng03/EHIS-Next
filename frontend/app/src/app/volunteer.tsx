import { ScreenHeader } from '../components/ScreenHeader';
import { VolunteerQuickActions } from '../components/VolunteerQuickActions';
import { validPoint } from '../lib/directions';
import type { MapPoint } from '../lib/map';
import { AppIcon } from '../components/AppIcon';
import { RoleTabs } from '../components/RoleTabs';
import { CaseHistory } from '../components/CaseHistory';
import { observationLabels, type ObservationAnswers as Answers } from '../lib/observations';
import { Text } from '../components/AppText';
import { Button } from '../components/ActionButton';
import { ToggleRow } from '../components/ToggleRow';
import { InfoDisclosure } from '../components/InfoDisclosure';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Linking, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import {
  callable as httpsCallable,
  firebaseClient,
  readableError,
  updateAvailability,
} from '../lib/firebase';
import { VolunteerAvailability } from '../components/VolunteerAvailability';
import { IncidentProgress } from '../components/IncidentProgress';
import { ReportReceipt } from '../components/ReportReceipt';
import type { TravelProgress } from '../lib/travel-progress';
import { IncidentNavigation } from '../components/IncidentNavigation';
import { AuthGate, AccountBar } from '../components/Session';
import { VolunteerApplication } from '../components/VolunteerApplication';
import { BackgroundNotifications } from '../components/BackgroundNotifications';
import { usePathname } from 'expo-router';
import { ConfirmAction } from '../components/ConfirmAction';
import { activeOffer, collectSignalEvents, invitationState } from '../lib/alert-policy';
import { palette } from '../lib/palette';
import { useEmergencySignal } from '../lib/use-emergency-signal';
import { subscribeVolunteerAlerts, type AlertFeedState } from '../lib/subscribe-alerts';
import { stopBackgroundLocation } from '../lib/background-location';
import { formatClock, formatCountdown, formatDistance } from '../lib/alert-format';

type Alert = {
  travelProgress?: TravelProgress | null;
  reportUpdatedAt?: { toMillis(): number };
  offerKind?: 'handover';
  handoverId?: string;
  incidentId: string;
  status: string;
  reportRevision: number;
  locationRevision?: number;
  distanceMeters: number;
  answers: Answers | null;
  offerExpiresAt?: { toMillis(): number };
};
type Details = {
  assignmentAtMs?: number | null;
  phone: string | null;
  answers: Answers | null;
  meetingNote?: string;
  reporterPresence?: 'with_patient' | 'left_scene' | null;
  revision: number;
  reportedAtMs?: number | null;
  locationRevision?: number;
  location: { latitude: number; longitude: number } | null;
  destination?: { source: string; address: string };
  patientProfile?: {
    fullName: string;
    allergies: string[];
    medicalConditions?: string[];
    emergencyContactPhone: string | null;
    emergencyContactName?: string | null;
    emergencyContactRelationship?: string | null;
  } | null;
};
const OfferSummary = memo(function OfferSummary({
  alert,
  onOpen,
}: {
  alert: Alert;
  onOpen: (id: string) => void;
}) {
  return (
    <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
      <AppIcon name="pin" size={21} color={palette.volunteer.primary} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 15, fontWeight: '700' }}>
          Cách khoảng {formatDistance(alert.distanceMeters)}
        </Text>
        <Text style={styles.note}>
          {alert.answers
            ? `${observationLabels(alert.answers).responsiveness} · ${observationLabels(alert.answers).breathing}`
            : 'Chờ bổ sung tình trạng'}
        </Text>
      </View>
      <View style={{ maxWidth: 112 }}>
        <Button
          title="Xem yêu cầu"
          accessibilityLabel={`Xem ca ${alert.incidentId.slice(0, 10)}`}
          onPress={() => onOpen(alert.incidentId)}
        />
      </View>
    </View>
  );
});
function Observation({ answers }: { answers: Answers | null }) {
  if (!answers) return <Text style={styles.note}>Chờ người báo bổ sung tình trạng.</Text>;
  const values = observationLabels(answers);
  return (
    <View style={{ gap: 6 }}>
      {(
        [
          ['user', 'Phản hồi', values.responsiveness],
          ['breath', 'Thở', values.breathing],
          ['drop', 'Chảy máu', values.bleeding],
        ] as const
      ).map(([icon, label, value]) => (
        <View
          key={label}
          style={{
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center',
            backgroundColor: '#f0f2f3',
            padding: 10,
            borderRadius: 8,
          }}
        >
          <AppIcon name={icon} size={19} color="#344554" />
          <Text style={{ flex: 1, fontSize: 14 }}>
            <Text style={{ fontWeight: '700' }}>{label}: </Text>
            {value}
          </Text>
        </View>
      ))}
      <Text style={{ fontSize: 13, color: '#53616a' }}>
        Quan sát của người báo, chưa phải chẩn đoán.
      </Text>
    </View>
  );
}
function IncidentAlert({
  alert,
  connected,
  now,
  onAccepted,
  onDeclined,
  autoPreview = false,
  canAccept = true,
}: {
  alert: Alert;
  connected: boolean;
  now: number;
  onAccepted?: (id: string) => void;
  onDeclined?: () => void;
  autoPreview?: boolean;
  canAccept?: boolean;
}) {
  const [details, setDetails] = useState<Details>();
  const [detailAttempt, setDetailAttempt] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!connected || !['accepted', 'arrived'].includes(alert.status)) return;
    let cancelled = false;
    httpsCallable<{ incidentId: string }, Details>(
      firebaseClient().functions,
      'getVolunteerIncidentDetails',
      { timeout: 15000 },
    )({ incidentId: alert.incidentId })
      .then((result) => {
        if (!cancelled) {
          setDetails(result.data);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDetails(undefined);
          setError(readableError(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    alert.incidentId,
    alert.reportRevision,
    alert.locationRevision,
    alert.status,
    connected,
    detailAttempt,
  ]);
  async function accept() {
    setBusy(true);
    setError('');
    try {
      await httpsCallable(
        firebaseClient().functions,
        alert.offerKind === 'handover' ? 'acceptIncidentHandover' : 'acceptIncident',
        { timeout: 15000 },
      )({
        incidentId: alert.incidentId,
        ...(alert.offerKind === 'handover' ? { handoverId: alert.handoverId } : {}),
      });
      onAccepted?.(alert.incidentId);
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }
  async function decline() {
    if (alert.offerKind === 'handover') {
      onDeclined?.();
      return;
    }
    setBusy(true);
    setError('');
    try {
      await httpsCallable(firebaseClient().functions, 'declineIncident', { timeout: 15000 })({
        incidentId: alert.incidentId,
      });
      onDeclined?.();
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    setBusy(true);
    setError('');
    try {
      await httpsCallable(firebaseClient().functions, 'finishIncident', { timeout: 15000 })({
        incidentId: alert.incidentId,
        outcome: 'completed',
      });
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }
  async function arrive() {
    setBusy(true);
    setError('');
    try {
      await httpsCallable(firebaseClient().functions, 'markIncidentArrived', { timeout: 15000 })({
        incidentId: alert.incidentId,
        expectedLocationRevision: details?.locationRevision ?? 0,
      });
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }
  const assigned = ['accepted', 'arrived'].includes(alert.status);
  const visibleStatus = invitationState(
    { ...alert, expiresAt: alert.offerExpiresAt?.toMillis() },
    now,
  );
  const offerExpired = visibleStatus === 'expired';
  const terminal =
    offerExpired || ['closed', 'completed', 'cancelled', 'expired'].includes(alert.status);
  const privateData = connected && details?.revision === alert.reportRevision ? details : undefined;
  return (
    <View style={assigned ? styles.card : { gap: 10 }}>
      {!assigned && !terminal && (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <AppIcon name="alert" color={palette.emergency.primary} size={38} />
          <Text accessibilityRole="alert" style={styles.urgentTitle}>
            {alert.offerKind === 'handover' ? 'Cần người nhận bàn giao' : 'Cần hỗ trợ khẩn'}
          </Text>
        </View>
      )}
      {terminal && <Text style={styles.cardTitle}>Đã kết thúc</Text>}
      {!assigned && (
        <Text style={[styles.cardTitle, { textAlign: 'center' }]}>
          Cách khoảng {formatDistance(alert.distanceMeters)}
        </Text>
      )}
      {!terminal && !assigned && (
        <>
          <Observation answers={alert.answers} />
          <Text style={[styles.note, { textAlign: 'center' }]}>
            {alert.reportRevision
              ? `Cập nhật lần ${alert.reportRevision}${alert.reportUpdatedAt ? ' · ' + formatClock(alert.reportUpdatedAt.toMillis()) : ''}`
              : 'Chờ thông tin bổ sung'}
          </Text>
        </>
      )}
      {alert.status === 'offered' && !offerExpired && (
        <>
          <Button
            loading={busy}
            title={
              busy ? 'Đang nhận…' : alert.offerKind === 'handover' ? 'Nhận bàn giao' : 'Nhận ca'
            }
            disabled={busy || !connected || !canAccept}
            color={palette.emergency.primary}
            onPress={accept}
          />
          <Button
            variant="secondary"
            color="#50606b"
            title={alert.offerKind === 'handover' ? 'Về danh sách' : 'Không thể nhận'}
            disabled={busy || !connected}
            onPress={decline}
          />
        </>
      )}
      {assigned && (
        <View style={styles.answers}>
          {!privateData && !error && (
            <Text accessibilityRole="status">Đã nhận ca · Đang tải hồ sơ và điểm đến…</Text>
          )}
          {!!privateData?.patientProfile && (
            <Text style={styles.cardTitle}>{privateData.patientProfile.fullName}</Text>
          )}
          {privateData?.reporterPresence === 'left_scene' && (
            <View
              style={{
                padding: 10,
                borderRadius: 10,
                backgroundColor: '#fde8e8',
                borderWidth: 1,
                borderColor: '#c93b3b',
                gap: 4,
              }}
            >
              <Text accessibilityRole="alert" style={{ color: '#8f1d1d', fontWeight: '700' }}>
                Người báo tin đã rời khỏi vị trí bệnh nhân
              </Text>
              <Text style={{ color: '#6b1d1d', fontSize: 14 }}>
                Kiểm tra mốc tìm bệnh nhân hoặc gọi người báo nếu có số liên hệ.
              </Text>
            </View>
          )}
          {privateData?.reporterPresence === 'with_patient' && (
            <Text style={{ color: '#166534', fontWeight: '600', fontSize: 14 }}>
              Người báo tin đang ở ngay cạnh bệnh nhân.
            </Text>
          )}
          {(alert.locationRevision || 0) > 0 && (
            <Text style={styles.urgentTitle}>Điểm bệnh nhân vừa được cập nhật</Text>
          )}
          {connected && details?.location && (
            <IncidentNavigation
              destination={details.location}
              connected={
                connected && (details.locationRevision || 0) === (alert.locationRevision || 0)
              }
              autoPreview={autoPreview || (alert.locationRevision || 0) > 0}
            />
          )}
          {connected && (details?.locationRevision || 0) !== (alert.locationRevision || 0) && (
            <Text>Đang cập nhật điểm đến…</Text>
          )}
          {privateData?.patientProfile ? (
            <InfoDisclosure title="Hồ sơ bệnh nhân" initiallyOpen>
              <View style={styles.answers}>
                <Text>Họ tên: {privateData.patientProfile.fullName}</Text>
                <Text>
                  Bệnh nền / tiền sử:{' '}
                  {(privateData.patientProfile.medicalConditions || []).join('; ') ||
                    'Chưa khai báo'}
                </Text>
                <Text>
                  Dị ứng: {privateData.patientProfile.allergies.join(', ') || 'Chưa khai báo'}
                </Text>
                <Text>
                  Người liên hệ:{' '}
                  {privateData.patientProfile.emergencyContactName || 'Chưa khai báo'}
                  {privateData.patientProfile.emergencyContactRelationship
                    ? ` · ${privateData.patientProfile.emergencyContactRelationship}`
                    : ''}
                </Text>
                <Text>
                  Số khẩn cấp: {privateData.patientProfile.emergencyContactPhone || 'Chưa khai báo'}
                </Text>
                <Text>Thông tin tự khai, chưa xác minh y tế.</Text>
              </View>
            </InfoDisclosure>
          ) : (
            privateData && <Text>Bệnh nhân không chia sẻ hồ sơ sức khỏe.</Text>
          )}
          <Text style={styles.note}>
            Cập nhật lần {alert.reportRevision}
            {alert.reportUpdatedAt ? ` · ${formatClock(alert.reportUpdatedAt.toMillis())}` : ''}
          </Text>
          <InfoDisclosure title="Tình trạng mới nhất">
            <Observation answers={alert.answers} />
          </InfoDisclosure>
          {alert.status === 'accepted' && (
            <ConfirmAction
              key={`arrival-${alert.locationRevision || 0}`}
              tone="complete"
              title="Đã đến nơi"
              explanation="Xác nhận bạn đã có mặt tại vị trí bệnh nhân? Chỉ xác nhận khi thực sự đã đến."
              disabled={busy || !connected || !privateData}
              onConfirm={arrive}
            />
          )}
          {privateData?.assignmentAtMs && alert.status === 'accepted' ? (
            <InfoDisclosure title="Tiến độ / gặp trở ngại" keepMounted>
              <IncidentProgress
                key={privateData.assignmentAtMs}
                incidentId={alert.incidentId}
                assignmentAtMs={privateData.assignmentAtMs}
                progress={alert.travelProgress}
                connected={connected}
                now={now}
              />
            </InfoDisclosure>
          ) : null}
          {!!privateData?.assignmentAtMs && alert.reportRevision > 0 && (
            <ReportReceipt
              incidentId={alert.incidentId}
              assignmentAtMs={privateData.assignmentAtMs}
              revision={alert.reportRevision}
              enabled={!!privateData && connected}
            />
          )}
          <InfoDisclosure title="Liên hệ người báo">
            <Text>
              {privateData
                ? privateData.phone || 'Không cung cấp số điện thoại'
                : 'Đang tải chi tiết…'}
            </Text>
            {!!privateData?.phone && (
              <Button
                variant="secondary"
                title="Gọi người báo"
                onPress={() =>
                  Linking.openURL('tel:' + privateData.phone).catch(() =>
                    setError('Chưa mở được cuộc gọi.'),
                  )
                }
              />
            )}
          </InfoDisclosure>
          {privateData?.destination?.source === 'patient_pin' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Điểm do người báo ở xa cung cấp</Text>
              <Text>{privateData.destination.address}</Text>
              <Text style={styles.note}>
                Xác minh điểm hẹn với người tại chỗ. Đây không phải GPS của người báo.
              </Text>
            </View>
          )}
          {!!privateData?.meetingNote && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Mốc tìm bệnh nhân</Text>
              <Text>{privateData.meetingNote}</Text>
              <Text style={styles.note}>Do người báo cung cấp · Điểm GPS không thay đổi.</Text>
            </View>
          )}
          {!privateData && !!error && (
            <Button
              title="Tải lại chi tiết ca"
              disabled={!connected}
              onPress={() => {
                setError('');
                setDetailAttempt((value) => value + 1);
              }}
            />
          )}
          {privateData?.reportedAtMs ? (
            <Text>
              Người báo cập nhật lúc{' '}
              {new Date(privateData.reportedAtMs).toLocaleTimeString('vi-VN')}
            </Text>
          ) : null}

          <ConfirmAction
            tone="complete"
            title="Hoàn tất ca hỗ trợ"
            explanation="Hoàn tất ca và đóng thông tin riêng?"
            disabled={busy || !connected || !privateData}
            onConfirm={finish}
          />
        </View>
      )}
      {!!error && !terminal && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
export default function VolunteerScreen() {
  return (
    <AuthGate purpose="volunteer">
      {(user) => <VolunteerDashboard key={user.uid} user={user} />}
    </AuthGate>
  );
}
function VolunteerDashboard({ user }: { user: User }) {
  const focused = usePathname() === '/volunteer';
  const [feed, setFeed] = useState<AlertFeedState & { key: string }>({
    alerts: [],
    connected: false,
    error: null,
    key: '',
  });
  const feedKey = user.uid;
  const [approved, setApproved] = useState(false),
    [checked, setChecked] = useState(false),
    [application, setApplication] = useState<{ status?: string; [key: string]: unknown }>();
  const [applicationLoaded, setApplicationLoaded] = useState(false),
    [verificationVersion, setVerificationVersion] = useState(0);
  const [suspended, setSuspended] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const alerts = useMemo(
    () => (approved && feed.key === feedKey ? feed.alerts : []),
    [approved, feed.key, feed.alerts, feedKey],
  );
  const connected = approved && feed.key === feedKey && feed.connected;
  const [available, setAvailable] = useState(false);
  const [ownPoint, setOwnPoint] = useState<MapPoint | null>(null);
  const [tab, setTab] = useState<'home' | 'history' | 'account'>('home');
  const pageScroll = useRef<ComponentRef<typeof ScrollView>>(null);

  const [wakeId, setWakeId] = useState<string | null>(null),
    [autoRouteId, setAutoRouteId] = useState<string | null>(null);
  const seen = useRef(new Map<string, number>());
  const acceptedOptimisticId = useRef<string | null>(null);
  const signal = useEmergencySignal();
  const [now, setNow] = useState(() => Date.now()),
    [error, setError] = useState('');
  useEffect(
    () =>
      onSnapshot(
        doc(firebaseClient().db, `volunteers/${user.uid}`),
        { includeMetadataChanges: true },
        (snapshot) => {
          setChecked(!snapshot.metadata.fromCache);
          setApproved(
            !snapshot.metadata.fromCache && snapshot.data()?.verificationStatus === 'approved',
          );
          setAvailable(!snapshot.metadata.fromCache && snapshot.data()?.isAvailable === true);
          setOwnPoint(
            !snapshot.metadata.fromCache && validPoint(snapshot.data()?.location)
              ? snapshot.data()!.location
              : null,
          );
          setVerificationVersion(snapshot.data()?.verificationPolicyVersion || 0);
          setSuspended(snapshot.data()?.verificationStatus === 'suspended');
        },
        (err) => {
          setChecked(false);
          setApproved(false);
          setAvailable(false);
          setOwnPoint(null);
          setError(readableError(err));
        },
      ),
    [user.uid, connectionAttempt],
  );
  useEffect(
    () =>
      onSnapshot(
        doc(firebaseClient().db, `volunteerApplications/${user.uid}`),
        (snapshot) => {
          setApplication(snapshot.data());
          setApplicationLoaded(true);
        },
        (err) => setError(readableError(err)),
      ),
    [user.uid],
  );
  useEffect(() => {
    if (!approved) return;
    return subscribeVolunteerAlerts(firebaseClient().db, user.uid, (value) => {
      const pendingId = acceptedOptimisticId.current;
      let nextAlerts = value.alerts;
      if (pendingId) {
        const match = value.alerts.find((alert) => alert.incidentId === pendingId);
        if (!match || match.status !== 'offered') {
          acceptedOptimisticId.current = null;
        } else {
          nextAlerts = value.alerts.map((alert) =>
            alert.incidentId === pendingId ? { ...alert, status: 'accepted' } : alert,
          );
        }
      }
      setFeed({ ...value, alerts: nextAlerts, key: feedKey });
      setError(value.error ? readableError(value.error) : '');
    });
  }, [user.uid, approved, feedKey]);
  useEffect(
    () => () => {
      updateAvailability({ available: false }, 4000).catch(() => undefined);
    },
    [user.uid],
  );
  useEffect(() => {
    if (!focused) updateAvailability({ available: false }, 4000).catch(() => undefined);
  }, [focused, user.uid]);
  const offers = useMemo(
    () =>
      alerts
        .filter((alert) =>
          activeOffer({ ...alert, expiresAt: alert.offerExpiresAt?.toMillis() }, now),
        )
        .sort(
          (a, b) =>
            (a.offerExpiresAt?.toMillis() || 0) - (b.offerExpiresAt?.toMillis() || 0) ||
            a.distanceMeters - b.distanceMeters ||
            a.incidentId.localeCompare(b.incidentId),
        ),
    [alerts, now],
  );
  const assigned = useMemo(
    () => alerts.filter((alert) => ['accepted', 'arrived'].includes(alert.status)),
    [alerts],
  );
  const wakeOffer = offers.find((alert) => alert.incidentId === wakeId);
  const needsSecondTick = !!wakeOffer || offers.length > 0 || (available && !assigned.length);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), needsSecondTick ? 1000 : 10000);
    return () => clearInterval(timer);
  }, [needsSecondTick]);
  const { play, stop, foreground } = signal;
  const openOffer = useCallback(
    (id: string) => {
      stop();
      setWakeId(id);
    },
    [stop],
  );
  const feedbackActive =
    approved && connected && focused && foreground && (available || assigned.length > 0);
  useEffect(() => {
    if (!feedbackActive) stop();
  }, [feedbackActive, stop]);
  useEffect(() => {
    if (!feedbackActive) return;
    const eligible = assigned.length ? assigned : alerts;
    const events = collectSignalEvents(
      seen.current,
      eligible.map((alert) => ({ ...alert, expiresAt: alert.offerExpiresAt?.toMillis() })),
      now,
    );
    if (events.length) {
      play(events.some((event) => event.kind === 'request') ? 'request' : 'update');
      const invitation = offers.find((alert) =>
        events.some((event) => event.incidentId === alert.incidentId),
      );
      if (invitation)
        setWakeId((previous) =>
          offers.some((alert) => alert.incidentId === previous) ? previous : invitation.incidentId,
        );
    }
  }, [alerts, offers, assigned, feedbackActive, now, play]);
  useEffect(() => {
    if (wakeId && !wakeOffer) stop();
  }, [wakeId, wakeOffer, stop]);
  function closeAlarm() {
    stop();
    setWakeId(null);
  }
  function accepted(id: string) {
    acceptedOptimisticId.current = id;
    void stopBackgroundLocation();
    setTab('home');
    closeAlarm();
    setAutoRouteId(id);
    // The API has confirmed assignment; do not wait for a later listener to show it.
    setFeed((previous) => ({
      ...previous,
      alerts: previous.alerts.map((alert) =>
        alert.incidentId === id ? { ...alert, status: 'accepted' } : alert,
      ),
    }));
  }
  return (
    <View style={{ flex: 1, backgroundColor: palette.volunteer.background }}>
      <ScreenHeader
        volunteer
        onAccount={() => {
          setTab('account');
          pageScroll.current?.scrollTo({ y: 0, animated: false });
        }}
      />
      <ScrollView
        ref={pageScroll}
        nativeID="volunteer-content"
        role={approved && checked ? 'tabpanel' : undefined}
        aria-labelledby={approved && checked ? `tab-volunteer-content-${tab}` : undefined}
        style={{ flex: 1 }}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        {!checked ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chưa xác nhận được kết nối</Text>
            <Text>
              Đang thử đồng bộ với máy chủ. Kiểm tra Wi-Fi hoặc dữ liệu di động; thông tin riêng và
              thao tác ca tạm ẩn.
            </Text>
            <Button
              variant="secondary"
              title="Kiểm tra lại kết nối"
              onPress={() => setConnectionAttempt((value) => value + 1)}
            />
          </View>
        ) : !approved ? (
          suspended ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quyền nhận ca đang tạm dừng</Text>
              <Text>
                Liên hệ quản trị hoặc người phụ trách đơn vị để được kiểm tra lại. Chưa thể bật sẵn
                sàng hay nhận ca.
              </Text>
            </View>
          ) : applicationLoaded ? (
            <VolunteerApplication
              key={String(application?.applicationRevision || 'new')}
              status={application?.status}
              initial={application}
            />
          ) : (
            <Text>Đang tải hồ sơ đăng ký…</Text>
          )
        ) : (
          <>
            <BackgroundNotifications
              visible={tab === 'account' || (tab === 'home' && assigned.length === 0)}
            />
            {tab === 'home' && (
              <>
                {![2, 3].includes(verificationVersion || 0) && (
                  <Text style={styles.note}>
                    Tài khoản cũ chưa có nhóm kỹ năng được admin xác minh.
                  </Text>
                )}

                {!connected && (
                  <Text accessibilityRole="alert">Đang đồng bộ · Tạm khóa thao tác ca.</Text>
                )}
                {!assigned.length && (
                  <VolunteerAvailability
                    key={user.uid}
                    uid={user.uid}
                    now={now}
                    paused={!connected || !focused}
                    prepareAlerts={signal.prepare}
                  />
                )}
                {feed.overflow && (
                  <Text accessibilityRole="alert" style={styles.error}>
                    Vượt 100 lời mời. Liên hệ người vận hành.
                  </Text>
                )}
                {offers.length > 0 && (
                  <Text style={styles.cardTitle}>Yêu cầu đang chờ · {offers.length}</Text>
                )}
                {assigned.map((alert) => (
                  <IncidentAlert
                    key={alert.incidentId}
                    alert={alert}
                    connected={connected && approved}
                    now={now}
                    autoPreview={autoRouteId === alert.incidentId}
                  />
                ))}
                {offers.map((alert) => (
                  <OfferSummary key={alert.incidentId} alert={alert} onOpen={openOffer} />
                ))}
                {!assigned.length && !wakeOffer && (
                  <VolunteerQuickActions
                    point={ownPoint}
                    organisation={
                      typeof application?.workAddress === 'string' ? application.workAddress : ''
                    }
                    area={
                      typeof application?.serviceArea === 'string' ? application.serviceArea : ''
                    }
                  />
                )}
              </>
            )}
            {tab === 'account' && (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Âm thanh cảnh báo</Text>
                  <Text accessibilityLiveRegion="polite" style={styles.note}>
                    {signal.sounding ? 'Đang phát chuông…' : signal.message}
                  </Text>
                  <Button
                    variant="quiet"
                    title="Kiểm tra âm báo"
                    onPress={signal.test}
                    color="#0b5962"
                  />
                  {signal.sounding && (
                    <Button
                      title="Dừng chuông"
                      onPress={signal.stop}
                      color={palette.emergency.primary}
                    />
                  )}
                  <InfoDisclosure title="Tùy chọn chuông và rung">
                    <ToggleRow
                      accessibilityLabel="Rung nhẹ khi có cảnh báo"
                      label={
                        signal.vibrationSupported
                          ? 'Rung khi có cảnh báo'
                          : 'Thiết bị chưa hỗ trợ rung'
                      }
                      value={signal.vibrationEnabled}
                      onValueChange={signal.toggleVibration}
                      disabled={!signal.vibrationSupported}
                    />
                    <Text style={styles.note}>
                      Chuông trong app: yêu cầu mới 6 giây; bổ sung 2 giây. Android cần Media &gt;
                      0. Muốn nhận khi bấm Home hoặc khóa màn hình, bật thông báo Android bên dưới.
                      Âm báo còn phụ thuộc cài đặt âm lượng và Không làm phiền.
                    </Text>
                  </InfoDisclosure>
                </View>
              </>
            )}
            {tab === 'home' && connected && !offers.length && !assigned.length && (
              <Text>Chưa có ca chờ gần bạn.</Text>
            )}
            {tab === 'history' && <CaseHistory role="volunteer" />}
            <Modal
              visible={!!wakeOffer && foreground && focused && connected}
              transparent
              animationType="none"
              hardwareAccelerated
              onRequestClose={closeAlarm}
            >
              <View style={styles.backdrop}>
                <ScrollView
                  contentContainerStyle={styles.modalContent}
                  keyboardShouldPersistTaps="always"
                  keyboardDismissMode="on-drag"
                >
                  {wakeOffer && (
                    <>
                      <Text style={styles.urgentText}>
                        Còn{' '}
                        {formatCountdown(
                          Math.min(
                            wakeOffer.offerKind === 'handover' ? 300 : 600,
                            (wakeOffer.offerExpiresAt!.toMillis() - now) / 1000,
                          ),
                        )}{' '}
                        để nhận. {offers.length > 1 ? `Có ${offers.length} lời mời đang chờ.` : ''}
                      </Text>
                      {!available && !assigned.length && (
                        <Text>Bật sẵn sàng trước khi nhận lời mời này.</Text>
                      )}
                      <IncidentAlert
                        alert={wakeOffer}
                        connected={connected && approved}
                        now={now}
                        onAccepted={accepted}
                        onDeclined={closeAlarm}
                        canAccept={available && !assigned.length}
                      />
                    </>
                  )}
                  {offers.length > 1 && (
                    <View style={{ gap: 8 }}>
                      <Text style={styles.cardTitle}>Chọn ca chờ khác ({offers.length})</Text>
                      {offers.map((item, index) => (
                        <Button
                          key={item.incidentId}
                          variant={item.incidentId === wakeId ? 'primary' : 'secondary'}
                          title={`${index + 1}. Ca ${item.incidentId.slice(0, 10)} · ${formatDistance(item.distanceMeters)}${item.incidentId === wakeId ? ' · đang xem' : ''}`}
                          onPress={() => {
                            stop();
                            setWakeId(item.incidentId);
                          }}
                        />
                      ))}
                    </View>
                  )}
                  <Button
                    variant="quiet"
                    title="Xem danh sách yêu cầu"
                    onPress={closeAlarm}
                    color="#526f67"
                  />
                  <Text style={styles.note}>Đóng cửa sổ không hủy lời mời.</Text>
                </ScrollView>
              </View>
            </Modal>
          </>
        )}
        {(!approved || tab === 'account') && <AccountBar />}
        {!!error && !suspended && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
      </ScrollView>
      {approved && checked && (
        <RoleTabs
          panelId="volunteer-content"
          value={tab}
          items={[
            ['home', 'Trang chính'],
            ['history', 'Hoạt động'],
            ['account', 'Tài khoản'],
          ]}
          onChange={(value) => {
            setTab(value);
            pageScroll.current?.scrollTo({ y: 0, animated: false });
          }}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  page: {
    padding: 12,
    gap: 10,
    backgroundColor: palette.volunteer.background,
    flexGrow: 1,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  urgent: {
    backgroundColor: palette.emergency.background,
    borderColor: palette.emergency.border,
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  urgentTitle: { color: palette.emergency.ink, fontSize: 20, lineHeight: 27, fontWeight: '700' },
  urgentText: { color: '#57282b', fontSize: 16, lineHeight: 23 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 30, 33, 0.75)',
    padding: 12,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: palette.emergency.background,
    padding: 16,
    gap: 12,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: palette.emergency.border,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    marginVertical: 12,
  },
  eyebrow: { color: '#526f67', fontSize: 13, fontWeight: '700' },
  title: { color: '#123c37', fontSize: 22, lineHeight: 29, fontWeight: '700' },
  intro: { fontSize: 16, lineHeight: 23, color: '#36574e' },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#dce8e0',
  },
  cardTitle: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: '#123c37' },
  input: { borderWidth: 1, borderColor: '#b8cbc1', borderRadius: 10, padding: 14 },
  revision: { color: '#096951', fontWeight: '700' },
  answers: { gap: 8 },
  error: { color: '#9f2424', fontSize: 17 },
  note: { color: '#405e54', fontSize: 14, lineHeight: 20 },
});
