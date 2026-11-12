import { defineConfig } from '@playwright/test';
import path from 'node:path';
export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: 0,
  timeout: 60000,
  expect: { timeout: 15000 },
  outputDir: '../../.local/product-review-20261112/playwright-artifacts',
  reporter: [
    ['list'],
    ['json', { outputFile: '../../.local/product-review-20261112/playwright-results.json' }],
  ],
  use: {
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: process.env.EHIS_BROWSER_EXECUTABLE
      ? { executablePath: process.env.EHIS_BROWSER_EXECUTABLE }
      : {},
  },
  webServer:
    process.env.EHIS_UI_SERVERS_READY === 'true'
      ? undefined
      : [
          {
            command: 'npm run web',
            cwd: path.resolve(__dirname, '../..'),
            url: 'http://localhost:3100',
            reuseExistingServer: false,
            timeout: 120000,
            env: {
              NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ehis-next',
              NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-key',
              NEXT_PUBLIC_FIREBASE_APP_ID: 'demo-app',
              NEXT_PUBLIC_USE_EMULATORS: 'true',
              NEXT_PUBLIC_EMULATOR_HOST: '127.0.0.1',
              EHIS_STATIC_EXPORT: 'false',
            },
          },
          {
            command: 'npm run app:web',
            cwd: path.resolve(__dirname, '../..'),
            url: 'http://localhost:8082',
            reuseExistingServer: false,
            timeout: 120000,
            env: {
              EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ehis-next',
              EXPO_PUBLIC_FIREBASE_API_KEY: 'demo-key',
              EXPO_PUBLIC_FIREBASE_APP_ID: 'demo-app',
              EXPO_PUBLIC_USE_EMULATORS: 'true',
              EXPO_PUBLIC_EMULATOR_HOST: '127.0.0.1',
            },
          },
        ],
});
