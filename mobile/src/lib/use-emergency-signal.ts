import { useCallback } from 'react';
import type { AlertSoundKind } from './emergency-audio';

// Native audio/vibration will be wired and device-tested in the approved native phase.
export function useEmergencySignal() {
  const prepare = useCallback(async () => false, []);
  const play: (kind: AlertSoundKind) => void = useCallback(() => {}, []);
  const stop = useCallback(() => {}, []), test = useCallback(async () => {}, []), mute = useCallback(() => {}, []);
  const toggleVibration: (value: boolean) => void = useCallback(() => {}, []);
  return { ready: false, soundEnabled: false, sounding: false, message: 'Chuông/rung của thay đổi này đang nghiệm thu trên web; chưa phát hành bản native mới.', foreground: true, vibrationSupported: false, vibrationEnabled: false, prepare, play, stop, test, mute, toggleVibration };
}
