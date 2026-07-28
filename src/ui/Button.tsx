import { useMemo, useCallback } from 'react';
import { Pressable, PressableProps, ViewStyle, StyleSheet, GestureResponderEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useThemeColors, useThemeBorderRadius, spacing, animationTokens } from '../theme';
import { AppText, TextVariant } from './Text';
import { Icon } from '../components/Icon';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'surface';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  title?: string;
  icon?: string;
  iconOnly?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  style?: ViewStyle;
}

const sizeConfig: Record<ButtonSize, { height: number; px: number; icon: number; textVariant: TextVariant }> = {
  sm: { height: 36, px: 16, icon: 18, textVariant: 'labelSmall' },
  md: { height: 48, px: 24, icon: 22, textVariant: 'label' },
  lg: { height: 56, px: 32, icon: 24, textVariant: 'body' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  title,
  icon,
  iconOnly,
  loading,
  fullWidth,
  leftIcon,
  rightIcon,
  disabled,
  style,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const cfg = sizeConfig[size];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const isDisabled = disabled || loading;

  const variantStyles = useMemo(() => {
    const map: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
      primary: { bg: colors.primary, text: colors['on-primary'] },
      secondary: { bg: colors.secondary, text: colors['on-secondary'] },
      destructive: { bg: colors.error, text: colors['on-error'] },
      outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
      ghost: { bg: 'transparent', text: colors.primary },
      surface: { bg: colors['surface-container'], text: colors['on-surface'] },
    };
    return map[variant];
  }, [colors, variant]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isDisabled ? 0.5 : opacity.value,
  }));

  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    scale.value = withSpring(0.97, animationTokens.spring.snappy);
    opacity.value = withTiming(0.9, { duration: animationTokens.duration.fast });
    onPressIn?.(e);
  }, []);

  const handlePressOut = useCallback((e: GestureResponderEvent) => {
    scale.value = withSpring(1, animationTokens.spring.default);
    opacity.value = withTiming(1, { duration: animationTokens.duration.fast });
    onPressOut?.(e);
  }, []);

  const iconEl = (icon || leftIcon) && (
    <Icon name={icon || leftIcon!} size={cfg.icon} color={variantStyles.text} />
  );
  const rightIconEl = rightIcon && (
    <Icon name={rightIcon} size={cfg.icon} color={variantStyles.text} />
  );

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      <Animated.View
        style={[
          styles.base,
          {
            height: cfg.height,
            paddingHorizontal: iconOnly ? 0 : cfg.px,
            borderRadius: br.lg,
            backgroundColor: variantStyles.bg,
            borderWidth: variantStyles.border ? 1.5 : 0,
            borderColor: variantStyles.border || 'transparent',
            width: iconOnly ? cfg.height : fullWidth ? '100%' : undefined,
          },
          animatedStyle,
          style as ViewStyle,
        ]}
      >
        {loading ? (
          <Icon name="refresh" size={cfg.icon} color={variantStyles.text} />
        ) : (
          <>
            {iconEl}
            {title && !iconOnly && (
              <AppText
                variant={cfg.textVariant}
                style={{ color: variantStyles.text, textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: icon || leftIcon ? spacing.xs : 0 }}
              >
                {title}
              </AppText>
            )}
            {rightIconEl}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
