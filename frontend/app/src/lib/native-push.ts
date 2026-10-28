// Browser fallback. Native Android implementation is selected by Metro.
export async function enableNativePush(): Promise<string> { return 'Thông báo nền dành cho APK Android. Trên web, giữ trang TNV mở.'; }
export async function disconnectNativePush(): Promise<void> { /* No device token on web. */ }
