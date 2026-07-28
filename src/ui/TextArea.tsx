import { useState } from 'react';
import { TextInput, TextInputProps, View, Platform } from 'react-native';
import { useThemeColors, useThemeTypography, useThemeBorderRadius, spacing } from '../theme';
import { AppText } from './Text';

const isWeb = Platform.OS === 'web';

interface TextAreaProps extends Omit<TextInputProps, 'multiline'> {
  label?: string;
  error?: string;
  helperText?: string;
  numberOfLines?: number;
}

export function TextArea({
  label,
  error,
  helperText,
  numberOfLines = 4,
  style,
  onFocus,
  onBlur,
  ...props
}: TextAreaProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const br = useThemeBorderRadius();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
          {label}
        </AppText>
      )}
      <View
        style={{
          backgroundColor: colors['surface-container-low'],
          borderRadius: br.lg,
          borderWidth: focused || error ? 2 : 1,
          borderColor: error ? colors.error : focused ? colors.focus : colors['outline-variant'],
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
        }}
      >
        <TextInput
          multiline
          numberOfLines={numberOfLines}
          placeholderTextColor={colors.placeholder}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            typography['body-lg'],
            {
              color: colors['on-surface'],
              textAlignVertical: 'top',
              minHeight: numberOfLines * 22,
              padding: 0,
            },
            isWeb && ({ outlineStyle: 'none', outlineWidth: 0 } as any),
            style,
          ]}
          {...props}
        />
      </View>
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
