import { View } from 'react-native';
import { AppText, StatusBadge } from '../../ui';
import { GlassCard } from '../GlassCard';
import type { Order } from '../../db/schema';

interface OrdersReportProps {
  allOrders: Order[];
  inRangeOrders: Order[];
  colors: any;
  isDesktop: boolean;
}

export function OrdersReport({ allOrders, inRangeOrders, colors, isDesktop }: OrdersReportProps) {
  const total = inRangeOrders.length;
  const finished = inRangeOrders.filter((o) => o.status === 'finished').length;
  const inProgress = inRangeOrders.filter((o) => o.status === 'in-progress').length;
  const waiting = inRangeOrders.filter((o) => o.status === 'waiting-approval').length;
  const open = inRangeOrders.filter((o) => o.status === 'open').length;
  const cancelled = inRangeOrders.filter((o) => o.status === 'cancelled').length;

  return (
    <GlassCard style={{ padding: 24 }}>
      <AppText variant="h4" style={{ color: colors.primary, marginBottom: 16 }}>
        Visão Geral de Ordens
      </AppText>
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 150, backgroundColor: colors['surface-container-low'], padding: 16, borderRadius: 12 }}>
          <AppText variant="labelSmall" color="text-secondary" style={{ textTransform: 'uppercase', marginBottom: 4 }}>
            Total no Período
          </AppText>
          <AppText variant="h2" style={{ color: colors.primary }}>{total}</AppText>
        </View>
        <View style={{ flex: 1, minWidth: 150, backgroundColor: colors['surface-container-low'], padding: 16, borderRadius: 12 }}>
          <AppText variant="labelSmall" color="text-secondary" style={{ textTransform: 'uppercase', marginBottom: 4 }}>
            Finalizadas
          </AppText>
          <AppText variant="h2" style={{ color: colors.success }}>{finished}</AppText>
          <AppText variant="caption" color="text-tertiary">
            {total > 0 ? Math.round((finished / total) * 100) : 0}% de conversão
          </AppText>
        </View>
      </View>
      
      <AppText variant="label" style={{ color: colors.primary, marginTop: 24, marginBottom: 16 }}>
        Distribuição de Status
      </AppText>
      <View style={{ gap: 12 }}>
        {[
          { label: 'Abertas', count: open, variant: 'waiting' as const },
          { label: 'Em execução', count: inProgress, variant: 'in-execution' as const },
          { label: 'Aguardando Aprovação', count: waiting, variant: 'out-of-stock' as const },
          { label: 'Finalizadas', count: finished, variant: 'ready' as const },
          { label: 'Canceladas', count: cancelled, variant: 'out-of-stock' as const },
        ].map((st) => (
          <View key={st.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <StatusBadge variant={st.variant} label={st.label} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppText variant="body" style={{ fontWeight: '600' }}>{st.count}</AppText>
              <AppText variant="labelSmall" color="text-tertiary" style={{ width: 40, textAlign: 'right' }}>
                {total > 0 ? Math.round((st.count / total) * 100) : 0}%
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}
