import { Stack } from 'expo-router';
import { SessionProvider, useSession } from '../components/Session';
import { Connectivity } from '../components/Connectivity';

export default function RootLayout() {
  return <SessionProvider><Connectivity /><AppStack /></SessionProvider>;
}
function AppStack() {
  const { user, purpose, loading, error } = useSession();
  const ready = !!user && !loading && !error;
  return <Stack screenOptions={{ headerStyle: { backgroundColor: '#0b4147' }, headerTintColor: '#fff' }}>
    <Stack.Screen name="index" options={{ title: 'EHIS Next' }} />
    <Stack.Screen name="patient" options={{ title: ready && purpose === 'patient' ? 'Bệnh nhân' : 'EHIS Next' }} />
    <Stack.Screen name="volunteer" options={{ title: ready && purpose === 'volunteer' ? 'Tình nguyện viên' : 'EHIS Next' }} />
  </Stack>;
}
