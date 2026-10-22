import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { connectAuthEmulator, initializeAuth, Persistence } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable, httpsCallableFromURL, Functions, HttpsCallableOptions } from 'firebase/functions';
import { Platform } from 'react-native';

export const isLocalEmulator = process.env.EXPO_PUBLIC_USE_EMULATORS === 'true' && process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === 'demo-ehis-next';
export const isTrialMode = isLocalEmulator || process.env.EXPO_PUBLIC_TRIAL_MODE === 'true';

function initializeClient() {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  if (!projectId || !apiKey || !appId) throw new Error('Thiếu cấu hình Firebase trong mobile/.env.local.');
  const emulators = process.env.EXPO_PUBLIC_USE_EMULATORS === 'true';
  if (emulators && projectId !== 'demo-ehis-next') throw new Error('Emulator phải dùng demo-ehis-next.');
  const app = getApps().length ? getApp() : initializeApp({ projectId, apiKey, appId, authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN });
  // SDK resolves the React Native entry at runtime; its persistence export is RN-only.
  const auth = Platform.OS === 'web' ? initializeAuth(app, {
    persistence: isLocalEmulator ? FirebaseAuth.browserSessionPersistence : FirebaseAuth.browserLocalPersistence,
  }) : initializeAuth(app, {
    persistence: (FirebaseAuth as typeof FirebaseAuth & { getReactNativePersistence(storage: typeof AsyncStorage): Persistence }).getReactNativePersistence(AsyncStorage),
  });
  const db = getFirestore(app);
  const functions = getFunctions(app, 'asia-southeast1');
  if (emulators) {
    const host = process.env.EXPO_PUBLIC_EMULATOR_HOST || '127.0.0.1';
    connectAuthEmulator(auth, `http://${host}:9199`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8180);
    connectFunctionsEmulator(functions, host, 5101);
  }
  return { auth, db, functions };
}
const scope = globalThis as typeof globalThis & { ehisMobileFirebase?: ReturnType<typeof initializeClient> };
export function firebaseClient() { return scope.ehisMobileFirebase ??= initializeClient(); }
export function callable<Request = unknown, Response = unknown>(functions: Functions, name: string, options?: HttpsCallableOptions) {
  const base = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (!base || isLocalEmulator) return httpsCallable<Request, Response>(functions, name, options);
  const url = new URL(base);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Invalid cloud backend URL');
  return httpsCallableFromURL<Request, Response>(functions, `${base.replace(/\/+$/, '')}/${name}`, options);
}
let availabilityQueue: Promise<unknown> = Promise.resolve();
export function updateAvailability(data: { available: boolean; location?: { latitude: number; longitude: number } }, timeout = 12000) {
  const uid = firebaseClient().auth.currentUser?.uid;
  const operation = availabilityQueue.catch(() => undefined).then(() => {
    if (!uid || firebaseClient().auth.currentUser?.uid !== uid) throw new Error('Session changed');
    return callable(firebaseClient().functions, 'setVolunteerAvailability', { timeout })(data);
  });
  availabilityQueue = operation;
  return operation;
}
export function readableError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/email-already-in-use') return 'Email này đã có tài khoản. Chọn Đăng nhập hoặc Quên mật khẩu; không cần đăng ký lại.';
  if (code === 'auth/network-request-failed' || code === 'functions/unavailable' || code === 'functions/deadline-exceeded') return 'Chưa kết nối được máy chủ. Kiểm tra Internet rồi thử lại. Chỉ coi thao tác thành công khi có xác nhận.';
  if (code === 'auth/too-many-requests') return 'Có quá nhiều lần thử đăng nhập. Đợi một lúc rồi thử lại hoặc đặt lại mật khẩu.';
  if (code === 'functions/resource-exhausted') return 'Bạn thao tác quá nhanh. Đợi khoảng một phút rồi thử lại.';
  if (code === 'functions/failed-precondition') return 'Trạng thái hiện tại chưa cho phép thao tác. Kiểm tra hồ sơ, thẻ hoặc ca đang hoạt động rồi thử lại.';
  if (code === 'functions/invalid-argument') return 'Thông tin chưa hợp lệ. Kiểm tra tên, số điện thoại và các trường đã nhập.';
  if (code === 'auth/email-already-in-use') return 'Email đã có tài khoản. Chọn đăng nhập.';
  if (code === 'auth/weak-password') return 'Mật khẩu chưa đủ mạnh. Dùng ít nhất 8 ký tự.';
  if (code === 'auth/invalid-email') return 'Địa chỉ email chưa hợp lệ.';
  if (code === 'functions/permission-denied' || code === 'permission-denied') return 'Chưa được duyệt hoặc không có quyền với ca này.';
  if (code?.startsWith('auth/')) return 'Chưa đăng nhập được. Kiểm tra tài khoản và kết nối.';
  return 'Chưa hoàn tất thao tác. Kiểm tra kết nối rồi thử lại.';
}
