import React from 'react';
import { View } from 'react-native';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing } from '../theme';
import { AppText } from '../ui/Text';
import { Icon } from './Icon';

interface KpiCardProps {
  label: string;
  value: string;
  icon: string;
  iconBg?: string;
  iconColor?: string;
  caption?: string;
}

/**
 * KPI card with fixed value block height so values with different lengths
 * ("0" vs "R$ 20.659,70") stay vertically aligned across a row.
 */
export const KpiCard = React.memo(function KpiCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  caption,
}: KpiCardProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}`}
      style={[
        {
          borderRadius: br.xl,
          padding: spacing.lg,
          backgroundColor: colors['surface-container-lowest'],
          borderWidth: 1,
          borderColor: colors['outline-variant'],
          flex: 1,
          minWidth: 150,
          minHeight: 116,
        },
        shadows.kpi,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText
            variant="label"
            color="text-secondary"
            transform="uppercase"
            style={{ letterSpacing: 0.5, marginBottom: spacing.xs }}
            numberOfLines={1}
          >
            {label}
          </AppText>
          <View style={{ minHeight: 40, justifyContent: 'center' }}>
            <AppText variant="h1" style={{ color: colors.primary }} numberOfLines={1}>
              {value}
            </AppText>
          </View>
          {caption && (
            <AppText variant="labelSmall" color="text-tertiary" style={{ marginTop: 2 }} numberOfLines={1}>
              {caption}
            </AppText>
          )}
        </View>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: br.lg,
            backgroundColor: iconBg || colors['primary-container'],
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Icon name={icon} size={24} color={iconColor || colors['on-primary-container']} />
        </View>
      </View>
    </View>
  );
});
