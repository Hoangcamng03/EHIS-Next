import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const fixture = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../.local/product-review-20261112/ui-fixtures.private.json'),
    'utf8',
  ),
);
const shots = path.resolve(__dirname, '../../../.local/product-update-20261118/screens');
fs.mkdirSync(shots, { recursive: true });
test('project website stays readable on phone and desktop', async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('http://localhost:3100');
    await expect(page.getByRole('heading', { name: /Một mã QR/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mở EHIS', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: path.join(shots, `website-${width}.png`), fullPage: true });
  }
});
test('remote reporter confirms patient pin without requesting reporter GPS', async ({ page }) => {
  await page.goto(`http://localhost:3100/card?id=${fixture.remoteCardId}`);
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = () => {
      throw Error('Remote request must not read reporter GPS');
    };
    navigator.geolocation.watchPosition = () => {
      throw Error('Remote request must not watch reporter GPS');
    };
  });
  await page.getByRole('button', { name: 'Không, chọn điểm bệnh nhân', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Địa chỉ / cổng / tầng / điểm hẹn của bệnh nhân' })
    .fill('Cổng A, tầng trệt, khu An Bình');
  await page.getByText('Nhập tọa độ được chia sẻ', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Vĩ độ', exact: true }).fill('10.779');
  await page.getByRole('textbox', { name: 'Kinh độ', exact: true }).fill('106.699');
  const submit = page.getByRole('button', { name: 'Gửi yêu cầu hỗ trợ', exact: true });
  await expect(submit).toBeDisabled();
  await page.getByRole('button', { name: 'Đặt điểm trên bản đồ', exact: true }).click();
  await page
    .getByRole('checkbox', {
      name: 'Tôi đã xác nhận địa chỉ và ghim đúng vị trí bệnh nhân.',
      exact: true,
    })
    .check();
  await page.screenshot({ path: path.join(shots, 'remote-confirm.png'), fullPage: true });
  await submit.click();
  await expect(page).toHaveURL(/\/report\?id=/);
  await expect(page.getByRole('heading', { name: /Bổ sung tình trạng/ })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Tôi không ở cạnh bệnh nhân' })).toBeChecked();
});
test('volunteer submits directly and admin verifies skills without referrer', async ({
  browser,
}) => {
  const applicant = await browser.newContext({ viewport: { width: 390, height: 844 } }),
    administrator = await browser.newContext();
  const v = await applicant.newPage(),
    a = await administrator.newPage();
  const renderingErrors: string[] = [];
  v.on('console', (message) => {
    if (/Unexpected text node|non-boolean attribute/.test(message.text()))
      renderingErrors.push(message.text());
  });
  try {
    await v.goto('http://localhost:8082');
    await v.getByRole('textbox', { name: 'Email', exact: true }).fill(fixture.applicant.email);
    await v.getByLabel('Mật khẩu', { exact: true }).fill(fixture.applicant.password);
    await v.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await v.getByRole('textbox', { name: 'Họ và tên', exact: true }).fill('Trần Anh Khoa');
    await v.getByRole('textbox', { name: 'Số điện thoại', exact: true }).fill('0900000000');
    await v
      .getByRole('textbox', { name: 'Khóa đào tạo / nơi thực hành', exact: true })
      .fill('Khóa sơ cứu tại đơn vị An Bình');
    await v
      .getByRole('textbox', { name: 'Khu vực cư trú (phường/xã, tỉnh/thành)', exact: true })
      .fill('Phường An Bình');
    await v
      .getByRole('textbox', { name: 'Đơn vị học tập / làm việc và địa chỉ', exact: true })
      .fill('Đơn vị An Bình');
    await v
      .getByRole('textbox', { name: 'Khu vực có thể hỗ trợ', exact: true })
      .fill('Khu An Bình');
    await expect(v.getByText('Email người quản lý giới thiệu', { exact: true })).toHaveCount(0);
    await v.getByRole('checkbox', { name: 'Hồi sinh tim phổi', exact: true }).click();
    await v.screenshot({ path: path.join(shots, 'volunteer-application.png'), fullPage: true });
    await v.getByRole('button', { name: 'Gửi hồ sơ xác minh', exact: true }).click();
    await expect(v.getByText('Đã gửi hồ sơ · Chờ admin duyệt.', { exact: true })).toBeVisible();
    await a.goto('http://localhost:3100/admin');
    await a.getByRole('textbox', { name: 'Email quản trị', exact: true }).fill(fixture.admin.email);
    await a.getByLabel('Mật khẩu', { exact: true }).fill(fixture.admin.password);
    await a.getByRole('button', { name: 'Đăng nhập quản trị', exact: true }).click();
    const panel = a
      .locator('section')
      .filter({ has: a.getByRole('heading', { name: 'Trần Anh Khoa', exact: true }) });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Duyệt đơn', exact: true })).toBeDisabled();
    for (const name of [
      'Danh tính',
      'Đơn vị / nơi học tập',
      'Đào tạo và kỹ năng',
      'Phạm vi hỗ trợ',
    ])
      await panel.getByRole('checkbox', { name, exact: true }).check();
    await panel
      .getByRole('textbox', { name: 'Căn cứ xác minh / giới hạn hỗ trợ', exact: true })
      .fill('Căn cứ trong hồ sơ được đối chiếu; giới hạn hỗ trợ theo đào tạo.');
    await a.screenshot({ path: path.join(shots, 'admin-review.png'), fullPage: true });
    await panel.getByRole('button', { name: 'Duyệt đơn', exact: true }).click();
    await panel.getByRole('button', { name: 'Xác nhận duyệt đơn', exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(
      v.getByRole('switch', { name: 'Sẵn sàng nhận yêu cầu hỗ trợ', exact: true }),
    ).toBeVisible();
    const footerTab = await v.getByRole('tab', { name: 'Trang chính', exact: true }).boundingBox();
    expect(footerTab!.y).toBeGreaterThan(724);
    expect(footerTab!.y + footerTab!.height).toBeLessThanOrEqual(844);
    await v.getByRole('tab', { name: 'Hoạt động', exact: true }).click();
    await expect(v.getByText('Lịch sử hỗ trợ', { exact: true })).toBeVisible();
    await v.getByRole('tab', { name: 'Trang chính', exact: true }).click();
    expect(renderingErrors).toEqual([]);
    await v.screenshot({ path: path.join(shots, 'volunteer-approved.png'), fullPage: true });
  } finally {
    await applicant.close();
    await administrator.close();
  }
});
