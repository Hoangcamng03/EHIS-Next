import { Stack } from 'expo-router';
import { SessionProvider, useSession } from '../components/Session';
import { Connectivity } from '../components/Connectivity';
import { RoleTheme } from '../components/RoleTheme';
import { palette } from '../lib/palette';

export default function RootLayout() {
  return <SessionProvider><Connectivity /><AppStack /></SessionProvider>;
}
function AppStack() {
  const { user, purpose, loading, error } = useSession();
  const ready = !!user && !loading && !error;
  const color = ready && purpose ? palette[purpose].primary : '#0b4147';
  return <RoleTheme.Provider value={color}><Stack screenOptions={{ headerStyle: { backgroundColor: color }, headerTintColor: '#fff', contentStyle: { backgroundColor: ready && purpose ? palette[purpose].background : '#f4f8f6' } }}>
    <Stack.Screen name="index" options={{ title: 'EHIS Next' }} />
    <Stack.Screen name="patient" options={{ title: ready && purpose === 'patient' ? 'Bệnh nhân' : 'EHIS Next' }} />
    <Stack.Screen name="volunteer" options={{ title: ready && purpose === 'volunteer' ? 'Tình nguyện viên' : 'EHIS Next' }} />
  </Stack></RoleTheme.Provider>;
}
