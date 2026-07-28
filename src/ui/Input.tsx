import { useState, useCallback } from 'react';
import { View, TextInput, TextInputProps, Pressable, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useThemeColors, useThemeTypography, useThemeBorderRadius, spacing, animationTokens } from '../theme';
import { AppText } from './Text';
import { Icon } from '../components/Icon';

const isWeb = Platform.OS === 'web';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export function Input({ label, error, helperText, leftIcon, rightIcon, onRightIconPress, style, ...props }: InputProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const br = useThemeBorderRadius();
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? colors.error
      : focusProgress.value > 0
      ? colors.focus
      : colors['outline-variant'],
    borderWidth: focused || error ? 2 : 1,
  }));

  const onFocus = useCallback((e: any) => {
    setFocused(true);
    focusProgress.value = withTiming(1, { duration: animationTokens.duration.fast });
    props.onFocus?.(e);
  }, []);

  const onBlur = useCallback((e: any) => {
    setFocused(false);
    focusProgress.value = withTiming(0, { duration: animationTokens.duration.fast });
    props.onBlur?.(e);
  }, []);

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
          {label}
        </AppText>
      )}
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors['surface-container-low'],
            borderRadius: br.lg,
            paddingHorizontal: spacing.md,
            minHeight: 52,
          },
          animatedBorderStyle,
        ]}
      >
        {leftIcon && (
          <Icon name={leftIcon} size={20} color={colors['on-surface-variant']} style={{ marginRight: spacing.sm }} />
        )}
        <TextInput
          style={[
            typography['body-lg'],
            {
              color: colors['on-surface'],
              flex: 1,
              paddingVertical: spacing.sm + 2,
            },
            isWeb && ({ outlineStyle: 'none', outlineWidth: 0 } as any),
            style,
          ]}
          placeholderTextColor={colors.placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          {...props}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} style={{ padding: spacing.xs }}>
            <Icon name={rightIcon} size={20} color={colors['on-surface-variant']} />
          </Pressable>
        )}
      </Animated.View>
      {error && (
        <AppText variant="caption" color="error" style={{ marginTop: spacing.xs }}>
          {error}
        </AppText>
      )}
      {helperText && !error && (
        <AppText variant="caption" color="text-tertiary" style={{ marginTop: spacing.xs }}>
          {helperText}
        </AppText>
      )}
    </View>
  );
}
