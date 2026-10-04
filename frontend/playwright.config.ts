import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['line']] : 'line',
  use: {
    baseURL: 'http://127.0.0.1:18080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: executablePath ? { executablePath } : undefined
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium' } }
  ],
  webServer: {
    command: 'java -jar ../target/finnyboyfab-store-0.0.1-SNAPSHOT.jar',
    url: 'http://127.0.0.1:18080/healthz',
    timeout: 45_000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      SPRING_PROFILES_ACTIVE: 'prod',
      PORT: '18080',
      SITE_BASE_URL: 'http://127.0.0.1:18080',
      APP_BASE_URL: 'http://127.0.0.1:18080',
      SUPPORT_EMAIL: 'deployment-test@example.com',
      STORE_DATA_DIR: `/tmp/finnyboyfab-e2e-${process.pid}`,
      CHECKOUT_ENABLED: 'false'
    }
  }
});
