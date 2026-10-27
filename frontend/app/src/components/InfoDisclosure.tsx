import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './AppText';

export function InfoDisclosure({ title = 'Thông tin thêm', children }: { title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: open ? 8 : 0 }}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} aria-expanded={open}
      accessibilityLabel={`${open ? 'Ẩn' : 'Xem'} ${title.toLocaleLowerCase('vi-VN')}`}
      onPress={() => setOpen(value => !value)} hitSlop={4} pressRetentionOffset={32} unstable_pressDelay={0}
      android_ripple={{ color: '#dbe8e3' }}
      style={({ pressed }) => ({ minHeight: 48, paddingVertical: 12, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, backgroundColor: pressed ? '#e6efeb' : 'transparent' })}>
      <Text style={{ flex: 1, fontSize: 14, color: '#526f67', fontWeight: '600' }}>{title}</Text>
      <Text style={{ color: '#526f67' }}>{open ? '−' : '+'}</Text>
    </Pressable>
    {open && <View style={{ gap: 8 }}>{children}</View>}
  </View>;
}
