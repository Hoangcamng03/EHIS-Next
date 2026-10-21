import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'EHIS Next · Capstone', description: 'Nền tảng phát triển EHIS của nhóm Capstone.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
