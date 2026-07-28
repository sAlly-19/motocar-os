import { useEffect, useRef } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSequence } from 'react-native-reanimated';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing, animationTokens } from '../theme';
import { AppText } from './Text';
import { Icon } from '../components/Icon';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  /** Auto-dismiss delay in ms. Set to 0 to disable auto-dismiss. Default 4000. */
  duration?: number;
  onDismiss: () => void;
  action?: { label: string; onPress: () => void };
}

const typeConfig: Record<ToastType, { bg: string; icon: string; iconColor: string }> = {
  success: { bg: 'success-container', icon: 'check_circle', iconColor: 'on-success-container' },
  error: { bg: 'error-container', icon: 'error', iconColor: 'on-error-container' },
  warning: { bg: 'warning-container', icon: 'warning', iconColor: 'on-warning-container' },
  info: { bg: 'surface-container-high', icon: 'info', iconColor: 'on-surface' },
};

export function Toast({ visible, message, type = 'info', duration = 4000, onDismiss, action }: ToastProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cfg = typeConfig[type];

  useEffect(() => {
    if (visible) {
      translateY.value = withSequence(
        withTiming(-spacing.md, { duration: animationTokens.duration.enter, easing: animationTokens.easing.decelerate }),
        withTiming(0, { duration: animationTokens.duration.normal, easing: animationTokens.easing.decelerate }),
      );
      opacity.value = withTiming(1, { duration: animationTokens.duration.fast });

      if (duration > 0) {
        dismissTimer.current = setTimeout(onDismiss, duration);
      }
    } else {
      translateY.value = withTiming(100, { duration: animationTokens.duration.exit, easing: animationTokens.easing.accelerate });
      opacity.value = withTiming(0, { duration: animationTokens.duration.fast });
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
    };
  }, [visible, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        {
          position: 'absolute',
          bottom: 80,
          left: spacing.md,
          right: spacing.md,
          backgroundColor: colors[cfg.bg],
          borderRadius: br.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          zIndex: 9999,
        },
        shadows.lg,
        animatedStyle,
      ]}
    >
      <Icon name={cfg.icon} size={20} color={colors[cfg.iconColor]} />
      <AppText variant="bodySmall" style={{ color: colors[cfg.iconColor], flex: 1 }}>
        {message}
      </AppText>
      {action && (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={{ padding: spacing.xs }}
        >
          <AppText variant="label" style={{ color: colors.primary }}>
            {action.label}
          </AppText>
        </Pressable>
      )}
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Fechar notificação"
        style={{ padding: spacing.xs }}
      >
        <Icon name="close" size={16} color={colors[cfg.iconColor]} />
      </Pressable>
    </Animated.View>
  );
}
