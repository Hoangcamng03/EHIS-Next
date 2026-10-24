import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'EHIS · Hỗ trợ cộng đồng', description: 'Thẻ sức khỏe và kết nối tình nguyện viên của nhóm EHIS.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
