import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './AppText';
import { AppIcon } from './AppIcon';
import { useRoleColor } from './RoleTheme';
export function ScreenHeader({
  volunteer = false,
  onAccount,
}: {
  volunteer?: boolean;
  onAccount: () => void;
}) {
  const color = useRoleColor(),
    insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: color, paddingTop: insets.top }}>
      <View
        style={{
          minHeight: 54,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          maxWidth: 800,
          alignSelf: 'center',
        }}
      >
        <AppIcon name={volunteer ? 'people' : 'link'} color="white" size={27} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: volunteer ? 17 : 23 }}>
            {volunteer ? 'Tình nguyện viên' : 'EHIS'}
          </Text>
          {volunteer && (
            <Text style={{ color: '#e5f6ed', fontSize: 12 }}>Đội hỗ trợ cộng đồng</Text>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở tài khoản"
          onPress={onAccount}
          style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppIcon name="user" color="white" size={24} />
        </Pressable>
      </View>
    </View>
  );
}
