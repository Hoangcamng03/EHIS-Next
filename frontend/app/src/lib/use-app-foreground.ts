import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
export function useAppForeground() {
  const [active, setActive] = useState(() => AppState.currentState === 'active' && (typeof document === 'undefined' || !document.hidden));
  useEffect(() => {
    const update = () => setActive(AppState.currentState === 'active' && (typeof document === 'undefined' || !document.hidden));
    const subscription = AppState.addEventListener('change', update);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', update);
    return () => { subscription.remove(); if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', update); };
  }, []);
  return active;
}
