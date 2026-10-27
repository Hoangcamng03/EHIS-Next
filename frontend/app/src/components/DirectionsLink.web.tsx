export function DirectionsLink({ title, url, disabled }: { title: string; url: string; disabled: boolean }) {
  return <a href={disabled ? undefined : url} aria-disabled={disabled} style={{ display: 'block', textAlign: 'center', padding: 14, minHeight: 56, borderRadius: 12, border: '1px solid #125b99', background: '#fff', color: '#125b99', textDecoration: 'none', fontWeight: 700, opacity: disabled ? 0.5 : 1 }}>{title}</a>;
}
