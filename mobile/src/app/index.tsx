import { Redirect } from 'expo-router';
import { AuthGate, useSession } from '../components/Session';
import { accountPurposes } from '../lib/account-purpose';

export default function HomeScreen() {
  const { purpose } = useSession();
  return <AuthGate>{() => purpose ? <Redirect href={accountPurposes[purpose].route} /> : null}</AuthGate>;
}
