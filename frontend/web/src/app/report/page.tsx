import { Suspense } from 'react';
import { PublicRoute } from '@/components/PublicRoute';
export default function ReportPage() { return <Suspense fallback={<main className="report-page"><p role="status">Đang mở yêu cầu…</p></main>}><PublicRoute kind="report" /></Suspense>; }
