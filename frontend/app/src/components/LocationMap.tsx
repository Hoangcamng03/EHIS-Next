import { Text } from './AppText';
import { Button } from './ActionButton';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { mapLinks, MapPoint } from '../lib/map';

export function LocationMap({ point, title }: { point: MapPoint; title: string }) {
  const [error, setError] = useState('');
  return <View style={{ gap: 8 }}>
    <Text style={{ fontWeight: '700' }}>{title}</Text>
    <Text>{point.latitude}, {point.longitude}</Text>
    <Button title="Mở vị trí trên bản đồ" onPress={() => { setError(''); Linking.openURL(mapLinks(point).full).catch(() => setError('Chưa mở được bản đồ. Kiểm tra kết nối rồi thử lại.')); }} />
    {!!error && <Text accessibilityRole="alert">{error}</Text>}
  </View>;
}
