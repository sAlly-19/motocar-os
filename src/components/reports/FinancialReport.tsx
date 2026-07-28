import { View } from 'react-native';
import { AppText } from '../../ui';
import { GlassCard } from '../GlassCard';
import type { Order } from '../../db/schema';
import { formatCurrency } from '../../utils/currency';

interface FinancialReportProps {
  orders: Order[];
  inRangeOrders: Order[];
  colors: any;
  isDesktop: boolean;
  winWidth: number;
  periodLabel: string;
}

export function FinancialReport({ inRangeOrders, colors, isDesktop, periodLabel }: FinancialReportProps) {
  const revenue = inRangeOrders.reduce((sum, o) => sum + o.total, 0);
  const partsRevenue = inRangeOrders.reduce((sum, o) => sum + (o.partsSubtotal || 0), 0);
  const laborRevenue = inRangeOrders.reduce((sum, o) => sum + (o.laborSubtotal || 0), 0);
  const discounts = inRangeOrders.reduce((sum, o) => sum + (o.discount || 0), 0);

  const avgTicket = inRangeOrders.length > 0 ? revenue / inRangeOrders.length : 0;

  return (
    <GlassCard style={{ padding: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <View>
          <AppText variant="h4" style={{ color: colors.primary }}>Relatório Financeiro</AppText>
          <AppText variant="bodySmall" color="text-secondary">{periodLabel}</AppText>
        </View>
      </View>

      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, marginBottom: 24 }}>
        <View style={{ flex: 1, backgroundColor: colors['primary-container'], padding: 20, borderRadius: 16 }}>
          <AppText variant="label" style={{ color: colors['on-primary-container'], opacity: 0.8, marginBottom: 4 }}>
            Faturamento Total
          </AppText>
          <AppText variant="h1" style={{ color: colors['on-primary-container'] }}>
            {formatCurrency(revenue)}
          </AppText>
        </View>
        <View style={{ flex: 1, backgroundColor: colors['surface-container-low'], padding: 20, borderRadius: 16 }}>
          <AppText variant="label" color="text-secondary" style={{ marginBottom: 4 }}>
            Ticket Médio
          </AppText>
          <AppText variant="h2" style={{ color: colors.secondary }}>
            {formatCurrency(avgTicket)}
          </AppText>
        </View>
      </View>

      <AppText variant="label" style={{ color: colors.primary, marginBottom: 16 }}>Detalhamento da Receita</AppText>
      
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors['surface-container'] }}>
          <AppText variant="body" color="text-secondary">Subtotal em Peças</AppText>
          <AppText variant="body" style={{ fontWeight: '600' }}>{formatCurrency(partsRevenue)}</AppText>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors['surface-container'] }}>
          <AppText variant="body" color="text-secondary">Subtotal em Mão de Obra</AppText>
          <AppText variant="body" style={{ fontWeight: '600' }}>{formatCurrency(laborRevenue)}</AppText>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors['surface-container'] }}>
          <AppText variant="body" color="error">Descontos Concedidos</AppText>
          <AppText variant="body" color="error" style={{ fontWeight: '600' }}>- {formatCurrency(discounts)}</AppText>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
          <AppText variant="label" style={{ color: colors.primary }}>TOTAL LÍQUIDO</AppText>
          <AppText variant="h4" style={{ color: colors.primary }}>{formatCurrency(revenue)}</AppText>
        </View>
      </View>
    </GlassCard>
  );
}
