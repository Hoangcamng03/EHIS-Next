import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { firebaseClient, updateAvailability } from './firebase';

const TASK_NAME = 'ehis-volunteer-bg-location';

if (!TaskManager.isTaskDefined(TASK_NAME)) {
  TaskManager.defineTask<{ locations?: Location.LocationObject[] }>(
    TASK_NAME,
    async ({ data, error }) => {
      if (error || !data?.locations?.length) return;
      if (!firebaseClient().auth.currentUser) {
        await stopBackgroundLocation();
        return;
      }
      const best = [...data.locations].sort(
        (a, b) => (a.coords.accuracy ?? Infinity) - (b.coords.accuracy ?? Infinity),
      )[0];
      if (!best) return;
      const { latitude, longitude } = best.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      try {
        await updateAvailability({ available: true, location: { latitude, longitude } }, 12000);
      } catch {
        /* Transient network or offline errors will retry on the next GPS interval. */
      }
    },
  );
}

export async function startBackgroundLocation(): Promise<{ enabled: boolean; message: string }> {
  if (Platform.OS !== 'android') return { enabled: false, message: '' };
  const permission = await Location.requestBackgroundPermissionsAsync();
  if (permission.status !== 'granted') {
    return {
      enabled: false,
      message:
        'Chưa cấp quyền vị trí "Cho phép mọi lúc". Nếu khóa màn hình quá 5 phút, app có thể ngừng nhận ca mới.',
    };
  }
  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (!started) {
    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000,
      distanceInterval: 50,
      deferredUpdatesInterval: 60000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'EHIS đang bật Sẵn sàng',
        notificationBody: 'Đang cập nhật vị trí nền để nhận yêu cầu hỗ trợ khi khóa màn hình.',
        notificationColor: '#167447',
      },
    });
  }
  return {
    enabled: true,
    message: 'GPS nền đang chạy (cập nhật định kỳ khi tắt màn hình).',
  };
}

export async function stopBackgroundLocation(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    }
  } catch {
    /* Task may already be stopped. */
  }
}
