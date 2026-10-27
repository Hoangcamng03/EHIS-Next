import { useState } from 'react';

// A native browser checkbox provides label taps, Space, focus and one ARIA target.
export function ToggleRow({ label, value, disabled = false, onValueChange, accessibilityLabel = label }: {
  label: string; value: boolean; disabled?: boolean; onValueChange(value: boolean): void; accessibilityLabel?: string;
}) {
  const [focused, setFocused] = useState(false);
  return <label style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, padding: '8px 4px', boxSizing: 'border-box', borderRadius: 8,
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1, outline: focused ? '2px solid #096951' : 'none', outlineOffset: 2 }}>
    <input type="checkbox" role="switch" aria-label={accessibilityLabel} aria-checked={value} disabled={disabled} checked={value}
      onChange={event => onValueChange(event.currentTarget.checked)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, margin: 0, cursor: disabled ? 'default' : 'pointer', touchAction: 'manipulation' }} />
    <span aria-hidden="true" style={{ width: 40, height: 24, borderRadius: 14, background: value ? '#096951' : '#879a9c', display: 'inline-flex', alignItems: 'center', flexShrink: 0, padding: 3, boxSizing: 'border-box' }}>
      <span style={{ display: 'block', width: 18, height: 18, borderRadius: '50%', background: '#fff', transform: value ? 'translateX(16px)' : 'translateX(0)' }} />
    </span>
    <span style={{ flex: 1, fontSize: 16, lineHeight: '23px', color: '#123c37', fontFamily: 'inherit' }}>{label}</span>
  </label>;
}
