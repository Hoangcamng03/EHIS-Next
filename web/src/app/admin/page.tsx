import Link from 'next/link';
export default function AdminPage() {
  return <main className="page"><div className="eyebrow">EHIS NEXT · QUẢN TRỊ</div>
    <h1>Quản trị</h1><div className="notice">Khu vực chưa triển khai. Không có dữ liệu riêng tư hoặc thao tác duyệt tại đây.</div>
    <article className="card"><h2>Tiêu chí của module</h2><p>Đăng nhập, kiểm tra quyền admin ở backend, duyệt đăng ký TNV và xem nhật ký được phép. Không cho người dùng tự sửa role hoặc trạng thái xác minh.</p></article>
    <p><Link href="/">← Về trang chính</Link></p></main>;
}
