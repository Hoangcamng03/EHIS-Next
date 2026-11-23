import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const fixture = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../.local/product-review-20261112/ui-fixtures.private.json'),
    'utf8',
  ),
);
const app = 'http://localhost:8082',
  web = 'http://localhost:3100';
const screenshots = path.resolve(__dirname, '../../../.local/uat-20261124/screens');
fs.mkdirSync(screenshots, { recursive: true });
async function login(page: Page, account: { email: string; password: string }) {
  await page.goto(app);
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(account.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}
test('patient sees consent failure inside the confirmation and can cancel without changing sharing', async ({
  page,
}) => {
  await login(page, fixture.patient);
  const toggle = page.getByRole('switch', { name: 'Chia sẻ hồ sơ khi được hỗ trợ', exact: true });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.click();
  await page.route('**/updatePatientCardConsent', async (route) => {
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': 'authorization,content-type',
        },
      });
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        error: { status: 'FAILED_PRECONDITION', message: 'Card has an active incident' },
      }),
    });
  });
  const confirm = page.getByRole('button', { name: 'Xác nhận dừng chia sẻ', exact: true });
  const dialog = confirm.locator('..');
  await confirm.click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await page.screenshot({
    path: path.join(screenshots, 'consent-error-visible.png'),
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
});
test('patient emergency-contact shortcut scrolls directly to the contact fields', async ({
  page,
}) => {
  await login(page, fixture.patient);
  await page.getByRole('button', { name: 'Liên hệ khẩn cấp', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Tên người liên hệ khẩn cấp', exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByRole('textbox', { name: 'Số liên hệ khẩn cấp', exact: true }),
  ).toBeInViewport();
  await page.screenshot({ path: path.join(screenshots, 'emergency-contact-shortcut.png') });
  await page.getByRole('tab', { name: 'Thẻ của tôi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Phóng to mã QR', exact: true })).toBeInViewport();
});
test('reporter rejects stale GPS and can safely retry an uncertain location update', async ({
  browser,
}) => {
  const vc = await browser.newContext({
    viewport: { width: 390, height: 844 },
    geolocation: { latitude: 10.7769, longitude: 106.7009 },
    permissions: ['geolocation'],
  });
  const rc = await browser.newContext({
    viewport: { width: 390, height: 844 },
    geolocation: { latitude: 10.779, longitude: 106.699 },
    permissions: ['geolocation'],
  });
  const v = await vc.newPage(),
    r = await rc.newPage();
  const pageErrors: string[] = [];
  v.on('pageerror', (error) => pageErrors.push(error.message));
  r.on('pageerror', (error) => pageErrors.push(error.message));
  const received: string[] = [];
  try {
    await login(v, fixture.volunteer);
    await v.getByRole('switch', { name: 'Sẵn sàng nhận yêu cầu hỗ trợ', exact: true }).click();
    await r.goto(`${web}/card?id=${fixture.cardId}`);
    await r.getByRole('checkbox').check();
    await r.getByRole('button', { name: 'Gửi yêu cầu hỗ trợ', exact: true }).click();
    await expect(r).toHaveURL(/\/report\?id=/);
    await v.getByRole('button', { name: 'Nhận ca', exact: true }).click();
    await expect(v.getByRole('button', { name: 'Đã đến nơi', exact: true })).toBeVisible();
    await v.getByRole('button', { name: 'Đã đến nơi', exact: true }).click();
    await expect(
      v.getByRole('button', { name: 'Xác nhận: đã đến nơi', exact: true }),
    ).toBeVisible();
    await r.getByText('Bệnh nhân đã đổi vị trí? Cập nhật điểm', { exact: true }).click();
    await r.getByRole('button', { name: 'Lấy GPS để xác nhận điểm mới', exact: true }).click();
    await r
      .getByRole('checkbox', {
        name: 'Tôi đang ở cạnh bệnh nhân và xác nhận dùng điểm mới này.',
        exact: true,
      })
      .check();
    await r.evaluate(() => {
      const original = Date.now;
      (window as unknown as { restoreNow: () => void }).restoreNow = () => {
        Date.now = original;
      };
      Date.now = () => original() + 20000;
    });
    await r.getByRole('button', { name: 'Xác nhận đổi điểm và báo TNV', exact: true }).click();
    await expect(r.getByRole('alert').filter({ hasText: /GPS.*10 giây/ })).toBeVisible();
    await r.evaluate(() => (window as unknown as { restoreNow: () => void }).restoreNow());
    await r.getByRole('button', { name: 'Lấy GPS để xác nhận điểm mới', exact: true }).click();
    await r
      .getByRole('checkbox', {
        name: 'Tôi đang ở cạnh bệnh nhân và xác nhận dùng điểm mới này.',
        exact: true,
      })
      .check();
    await r.route('**/updateIncidentLocation', async (route) => {
      if (route.request().method() === 'OPTIONS') return route.continue();
      received.push(route.request().postData()!);
      if (received.length === 1) {
        const response = await route.fetch();
        expect(response.status()).toBe(200);
        return route.abort('failed');
      }
      return route.continue();
    });
    await r.getByRole('button', { name: 'Xác nhận đổi điểm và báo TNV', exact: true }).click();
    const retry = r.getByRole('button', { name: 'Kiểm tra lần gửi trước', exact: true });
    await expect(retry).toBeVisible();
    await expect(v.getByRole('button', { name: 'Xác nhận: đã đến nơi', exact: true })).toBeHidden();
    await expect(
      r.getByRole('checkbox', {
        name: 'Tôi ở xa, chọn điểm do người tại chỗ cung cấp',
        exact: true,
      }),
    ).toBeDisabled();
    await r.screenshot({ path: path.join(screenshots, 'location-update-recovery.png') });
    await r.evaluate(() => {
      const original = Date.now;
      Date.now = () => original() + 20000;
    });
    await retry.click();
    await expect(
      r.getByText('Máy chủ đã cập nhật điểm bệnh nhân và báo lại TNV phụ trách.', { exact: true }),
    ).toBeVisible();
    expect(received.length).toBe(2);
    expect(received[1]).toBe(received[0]);
    await r.evaluate(() => {
      navigator.geolocation.watchPosition = () => 4242;
      navigator.geolocation.clearWatch = () => {};
    });
    await r.getByRole('button', { name: 'Lấy GPS để xác nhận điểm mới', exact: true }).click();
    await r.getByRole('button', { name: 'Hủy lấy GPS', exact: true }).click();
    await expect(
      r.getByText('Đã dừng lấy GPS. Điểm bệnh nhân chưa thay đổi.', { exact: true }),
    ).toBeVisible();
    await expect(
      r.getByRole('button', { name: 'Lấy GPS để xác nhận điểm mới', exact: true }),
    ).toBeEnabled();
    expect(pageErrors).toEqual([]);
  } finally {
    // Close the synthetic incident through the normal UI even after a failed assertion.
    const finish = v.getByRole('button', { name: 'Hoàn tất ca hỗ trợ', exact: true });
    try {
      if (await finish.count()) {
        await finish.click({ timeout: 5000 });
        await v
          .getByRole('button', { name: 'Xác nhận: hoàn tất ca hỗ trợ', exact: true })
          .click({ timeout: 5000 });
      }
    } finally {
      await vc.close();
      await rc.close();
    }
  }
});
