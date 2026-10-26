import { Suspense } from 'react';
import { PublicRoute } from '@/components/PublicRoute';
export default function CardPage() { return <Suspense fallback={<main className="report-page"><p role="status">Đang mở thẻ…</p></main>}><PublicRoute kind="card" /></Suspense>; }
