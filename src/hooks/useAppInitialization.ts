import { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';

/**
 * Triggers the app store initialization once fonts have loaded.
 */
export function useAppInitialization(fontsLoaded: boolean) {
  const initialize = useAppStore((s) => s.initialize);
  const initialized = useAppStore((s) => s.initialized);

  useEffect(() => {
    if (fontsLoaded && !initialized) {
      initialize();
    }
  }, [fontsLoaded, initialized, initialize]);

  return { initialized };
}
