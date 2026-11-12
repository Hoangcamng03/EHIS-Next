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
const shots = path.resolve(__dirname, '../../../.local/product-review-20261112/screens');
fs.mkdirSync(shots, { recursive: true });
for (const width of [390, 1280])
  test(`reporter access and emergency call at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${web}/card?id=${fixtures.cardId}`);
    await expect(page.getByRole('link', { name: 'Gọi 115', exact: true })).toHaveAttribute(
      'href',
      'tel:115',
    );
    await expect(page.getByText(/chạy thử|diễn tập|vị trí giả/i)).toHaveCount(0);
    const send = page.getByRole('button', { name: 'Báo tình nguyện viên gần đây', exact: true });
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
    await expect(page.getByText('EHIS 0.4.21', { exact: true })).toHaveCount(0);
  });
test('new patient signup routes directly to patient without choosing role again', async ({
  page,
}) => {
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
  await expect(page.getByText('Thẻ sức khỏe', { exact: true })).toBeVisible();
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
    await r.goto(`${web}/card?id=${fixtures.cardId}`);
    await r.getByRole('checkbox').check();
    await r.getByRole('button', { name: 'Báo tình nguyện viên gần đây', exact: true }).click();
    await expect(r).toHaveURL(/\/report\?id=/);
    await r.getByRole('radio', { name: /Có phản ứng/ }).check();
    await r.getByRole('radio', { name: /Có vẻ thở đều/ }).check();
    await r.locator('input[name="bleeding"][value="none_seen"]').check();
    await r.getByRole('button', { name: /Gửi thông tin/ }).click();
    await expect(v.getByText('Cập nhật lần 1', { exact: false }).first()).toBeVisible();
    await v.screenshot({ path: path.join(shots, 'volunteer-alert.png') });
    await v.getByRole('button', { name: 'Nhận ca', exact: true }).click();
    await expect(v.getByRole('button', { name: 'Đã đến nơi', exact: true })).toBeVisible();
    await expect(v.getByText('Đường đến bệnh nhân', { exact: true })).toBeVisible();
    await v.screenshot({ path: path.join(shots, 'volunteer-active.png') });
    await r.getByRole('radio', { name: /Có vẻ khó thở/ }).check();
    await r.getByRole('button', { name: /Gửi thông tin/ }).click();
    await expect(v.getByText('Cập nhật lần 2', { exact: false }).first()).toBeVisible();
    await v.getByRole('button', { name: 'Hoàn tất ca hỗ trợ', exact: true }).click();
    await v.getByRole('button', { name: 'Xác nhận: hoàn tất ca hỗ trợ', exact: true }).click();
    await expect(
      r.getByRole('heading', { name: 'Yêu cầu đã kết thúc', exact: true }),
    ).toBeVisible();
    await expect(ready).toHaveAttribute('aria-checked', 'false');
  } finally {
    await volunteerContext.close();
    await reporterContext.close();
  }
});
