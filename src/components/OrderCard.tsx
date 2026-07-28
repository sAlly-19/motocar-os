import { View } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing } from '../theme';
import { StatusBadge } from '../ui';
import { AppText } from '../ui/Text';
import { Icon } from './Icon';
import { AnimatedPressable } from './AnimatedPressable';
import { formatCurrency } from '../utils/currency';
import type { Order } from '../db/schema';

interface OrderCardProps {
  order: Order;
  getCustomerName: (id: string) => string;
  t: (key: string) => string;
}

const statusMap: Record<string, { variant: string; label: string }> = {
  ready: { variant: 'ready', label: 'Pronto' },
  'in-progress': { variant: 'in-execution', label: 'Em Execução' },
  'waiting-approval': { variant: 'waiting', label: 'Aguardando' },
  open: { variant: 'in-execution', label: 'Aberta' },
  finished: { variant: 'finished', label: 'Finalizada' },
};

export function OrderCard({ order, getCustomerName, t }: OrderCardProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const s = statusMap[order.status] || { variant: 'waiting', label: order.status };
  const customerName = getCustomerName(order.customerId);
  const plate = order.plate ?? '';

  return (
    <AnimatedPressable
      onPress={() => router.push(`/ticket/${order.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Ordem ${order.number} de ${customerName}${plate ? `, placa ${plate}` : ''}, ${s.label}`}
      style={[
        {
          borderRadius: br.xl,
          borderWidth: 1,
          borderColor: colors['outline-variant'],
          backgroundColor: colors['surface-container-lowest'],
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
        shadows.sm,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.sm,
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText
            variant="labelSmall"
            color="text-secondary"
            transform="uppercase"
            style={{ letterSpacing: 1 }}
          >
            {t('orders.serviceOrder')}
          </AppText>
          <AppText variant="h4" style={{ color: colors.primary, fontWeight: '700' }}>
            #{order.number}
          </AppText>
        </View>
        <StatusBadge variant={s.variant} label={s.label} />
      </View>
      <View style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="person" size={18} color={colors['on-surface-variant']} />
          <AppText variant="bodySmall">{customerName}</AppText>
        </View>
        {plate && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name="directions_car" size={18} color={colors['on-surface-variant']} />
            <AppText variant="bodySmall" color="text-secondary">{plate}</AppText>
          </View>
        )}
        <AppText
          variant="h3"
          style={{ color: colors.secondary, fontWeight: '700', marginTop: spacing.xs }}
        >
          {formatCurrency(order.total)}
        </AppText>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.md,
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors['outline-variant'],
        }}
      >
        <AppText variant="label" style={{ color: colors.secondary, fontWeight: '600' }}>
          {t('orders.details')}
        </AppText>
        <Icon name="arrow_forward" size={16} color={colors.secondary} />
      </View>
    </AnimatedPressable>
  );
}
