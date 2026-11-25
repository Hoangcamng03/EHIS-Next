// Browser fallback; background location service runs on Android native APK only.
export async function startBackgroundLocation(): Promise<{ enabled: boolean; message: string }> {
  return { enabled: false, message: '' };
}
export async function stopBackgroundLocation(): Promise<void> {}
