import { View, TextInput, TextInputProps } from 'react-native';
import { useThemeColors, useThemeBorderRadius, spacing, typography } from '../theme';
import { AppText } from '../ui/Text';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function FormField({ label, error, style, ...props }: FormFieldProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>{label}</AppText>
      <TextInput
        style={[
          {
            backgroundColor: colors['surface-container-low'],
            borderRadius: br.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 4,
            borderWidth: 1,
            borderColor: error ? colors.error : 'transparent',
          },
          typography['body-lg'],
          { color: colors['on-surface'] },
          style,
        ]}
        placeholderTextColor={colors.placeholder}
        {...props}
      />
      {error && <AppText variant="caption" color="error" style={{ marginTop: spacing.xs }}>{error}</AppText>}
    </View>
  );
}
