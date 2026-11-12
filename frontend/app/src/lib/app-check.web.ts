import type { FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
export function configureAppCheck(app: FirebaseApp, emulators: boolean) {
  const siteKey = process.env.EXPO_PUBLIC_APPCHECK_SITE_KEY;
  if (!emulators && siteKey)
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
}
