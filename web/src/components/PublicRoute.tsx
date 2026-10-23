'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EmergencyContact } from './EmergencyContact';
import { RequestHelp } from './RequestHelp';
import { BystanderReport } from './BystanderReport';

export function PublicRoute({ kind }: { kind: 'card' | 'report' }) {
  const id = useSearchParams().get('id') || '';
  if (!/^[a-zA-Z0-9_-]{6,128}$/.test(id)) return <main className="report-page role-reporter"><EmergencyContact /><h1>Liên kết chưa hợp lệ</h1><p>Hãy quét lại thẻ EHIS hoặc mở đường dẫn do ứng dụng cung cấp.</p><Link href="/">Về trang hướng dẫn</Link></main>;
  return kind === 'card' ? <RequestHelp key={id} cardId={id} /> : <BystanderReport key={id} incidentId={id} />;
}
