import { ButtonProps, Pressable, Text } from 'react-native';
import { useRoleColor } from './RoleTheme';

// System text scaling stays enabled; actions wrap instead of clipping at large fonts.
export function Button({ title, onPress, disabled, color, accessibilityLabel, testID }: ButtonProps) {
  const roleColor = useRoleColor();
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title}
    accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} testID={testID}
    style={({ pressed }) => ({ minHeight: 56, paddingVertical: 15, paddingHorizontal: 18,
      borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%',
      backgroundColor: disabled ? '#dce5e1' : color || roleColor, opacity: pressed ? 0.8 : 1 })}>
    <Text style={{ fontSize: 18, lineHeight: 26, fontWeight: '700', textAlign: 'center', color: disabled ? '#465c55' : '#fff' }}>{title}</Text>
  </Pressable>;
}
