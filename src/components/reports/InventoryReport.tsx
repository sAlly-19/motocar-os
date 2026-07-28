import { View } from 'react-native';
import { AppText, StatusBadge } from '../../ui';
import { GlassCard } from '../GlassCard';
import type { Order, Part } from '../../db/schema';
import { formatCurrency } from '../../utils/currency';

interface InventoryReportProps {
  parts: Part[];
  orders: Order[];
  colors: any;
  br: any;
  isDesktop: boolean;
}

export function InventoryReport({ parts, colors, br, isDesktop }: InventoryReportProps) {
  const totalValue = parts.reduce((sum, p) => sum + p.costPrice * p.currentStock, 0);
  const totalItems = parts.reduce((sum, p) => sum + p.currentStock, 0);
  const lowStock = parts.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock);
  const outOfStock = parts.filter((p) => p.currentStock === 0);

  const topValueParts = [...parts].sort((a, b) => (b.costPrice * b.currentStock) - (a.costPrice * a.currentStock)).slice(0, 5);

  return (
    <View style={{ gap: 16 }}>
      <GlassCard style={{ padding: 24 }}>
        <AppText variant="h4" style={{ color: colors.primary, marginBottom: 16 }}>
          Estoque Geral
        </AppText>
        
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: colors['surface-container-low'], padding: 16, borderRadius: 12 }}>
            <AppText variant="labelSmall" color="text-secondary" style={{ textTransform: 'uppercase', marginBottom: 4 }}>
              Capital Imobilizado
            </AppText>
            <AppText variant="h2" style={{ color: colors.primary }}>{formatCurrency(totalValue)}</AppText>
            <AppText variant="caption" color="text-tertiary">
              Custo total em estoque
            </AppText>
          </View>
          <View style={{ flex: 1, backgroundColor: colors['surface-container-low'], padding: 16, borderRadius: 12 }}>
            <AppText variant="labelSmall" color="text-secondary" style={{ textTransform: 'uppercase', marginBottom: 4 }}>
              Volume
            </AppText>
            <AppText variant="h2" style={{ color: colors.secondary }}>{totalItems}</AppText>
            <AppText variant="caption" color="text-tertiary">
              Unidades físicas
            </AppText>
          </View>
        </View>

        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, marginBottom: 24 }}>
          <View style={{ flex: 1, padding: 16, borderWidth: 1, borderColor: colors['outline-variant'], borderRadius: br.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="label" style={{ color: colors.error }}>Estoque Zerado</AppText>
              <StatusBadge variant="out-of-stock" label={String(outOfStock.length)} />
            </View>
          </View>
          <View style={{ flex: 1, padding: 16, borderWidth: 1, borderColor: colors['outline-variant'], borderRadius: br.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="label" style={{ color: colors.secondary }}>Baixo Estoque</AppText>
              <StatusBadge variant="in-execution" label={String(lowStock.length)} />
            </View>
          </View>
        </View>

        <AppText variant="label" style={{ color: colors.primary, marginBottom: 12 }}>Maior Valor Imobilizado (Top 5)</AppText>
        <View style={{ gap: 8 }}>
          {topValueParts.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors['surface-container'] }}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodySmall" style={{ fontWeight: '600' }} numberOfLines={1}>{p.name}</AppText>
                <AppText variant="caption" color="text-tertiary">{p.currentStock} un x {formatCurrency(p.costPrice)}</AppText>
              </View>
              <AppText variant="bodySmall" style={{ fontWeight: '700', color: colors.primary }}>
                {formatCurrency(p.costPrice * p.currentStock)}
              </AppText>
            </View>
          ))}
        </View>
      </GlassCard>
    </View>
  );
}
