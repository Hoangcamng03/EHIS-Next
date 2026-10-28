import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { signalDuration, type AlertSoundKind } from './emergency-audio';
import { createNativeSignal } from './native-signal';

// Expo's native shared object exposes documented setters; this is not React state.
function enablePlayerAudio(player: AudioPlayer) { player.muted = false; player.volume = 1; }

// Foreground only. These modules require a new binary and device acceptance.
export function useEmergencySignal() {
  const player = useAudioPlayer(require('../../assets/emergency_tone.wav'));
  const [state, setState] = useState({ ready: false, sounding: false, message: 'Thử chuông và giữ app mở.' });
  const [soundEnabled, setSoundEnabled] = useState(true), [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const signal = useMemo(() => createNativeSignal({
    prepare: async () => {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldPlayInBackground: false, shouldRouteThroughEarpiece: false, interruptionMode: 'mixWithOthers' });
      enablePlayerAudio(player);
      if (!player.isLoaded) await new Promise<void>((resolve, reject) => {
        const subscription = player.addListener('playbackStatusUpdate', status => { if (status.isLoaded) { clearTimeout(timer); subscription.remove(); resolve(); } });
        const timer = setTimeout(() => { subscription.remove(); reject(new Error('audio-load-timeout')); }, 3000);
        if (player.isLoaded) { clearTimeout(timer); subscription.remove(); resolve(); }
      });
    },
    loaded: () => player.isLoaded, active: () => AppState.currentState === 'active',
    seek: () => player.seekTo(0), play: () => player.play(), pause: () => player.pause(),
    haptic: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    later: (callback, ms) => setTimeout(callback, ms), clear: timer => clearTimeout(timer as ReturnType<typeof setTimeout>),
    notify: value => setState(previous => ({ ...previous, ...value })),
  }), [player]);
  useEffect(() => {
    signal.activate();
    void signal.prepare();
    const listener = AppState.addEventListener('change', value => { setForeground(value === 'active'); if (value !== 'active') signal.stop(); });
    return () => { listener.remove(); signal.dispose(); };
  }, [signal]);
  const test = useCallback(async () => { setSoundEnabled(true); await signal.test(); }, [signal]);
  const mute = useCallback(() => { setSoundEnabled(false); signal.mute(); }, [signal]);
  const play = useCallback((kind: AlertSoundKind) => { void signal.play(signalDuration(kind)); }, [signal]);
  const toggleVibration = useCallback((value: boolean) => { setVibrationEnabled(value); signal.toggleVibration(value); }, [signal]);
  const prepare = useCallback(() => { setSoundEnabled(true); return signal.arm(); }, [signal]);
  return { ...state, soundEnabled, foreground, vibrationSupported: true, vibrationEnabled, prepare, play, stop: signal.stop, test, mute, toggleVibration };
}
