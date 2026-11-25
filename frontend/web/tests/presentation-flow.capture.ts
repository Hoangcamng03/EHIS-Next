import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const app = 'http://localhost:8082',
  web = 'http://localhost:3100';
const dir = path.resolve(__dirname, '../../../.local/flow-final');
const fixture = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../.local/product-review-20261112/ui-fixtures.private.json'),
    'utf8',
  ),
);
type Step = {
  number: number;
  scenario: string;
  role: string;
  title: string;
  action: string;
  image: string;
  sha256: string;
  width: number;
  height: number;
};
const steps: Step[] = [];
const renderingErrors: string[] = [];
test.use({ actionTimeout: 15000, navigationTimeout: 20000 });
let scenario = '01. Đăng ký và xác minh';
fs.mkdirSync(dir, { recursive: true });
test.beforeAll(() => {
  execFileSync(process.execPath, [
    path.resolve(__dirname, '../../../scripts/test-support/cleanup-flow.cjs'),
  ]);
});
async function shot(page: Page, role: string, title: string, action: string) {
  expect(renderingErrors).toEqual([]);
  const number = steps.length + 1,
    image = String(number).padStart(2, '0') + '.png';
  await page.screenshot({ path: path.join(dir, image), animations: 'disabled' });
  const size = page.viewportSize()!;
  steps.push({
    number,
    scenario,
    role,
    title,
    action,
    image,
    sha256: createHash('sha256')
      .update(fs.readFileSync(path.join(dir, image)))
      .digest('hex'),
    ...size,
  });
  save('IN_PROGRESS');
  console.log(JSON.stringify({ flowStep: number, title }));
}
function save(status: string, error?: string) {
  fs.writeFileSync(
    path.join(dir, 'flow.json'),
    JSON.stringify(
      {
        status,
        generatedAt: new Date().toISOString(),
        scope:
          'Local Emulator and real browser UI; fictional profiles and configured browser positions. Not phone/clinical acceptance.',
        error,
        steps,
      },
      null,
      2,
    ),
  );
}
test.afterEach(async ({}, info) => {
  if (info.status !== 'passed')
    save('FAIL', info.error?.message?.split('\n')[0] || 'Flow did not finish');
});
async function signup(
  page: Page,
  role: 'Bệnh nhân' | 'Tình nguyện viên',
  slug: string,
  capture = false,
) {
  await page.goto(app);
  await page.getByRole('button', { name: 'Chưa có tài khoản? Đăng ký', exact: true }).click();
  if (capture) await shot(page, role, 'Chọn đối tượng', 'Chọn vai trò phù hợp trước khi đăng ký.');
  await page.getByRole('button', { name: `Chọn ${role}`, exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill(`${slug}.${randomUUID().slice(0, 8)}@example.com`);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('A' + randomUUID() + '9!');
  await page
    .getByRole('checkbox', { name: 'Xác nhận đã đọc thông tin dữ liệu', exact: true })
    .check();
  if (capture)
    await shot(
      page,
      role,
      'Tạo tài khoản',
      'Điền email, mật khẩu; xác nhận đã đọc quyền riêng tư.',
    );
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page).toHaveURL(role === 'Bệnh nhân' ? /\/patient$/ : /\/volunteer$/);
}
async function patient(page: Page, name: string, condition: string, capture = false) {
  await signup(page, 'Bệnh nhân', name === 'Nguyễn Minh An' ? 'minhan' : 'lanphuong', capture);
  await page.getByRole('tab', { name: 'Hồ sơ', exact: true }).click();
  await page.getByRole('textbox', { name: 'Họ tên bệnh nhân', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'Bệnh nền và tiền sử', exact: true }).fill(condition);
  await page.getByRole('textbox', { name: 'Dị ứng', exact: true }).fill('Penicillin');
  await page
    .getByRole('textbox', { name: 'Tên người liên hệ khẩn cấp', exact: true })
    .fill('Nguyễn Thu Hà');
  await page
    .getByRole('textbox', { name: 'Quan hệ người liên hệ khẩn cấp', exact: true })
    .fill('Chị');
  await page.getByRole('textbox', { name: 'Số liên hệ khẩn cấp', exact: true }).fill('0900000000');
  await page.getByRole('button', { name: 'Lưu hồ sơ', exact: true }).click();
  await expect(page.getByText('Đã lưu hồ sơ.', { exact: true }).first()).toBeVisible();
  if (capture)
    await shot(
      page,
      'Bệnh nhân',
      'Lưu hồ sơ và liên hệ',
      'Tên người liên hệ, quan hệ và số điện thoại đi cùng nhau.',
    );
  await page.getByRole('tab', { name: 'Thẻ của tôi', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo mã QR', exact: true }).click();
  await expect(page.getByText('Mã QR đang hoạt động', { exact: true })).toBeVisible();
  if (capture)
    await shot(
      page,
      'Bệnh nhân',
      'Thẻ QR hoạt động',
      'QR là liên kết thẻ; bệnh án không nằm trực tiếp trong QR.',
    );
  await page.getByRole('tab', { name: 'Tài khoản', exact: true }).click();
  const url = await page
    .getByRole('link', { name: 'Mở trang từ QR', exact: true })
    .getAttribute('href');
  expect(new URL(url!).origin).toBe(web);
  await page.getByRole('tab', { name: 'Thẻ của tôi', exact: true }).click();
  return url!;
}
async function application(page: Page, name: string, capture = false) {
  await signup(page, 'Tình nguyện viên', name === 'Trần Anh Khoa' ? 'anhkhoa' : 'baongoc', capture);
  for (const [label, value] of [
    ['Họ và tên', name],
    ['Số điện thoại', '0900000000'],
    ['Khóa đào tạo / nơi thực hành', 'Khóa sơ cứu cộng đồng An Bình'],
    ['Khu vực cư trú (phường/xã, tỉnh/thành)', 'Phường An Bình'],
    ['Đơn vị học tập / làm việc và địa chỉ', 'Đơn vị An Bình'],
    ['Khu vực có thể hỗ trợ', 'Khu An Bình'],
  ])
    await page.getByRole('textbox', { name: label, exact: true }).fill(value);
  await page.getByRole('checkbox', { name: 'Hồi sinh tim phổi', exact: true }).click();
  if (capture)
    await shot(
      page,
      'Tình nguyện viên',
      'Gửi hồ sơ năng lực',
      'Khai đào tạo, đơn vị, khu vực và kỹ năng đề nghị xác minh.',
    );
  await page.getByRole('button', { name: 'Gửi hồ sơ xác minh', exact: true }).click();
  await expect(page.getByText('Đã gửi hồ sơ · Chờ admin duyệt.', { exact: true })).toBeVisible();
  if (capture)
    await shot(
      page,
      'Tình nguyện viên',
      'Chờ quản trị duyệt',
      'Tài khoản chưa thể bật sẵn sàng trước khi được duyệt.',
    );
}
async function approve(admin: Page, name: string, capture = false) {
  await admin.getByRole('button', { name: 'Tải lại đơn chờ duyệt', exact: true }).click();
  const panel = admin
    .locator('section')
    .filter({ has: admin.getByRole('heading', { name, exact: true }) });
  await expect(panel).toBeVisible();
  for (const label of ['Danh tính', 'Đơn vị / nơi học tập', 'Đào tạo và kỹ năng', 'Phạm vi hỗ trợ'])
    await panel.getByRole('checkbox', { name: label, exact: true }).check();
  await panel
    .getByRole('textbox', { name: 'Căn cứ xác minh / giới hạn hỗ trợ', exact: true })
    .fill('Đối chiếu hồ sơ năng lực; chỉ hỗ trợ trong phạm vi đã được đào tạo.');
  if (capture)
    await shot(
      admin,
      'Quản trị',
      'Đối chiếu trước khi duyệt',
      'Kiểm bốn điều kiện, kỹ năng và căn cứ; không cần người giới thiệu.',
    );
  await panel.getByRole('button', { name: 'Duyệt đơn', exact: true }).click();
  if (capture)
    await shot(admin, 'Quản trị', 'Xác nhận quyết định', 'Duyệt không tự bật trạng thái sẵn sàng.');
  await panel.getByRole('button', { name: 'Xác nhận duyệt đơn', exact: true }).click();
  await expect(panel).toHaveCount(0);
}
async function report(page: Page, url: string, capture = false) {
  await page.goto(url);
  await page.getByRole('checkbox').check();
  if (capture)
    await shot(
      page,
      'Người báo',
      'Xác nhận ở cạnh bệnh nhân',
      'Chỉ dùng GPS người báo khi thực sự ở cùng vị trí.',
    );
  await page.getByRole('button', { name: 'Gửi yêu cầu hỗ trợ', exact: true }).click();
  await expect(page).toHaveURL(/\/report\?id=/);
  if (capture)
    await shot(
      page,
      'Người báo',
      'Backend đã nhận yêu cầu',
      'Chuyển sang bảng hỏi ngay sau xác nhận máy chủ, không đợi tình nguyện viên.',
    );
  await page.getByRole('radio', { name: /Có phản ứng/ }).check();
  await page.getByRole('radio', { name: /Có vẻ thở đều/ }).check();
  await page.locator('input[name="bleeding"][value="none_seen"]').check();
  await page.getByRole('button', { name: /Gửi thông tin/ }).click();
  await expect(page.getByText(/Máy chủ đã lưu bản bổ sung số 1/)).toBeVisible();
  if (capture)
    await shot(
      page,
      'Người báo',
      'Gửi quan sát ban đầu',
      'Ba câu trả lời mô tả điều quan sát; số điện thoại có thể bỏ trống.',
    );
  return new URL(page.url()).searchParams.get('id')!;
}
async function finish(page: Page) {
  await page.getByRole('button', { name: 'Hoàn tất ca hỗ trợ', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận: hoàn tất ca hỗ trợ', exact: true }).click();
}
test('capture complete role journeys and operational branches through UI', async ({ browser }) => {
  test.setTimeout(360000);
  const contexts: BrowserContext[] = [];
  const errors: string[] = [];
  // Separate the presentation area from the regression fixtures (>5 km).
  async function mobile(latitude = 10.8769, longitude = 106.7009) {
    const c = await browser.newContext({
      viewport: { width: 390, height: 844 },
      geolocation: { latitude, longitude, accuracy: 10 },
      permissions: ['geolocation'],
    });
    contexts.push(c);
    const p = await c.newPage();
    p.on('console', (message) => {
      if (/Unexpected text node|non-boolean attribute/.test(message.text()))
        renderingErrors.push(message.text());
    });
    p.on('pageerror', (e) => errors.push(e.message));
    return p;
  }
  try {
    const p = await mobile(),
      v = await mobile(),
      v2 = await mobile(10.8772, 106.7006);
    const patientUrl = await patient(p, 'Nguyễn Minh An', 'Hen phế quản', true);
    await application(v, 'Trần Anh Khoa', true);
    await application(v2, 'Lê Bảo Ngọc');
    const ac = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    contexts.push(ac);
    const admin = await ac.newPage();
    await admin.goto(`${web}/admin`);
    await admin
      .getByRole('textbox', { name: 'Email quản trị', exact: true })
      .fill(fixture.admin.email);
    await admin.getByLabel('Mật khẩu', { exact: true }).fill(fixture.admin.password);
    await admin.getByRole('button', { name: 'Đăng nhập quản trị', exact: true }).click();
    await approve(admin, 'Trần Anh Khoa', true);
    await approve(admin, 'Lê Bảo Ngọc');
    await ac.close();
    await v.bringToFront();
    await expect(
      v.getByRole('switch', { name: 'Sẵn sàng nhận yêu cầu hỗ trợ', exact: true }),
    ).toBeVisible();
    scenario = '02. Một ca hỗ trợ';
    await v.getByRole('switch', { name: 'Sẵn sàng nhận yêu cầu hỗ trợ', exact: true }).click();
    await expect(
      v.getByRole('switch', { name: 'Sẵn sàng nhận yêu cầu hỗ trợ', exact: true }),
    ).toHaveAttribute('aria-checked', 'true');
    await shot(
      v,
      'Tình nguyện viên',
      'Bật sẵn sàng',
      'GPS được máy chủ ghi nhận trước khi trạng thái sẵn sàng có hiệu lực.',
    );
    const r = await mobile(10.879, 106.699);
    await report(r, patientUrl, true);
    await expect(v.getByRole('button', { name: 'Nhận ca', exact: true })).toBeVisible();
    await expect(v.getByText('Cập nhật lần 1', { exact: false }).first()).toBeVisible();
    await shot(
      v,
      'Tình nguyện viên',
      'Lời mời hỗ trợ',
      'Xem khoảng cách và quan sát; hồ sơ riêng chỉ mở sau khi nhận ca.',
    );
    await v.getByRole('button', { name: 'Nhận ca', exact: true }).click();
    await expect(v.getByRole('button', { name: 'Đã đến nơi', exact: true })).toBeVisible();
    await v.getByText('Đường đến bệnh nhân', { exact: true }).scrollIntoViewIfNeeded();
    await expect(v.getByRole('heading', { name: /km · ~/ })).toBeVisible({ timeout: 22000 });
    await expect
      .poll(
        () =>
          v
            .locator('.leaflet-tile')
            .evaluateAll(
              (tiles) =>
                tiles.length > 0 &&
                tiles.every(
                  (tile) =>
                    (tile as HTMLImageElement).complete &&
                    (tile as HTMLImageElement).naturalWidth > 0,
                ),
            ),
        { timeout: 22000 },
      )
      .toBe(true);
    await shot(
      v,
      'Tình nguyện viên',
      'Ca đã nhận và bản đồ',
      'Chỉ người được phân công được xem điểm đến và thông tin riêng.',
    );
    await v.getByRole('button', { name: 'Xem tiến độ / gặp trở ngại', exact: true }).click();
    await v.getByRole('textbox', { name: 'Số phút dự kiến đến', exact: true }).fill('5');
    await v.getByRole('button', { name: 'Xác nhận lên đường', exact: true }).click();
    await expect(v.getByRole('button', { name: 'Cập nhật giờ đến', exact: true })).toBeVisible();
    await shot(
      v,
      'Tình nguyện viên',
      'Xác nhận lên đường',
      'Ghi giờ dự kiến; đây là cam kết tiến độ do người hỗ trợ xác nhận.',
    );
    await r.getByRole('radio', { name: /Có vẻ khó thở/ }).check();
    await r.getByRole('button', { name: /Gửi thông tin/ }).click();
    await expect(v.getByText('Cập nhật lần 2', { exact: false }).first()).toBeVisible();
    await v.getByRole('button', { name: 'Xem tình trạng mới nhất', exact: true }).click();
    await shot(
      v,
      'Tình nguyện viên',
      'Tình trạng mới tự cập nhật',
      'Người báo đổi câu trả lời; tình nguyện viên nhận bản mới trong cùng ca.',
    );
    await v.getByRole('button', { name: 'Đã đến nơi', exact: true }).click();
    await shot(
      v,
      'Tình nguyện viên',
      'Xác nhận đã đến',
      'Chỉ xác nhận khi đã có mặt; thao tác này không phải bằng chứng GPS.',
    );
    await v.getByRole('button', { name: 'Xác nhận: đã đến nơi', exact: true }).click();
    await finish(v);
    await expect(
      r.getByRole('heading', { name: 'Yêu cầu đã kết thúc', exact: true }),
    ).toBeVisible();
    await shot(
      r,
      'Người báo',
      'Yêu cầu kết thúc',
      'Không còn gửi thêm câu trả lời sau khi ca đã kết thúc.',
    );
    await v.getByRole('tab', { name: 'Hoạt động', exact: true }).click();
    await v.getByRole('button', { name: 'Xem lịch sử ca', exact: true }).click();
    await expect(v.getByText('Nguyễn Minh An', { exact: true })).toBeVisible();
    await shot(
      v,
      'Tình nguyện viên',
      'Xem lịch sử có đồng ý',
      'Người từng phụ trách xem tóm tắt trong thời hạn cho phép.',
    );
    await v.getByRole('tab', { name: 'Trang chính', exact: true }).click();
    scenario = '03. Nhiều ca và nhận ca khi bật muộn';
    const p2 = await mobile(),
      r2 = await mobile(10.882, 106.701);
    const secondUrl = await patient(p2, 'Lê Lan Phương', 'Đái tháo đường type 2');
    await p2.context().close();
    const first = await report(r, patientUrl),
      second = await report(r2, secondUrl);
    await r.evaluate(() => scrollTo(0, 0));
    await shot(
      r,
      'Người báo',
      'Chờ người sẵn sàng',
      'Yêu cầu đã ghi nhận nhưng chưa đồng nghĩa có người nhận.',
    );
    // A fixed browser geolocation is a controlled sensor input. Emit a new
    // fix before a second acquisition; do not weaken the 10-second age rule.
    await v.context().setGeolocation({ latitude: 10.8769, longitude: 106.7009 });
    await v.getByRole('switch', { name: 'Sẵn sàng nhận yêu cầu hỗ trợ', exact: true }).click();
    await expect(v.getByText('Chọn ca chờ khác (2)', { exact: true })).toBeVisible();
    await shot(
      v,
      'Tình nguyện viên',
      'Hai ca đã có trước khi bật sẵn sàng',
      'Danh sách có hai lời mời, mỗi ca có khoảng cách riêng.',
    );
    const accepted = v.waitForRequest(
      (q) => q.url().endsWith('/acceptIncident') && q.method() === 'POST',
    );
    await v.getByRole('button', { name: 'Nhận ca', exact: true }).click();
    const owned = JSON.parse((await accepted).postData()!).data.incidentId;
    expect([first, second]).toContain(owned);
    const pending = owned === first ? second : first,
      ownerReporter = owned === first ? r : r2,
      otherReporter = owned === first ? r2 : r;
    await expect(v.getByRole('button', { name: 'Đã đến nơi', exact: true })).toBeVisible();
    await v.getByRole('button', { name: `Xem ca ${pending.slice(0, 10)}`, exact: true }).click();
    await expect(v.getByRole('button', { name: 'Nhận ca', exact: true })).toBeDisabled();
    await shot(
      v,
      'Tình nguyện viên',
      'Một người chỉ phụ trách một ca',
      'Ca còn lại xem được lời mời, nhưng nút nhận bị khóa khi đang bận.',
    );
    await v.getByRole('button', { name: 'Xem danh sách yêu cầu', exact: true }).click();
    scenario = '04. Không thể tiếp tục và bàn giao';
    await v.getByRole('button', { name: 'Xem tiến độ / gặp trở ngại', exact: true }).click();
    await v.getByRole('button', { name: 'Không thể tiếp tục', exact: true }).click();
    await shot(
      v,
      'Tình nguyện viên',
      'Đề nghị người thay',
      'Xác nhận yêu cầu tìm người thay; chưa tự giải phóng ca.',
    );
    await v.getByRole('button', { name: 'Xác nhận: không thể tiếp tục', exact: true }).click();
    await expect(v.getByText(/Bạn chưa được giải phóng ca/)).toBeVisible();
    await shot(
      v,
      'Tình nguyện viên',
      'Chờ bàn giao',
      'Người hiện tại vẫn phụ trách khi chưa có người thay xác nhận.',
    );
    await v2.context().setGeolocation({ latitude: 10.8772, longitude: 106.7006 });
    await v2.getByRole('switch', { name: 'Sẵn sàng nhận yêu cầu hỗ trợ', exact: true }).click();
    await expect(v2.getByText('Chọn ca chờ khác (2)', { exact: true })).toBeVisible();
    await v2.getByRole('button', { name: new RegExp(`Ca ${owned.slice(0, 10)}`) }).click();
    await expect(v2.getByRole('button', { name: 'Nhận bàn giao', exact: true })).toBeVisible();
    await shot(
      v2,
      'Tình nguyện viên',
      'Người thay nhận lời mời',
      'Tình nguyện viên thứ hai mở đúng lời mời bàn giao.',
    );
    await v2.getByRole('button', { name: 'Nhận bàn giao', exact: true }).click();
    await expect(v2.getByRole('button', { name: 'Đã đến nơi', exact: true })).toBeVisible();
    await expect(v.getByRole('button', { name: 'Hoàn tất ca hỗ trợ', exact: true })).toHaveCount(0);
    await shot(
      v2,
      'Tình nguyện viên',
      'Bàn giao thành công',
      'Người mới được cấp chi tiết; người cũ mất quyền thao tác ca.',
    );
    await ownerReporter.evaluate(() => scrollTo(0, 0));
    await shot(
      ownerReporter,
      'Người báo',
      'Theo dõi sau bàn giao',
      'Cùng một yêu cầu, người phụ trách đã thay đổi; không tạo ca mới.',
    );
    await finish(v2);
    await expect(
      ownerReporter.getByRole('heading', { name: 'Yêu cầu đã kết thúc', exact: true }),
    ).toBeVisible();
    await otherReporter
      .getByRole('button', { name: 'Hủy yêu cầu chưa có TNV nhận', exact: true })
      .click();
    await otherReporter.getByRole('button', { name: 'Xác nhận hủy yêu cầu', exact: true }).click();
    await expect(
      otherReporter.getByRole('heading', { name: 'Yêu cầu đã kết thúc', exact: true }),
    ).toBeVisible();
    await shot(
      otherReporter,
      'Người báo',
      'Hủy ca chưa ai nhận',
      'Chỉ ca chưa có người phụ trách được hủy theo luồng người báo.',
    );
    expect(errors).toEqual([]);
    save('PASS');
  } catch (error) {
    save('FAIL', error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    for (const context of contexts) await context.close();
  }
});
