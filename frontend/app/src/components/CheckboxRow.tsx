import { Pressable, View } from 'react-native';
import { Text } from './AppText';
import { useRoleColor } from './RoleTheme';

export function CheckboxRow({
  label,
  value,
  disabled = false,
  onValueChange,
  accessibilityLabel = label,
}: {
  label: string;
  value: boolean;
  disabled?: boolean;
  onValueChange(value: boolean): void;
  accessibilityLabel?: string;
}) {
  const color = useRoleColor();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      aria-checked={value}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      hitSlop={4}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        minHeight: 48,
        padding: 8,
        borderRadius: 8,
        backgroundColor: pressed ? '#e8eeed' : 'transparent',
        opacity: disabled ? 0.6 : 1,
      })}
    >
      <View
        accessible={false}
        style={{
          width: 24,
          height: 24,
          borderWidth: 2,
          borderRadius: 4,
          borderColor: color,
          backgroundColor: value ? color : '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16 }}> {value ? '✓' : ''} </Text>
      </View>
      <Text style={{ flex: 1, fontSize: 16, lineHeight: 23 }}>{label}</Text>
    </Pressable>
  );
}
