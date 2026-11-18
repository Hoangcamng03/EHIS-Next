import { confirmedPoint } from './location-fix';

// Some browsers first return a coarse network fix. Keep watching until a fresh
// usable GPS fix arrives; always remove the watcher on success, timeout or abort.
export function accuratePosition(signal?: AbortSignal): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation || signal?.aborted) return reject(new Error('location'));
    let watch: number | undefined,
      settled = false;
    const finish = (position?: GeolocationPosition) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      if (watch !== undefined) navigator.geolocation.clearWatch(watch);
      if (position) resolve(position);
      else reject(new Error('location'));
    };
    const abort = () => finish();
    const timer = setTimeout(abort, 15000);
    signal?.addEventListener('abort', abort, { once: true });
    try {
      watch = navigator.geolocation.watchPosition(
        (position) => {
          try {
            confirmedPoint(position, Date.now());
            finish(position);
          } catch {
            /* Wait for a more accurate, current fix. */
          }
        },
        (error) => {
          if (error.code === 1) finish();
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
      if (settled && watch !== undefined) navigator.geolocation.clearWatch(watch);
    } catch {
      finish();
    }
  });
}
