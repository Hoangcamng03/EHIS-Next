import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './AppText';
import { useRoleColor } from './RoleTheme';
import { AppIcon, type IconName } from './AppIcon';
export function RoleTabs<T extends string>({
  value,
  items,
  onChange,
}: {
  value: T;
  items: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  const color = useRoleColor();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingLeft: Math.max(insets.left, 12),
        paddingRight: Math.max(insets.right, 12),
        borderTopWidth: 1,
        borderTopColor: '#d9e3ea',
        backgroundColor: 'white',
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          flexDirection: 'row',
          gap: 4,
          padding: 2,
          borderRadius: 10,
          backgroundColor: 'white',
        }}
      >
        {items.map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: value === key }}
            onPress={() => onChange(key)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 50,
              padding: 4,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              backgroundColor: value === key ? `${color}18` : pressed ? '#e7f0ed' : 'transparent',
            })}
          >
            <AppIcon
              name={
                (
                  {
                    card: 'card',
                    profile: 'activity',
                    history: 'activity',
                    home: 'home',
                    account: 'user',
                  } as Record<string, IconName>
                )[key] || 'card'
              }
              size={20}
              color={value === key ? color : '#607083'}
            />
            <Text
              style={{
                color: value === key ? color : '#607083',
                fontSize: 13,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
