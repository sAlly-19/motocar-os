import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { useThemeColors, useThemeTypography } from '../theme';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'label' | 'labelSmall' | 'caption';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: keyof ReturnType<typeof useThemeColors>;
  align?: TextStyle['textAlign'];
  transform?: TextStyle['textTransform'];
  weight?: TextStyle['fontWeight'];
}

const variantMap: Record<TextVariant, string> = {
  h1: 'headline-lg',
  h2: 'headline-lg-mobile',
  h3: 'headline-md',
  h4: 'headline-sm',
  body: 'body-lg',
  bodySmall: 'body-md',
  label: 'label-md',
  labelSmall: 'label-sm',
  caption: 'label-sm',
};

export function AppText({ variant = 'body', color, align, transform, weight, style, ...props }: AppTextProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const baseStyle = typography[variantMap[variant]] || typography['body-md'];
  const textColor = color ? colors[color] : colors['text-primary'];

  return (
    <RNText
      style={[
        baseStyle,
        { color: textColor },
        align && { textAlign: align },
        transform && { textTransform: transform },
        weight && { fontWeight: weight },
        style,
      ]}
      {...props}
    />
  );
}
