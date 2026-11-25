import { useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useSession } from './Session';
export function NotificationNavigation() {
  const response = Notifications.useLastNotificationResponse();
  const { user, purpose, loading } = useSession();
  const pathname = usePathname();
  useEffect(() => {
    if (!response || loading) return;
    if (
      user &&
      purpose === 'volunteer' &&
      response.notification.request.content.data?.screen === 'volunteer' &&
      pathname !== '/volunteer'
    ) {
      // Never trust a notification as assignment or authorization; the feed revalidates.
      router.replace('/volunteer');
    }
    void Notifications.clearLastNotificationResponseAsync();
  }, [response, user, purpose, loading, pathname]);
  return null;
}
