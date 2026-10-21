'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

function initializeClient(name = '[DEFAULT]') {
  if (typeof window === 'undefined') throw new Error('Chỉ khởi tạo Firebase trong trình duyệt.');
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!projectId || !apiKey || !appId) throw new Error('Chưa cấu hình kết nối. Hãy kiểm tra file môi trường web.');
  const emulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';
  if (emulators && projectId !== 'demo-ehis-next') throw new Error('Emulator phải dùng project demo-ehis-next.');
  const app = getApps().some(app => app.name === name) ? getApp(name) : initializeApp({ projectId, apiKey, appId, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }, name);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app, 'asia-southeast1');
  if (emulators) {
    const host = process.env.NEXT_PUBLIC_EMULATOR_HOST || '127.0.0.1';
    connectAuthEmulator(auth, `http://${host}:9199`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8180);
    connectFunctionsEmulator(functions, host, 5101);
  }
  return { auth, db, functions };
}

// Retain connected instances across development hot reloads.
const scope = globalThis as typeof globalThis & { ehisFirebase?: ReturnType<typeof initializeClient>; ehisAdminFirebase?: ReturnType<typeof initializeClient> };
export function firebaseClient() { return scope.ehisFirebase ??= initializeClient(); }
// Separate Auth identity so admin sign-in never replaces an anonymous reporter session.
export function adminClient() { return scope.ehisAdminFirebase ??= initializeClient('ehis-admin'); }
let pendingSession: Promise<string> | undefined;
export async function reporterSession(): Promise<string> {
  if (!pendingSession) pendingSession = (async () => {
    const { auth } = firebaseClient();
    await auth.authStateReady();
    return auth.currentUser?.uid ?? (await signInAnonymously(auth)).user.uid;
  })().finally(() => { pendingSession = undefined; });
  return pendingSession;
}

export function readableError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    'functions/not-found': 'Thẻ không tồn tại hoặc đã bị thu hồi.',
    'functions/already-exists': 'Thẻ này đang có yêu cầu hỗ trợ. Không tạo thêm ca trùng.',
    'functions/permission-denied': 'Phiên này không có quyền với yêu cầu. Hãy dùng trình duyệt đã gửi yêu cầu.',
    'functions/unauthenticated': 'Phiên đăng nhập đã hết hạn. Hãy thử lại.',
    'functions/invalid-argument': 'Thông tin chưa hợp lệ. Kiểm tra câu trả lời và số điện thoại nếu có.',
    'functions/failed-precondition': 'Trạng thái hiện tại không cho phép thao tác này.',
    'functions/unavailable': 'Chưa kết nối được máy chủ. Bạn có thể thử gửi lại.',
    'functions/deadline-exceeded': 'Chưa nhận được xác nhận từ máy chủ. Kiểm tra kết nối rồi thử lại; yêu cầu có mã chống gửi trùng.',
    'auth/network-request-failed': 'Chưa tạo được phiên vì mất kết nối. Kiểm tra mạng và thử lại.',
    'permission-denied': 'Bạn không có quyền xem yêu cầu này.',
  };
  return (code && messages[code]) || 'Chưa hoàn tất thao tác. Kiểm tra kết nối rồi thử lại.';
}
