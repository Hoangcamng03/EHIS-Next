import { Stack } from 'expo-router';
import { SessionProvider, useSession } from '../components/Session';
import { Connectivity } from '../components/Connectivity';
import { RoleTheme } from '../components/RoleTheme';
import { textFamily } from '../lib/typography';
import { palette } from '../lib/palette';
import { NotificationNavigation } from '../components/NotificationNavigation';
import { FocusStyle } from '../components/FocusStyle';

export default function RootLayout() {
  return (
    <SessionProvider>
      <FocusStyle />
      <Connectivity />
      <AppStack />
      <NotificationNavigation />
    </SessionProvider>
  );
}
function AppStack() {
  const { user, purpose, loading, error } = useSession();
  const ready = !!user && !loading && !error;
  const color = ready && purpose ? palette[purpose].primary : '#0b4147';
  return (
    <RoleTheme.Provider value={color}>
      <Stack
        screenOptions={{
          headerTitleStyle: { fontFamily: textFamily },
          headerStyle: { backgroundColor: color },
          headerTintColor: '#fff',
          contentStyle: {
            backgroundColor: ready && purpose ? palette[purpose].background : '#f4f8f6',
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'EHIS' }} />
        <Stack.Screen
          name="patient"
          options={{ title: 'EHIS', headerShown: !ready || purpose !== 'patient', statusBarStyle: 'light' }}
        />
        <Stack.Screen
          name="volunteer"
          options={{ title: 'EHIS', headerShown: !ready || purpose !== 'volunteer', statusBarStyle: 'light' }}
        />
      </Stack>
    </RoleTheme.Provider>
  );
}
