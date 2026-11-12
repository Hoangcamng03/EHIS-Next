import type { FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

// Optional rollout only. Register the key/domains and monitor before enforcing
// the backend; enforcement must also support the installed Android clients.
export function configureAppCheck(app: FirebaseApp, emulators: boolean) {
  const siteKey = process.env.NEXT_PUBLIC_APPCHECK_SITE_KEY;
  if (!emulators && siteKey)
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
}
