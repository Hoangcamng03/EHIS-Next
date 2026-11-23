import { ScreenHeader } from '../components/ScreenHeader';
import { ActionRow } from '../components/ActionRow';
import { AppIcon } from '../components/AppIcon';
import { RoleTabs } from '../components/RoleTabs';
import { CaseHistory } from '../components/CaseHistory';
import { CheckboxRow } from '../components/CheckboxRow';
import { ExternalLink } from '../components/ExternalLink';
import { TextInput } from '../components/AppTextInput';
import { TravelStatusText } from '../components/TravelStatusText';
import type { TravelProgress } from '../lib/travel-progress';
import { Text } from '../components/AppText';
import { Button } from '../components/ActionButton';
import { ToggleRow } from '../components/ToggleRow';
import { InfoDisclosure } from '../components/InfoDisclosure';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Modal, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';

import QRCode from 'react-native-qrcode-svg';
import { AuthGate, AccountBar } from '../components/Session';
import {
  callable as httpsCallable,
  firebaseClient,
  isLocalEmulator,
  readableError,
} from '../lib/firebase';
import { patientUi as ui, statusLabel } from '../lib/ui';
import { ConfirmAction } from '../components/ConfirmAction';
import { profileDraft, profileMatchesSaved } from '../lib/profile-draft';

