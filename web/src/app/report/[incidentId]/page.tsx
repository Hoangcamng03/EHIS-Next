import { BystanderReport } from '@/components/BystanderReport';
export default async function ReportPage({ params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params;
  return <BystanderReport key={incidentId} incidentId={incidentId} />;
}
