import { useCallback } from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useThemeColors, useThemeBorderRadius, spacing, animationTokens } from '../theme';
import { AppText } from './Text';
import { Icon } from '../components/Icon';

type ChipSize = 'sm' | 'md';

interface ChipProps {
  label: string;
  onPress?: () => void;
  onDelete?: () => void;
  selected?: boolean;
  size?: ChipSize;
  leftIcon?: string;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const sizeConfig: Record<ChipSize, { px: number; py: number; icon: number }> = {
  sm: { px: spacing.sm + 2, py: spacing.xs, icon: 12 },
  md: { px: spacing.md, py: spacing.xs + 2, icon: 14 },
};

export function Chip({
  label,
  onPress,
  onDelete,
  selected,
  size = 'md',
  leftIcon,
  disabled,
  style,
  accessibilityLabel,
}: ChipProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const cfg = sizeConfig[size];
  const scale = useSharedValue(1);

  const bg = disabled
    ? colors['surface-container-low']
    : selected
    ? colors.primary
    : colors['surface-container'];
  const fg = disabled
    ? colors['text-tertiary']
    : selected
    ? colors['on-primary']
    : colors['on-surface'];
  const borderColor = selected ? colors.primary : colors['outline-variant'];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.6 : 1,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.94, animationTokens.spring.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, animationTokens.spring.default);
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      hitSlop={4}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            backgroundColor: bg,
            paddingHorizontal: cfg.px,
            paddingVertical: cfg.py,
            borderRadius: br.full,
            borderWidth: 1,
            borderColor,
          },
          animatedStyle,
          style,
        ]}
      >
        {leftIcon && <Icon name={leftIcon} size={cfg.icon + 4} color={fg} />}
        <AppText variant={size === 'sm' ? 'labelSmall' : 'label'} style={{ color: fg }}>
          {label}
        </AppText>
        {onDelete && !disabled && (
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remover ${label}`}
          >
            <Icon name="close" size={cfg.icon} color={fg} />
          </Pressable>
        )}
      </Animated.View>
    </Pressable>
  );
}
