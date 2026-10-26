import Constants from 'expo-constants';
import { Text } from './AppText';

export function ReleaseStatus() {
  return <Text style={{ color: '#526f67', fontSize: 15 }}>EHIS {Constants.expoConfig?.version || '0.4.1'}</Text>;
}
