import { Text } from './AppText';
import { Button } from './ActionButton';
import { useState } from 'react';
import { Linking, View } from 'react-native';

export function DirectionsLink({ title, url, disabled }: { title: string; url: string; disabled: boolean }) {
  const [error, setError] = useState('');
  return <View style={{ gap: 8 }}><Button variant="secondary" title={title} disabled={disabled} onPress={() => { setError(''); Linking.openURL(url).catch(() => setError('Chưa mở được Google Maps. Kiểm tra kết nối rồi thử lại.')); }} />{!!error && <Text accessibilityRole="alert">{error}</Text>}</View>;
}
