import { Pressable } from 'react-native';
import { Text } from './AppText';
import { AppIcon, type IconName } from './AppIcon';
export function ActionRow({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        borderBottomWidth: 1,
        borderBottomColor: '#e1e8ed',
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        paddingHorizontal: 12,
        backgroundColor: pressed ? '#eaf2fa' : 'white',
      })}
    >
      <AppIcon name={icon} size={21} color="#314b61" />
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '600' }}>{title}</Text>
      <AppIcon name="chevron" size={17} color="#657c89" />
    </Pressable>
  );
}
