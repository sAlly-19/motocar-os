import { useMemo } from 'react';
import { View } from 'react-native';
import { useThemeColors, useThemeBorderRadius, spacing } from '../theme';
import { AppText } from './Text';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  label: string;
  dot?: boolean;
  count?: number;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: 'primary-container', text: 'on-primary-container' },
  secondary: { bg: 'secondary-container', text: 'on-secondary-container' },
  success: { bg: 'success-container', text: 'on-success-container' },
  warning: { bg: 'warning-container', text: 'on-warning-container' },
  danger: { bg: 'error-container', text: 'on-error-container' },
  info: { bg: 'info-container', text: 'on-info-container' },
  neutral: { bg: 'surface-container-high', text: 'on-surface-variant' },
};

export function Badge({ variant = 'neutral', size = 'md', label, dot, count }: BadgeProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const vars = variantStyles[variant];
  const isSmall = size === 'sm';
  const textVariant = isSmall ? 'labelSmall' : 'label';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: colors[vars.bg],
        borderRadius: br.full,
        paddingHorizontal: isSmall ? spacing.sm : spacing.md,
        paddingVertical: isSmall ? 2 : spacing.xs,
        gap: spacing.xs,
      }}
    >
      {dot && (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors[vars.text],
          }}
        />
      )}
      <AppText variant={textVariant} color={undefined} style={{ color: colors[vars.text], fontWeight: '600' }}>
        {count !== undefined ? `${count}` : label}
      </AppText>
    </View>
  );
}

export function StatusBadge({ variant, label }: { variant: string; label: string }) {
  // Contrast: `waiting` uses `info` (blue) instead of `warning` (orange) so it
  // is visually distinct from `in-execution`/warning-based low-stock states.
  const map: Record<string, BadgeVariant> = {
    ready: 'success',
    'in-execution': 'primary',
    waiting: 'info',
    'out-of-stock': 'danger',
    'low-stock': 'warning',
    ideal: 'success',
    open: 'secondary',
    finished: 'neutral',
  };
  return <Badge variant={map[variant] || 'neutral'} label={label} dot />;
}
