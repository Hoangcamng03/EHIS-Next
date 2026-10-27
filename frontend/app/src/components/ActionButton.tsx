import { ButtonProps, Pressable, Text } from 'react-native';
import { useRoleColor } from './RoleTheme';

// System text scaling stays enabled; actions wrap instead of clipping at large fonts.
export function Button({ title, onPress, disabled, color, accessibilityLabel, testID, variant = 'primary' }: ButtonProps & { variant?: 'primary' | 'secondary' | 'quiet' }) {
  const roleColor = useRoleColor();
  const ink = color || roleColor;
  const subtle = variant !== 'primary';
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title}
    accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} testID={testID}
    style={({ pressed }) => ({ minHeight: 56, paddingVertical: 15, paddingHorizontal: 18,
      borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%',
      borderWidth: variant === 'secondary' ? 1 : 0, borderColor: disabled ? '#91afa0' : ink,
      backgroundColor: disabled ? '#dce5e1' : subtle ? '#fff' : ink, opacity: pressed ? 0.8 : 1 })}>
    <Text style={{ fontSize: 18, lineHeight: 26, fontWeight: '700', textAlign: 'center', color: disabled ? '#465c55' : subtle ? ink : '#fff' }}>{title}</Text>
  </Pressable>;
}
