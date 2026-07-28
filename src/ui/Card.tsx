import { useMemo, useCallback } from 'react';
import { Pressable, ViewProps, ViewStyle, StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing, animationTokens } from '../theme';

type CardVariant = 'elevated' | 'outlined' | 'filled' | 'ghost' | 'glass';

interface CardProps extends Omit<ViewProps, 'style'> {
  variant?: CardVariant;
  pressable?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Card({
  variant = 'outlined',
  pressable,
  onPress,
  style,
  children,
  accessibilityLabel,
  ...props
}: CardProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const scale = useSharedValue(1);

  const variantStyle = useMemo<ViewStyle>(() => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors['surface-container-lowest'],
          borderWidth: 0,
          ...shadows.md,
        };
      case 'filled':
        return {
          backgroundColor: colors['surface-container'],
          borderWidth: 0,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      case 'glass':
        return {
          backgroundColor: colors['surface-container-lowest'],
          borderColor: colors['outline-variant'],
          borderWidth: 1,
          opacity: 0.92,
          ...shadows.sm,
        };
      case 'outlined':
      default:
        return {
          backgroundColor: colors['surface-container-lowest'],
          borderColor: colors['outline-variant'],
          borderWidth: 1,
        };
    }
  }, [colors, variant, shadows]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, animationTokens.spring.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, animationTokens.spring.default);
  }, []);

  const baseStyle: ViewStyle = {
    borderRadius: br.xl,
    padding: spacing.md,
  };

  if (pressable && onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Animated.View style={[baseStyle, variantStyle, animatedStyle, style]} {...(props as any)}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View style={[baseStyle, variantStyle, style]} {...(props as any)}>
      {children}
    </Animated.View>
  );
}
