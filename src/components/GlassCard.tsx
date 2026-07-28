import React from 'react';
import { View, ViewProps } from 'react-native';
import { useThemeColors, useThemeBorderRadius, useThemeShadows } from '../theme';

interface GlassCardProps extends ViewProps {
  /**
   * @deprecated Kept for backwards compatibility. The visual effect is a subtle
   * translucency; use `<Card variant="glass">` from `src/ui/Card` in new code.
   */
  blur?: boolean;
}

export const GlassCard = React.memo(function GlassCard({ style, children, blur = true, ...props }: GlassCardProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();

  return (
    <View
      style={[
        {
          borderRadius: br.xl,
          borderWidth: 1,
          borderColor: colors['outline-variant'],
          backgroundColor: colors['surface-container-lowest'],
          opacity: blur ? 0.92 : 1,
        },
        shadows.sm,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
});
