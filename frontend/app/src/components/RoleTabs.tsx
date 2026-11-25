import { Pressable, View, Platform } from 'react-native';
import { useRef, type ComponentRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './AppText';
import { useRoleColor } from './RoleTheme';
import { AppIcon, type IconName } from './AppIcon';
export function RoleTabs<T extends string>({
  value,
  items,
  onChange,
  panelId,
}: {
  value: T;
  items: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
  panelId: string;
}) {
  const color = useRoleColor();
  const insets = useSafeAreaInsets();
  const buttons = useRef<(ComponentRef<typeof View> | null)[]>([]);
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
        accessibilityRole="tablist"
        accessibilityLabel="Điều hướng chính"
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
        {items.map(([key, label], index) => (
          <Pressable
            key={key}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            nativeID={`tab-${panelId}-${key}`}
            aria-controls={panelId}
            {...(Platform.OS === 'web'
              ? {
                  tabIndex: value === key ? (0 as const) : (-1 as const),
                  onKeyDown: (event: import('react-native').KeyDownEvent) => {
                    const key = event.nativeEvent.key;
                    const next =
                      key === 'ArrowRight'
                        ? (index + 1) % items.length
                        : key === 'ArrowLeft'
                          ? (index - 1 + items.length) % items.length
                          : key === 'Home'
                            ? 0
                            : key === 'End'
                              ? items.length - 1
                              : null;
                    if (next !== null) {
                      event.preventDefault();
                      buttons.current[next]?.focus();
                    }
                  },
                }
              : {})}
            accessibilityRole="tab"
            aria-selected={value === key}
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
