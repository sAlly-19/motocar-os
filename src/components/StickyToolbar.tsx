import { ReactNode } from 'react';
import { View, Platform, StyleProp, ViewStyle } from 'react-native';
import { useThemeColors, spacing } from '../theme';

interface StickyToolbarProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Vertical offset from top on web (matches TopAppBar height). Default 0. */
  topOffset?: number;
}

/**
 * Wrapper that pins its content to the top of its scroll container on web
 * (`position: sticky`). Falls back to a plain View on native.
 * Use inside a ScrollView above the list to keep filters + search visible.
 */
export function StickyToolbar({ children, style, topOffset = 0 }: StickyToolbarProps) {
  const colors = useThemeColors();
  const stickyStyle =
    Platform.OS === 'web'
      ? ({ position: 'sticky', top: topOffset, zIndex: 10 } as any)
      : {};

  return (
    <View
      style={[
        {
          backgroundColor: colors.background,
          paddingBottom: spacing.sm,
        },
        stickyStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
