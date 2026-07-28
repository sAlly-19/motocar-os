import { useEffect } from 'react';
import { router } from 'expo-router';

export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      switch (e.key) {
        case '1': router.replace('/(tabs)/dashboard'); break;
        case '2': router.replace('/(tabs)/orders'); break;
        case '3': router.replace('/(tabs)/inventory'); break;
        case '4': router.replace('/(tabs)/schedule'); break;
        case '5': router.replace('/(tabs)/profile'); break;
        case 'n':
        case 'N': router.push('/orders/new'); break;
      }
    };

    if (typeof document !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);
}
