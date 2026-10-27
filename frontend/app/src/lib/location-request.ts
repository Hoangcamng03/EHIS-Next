import { usableFix, type LocationFix } from './live-location';

export type PositionPort = {
  last(): Promise<LocationFix | null>;
  watch(receive: (fix: LocationFix) => void, fail: () => void): Promise<{ remove(): void }>;
};
// Race a strictly recent cached fix against a cancellable foreground watcher.
// A timeout must stop the native watcher, not just abandon its result.
export function firstUsableLocation(port: PositionPort, signal?: AbortSignal, timeout = 12000): Promise<LocationFix> {
  return new Promise((resolve, reject) => {
    let done = false, watcher: { remove(): void } | undefined;
    const finish = (fix?: LocationFix, error = 'location-timeout') => {
      if (done) return;
      done = true; clearTimeout(timer); signal?.removeEventListener('abort', aborted); watcher?.remove();
      if (fix) resolve(fix); else reject(new Error(error));
    };
    const aborted = () => finish(undefined, 'location-cancelled');
    const receive = (fix: LocationFix | null) => { if (fix && usableFix(fix, Date.now())) finish(fix); };
    const timer = setTimeout(() => finish(), timeout);
    if (signal?.aborted) { aborted(); return; }
    signal?.addEventListener('abort', aborted, { once: true });
    void port.last().then(receive).catch(() => undefined);
    void port.watch(receive, () => finish(undefined, 'location-unavailable')).then(value => {
      if (done) value.remove(); else watcher = value;
    }).catch(() => finish(undefined, 'location-unavailable'));
  });
}
