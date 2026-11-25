import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

const fixtures = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../.local/product-review-20261112/ui-fixtures.private.json'),
    'utf8',
  ),
);
const app = 'http://localhost:8082',
  web = 'http://localhost:3100';
const nativeVersion = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../app/app.json'), 'utf8'),
).expo.version;
const shots = path.resolve(__dirname, '../../../.local/product-review-20261112/screens');
fs.mkdirSync(shots, { recursive: true });
for (const width of [390, 1280])
  test(`reporter access without call banner at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${web}/card?id=${fixtures.cardId}`);
    await expect(page.locator('a[href="tel:115"]')).toHaveCount(0);
    await expect(page.getByRole('note', { name: 'Liên hệ cấp cứu' })).toHaveCount(0);
    await expect(page.getByText(/chạy thử|diễn tập|vị trí giả/i)).toHaveCount(0);
    const send = page.getByRole('button', { name: 'Gửi yêu cầu hỗ trợ', exact: true });
    await expect(send).toBeDisabled();
    await page.getByRole('checkbox').check();
    await expect(send).toBeEnabled();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
    await page.screenshot({ path: path.join(shots, `reporter-${width}.png`) });
  });
for (const role of ['Bệnh nhân', 'Tình nguyện viên'])
  test(`registration form explains ${role} and blocks short password`, async ({ page }) => {
    await page.goto(app);
    await page.getByRole('button', { name: 'Chưa có tài khoản? Đăng ký', exact: true }).click();
    await page.getByRole('button', { name: `Chọn ${role}`, exact: true }).click();
    await expect(page.getByText(`Bạn chọn: ${role}`, { exact: true })).toBeVisible();
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill('minhan@example.test');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('short');
    await page
      .getByRole('checkbox', { name: 'Xác nhận đã đọc thông tin dữ liệu', exact: true })
      .check();
    const submit = page.getByRole('button', { name: 'Tạo tài khoản', exact: true });
    await expect(submit).toBeDisabled();
    await page.getByLabel('Mật khẩu', { exact: true }).fill('Local-only-1234!');
    await expect(submit).toBeEnabled();
    await page.screenshot({
      path: path.join(
        shots,
        role === 'Bệnh nhân' ? 'patient-registration.png' : 'volunteer-registration.png',
      ),
    });
    await expect(page.getByText(`EHIS ${nativeVersion}`, { exact: true })).toHaveCount(0);
  });
