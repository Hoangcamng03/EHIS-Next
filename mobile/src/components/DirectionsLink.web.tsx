export function DirectionsLink({ title, url, disabled }: { title: string; url: string; disabled: boolean }) {
  return <a href={disabled ? undefined : url} aria-disabled={disabled} style={{ display: 'block', textAlign: 'center', padding: 12, borderRadius: 8, background: '#1769aa', color: 'white', textDecoration: 'none', fontWeight: 700, opacity: disabled ? 0.5 : 1 }}>{title}</a>;
}
