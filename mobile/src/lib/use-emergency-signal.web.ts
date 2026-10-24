import { useCallback, useEffect, useRef, useState } from 'react';
import { signalDuration, startAlertTone, type AlertSoundKind } from './emergency-audio';

export function useEmergencySignal() {
  const context = useRef<AudioContext | null>(null), cancel = useRef<(() => void) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const muted = useRef(false), mounted = useRef(true);
  const [ready, setReady] = useState(false), [soundEnabled, setSoundEnabled] = useState(true);
  const [sounding, setSounding] = useState(false), [message, setMessage] = useState('Bật sẵn sàng hoặc bấm thử chuông để chuẩn bị âm thanh.');
  const [foreground, setForeground] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible');
  const vibrationSupported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const vibration = useRef(true);
  const stop = useCallback(() => {
    cancel.current?.(); cancel.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(0);
    if (mounted.current) setSounding(false);
  }, []);
  const prepare = useCallback(async () => {
    if (muted.current) return false;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const Constructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Constructor) throw new Error('audio-unavailable');
      context.current ??= new Constructor();
      if (context.current.state !== 'running') await Promise.race([context.current.resume(), new Promise<never>((_, reject) => { resumeTimer = setTimeout(() => reject(new Error('audio-resume-timeout')), 4000); })]);
      if (!mounted.current || muted.current) return false;
      const running = context.current.state === 'running';
      setReady(running); setMessage(running ? 'Chuông đã sẵn sàng. Kiểm tra âm lượng thiết bị và giữ trang này mở.' : 'Trình duyệt đang chặn âm thanh. Bấm Bật và thử chuông.');
      return running;
    } catch {
      if (mounted.current && !muted.current) { setReady(false); setMessage('Chưa bật được âm thanh. Cảnh báo vẫn hiện trên màn hình; thử lại hoặc dùng trình duyệt khác.'); }
      return false;
    } finally { clearTimeout(resumeTimer); }
  }, []);
  const play = useCallback((kind: AlertSoundKind) => {
    stop();
    if (document.visibilityState !== 'visible') return;
    let played = false;
    if (!muted.current && context.current?.state === 'running') {
      try { cancel.current = startAlertTone(context.current, kind); played = true; }
      catch { setReady(false); setMessage('Chuông chưa phát được. Bấm Bật và thử chuông; yêu cầu vẫn hiển thị.'); }
    } else if (!muted.current) { setReady(false); setMessage('Có cập nhật mới nhưng âm thanh chưa được cho phép. Bấm Bật và thử chuông.'); }
    if (vibration.current && typeof navigator.vibrate === 'function') navigator.vibrate(kind === 'request' ? [120, 160, 120] : [100]);
    setSounding(played);
    timer.current = setTimeout(() => { cancel.current?.(); cancel.current = null; timer.current = null; if (mounted.current) setSounding(false); }, signalDuration(kind) * 1000);
  }, [stop]);
  const test = useCallback(async () => {
    muted.current = false; setSoundEnabled(true);
    if (await prepare() && !muted.current && mounted.current) play('test');
  }, [prepare, play]);
  const mute = useCallback(() => { muted.current = true; setSoundEnabled(false); setReady(false); stop(); setMessage('Đã tắt chuông. Cảnh báo bằng hình ảnh vẫn hoạt động; rung theo lựa chọn bên dưới.'); }, [stop]);
  useEffect(() => {
    mounted.current = true;
    const changed = () => { const visible = document.visibilityState === 'visible'; setForeground(visible); if (!visible) stop(); };
    document.addEventListener('visibilitychange', changed);
    return () => { mounted.current = false; document.removeEventListener('visibilitychange', changed); stop(); void context.current?.close().catch(() => {}); context.current = null; };
  }, [stop]);
  function toggleVibration(value: boolean) { vibration.current = value; setVibrationEnabled(value); if (!value && typeof navigator.vibrate === 'function') navigator.vibrate(0); }
  return { ready, soundEnabled, sounding, message, foreground, vibrationSupported, vibrationEnabled, prepare, play, stop, test, mute, toggleVibration };
}
