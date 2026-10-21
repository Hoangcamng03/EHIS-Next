import Link from 'next/link';
export default async function CardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  return <main className="page">
    <div className="eyebrow">EHIS NEXT · NGƯỜI BÁO</div><h1>Báo sự cố</h1>
    <div className="notice">Chức năng chưa triển khai. Trang này không gửi yêu cầu hay điều phối tình nguyện viên.</div>
    <article className="card"><h2>Luồng cần phát triển</h2><p>Mã thẻ: <strong>{cardId}</strong></p>
      <ol><li>Kiểm tra thẻ còn hiệu lực.</li><li>Tạo phiên người báo và xác nhận điểm sự cố.</li><li>Gửi yêu cầu với mã chống trùng.</li><li>Theo dõi trạng thái của phiên người báo.</li></ol>
      <p>Không tải hoặc hiển thị hồ sơ y tế tại trang công khai.</p>
    </article><p><Link href="/">← Về trang chính</Link></p>
  </main>;
}
