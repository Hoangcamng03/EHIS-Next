import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { connectAuthEmulator, getAuth, initializeAuth, Persistence } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { Platform } from 'react-native';

function initializeClient() {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  if (!projectId || !apiKey || !appId) throw new Error('Thiếu cấu hình Firebase trong mobile/.env.local.');
  const emulators = process.env.EXPO_PUBLIC_USE_EMULATORS === 'true';
  if (emulators && projectId !== 'demo-ehis-next') throw new Error('Emulator phải dùng demo-ehis-next.');
  const app = getApps().length ? getApp() : initializeApp({ projectId, apiKey, appId, authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN });
  // SDK resolves the React Native entry at runtime; its persistence export is RN-only.
  const auth = Platform.OS === 'web' ? getAuth(app) : initializeAuth(app, {
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
export function readableError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'functions/failed-precondition') return 'Ca đã được nhận, hết hạn hoặc bạn đang phụ trách ca khác.';
  if (code === 'functions/permission-denied' || code === 'permission-denied') return 'Chưa được duyệt hoặc không có quyền với ca này.';
  if (code?.startsWith('auth/')) return 'Chưa đăng nhập được. Kiểm tra tài khoản và kết nối.';
  return 'Chưa hoàn tất thao tác. Kiểm tra kết nối rồi thử lại.';
}
