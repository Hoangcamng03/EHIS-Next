import Link from 'next/link';
export default function ReferrerPage() {
  return (
    <main className="page">
      <h1>Quy trình duyệt đã thay đổi</h1>
      <p>
        Tình nguyện viên gửi hồ sơ trong ứng dụng. Admin xác minh và duyệt trực tiếp; không cần
        người giới thiệu.
      </p>
      <Link href="/admin">Mở quản trị</Link>
    </main>
  );
}
