export type AlertSoundKind = 'request' | 'update' | 'test';
export const signalDuration = (kind: AlertSoundKind) => kind === 'request' ? 6 : kind === 'update' ? 2 : 1;

// Finite, moderate-volume tones generated locally; no audio/data sent to a server.
export function startAlertTone(context: AudioContext, kind: AlertSoundKind): () => void {
  if (context.state !== 'running') throw new Error('audio-suspended');
  const nodes: { oscillator: OscillatorNode; gain: GainNode }[] = [];
  const start = context.currentTime, duration = signalDuration(kind);
  for (let offset = 0; offset < duration; offset += 0.75) {
    const oscillator = context.createOscillator(), gain = context.createGain();
    const from = start + offset, to = Math.min(from + 0.4, start + duration);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, from);
    oscillator.frequency.setValueAtTime(660, Math.min(from + 0.2, to));
    gain.gain.setValueAtTime(0, from);
    gain.gain.linearRampToValueAtTime(0.08, from + 0.01);
    gain.gain.setValueAtTime(0.08, Math.max(from + 0.01, to - 0.04));
    gain.gain.linearRampToValueAtTime(0, to);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(from); oscillator.stop(to);
    nodes.push({ oscillator, gain });
  }
  return () => {
    for (const { oscillator, gain } of nodes) {
      try { oscillator.stop(); } catch { /* May already have stopped. */ }
      oscillator.disconnect(); gain.disconnect();
    }
  };
}
