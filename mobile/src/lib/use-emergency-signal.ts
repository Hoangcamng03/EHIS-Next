import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { signalDuration, type AlertSoundKind } from './emergency-audio';
import { createNativeSignal } from './native-signal';

// Foreground only. These modules require a new binary and device acceptance.
export function useEmergencySignal() {
  const player = useAudioPlayer(require('../../assets/emergency-tone.wav'));
  const [state, setState] = useState({ ready: false, sounding: false, message: 'Bấm thử chuông và giữ ứng dụng mở để nhận cảnh báo.' });
  const [soundEnabled, setSoundEnabled] = useState(true), [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const signal = useMemo(() => createNativeSignal({
    prepare: () => setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldPlayInBackground: false, interruptionMode: 'mixWithOthers' }),
    loaded: () => player.isLoaded, active: () => AppState.currentState === 'active',
    seek: () => player.seekTo(0), play: () => player.play(), pause: () => player.pause(),
    haptic: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    later: (callback, ms) => setTimeout(callback, ms), clear: timer => clearTimeout(timer as ReturnType<typeof setTimeout>),
    notify: value => setState(previous => ({ ...previous, ...value })),
  }), [player]);
  useEffect(() => {
    signal.activate();
    const listener = AppState.addEventListener('change', value => { setForeground(value === 'active'); if (value !== 'active') signal.stop(); });
    return () => { listener.remove(); signal.dispose(); };
  }, [signal]);
  const test = useCallback(async () => { setSoundEnabled(true); await signal.test(); }, [signal]);
  const mute = useCallback(() => { setSoundEnabled(false); signal.mute(); }, [signal]);
  const play = useCallback((kind: AlertSoundKind) => { void signal.play(signalDuration(kind)); }, [signal]);
  const toggleVibration = useCallback((value: boolean) => { setVibrationEnabled(value); signal.toggleVibration(value); }, [signal]);
  return { ...state, soundEnabled, foreground, vibrationSupported: true, vibrationEnabled, prepare: signal.prepare, play, stop: signal.stop, test, mute, toggleVibration };
}