test('new patient signup routes directly to patient without choosing role again', async ({
  page,
}) => {
  const renderWarnings: string[] = [];
  page.on('console', (message) => {
    if (/non-boolean attribute|Unexpected text node/.test(message.text()))
      renderWarnings.push(message.text());
  });
  await page.goto(app);
  await page.getByRole('button', { name: 'Chưa có tài khoản? Đăng ký', exact: true }).click();
  await page.getByRole('button', { name: 'Chọn Bệnh nhân', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill(`lanphuong-${Date.now()}@example.test`);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Local-only-1234!');
  await page
    .getByRole('checkbox', { name: 'Xác nhận đã đọc thông tin dữ liệu', exact: true })
    .check();
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page).toHaveURL(/\/patient$/);
  await expect(page.getByText('Thẻ sức khỏe của bạn', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Hồ sơ', exact: true }).click();
  const initialTab = await page
    .getByRole('tab', { name: 'Thẻ của tôi', exact: true })
    .boundingBox();
  expect(initialTab!.y).toBeGreaterThan(724);
  await page.getByRole('textbox', { name: 'Họ tên bệnh nhân', exact: true }).fill('Lê Lan Phương');
  await page
    .getByRole('textbox', { name: 'Bệnh nền và tiền sử', exact: true })
    .fill('Hen phế quản');
  await page.getByRole('button', { name: 'Lưu hồ sơ', exact: true }).click();
  await expect(page.getByText('Đã lưu hồ sơ.', { exact: true }).first()).toBeVisible();
  const afterScrollTab = await page
    .getByRole('tab', { name: 'Thẻ của tôi', exact: true })
    .boundingBox();
  expect(Math.abs(afterScrollTab!.y - initialTab!.y)).toBeLessThan(2);
  await page.getByRole('tab', { name: 'Thẻ của tôi', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo mã QR', exact: true }).click();
  await expect(page.getByText('Mã QR đang hoạt động', { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(shots, 'patient-card.png') });
  await page.getByRole('button', { name: 'Phóng to mã QR', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đóng mã QR', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng mã QR', exact: true }).click();
  const sharing = page.getByRole('switch', { name: 'Chia sẻ hồ sơ khi được hỗ trợ', exact: true });
  await expect(sharing).toHaveAttribute('aria-checked', 'true');
  await sharing.click();
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(sharing).toHaveAttribute('aria-checked', 'true');
  await sharing.click();
  await page.getByRole('button', { name: 'Xác nhận dừng chia sẻ', exact: true }).click();
  await expect(sharing).toHaveAttribute('aria-checked', 'false');
  await sharing.click();
  await page.getByRole('button', { name: 'Xác nhận chia sẻ', exact: true }).click();
  await expect(sharing).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: 'Quay lại', exact: true })).toBeHidden();
  await page.screenshot({ path: path.join(shots, 'patient-card.png') });
  expect(renderWarnings).toEqual([]);
});
test('reporter GPS request, volunteer acceptance, report update and completion', async ({
  browser,
}) => {
  const volunteerContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    geolocation: { latitude: 10.7769, longitude: 106.7009 },
    permissions: ['geolocation'],
  });
  const reporterContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    geolocation: { latitude: 10.779, longitude: 106.699 },
    permissions: ['geolocation'],
  });
  const v = await volunteerContext.newPage(),
    r = await reporterContext.newPage();
  try {
    await v.goto(app);
    await v.getByRole('textbox', { name: 'Email', exact: true }).fill(fixtures.volunteer.email);
    await v.getByLabel('Mật khẩu', { exact: true }).fill(fixtures.volunteer.password);
    await v.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    const ready = v.getByRole('switch', { name: 'Sẵn sàng nhận yêu cầu hỗ trợ', exact: true });
    await ready.click();
    await expect(ready).toHaveAttribute('aria-checked', 'true');
    await v.getByRole('button', { name: 'Hướng dẫn', exact: true }).click();
    await expect(v.getByText('Hướng dẫn nhận ca', { exact: true })).toBeVisible();
    await v.getByRole('button', { name: 'Đóng', exact: true }).click();
    await v.screenshot({ path: path.join(shots, 'volunteer-ready.png') });
    await r.goto(`${web}/card?id=${fixtures.cardId}`);
    await r.getByRole('checkbox').check();
    await r.getByRole('button', { name: 'Gửi yêu cầu hỗ trợ', exact: true }).click();
    await expect(r).toHaveURL(/\/report\?id=/);
    await expect(r.locator('a[href="tel:115"]')).toHaveCount(0);
    await r.getByRole('radio', { name: /Có phản ứng/ }).check();
    await r.getByRole('radio', { name: /Có vẻ thở đều/ }).check();
    await r.locator('input[name="bleeding"][value="none_seen"]').check();
    await r.getByRole('button', { name: /Gửi thông tin/ }).click();
    await expect(r.getByText(/Máy chủ đã lưu bản bổ sung số 1/)).toBeVisible();
    await expect(v.getByText('Cập nhật lần 1', { exact: false }).first()).toBeVisible();
    await v.screenshot({ path: path.join(shots, 'volunteer-alert.png') });
    await v.getByRole('button', { name: 'Nhận ca', exact: true }).click();
    await expect(v.getByRole('button', { name: 'Đã đến nơi', exact: true })).toBeVisible();
    await expect(v.getByText('Đường đến bệnh nhân', { exact: true })).toBeVisible();
    await expect(v.getByText('Họ tên: Nguyễn Minh An', { exact: true })).toBeVisible();
    // Wait for the actual route request to settle; do not replace tiles/route
    // with fabricated images or geometry when the external service fails.
    await expect(v.getByText('Đang tính tuyến…', { exact: true })).toHaveCount(0, {
      timeout: 22000,
    });
    await expect
      .poll(() => v.locator('.leaflet-tile-loaded').count(), { timeout: 15000 })
      .toBeGreaterThan(0);
    await v.screenshot({ path: path.join(shots, 'volunteer-active.png') });
    await r.evaluate(() => window.scrollTo(0, 0));
    await r.screenshot({ path: path.join(shots, 'reporter-followup.png') });
    await r.screenshot({ path: path.join(shots, 'reporter-followup-full.png'), fullPage: true });
    await r.getByRole('radio', { name: /Có vẻ khó thở/ }).check();
    await r.getByRole('radio', { name: /Tôi không ở cạnh bệnh nhân/ }).check();
    await r.getByRole('button', { name: /Gửi thông tin/ }).click();
    await expect(v.getByText('Cập nhật lần 2', { exact: false }).first()).toBeVisible();
    await expect(
      v.getByText('Người báo tin không ở cạnh bệnh nhân', { exact: true }),
    ).toBeVisible();
    await v.getByRole('button', { name: 'Hoàn tất ca hỗ trợ', exact: true }).click();
    await v.getByRole('button', { name: 'Xác nhận: hoàn tất ca hỗ trợ', exact: true }).click();
    await expect(
      r.getByRole('heading', { name: 'Yêu cầu đã kết thúc', exact: true }),
    ).toBeVisible();
    await expect(r.locator('a[href="tel:115"]')).toHaveCount(0);
    await expect(ready).toHaveAttribute('aria-checked', 'false');
  } finally {
    await volunteerContext.close();
    await reporterContext.close();
  }
});
