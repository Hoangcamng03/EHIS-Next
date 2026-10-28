import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { callable, firebaseClient } from './firebase';

const storageKey = (uid: string) => `ehis-push-device:${uid}`;
// Foreground alarms are handled by the incident feed; avoid playing two sounds.
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false }) });
export async function enableNativePush(): Promise<string> {
  if (Platform.OS !== 'android') return 'Chưa phát hành thông báo nền iOS.';
  await Notifications.setNotificationChannelAsync('ehis_emergency_v1', { name: 'Yêu cầu hỗ trợ EHIS', importance: AndroidImportance.MAX,
    sound: 'emergency_tone.wav', enableVibrate: true, vibrationPattern: [0, 250, 200, 250], lockscreenVisibility: AndroidNotificationVisibility.PRIVATE });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return 'Chưa có quyền thông báo. Cho phép EHIS trong Cài đặt Android để nhận khi khóa màn hình.';
  const channel = await Notifications.getNotificationChannelAsync('ehis_emergency_v1');
  if (!channel || channel.importance === AndroidImportance.NONE || !channel.sound) return 'Kênh EHIS đang bị tắt hoặc không có âm. Mở Cài đặt thông báo Android để kiểm tra.';
  const token = await Notifications.getDevicePushTokenAsync();
  if (token.type !== 'android' || typeof token.data !== 'string') throw new Error('invalid-device-token');
  const uid = firebaseClient().auth.currentUser?.uid;
  if (!uid) throw new Error('session-changed');
  const result = await callable<{ token: string; enabled: boolean }, { pushEnabled: boolean }>(firebaseClient().functions, 'registerVolunteerDevice', { timeout: 15000 })({ token: token.data, enabled: true });
  if (firebaseClient().auth.currentUser?.uid !== uid) throw new Error('session-changed');
  await AsyncStorage.setItem(storageKey(uid), token.data);
  return result.data.pushEnabled ? 'Đã đăng ký thông báo Android. Hãy thử chuông khi Home/khóa màn hình trên máy này.' : 'Đã đăng ký thiết bị; backend chưa bật gửi thông báo. Giữ app mở để nhận cảnh báo.';
}
export async function disconnectNativePush() {
  const uid = firebaseClient().auth.currentUser?.uid;
  if (!uid) return;
  const deviceToken = await AsyncStorage.getItem(storageKey(uid));
  if (!deviceToken) return;
  await callable(firebaseClient().functions, 'registerVolunteerDevice', { timeout: 8000 })({ token: deviceToken, enabled: false });
  await AsyncStorage.removeItem(storageKey(uid));
  await Notifications.dismissAllNotificationsAsync();
}
