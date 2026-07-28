import { useEffect } from 'react';
import { useSegments } from 'expo-router';

let history: string[] = [];

export function useNavigationHistory() {
  const segments = useSegments();

  useEffect(() => {
    const path = '/' + segments.join('/');
    if (history[history.length - 1] !== path) {
      history.push(path);
    }
    if (history.length > 20) {
      history.shift();
    }
  }, [segments]);

  return {
    canGoBack: history.length > 1,
    goBack: () => {
      if (history.length > 1) {
        history.pop();
        const previous = history[history.length - 1];
        return previous;
      }
      return null;
    },
    getHistory: () => [...history],
  };
}
