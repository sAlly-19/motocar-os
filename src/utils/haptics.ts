import { Platform } from 'react-native';

let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch {}

export function triggerHaptic(type: 'success' | 'error' | 'warning' | 'selection' = 'selection') {
  if (!Haptics || Platform.OS === 'web') return;
  const map: Record<string, any> = {
    success: Haptics.NotificationFeedbackType?.Success,
    error: Haptics.NotificationFeedbackType?.Error,
    warning: Haptics.NotificationFeedbackType?.Warning,
    selection: undefined,
  };
  if (type === 'selection') {
    Haptics.selectionAsync?.();
  } else {
    Haptics.notificationAsync?.(map[type]);
  }
}
