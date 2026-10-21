import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerStyle: { backgroundColor: '#0b4147' }, headerTintColor: '#fff' }}>
    <Stack.Screen name="index" options={{ title: 'EHIS Next' }} />
    <Stack.Screen name="patient" options={{ title: 'Bệnh nhân' }} />
    <Stack.Screen name="volunteer" options={{ title: 'Tình nguyện viên' }} />
  </Stack>;
}
