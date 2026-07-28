import { View } from 'react-native';
import { useThemeColors, spacing } from '../theme';

type DividerSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'none';

interface DividerProps {
  vertical?: boolean;
  /** Semantic spacing size around the divider. `none` = no margin. */
  spacing?: DividerSpacing;
  color?: string;
}

export function Divider({ vertical, spacing: sp = 'md', color }: DividerProps) {
  const colors = useThemeColors();
  const margin = sp === 'none' ? 0 : spacing[sp];

  if (vertical) {
    return (
      <View
        accessibilityRole="none"
        style={{
          width: 1,
          alignSelf: 'stretch',
          backgroundColor: color || colors.divider,
          marginHorizontal: margin / 2,
        }}
      />
    );
  }

  return (
    <View
      accessibilityRole="none"
      style={{
        height: 1,
        backgroundColor: color || colors.divider,
        marginVertical: margin,
      }}
    />
  );
}
