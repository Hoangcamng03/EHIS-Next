// Inject hardware so cancellation races can be tested without a physical phone.
export type NativeSignalPort = {
  prepare(): Promise<void>; loaded(): boolean; active(): boolean;
  seek(): Promise<void>; play(): void; pause(): void; haptic(): Promise<void>;
  later(callback: () => void, ms: number): unknown; clear(timer: unknown): void;
  notify(value: { ready?: boolean; sounding?: boolean; message?: string }): void;
};
export function createNativeSignal(port: NativeSignalPort) {
  let epoch = 0, muted = false, vibration = true, disposed = false, ready = false, timer: unknown;
  const notify: NativeSignalPort['notify'] = value => { if (!disposed) port.notify(value); };
  function stop() {
    epoch++; if (timer !== undefined) port.clear(timer); timer = undefined;
    try { port.pause(); } catch { /* The player may already be released. */ }
    notify({ sounding: false });
  }
  async function prepare() {
    const started = epoch;
    try {
      await port.prepare();
      if (disposed || muted || started !== epoch || !port.active()) return false;
      ready = port.loaded();
      notify({ ready, message: ready ? 'Chuông đã sẵn sàng. Bấm thử chuông và kiểm tra âm lượng thiết bị.' : 'Âm thanh đang tải. Bấm thử lại; cảnh báo hình ảnh vẫn hoạt động.' });
      return ready;
    } catch {
      if (!disposed && !muted && started === epoch) { ready = false; notify({ ready: false, message: 'Chưa chuẩn bị được chuông. Thử lại; cảnh báo hình ảnh vẫn hoạt động.' }); }
      return false;
    }
  }
  async function play(duration: number) {
    stop(); const started = epoch;
    if (disposed || !port.active()) return;
    if (vibration) void port.haptic().catch(() => undefined);
    if (muted) return;
    if (!ready || !port.loaded()) { notify({ ready: false, message: 'Có cập nhật mới. Bấm thử chuông để chuẩn bị âm thanh.' }); return; }
    try {
      await port.seek();
      if (disposed || muted || started !== epoch || !port.active()) return;
      port.play(); notify({ sounding: true });
      timer = port.later(() => stop(), duration * 1000);
    } catch { if (!disposed && !muted && started === epoch) notify({ sounding: false, ready: false, message: 'Chưa phát được chuông. Bấm thử lại; kiểm tra yêu cầu trên màn hình.' }); }
  }
  function mute() { muted = true; ready = false; stop(); notify({ ready: false, message: 'Đã tắt chuông. Cảnh báo hình ảnh vẫn hoạt động; rung theo lựa chọn.' }); }
  async function test() { muted = false; if (await prepare()) await play(1); }
  return { prepare, play, stop, mute, test,
    activate() { disposed = false; },
    toggleVibration(value: boolean) { vibration = value; },
    dispose() { disposed = true; stop(); },
  };
}