type Card = { shareHistory?: boolean; cardId: string; active: boolean; shareProfile: boolean };
type History = {
  travelProgress?: TravelProgress | null;
  acceptedAt?: { toMillis(): number };
  id: string;
  status: string;
  createdAt?: { toDate(): Date };
  invitedCount?: number;
};
export default function PatientScreen() {
  return (
    <AuthGate purpose="patient">
      {(user) => <PatientDashboard key={user.uid} uid={user.uid} />}
    </AuthGate>
  );
}
function PatientDashboard({ uid }: { uid: string }) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const contactAnchor = useRef({
    requested: false,
    form: null as number | null,
    heading: null as number | null,
  });
  function scrollToContact() {
    const anchor = contactAnchor.current;
    if (anchor.requested && anchor.form !== null && anchor.heading !== null) {
      scroll.current?.scrollTo({
        y: Math.max(0, anchor.form + anchor.heading - 12),
        animated: false,
      });
      anchor.requested = false;
    }
  }
  function openProfile(contact = false) {
    contactAnchor.current = { requested: contact, form: null, heading: null };
    setTab('profile');
    if (!contact) scroll.current?.scrollTo({ y: 0, animated: false });
  }
  const { width } = useWindowDimensions();
  const [fullName, setFullName] = useState(''),
    [allergies, setAllergies] = useState(''),
    [phone, setPhone] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [contactName, setContactName] = useState(''),
    [contactRelationship, setContactRelationship] = useState('');
  const [loaded, setLoaded] = useState(false),
    [savedFingerprint, setSavedFingerprint] = useState<string | null>(null);
  const [profileFailed, setProfileFailed] = useState(false),
    [profileAttempt, setProfileAttempt] = useState(0);
  const [shareHistory, setShareHistory] = useState(false);
  const [expandedQr, setExpandedQr] = useState(false);
  const [pendingConsent, setPendingConsent] = useState<boolean | null>(null);
  const [consentError, setConsentError] = useState('');
  const [tab, setTab] = useState<'card' | 'profile' | 'history' | 'account'>('card');
  const [card, setCard] = useState<Card>(),
    [history, setHistory] = useState<History[]>([]);
  const [share, setShare] = useState(false),
    [confirmedRevoke, setConfirmedRevoke] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState('profile');
  const [connected, setConnected] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const configuredUrl = process.env.EXPO_PUBLIC_BYSTANDER_URL;
  const base =
    configuredUrl || (isLocalEmulator && Platform.OS === 'web' ? 'http://localhost:3100' : '');
  let validBase = false;
  try {
    const url = new URL(base);
    validBase =
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.protocol === 'https:' || (isLocalEmulator && url.protocol === 'http:'));
  } catch {
    /* Display setup message instead of a broken QR. */
  }
  const cardUrl =
    validBase && card?.active
      ? `${base.replace(/\/+$/, '')}/card?id=${encodeURIComponent(card.cardId)}`
      : '';
  useEffect(() => {
    let cancelled = false;
    getDoc(doc(firebaseClient().db, `patients/${uid}`))
      .then((snapshot) => {
        if (cancelled) return;
        const value = snapshot.data();
        setFullName(value?.fullName || '');
        setAllergies((value?.allergies || []).join(', '));
        setPhone(value?.emergencyContactPhone || '');
        setMedicalConditions((value?.medicalConditions || []).join('\n'));
        setContactName(value?.emergencyContactName || '');
        setContactRelationship(value?.emergencyContactRelationship || '');
        setSavedFingerprint(
          snapshot.exists()
            ? JSON.stringify(
                profileDraft(
                  value?.fullName || '',
                  (value?.allergies || []).join(', '),
                  value?.emergencyContactPhone || '',
                  value?.emergencyContactName || '',
                  value?.emergencyContactRelationship || '',
                  (value?.medicalConditions || []).join('\n'),
                ),
              )
            : null,
        );
        setLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(readableError(err));
          setProfileFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uid, profileAttempt]);
  useEffect(
    () =>
      onSnapshot(
        doc(firebaseClient().db, `patientCards/${uid}`),
        { includeMetadataChanges: true },
        (snapshot) => {
          setConnected(!snapshot.metadata.fromCache);
          setCard(snapshot.exists() ? (snapshot.data() as Card) : undefined);
        },
        (err) => {
          setConnected(false);
          setError(readableError(err));
        },
      ),
    [uid],
  );
  useEffect(
    () =>
      onSnapshot(
        query(
          collection(firebaseClient().db, `patients/${uid}/incidentStatuses`),
          orderBy('createdAt', 'desc'),
          limit(30),
        ),
        (snapshot) => {
          setHistory(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as History));
        },
        (err) => setError(readableError(err)),
      ),
    [uid],
  );
  useEffect(() => {
    if (card?.active) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [card?.active, card?.cardId]);
  const draft = profileDraft(
    fullName,
    allergies,
    phone,
    contactName,
    contactRelationship,
    medicalConditions,
  );
  const profileSaved = profileMatchesSaved(draft, savedFingerprint);
  const dirty = loaded && !profileSaved;
  async function act(action: 'save' | 'issue' | 'revoke') {
    if (
      action === 'save' &&
      [contactName.trim(), contactRelationship.trim(), phone.trim()].some(Boolean) &&
      ![contactName.trim(), contactRelationship.trim(), phone.trim()].every(Boolean)
    ) {
      setError('Điền đủ tên, quan hệ và số người liên hệ, hoặc để trống cả ba.');
      setFeedbackTarget('profile');
      return;
    }
    if (action === 'issue' && !profileSaved) {
      setError('Lưu thay đổi hồ sơ trước khi tạo mã QR.');
      return;
    }
    setOperation(action);
    setFeedbackTarget(action === 'save' ? 'profile' : 'card');
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (action === 'save') {
        await httpsCallable(firebaseClient().functions, 'savePatientProfile', { timeout: 15000 })(
          draft,
        );
        setSavedFingerprint(JSON.stringify(draft));
        setMessage('Đã lưu.');
      } else if (action === 'issue') {
        await httpsCallable(firebaseClient().functions, 'issuePatientCard', { timeout: 15000 })({
          shareProfile: share,
          shareHistory,
        });
        setMessage('Đã tạo QR.');
      } else {
        await httpsCallable(firebaseClient().functions, 'revokePatientCard', { timeout: 15000 })({
          cardId: card?.cardId,
        });
        setConfirmedRevoke(false);
        setMessage('Đã thu hồi thẻ. QR cũ không tạo được yêu cầu mới.');
      }
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
      setOperation(null);
    }
  }
  async function cancel(id: string) {
    setOperation('cancel');
    setFeedbackTarget('incident');
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await httpsCallable(firebaseClient().functions, 'cancelPatientIncident', { timeout: 15000 })({
        incidentId: id,
      });
      setMessage('Đã hủy yêu cầu chưa có TNV nhận.');
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
      setOperation(null);
    }
  }
  const active = history.find((item) =>
    ['dispatching', 'accepted', 'arrived'].includes(item.status),
  );
  const feedback = (target: string) =>
    feedbackTarget === target ? (
      <>
        {!!error && (
          <Text accessibilityRole="alert" style={ui.error}>
            {error}
          </Text>
        )}
        {!!message && (
          <Text accessibilityRole="alert" style={ui.success}>
            {message}
          </Text>
        )}
      </>
    ) : null;
  const renderIncident = (item: History) => (
    <View
      key={item.id}
      style={{ gap: 6, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#dce8e0' }}
    >
      <Text style={{ fontWeight: '700' }}>{statusLabel[item.status] || item.status}</Text>
      <Text style={ui.body}>
        Ca {item.id.slice(0, 10)} · {item.createdAt?.toDate().toLocaleString('vi-VN') || ''}
      </Text>
      {item.status === 'accepted' && (
        <TravelStatusText
          progress={item.travelProgress}
          acceptedAtMs={item.acceptedAt?.toMillis()}
          connected={connected}
        />
      )}
      {item.status === 'dispatching' && (
        <Text style={ui.body}>
          {item.invitedCount
            ? 'Đã gửi lời mời; chưa đồng nghĩa đã có người nhận.'
            : 'Chưa có TNV phù hợp. Không chờ EHIS nếu cần dịch vụ cấp cứu.'}
        </Text>
      )}
      {item.status === 'dispatching' && (
        <ConfirmAction
          title="Hủy yêu cầu"
          explanation="Bạn muốn hủy yêu cầu này? Chỉ hủy nếu đã gửi nhầm hoặc không còn cần hỗ trợ qua EHIS."
          disabled={busy || !connected}
          onConfirm={() => cancel(item.id)}
        />
      )}
    </View>
  );
  const cardPanel = (
    <View style={ui.card}>
      {!card?.active && <Text style={ui.heading}>Tạo thẻ sức khỏe</Text>}
      {card?.active ? (
        <>
          <View style={{ alignItems: 'center', gap: 5 }}>
            <Text
              style={{ fontWeight: '800', fontSize: 20, color: '#163c62', textAlign: 'center' }}
            >
              {profileSaved ? fullName : 'Hồ sơ đã lưu'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <AppIcon name="check" color="#169447" size={16} />
              <Text style={{ fontSize: 13, color: '#276b47' }}>Mã QR đang hoạt động</Text>
            </View>
            {dirty && <Text style={ui.error}>Có thay đổi chưa lưu.</Text>}
            {!!cardUrl && (
              <View style={{ padding: 7, backgroundColor: 'white' }}>
                <QRCode
                  value={cardUrl}
                  size={Math.min(168, Math.max(120, width - 150))}
                  quietZone={10}
                />
              </View>
            )}
            {!!cardUrl && <Button title="Phóng to mã QR" onPress={() => setExpandedQr(true)} />}
          </View>
          <Modal
            visible={expandedQr}
            transparent
            animationType="fade"
            onRequestClose={() => setExpandedQr(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: '#102c45e8',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              <View style={[ui.card, { alignItems: 'center' }]}>
                <Text style={ui.heading}>Thẻ sức khỏe EHIS</Text>
                <QRCode
                  value={cardUrl}
                  size={Math.min(360, Math.max(120, width - 88))}
                  quietZone={12}
                />
                <Button title="Đóng mã QR" onPress={() => setExpandedQr(false)} />
              </View>
            </View>
          </Modal>
          {!validBase && <Text style={ui.error}>Chưa có địa chỉ trang báo hỗ trợ hợp lệ.</Text>}
        </>
      ) : (
        <>
          {!profileSaved && (
            <>
              <Text style={ui.body}>Lưu hồ sơ để tạo QR.</Text>
              <Button title="Điền hồ sơ sức khỏe" onPress={() => setTab('profile')} />
            </>
          )}
          <Text style={ui.body}>
            {card
              ? 'QR cũ đã vô hiệu hóa. Bạn có thể tạo mã mới.'
              : 'QR chứa liên kết thẻ, không chứa bệnh án.'}
          </Text>
          <ToggleRow
            accessibilityLabel="Cho phép TNV được phân công xem hồ sơ"
            label="Chia sẻ tên, bệnh nền, dị ứng và liên hệ với TNV nhận ca."
            value={share}
            onValueChange={setShare}
            disabled={busy}
          />
          <CheckboxRow
            label="Cho phép lưu tóm tắt ca trong 30 ngày để tôi và TNV từng phụ trách xem lại."
            value={shareHistory}
            onValueChange={setShareHistory}
            disabled={busy}
          />
          <Text style={ui.caption}>
            Chỉ lưu tên, bệnh nền, dị ứng và quan sát; không lưu số người báo hoặc tọa độ vào lịch
            sử.
          </Text>
          <Button
            loading={operation === 'issue'}
            title={operation === 'issue' ? 'Đang tạo mã QR…' : 'Tạo mã QR'}
            disabled={busy || !connected || !profileSaved || !validBase}
            onPress={() => act('issue')}
          />
          {!validBase && (
            <Text style={ui.error}>Cần cấu hình địa chỉ website cho QR trước khi phát hành.</Text>
          )}
        </>
      )}
      {feedback('card')}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: '#eef5ff' }}>
      <ScreenHeader
        onAccount={() => {
          setTab('account');
          scroll.current?.scrollTo({ y: 0, animated: false });
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        ref={scroll}
        contentContainerStyle={ui.page}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        <Text style={ui.title}>Thẻ sức khỏe của bạn</Text>
        {!connected && (
          <Text accessibilityRole="alert" style={ui.error}>
            Đang chờ máy chủ. Thẻ và trạng thái lưu trên thiết bị có thể đã cũ.
          </Text>
        )}
        {feedback('incident')}
        {active && (
          <View style={ui.card}>
            <Text style={ui.heading}>Yêu cầu đang diễn ra</Text>
            {renderIncident(active)}
          </View>
        )}
        {tab === 'card' && (
          <>
            {cardPanel}
            {card?.active && (
              <View
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#d7e4f0',
                }}
              >
                <ActionRow
                  title="Thông tin sức khỏe"
                  icon="activity"
                  onPress={() => openProfile()}
                />
                <ActionRow
                  title="Liên hệ khẩn cấp"
                  icon="people"
                  onPress={() => openProfile(true)}
                />
                <View style={{ paddingHorizontal: 10 }}>
                  <ToggleRow
                    label="Chia sẻ khi được hỗ trợ"
                    accessibilityLabel="Chia sẻ hồ sơ khi được hỗ trợ"
                    value={card.shareProfile}
                    disabled={busy || !connected || !!active}
                    onValueChange={(value) => {
                      setConsentError('');
                      setPendingConsent(value);
                    }}
                    right
                  />
                </View>
              </View>
            )}
          </>
        )}
        <Modal
          visible={pendingConsent !== null}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!busy) setPendingConsent(null);
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: '#102c4588',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <View style={ui.card}>
              <Text style={ui.heading}>
                {pendingConsent
                  ? 'Cho phép TNV nhận ca xem hồ sơ?'
                  : 'Dừng chia sẻ hồ sơ trong ca mới?'}
              </Text>
              <Text>
                Tên, bệnh nền, dị ứng và liên hệ chỉ mở cho người được phân công. Lựa chọn lịch sử
                30 ngày giữ riêng.
              </Text>
              <Button
                title={pendingConsent ? 'Xác nhận chia sẻ' : 'Xác nhận dừng chia sẻ'}
                loading={busy}
                disabled={busy || !connected}
                onPress={async () => {
                  if (busy || !connected || pendingConsent === null) return;
                  setBusy(true);
                  setConsentError('');
                  setFeedbackTarget('card');
                  try {
                    await httpsCallable(
                      firebaseClient().functions,
                      'updatePatientCardConsent',
                    )({ shareProfile: pendingConsent });
                    setPendingConsent(null);
                  } catch (err) {
                    setConsentError(readableError(err));
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              {!!consentError && (
                <Text accessibilityRole="alert" style={ui.error}>
                  {consentError}
                </Text>
              )}
              {!connected && (
                <Text accessibilityRole="alert" style={ui.error}>
                  Chờ kết nối máy chủ. Chưa thể thay đổi chia sẻ.
                </Text>
              )}
              <Button
                title="Quay lại"
                variant="secondary"
                disabled={busy}
                onPress={() => setPendingConsent(null)}
              />
            </View>
          </View>
        </Modal>
        {tab === 'profile' && (
          <View
            style={ui.card}
            onLayout={(event) => {
              contactAnchor.current.form = event.nativeEvent.layout.y;
              scrollToContact();
            }}
          >
            <Text style={ui.heading}>Thông tin sức khỏe</Text>
            <ActionRow title="Lịch sử hỗ trợ" icon="activity" onPress={() => setTab('history')} />
            {profileFailed && (
              <>
                <Text accessibilityRole="alert" style={ui.error}>
                  Chưa tải được hồ sơ. Tải lại trước khi chỉnh sửa để tránh ghi đè dữ liệu đã lưu.
                </Text>
                <Button
                  title="Tải lại hồ sơ"
                  onPress={() => {
                    setError('');
                    setProfileFailed(false);
                    setProfileAttempt((value) => value + 1);
                  }}
                />
              </>
            )}
            <Text style={ui.body}>Thông tin tự khai, chưa xác minh y tế.</Text>
            <Text>Họ và tên</Text>
            <TextInput
              accessibilityLabel="Họ tên bệnh nhân"
              value={fullName}
              onChangeText={setFullName}
              maxLength={100}
              style={ui.input}
              editable={loaded && !busy}
            />
            <Text>Bệnh nền / tiền sử đã khai báo</Text>
            <TextInput
              accessibilityLabel="Bệnh nền và tiền sử"
              value={medicalConditions}
              onChangeText={setMedicalConditions}
              multiline
              maxLength={2020}
              placeholder="Mỗi bệnh một dòng; để trống nếu chưa khai báo"
              style={ui.input}
              editable={loaded && !busy}
            />
            <Text>Dị ứng · phân cách bằng dấu phẩy</Text>
            <TextInput
              accessibilityLabel="Dị ứng"
              value={allergies}
              onChangeText={setAllergies}
              multiline
              maxLength={2000}
              placeholder="Để trống nếu chưa khai báo"
              style={ui.input}
              editable={loaded && !busy}
            />
            <Text
              style={ui.heading}
              onLayout={(event) => {
                contactAnchor.current.heading = event.nativeEvent.layout.y;
                scrollToContact();
              }}
            >
              Liên hệ khẩn cấp · tùy chọn
            </Text>
            <Text style={ui.caption}>
              Điền đủ tên, quan hệ và số điện thoại, hoặc để trống cả ba.
            </Text>
            <Text>Tên người liên hệ</Text>
            <TextInput
              accessibilityLabel="Tên người liên hệ khẩn cấp"
              value={contactName}
              onChangeText={setContactName}
              maxLength={100}
              style={ui.input}
              editable={loaded && !busy}
            />
            <Text>Quan hệ với bạn</Text>
            <TextInput
              accessibilityLabel="Quan hệ người liên hệ khẩn cấp"
              placeholder="Ví dụ: mẹ, anh trai, bạn"
              value={contactRelationship}
              onChangeText={setContactRelationship}
              maxLength={60}
              style={ui.input}
              editable={loaded && !busy}
            />
            <Text>Số điện thoại</Text>
            <TextInput
              accessibilityLabel="Số liên hệ khẩn cấp"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={40}
              style={ui.input}
              editable={loaded && !busy}
            />
            {loaded && (
              <Text accessibilityLiveRegion="polite" style={profileSaved ? ui.success : ui.body}>
                {profileSaved ? 'Đã lưu hồ sơ.' : 'Có thay đổi chưa lưu.'}
              </Text>
            )}
            <Button
              loading={operation === 'save'}
              title={operation === 'save' ? 'Đang lưu hồ sơ…' : 'Lưu hồ sơ'}
              disabled={!loaded || busy || !connected || !fullName.trim() || profileSaved}
              onPress={() => act('save')}
            />
            {feedback('profile')}
          </View>
        )}
        {tab === 'history' && <CaseHistory role="patient" />}
        {tab === 'account' && (
          <>
            <AccountBar />
            {card?.active && (
              <View style={ui.card}>
                <Text style={ui.heading}>Quản lý thẻ</Text>{' '}
                <InfoDisclosure title="Liên kết thẻ QR">
                  <Text selectable accessibilityLabel="Đường dẫn thẻ EHIS" style={ui.caption}>
                    {cardUrl}
                  </Text>
                </InfoDisclosure>
                <ExternalLink
                  variant="secondary"
                  title="Mở trang từ QR"
                  href={cardUrl}
                  onError={() => setError('Chưa mở được trang thẻ.')}
                />
                {active ? (
                  <Text style={ui.body}>
                    Thẻ đang có ca hỗ trợ. Cần kết thúc/hủy ca trước khi thu hồi.
                  </Text>
                ) : (
                  <>
                    <InfoDisclosure title="Vô hiệu hóa QR">
                      <ToggleRow
                        accessibilityLabel="Xác nhận thu hồi thẻ"
                        label="Tôi hiểu QR này sẽ ngừng hoạt động."
                        value={confirmedRevoke}
                        onValueChange={setConfirmedRevoke}
                        disabled={busy}
                      />
                      <Button
                        variant="secondary"
                        title={operation === 'revoke' ? 'Đang vô hiệu hóa…' : 'Vô hiệu hóa QR'}
                        color="#a12626"
                        disabled={busy || !connected || !confirmedRevoke}
                        onPress={() => act('revoke')}
                      />
                    </InfoDisclosure>
                  </>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <RoleTabs
        value={tab === 'history' ? 'profile' : tab}
        items={[
          ['card', 'Thẻ của tôi'],
          ['profile', 'Hồ sơ'],
          ['account', 'Tài khoản'],
        ]}
        onChange={(value) => {
          setTab(value);
          scroll.current?.scrollTo({ y: 0, animated: false });
        }}
      />
    </View>
  );
}
