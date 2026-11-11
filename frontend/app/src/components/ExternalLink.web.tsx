import { useRoleColor } from './RoleTheme';
import type { ExternalLinkProps } from './ExternalLink';
export function ExternalLink({ title, href, variant = 'primary', color }: ExternalLinkProps) {
  const roleColor = useRoleColor(), ink = color || roleColor, subtle = variant !== 'primary';
  return <a href={href} style={{ boxSizing: 'border-box', display: 'flex', width: '100%', minHeight: 48, padding: '12px 16px', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: variant === 'secondary' ? `1px solid ${ink}` : 'none', background: subtle ? '#fff' : ink, color: subtle ? ink : '#fff', fontSize: 16, lineHeight: '24px', fontWeight: 600, textAlign: 'center', textDecoration: 'none', overflowWrap: 'anywhere' }}>{title}</a>;
}
