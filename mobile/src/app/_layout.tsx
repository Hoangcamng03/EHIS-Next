import { Stack } from 'expo-router';
import { SessionProvider, useSession } from '../components/Session';

export default function RootLayout() {
  return <SessionProvider><AppStack /></SessionProvider>;
}
function AppStack() {
  const { user } = useSession();
  return <Stack screenOptions={{ headerStyle: { backgroundColor: '#0b4147' }, headerTintColor: '#fff' }}>
    <Stack.Screen name="index" options={{ title: 'EHIS Next' }} />
    <Stack.Screen name="patient" options={{ title: user ? 'Bệnh nhân' : 'EHIS Next' }} />
    <Stack.Screen name="volunteer" options={{ title: user ? 'Tình nguyện viên' : 'EHIS Next' }} />
  </Stack>;
}
