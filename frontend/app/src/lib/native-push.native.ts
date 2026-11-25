import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { callable, firebaseClient } from './firebase';

const storageKey = (uid: string) => `ehis-push-device:${uid}`;
let registration: Promise<unknown> = Promise.resolve(),
  signingOut = false;
function registerToken(uid: string, token: string) {
  const work = registration
    .catch(() => undefined)
    .then(async () => {
      if (signingOut || firebaseClient().auth.currentUser?.uid !== uid)
        throw new Error('session-changed');
      const previous = await AsyncStorage.getItem(storageKey(uid));
      const result = await callable<
        { token: string; enabled: boolean; replaceToken?: string },
        { pushEnabled: boolean; recoveryQueued: number; recoveryOverflow: boolean }
      >(firebaseClient().functions, 'registerVolunteerDevice', { timeout: 15000 })({
        token,
        enabled: true,
        ...(previous && previous !== token ? { replaceToken: previous } : {}),
      });
      if (firebaseClient().auth.currentUser?.uid !== uid) throw new Error('session-changed');
      await AsyncStorage.setItem(storageKey(uid), token);
      return result.data;
    });
  registration = work;
  return work;
}
// Foreground alarms are handled by the incident feed; avoid playing two sounds.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
export async function enableNativePush(): Promise<string> {
  signingOut = false;
  if (Platform.OS !== 'android') return 'Chưa phát hành thông báo nền iOS.';
  await Notifications.setNotificationChannelAsync('ehis_emergency_v1', {
    name: 'Yêu cầu hỗ trợ EHIS',
    importance: AndroidImportance.MAX,
    sound: 'emergency_tone.wav',
    enableVibrate: true,
    vibrationPattern: [0, 250, 200, 250],
    lockscreenVisibility: AndroidNotificationVisibility.PRIVATE,
  });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted)
    return 'Chưa có quyền thông báo. Cho phép EHIS trong Cài đặt Android để nhận khi khóa màn hình.';
  const channel = await Notifications.getNotificationChannelAsync('ehis_emergency_v1');
  if (!channel || channel.importance < AndroidImportance.DEFAULT || !channel.sound)
    return 'Kênh EHIS đang bị tắt hoặc đặt im lặng. Mở Cài đặt thông báo Android để bật âm cho kênh Yêu cầu hỗ trợ EHIS.';
  const token = await Notifications.getDevicePushTokenAsync();
  if (token.type !== 'android' || typeof token.data !== 'string')
    throw new Error('invalid-device-token');
  const uid = firebaseClient().auth.currentUser?.uid;
  if (!uid) throw new Error('session-changed');
  const result = await registerToken(uid, token.data);
  return result.pushEnabled
    ? `Đã đăng ký thông báo Android.${result.recoveryQueued ? ' Đã xếp hàng nhắc các ca còn hiệu lực trên máy này.' : ''}${result.recoveryOverflow ? ' Có nhiều ca; mở danh sách để đồng bộ đầy đủ.' : ''} Hãy thử chuông khi Home/khóa màn hình trên máy này.`
    : 'Đã đăng ký thiết bị; backend chưa bật gửi thông báo. Giữ app mở để nhận cảnh báo.';
}
export function watchNativePush(onStatus: (message: string) => void) {
  const uid = firebaseClient().auth.currentUser?.uid;
  if (!uid || Platform.OS !== 'android') return () => {};
  signingOut = false;
  let lastRefresh = 0;
  async function refresh(token?: string) {
    if (
      signingOut ||
      firebaseClient().auth.currentUser?.uid !== uid ||
      (!token && Date.now() - lastRefresh < 60000)
    )
      return;
    if (!(await Notifications.getPermissionsAsync()).granted) {
      onStatus('Quyền thông báo Android đang bị tắt. Chưa thể xác nhận nhận chuông nền.');
      return;
    }
    const current = token || (await Notifications.getDevicePushTokenAsync()).data;
    if (typeof current !== 'string') return;
    const result = await registerToken(uid!, current);
    lastRefresh = Date.now();
    onStatus(
      result.pushEnabled
        ? 'Đã đăng ký thiết bị nhận thông báo. Cần kiểm tra thực tế khi Home/khóa màn hình.'
        : 'Backend chưa bật thông báo nền. Giữ EHIS mở và báo quản trị.',
    );
  }
  const listener = Notifications.addPushTokenListener((token) => {
    if (token.type === 'android' && typeof token.data === 'string')
      void refresh(token.data).catch(() =>
        onStatus('Chưa làm mới được thông báo thiết bị. Kiểm tra mạng và bấm kiểm tra lại.'),
      );
  });
  void refresh().catch(() =>
    onStatus('Chưa kiểm tra lại được thông báo Android. Bấm kiểm tra khi có mạng.'),
  );
  const active = AppState.addEventListener('change', (state) => {
    if (state === 'active')
      void refresh().catch(() =>
        onStatus('Chưa làm mới được thông báo Android. Kiểm tra kết nối rồi thử lại.'),
      );
  });
  return () => {
    listener.remove();
    active.remove();
  };
}
export async function disconnectNativePush() {
  signingOut = true;
  await registration.catch(() => undefined);
  const uid = firebaseClient().auth.currentUser?.uid;
  if (!uid) return;
  const deviceToken = await AsyncStorage.getItem(storageKey(uid));
  if (!deviceToken) return;
  await callable(firebaseClient().functions, 'registerVolunteerDevice', { timeout: 8000 })({
    token: deviceToken,
    enabled: false,
  });
  await AsyncStorage.removeItem(storageKey(uid));
  await Notifications.dismissAllNotificationsAsync();
}
