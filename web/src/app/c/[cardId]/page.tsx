import { RequestHelp } from '@/components/RequestHelp';
export default async function CardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  return <RequestHelp key={cardId} cardId={cardId} />;
}
