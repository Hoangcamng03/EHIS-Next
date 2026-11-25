import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

const fixture = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../.local/product-review-20261112/ui-fixtures.private.json'),
    'utf8',
  ),
);
const web = 'http://localhost:3100';
const shots = path.resolve(__dirname, '../../../.local/quality-20261124/screens');
fs.mkdirSync(shots, { recursive: true });

test('initial request exposes exact recovery immediately after a lost server acknowledgement', async ({
  page,
}) => {
  await page.goto(`${web}/card?id=${fixture.cardId}`);
  await page.getByRole('button', { name: 'Không, chọn điểm bệnh nhân', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Địa chỉ / cổng / tầng / điểm hẹn của bệnh nhân' })
    .fill('Cổng chính khu An Bình');
  await page.getByText('Nhập tọa độ được chia sẻ', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Vĩ độ', exact: true }).fill('10.779');
  await page.getByRole('textbox', { name: 'Kinh độ', exact: true }).fill('106.699');
  await page.getByRole('button', { name: 'Đặt điểm trên bản đồ', exact: true }).click();
  await page
    .getByRole('checkbox', {
      name: 'Tôi đã xác nhận địa chỉ và ghim đúng vị trí bệnh nhân.',
      exact: true,
    })
    .check();
  const payloads: string[] = [];
  await page.route('**/createIncident', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.continue();
    payloads.push(route.request().postData()!);
    if (payloads.length === 1) {
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      return route.abort('failed');
    }
    return route.continue();
  });
  await page.getByRole('button', { name: 'Gửi yêu cầu hỗ trợ', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Kiểm tra yêu cầu trước', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Có, dùng GPS của tôi', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('textbox', { name: 'Địa chỉ / cổng / tầng / điểm hẹn của bệnh nhân' }),
  ).toBeDisabled();
  await page.screenshot({ path: path.join(shots, 'request-recovery.png'), animations: 'disabled' });
  // Reload must recover the same persisted request without asking for a new point.
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Kiểm tra yêu cầu trước', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Kiểm tra yêu cầu trước', exact: true }).click();
  await expect(page).toHaveURL(/\/report\?id=/);
  expect(payloads).toHaveLength(2);
  expect(payloads[1]).toBe(payloads[0]);
  await page.getByRole('button', { name: 'Hủy yêu cầu chưa có TNV nhận', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận hủy yêu cầu', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Yêu cầu đã kết thúc', exact: true }),
  ).toBeVisible();
});

test('reporter can cancel GPS acquisition without sending an incident', async ({ page }) => {
  await page.goto(`${web}/card?id=${fixture.remoteCardId}`);
  await page.evaluate(() => {
    (window as unknown as { clearedGps: number }).clearedGps = 0;
    navigator.geolocation.watchPosition = () => 8642;
    navigator.geolocation.clearWatch = () => {
      (window as unknown as { clearedGps: number }).clearedGps++;
    };
  });
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/createIncident')) requests.push(request.url());
  });
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Gửi yêu cầu hỗ trợ', exact: true }).click();
  await page.getByRole('button', { name: 'Hủy lấy GPS', exact: true }).click();
  await expect(
    page.getByText('Đã dừng lấy GPS. Chưa gửi yêu cầu hỗ trợ.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Không, chọn điểm bệnh nhân', exact: true }),
  ).toBeEnabled();
  expect(await page.evaluate(() => (window as unknown as { clearedGps: number }).clearedGps)).toBe(
    1,
  );
  expect(requests).toEqual([]);
});

test('admin access verification failure is retryable and never displayed as denied access', async ({
  page,
}) => {
  let failed = false;
  await page.route('**/getMyAccess', async (route) => {
    if (route.request().method() === 'OPTIONS' || failed) return route.continue();
    failed = true;
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        error: { status: 'UNAVAILABLE', message: 'Temporary transport failure' },
      }),
    });
  });
  await page.goto(`${web}/admin`);
  await page
    .getByRole('textbox', { name: 'Email quản trị', exact: true })
    .fill(fixture.admin.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(fixture.admin.password);
  await page.getByRole('button', { name: 'Đăng nhập quản trị', exact: true }).click();
  const retry = page.getByRole('button', { name: 'Kiểm tra lại quyền quản trị', exact: true });
  await expect(retry).toBeVisible();
  await expect(page.getByText(/Tài khoản này không có quyền quản trị/)).toHaveCount(0);
  await page.screenshot({ path: path.join(shots, 'admin-recovery.png') });
  await retry.click();
  await expect(
    page.getByRole('heading', { name: 'Duyệt tình nguyện viên', exact: true }),
  ).toBeVisible();
});

test('patient and volunteer home controls satisfy automated accessibility checks', async ({
  browser,
}) => {
  for (const [role, account] of [
    ['patient', fixture.patient],
    ['volunteer', fixture.volunteer],
  ] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    try {
      const page = await context.newPage();
      const renderErrors: string[] = [];
      page.on('console', (message) => {
        if (/Unexpected text node|non-boolean attribute/.test(message.text()))
          renderErrors.push(message.text());
      });
      await page.goto('http://localhost:8082');
      await page.getByRole('textbox', { name: 'Email', exact: true }).fill(account.email);
      await page.getByLabel('Mật khẩu', { exact: true }).fill(account.password);
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await expect(
        page.getByRole('tab', {
          name: role === 'patient' ? 'Thẻ của tôi' : 'Trang chính',
          exact: true,
        }),
      ).toBeVisible();
      const audit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      fs.writeFileSync(
        path.join(shots, `accessibility-${role}.json`),
        JSON.stringify(audit.violations, null, 2),
      );
      expect(audit.violations).toEqual([]);
      const tabs = page.getByRole('tablist', { name: 'Điều hướng chính', exact: true });
      const first = tabs.getByRole('tab').first(),
        last = tabs.getByRole('tab').last();
      await first.focus();
      await first.press('End');
      await expect(last).toBeFocused();
      await last.press('Enter');
      await expect(last).toHaveAttribute('aria-selected', 'true');
      expect(renderErrors).toEqual([]);
      await last.press('Home');
      await expect(first).toBeFocused();
      await first.press('Enter');
      await expect(first).toHaveAttribute('aria-selected', 'true');
      await page.setViewportSize({ width: 320, height: 640 });
      await expect(first).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: path.join(shots, `home-${role}-320.png`),
        animations: 'disabled',
      });
    } finally {
      await context.close();
    }
  }
});
