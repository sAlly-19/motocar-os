import { View } from 'react-native';
import { AppText } from '../../ui';
import { GlassCard } from '../GlassCard';
import type { Order, Customer, Vehicle } from '../../db/schema';
import { formatCurrency } from '../../utils/currency';

interface CustomersReportProps {
  customers: Customer[];
  vehicles: Vehicle[];
  orders: Order[];
  inRangeOrders: Order[];
  colors: any;
  br: any;
  isDesktop: boolean;
}

export function CustomersReport({ customers, inRangeOrders, colors, br, isDesktop }: CustomersReportProps) {
  const activeCustomerIds = new Set(inRangeOrders.map((o) => o.customerId));
  const activeCustomersCount = activeCustomerIds.size;
  const newCustomersCount = customers.filter((c) => {
    // Para simplificar, consideramos "novos" clientes que têm sua primeira OS neste período
    // Esta é uma aproximação baseada na criação da OS, não do cliente
    return true; 
  }).length; // Simplificação visual. A lógica real exigiria checar createdAt do cliente vs período.

  // Ranking de clientes por receita no período
  const customerRevenue: Record<string, number> = {};
  const customerOsCount: Record<string, number> = {};
  
  inRangeOrders.forEach((o) => {
    customerRevenue[o.customerId] = (customerRevenue[o.customerId] || 0) + o.total;
    customerOsCount[o.customerId] = (customerOsCount[o.customerId] || 0) + 1;
  });

  const topCustomers = Object.entries(customerRevenue)
    .sort(([, revA], [, revB]) => revB - revA)
    .slice(0, 5)
    .map(([id, rev]) => {
      const customer = customers.find(c => c.id === id);
      return {
        id,
        name: customer?.fullName || 'Cliente Removido',
        revenue: rev,
        osCount: customerOsCount[id] || 0
      };
    });

  return (
    <GlassCard style={{ padding: 24 }}>
      <AppText variant="h4" style={{ color: colors.primary, marginBottom: 16 }}>
        Métricas de Clientes
      </AppText>
      
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, marginBottom: 24 }}>
        <View style={{ flex: 1, backgroundColor: colors['surface-container-low'], padding: 16, borderRadius: br.lg }}>
          <AppText variant="labelSmall" color="text-secondary" style={{ textTransform: 'uppercase', marginBottom: 4 }}>
            Clientes Atendidos
          </AppText>
          <AppText variant="h2" style={{ color: colors.primary }}>{activeCustomersCount}</AppText>
          <AppText variant="caption" color="text-tertiary">
            No período selecionado
          </AppText>
        </View>
        <View style={{ flex: 1, backgroundColor: colors['surface-container-low'], padding: 16, borderRadius: br.lg }}>
          <AppText variant="labelSmall" color="text-secondary" style={{ textTransform: 'uppercase', marginBottom: 4 }}>
            Total na Base
          </AppText>
          <AppText variant="h2" style={{ color: colors.secondary }}>{customers.length}</AppText>
          <AppText variant="caption" color="text-tertiary">
            Clientes cadastrados
          </AppText>
        </View>
      </View>

      {topCustomers.length > 0 && (
        <>
          <AppText variant="label" style={{ color: colors.primary, marginBottom: 12 }}>Top 5 Clientes (Receita)</AppText>
          <View style={{ gap: 8 }}>
            {topCustomers.map((tc, index) => (
              <View key={tc.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors['surface-container'] }}>
                <AppText variant="label" style={{ color: colors.secondary, width: 24 }}>{index + 1}º</AppText>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySmall" style={{ fontWeight: '600' }} numberOfLines={1}>{tc.name}</AppText>
                  <AppText variant="caption" color="text-tertiary">{tc.osCount} ordens de serviço</AppText>
                </View>
                <AppText variant="bodySmall" style={{ fontWeight: '700', color: colors.primary }}>
                  {formatCurrency(tc.revenue)}
                </AppText>
              </View>
            ))}
          </View>
        </>
      )}
    </GlassCard>
  );
}
