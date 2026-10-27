import { ActivityIndicator, ButtonProps, Pressable, Text, View } from 'react-native';
import { useRoleColor } from './RoleTheme';

// System text scaling stays enabled; actions wrap instead of clipping at large fonts.
export function Button({ title, onPress, disabled, color, accessibilityLabel, testID, variant = 'primary', loading = false }: ButtonProps & { variant?: 'primary' | 'secondary' | 'quiet'; loading?: boolean }) {
  const roleColor = useRoleColor();
  const ink = color || roleColor;
  const subtle = variant !== 'primary';
  const inactive = !!disabled || loading;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title}
    aria-disabled={inactive} aria-busy={loading}
    accessibilityState={{ disabled: inactive, busy: loading }} disabled={inactive} onPress={onPress} testID={testID}
    hitSlop={6} pressRetentionOffset={32} unstable_pressDelay={0}
    android_ripple={{ color: subtle ? '#dbe8e3' : '#ffffff35', foreground: true }}
    style={({ pressed }) => ({ minHeight: 48, paddingVertical: 12, paddingHorizontal: 16,
      borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%',
      overflow: 'hidden',
      borderWidth: variant === 'secondary' ? 1 : 0, borderColor: inactive ? '#91afa0' : ink,
      backgroundColor: inactive ? '#dce5e1' : subtle ? '#fff' : ink, opacity: pressed ? 0.8 : 1 })}>
    <View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {loading && <ActivityIndicator size="small" color="#465c55" />}
      <Text style={{ flexShrink: 1, fontSize: 16, lineHeight: 22, fontWeight: '600', textAlign: 'center', color: inactive ? '#465c55' : subtle ? ink : '#fff' }}>{title}</Text>
    </View>
  </Pressable>;
}
