import { useEffect } from 'react';
import { View } from 'react-native';
import { useThemeColors, spacing } from '../theme';
import { AppText } from '../ui/Text';
import { Icon } from './Icon';
import { AnimatedPressable } from './AnimatedPressable';

interface ErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
  type?: 'error' | 'success' | 'info';
}

const bgMap = {
  error: 'error-container',
  success: 'success-container',
  info: 'surface-container-high',
} as const;
const textMap = {
  error: 'on-error-container',
  success: 'on-success-container',
  info: 'on-surface',
} as const;
const iconMap = {
  error: 'error',
  success: 'check_circle',
  info: 'info',
} as const;

/**
 * Auto-dismissing banner. Reanimated-free implementation — uses setTimeout
 * for the dismiss and no opacity animation. Simpler + avoids the Reanimated
 * blank-screen bug on this SDK.
 */
export function ErrorBanner({ message, onDismiss, duration = 5000, type = 'error' }: ErrorBannerProps) {
  const colors = useThemeColors();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  const bgKey = bgMap[type];
  const textKey = textMap[type];

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion={type === 'error' ? 'assertive' : 'polite'}
      style={{
        backgroundColor: colors[bgKey],
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
      }}
    >
      <Icon name={iconMap[type]} size={18} color={colors[textKey]} />
      <AppText variant="bodySmall" style={{ color: colors[textKey], flex: 1 }}>
        {message}
      </AppText>
      <AnimatedPressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dispensar notificação"
        hitSlop={8}
        style={{ padding: spacing.xs }}
      >
        <Icon name="close" size={16} color={colors[textKey]} />
      </AnimatedPressable>
    </View>
  );
}
