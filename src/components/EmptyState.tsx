import { View } from 'react-native';
import { useThemeColors, spacing } from '../theme';
import { AppText } from '../ui/Text';
import { Icon } from './Icon';
import { EmptyIllustration, type IllustrationName } from './EmptyIllustration';

interface EmptyStateProps {
  /** Legacy Material icon name (fallback if no `illustration` provided). */
  icon?: string;
  /** New illustrated variant — preferred. */
  illustration?: IllustrationName;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

// Maps legacy icon names to illustrations for automatic upgrade.
const ICON_TO_ILLUSTRATION: Record<string, IllustrationName> = {
  description: 'empty-clipboard',
  inventory_2: 'empty-inventory',
  inbox: 'empty-box',
  search_off: 'empty-search',
  payments: 'empty-quotes',
  request_quote: 'empty-quotes',
  group: 'empty-team',
  calendar_month: 'empty-schedule',
};

export function EmptyState({ icon, illustration, title, subtitle, action }: EmptyStateProps) {
  const colors = useThemeColors();
  const resolved = illustration ?? (icon ? ICON_TO_ILLUSTRATION[icon] : undefined);

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: 40,
      }}
    >
      {resolved ? (
        <EmptyIllustration name={resolved} size={160} />
      ) : (
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors['surface-container'],
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
          }}
        >
          <Icon name={icon ?? 'inbox'} size={40} color={colors['on-surface-variant']} />
        </View>
      )}
      <AppText
        variant="h3"
        align="center"
        style={{ marginTop: spacing.md, marginBottom: spacing.xs, color: colors.primary }}
      >
        {title}
      </AppText>
      {subtitle && (
        <AppText
          variant="bodySmall"
          color="text-secondary"
          align="center"
          style={{ marginBottom: spacing.lg, maxWidth: 340 }}
        >
          {subtitle}
        </AppText>
      )}
      {action}
    </View>
  );
}
