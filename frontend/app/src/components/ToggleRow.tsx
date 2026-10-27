import { Pressable, Switch, View } from 'react-native';
import { Text } from './AppText';

// One accessible target: the label and switch share the same >=48dp tap area.
export function ToggleRow({ label, value, disabled = false, onValueChange, accessibilityLabel = label }: {
  label: string; value: boolean; disabled?: boolean; onValueChange(value: boolean): void; accessibilityLabel?: string;
}) {
  return <Pressable accessibilityRole="switch" accessibilityLabel={accessibilityLabel}
    aria-checked={value} aria-disabled={disabled}
    accessibilityState={{ checked: value, disabled }} disabled={disabled} onPress={() => onValueChange(!value)}
    hitSlop={4} pressRetentionOffset={32} unstable_pressDelay={0} android_ripple={{ color: '#c6dfd4' }}
    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8, backgroundColor: pressed ? '#dbece3' : 'transparent', opacity: disabled ? 0.6 : 1 })}>
    <View pointerEvents="none" accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Switch value={value} disabled={disabled} accessible={false} focusable={false} tabIndex={-1} />
    </View>
    <Text style={{ flex: 1, fontSize: 16, lineHeight: 23 }}>{label}</Text>
  </Pressable>;
}
