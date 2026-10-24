import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { View } from 'react-native';
import { Text } from './AppText';
import { ui } from '../lib/ui';

export function ReleaseStatus() {
  const { isUpdatePending } = Updates.useUpdates();
  return <View style={{ gap: 8 }}>
    <Text style={{ color: '#526f67', fontSize: 15 }}>EHIS {Constants.expoConfig?.version || '0.4.1'}</Text>
    {Updates.isEnabled && isUpdatePending && <View style={ui.notice}>
      <Text>Bản mới đã tải xong và sẽ áp dụng khi mở lại app. Hãy hoàn tất thao tác hiện tại trước.</Text>
    </View>}
  </View>;
}
