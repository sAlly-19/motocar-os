import { useState, useMemo } from 'react';
import { View, ScrollView, useWindowDimensions, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors, spacing, borderRadius } from '../../src/theme';
import { KpiCard } from '../../src/components/KpiCard';
import { StatusBadge } from '../../src/ui';
import { Icon } from '../../src/components/Icon';
import { GlassCard } from '../../src/components/GlassCard';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';

import { formatCurrency } from '../../src/utils/currency';
import { useAppStore } from '../../src/stores/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useRevenue } from '../../src/hooks/useRevenue';
import { AppText, Button, Chip } from '../../src/ui';

export default function DashboardScreen() {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { periodRevenue, chartData } = useRevenue(period, customStart, customEnd);

  const { orders, parts, customers } = useAppStore(
    useShallow((s) => ({
      orders: s.orders,
      parts: s.parts,
      customers: s.customers,
    }))
  );

  const activeOrders = useMemo(() => orders.filter((o) => o.status !== 'finished'), [orders]);
  const openOS = useMemo(
    () => orders.filter((o) => o.status === 'open' || o.status === 'in-progress').length,
    [orders]
  );
  const inProgress = useMemo(() => orders.filter((o) => o.status === 'in-progress').length, [orders]);
  const finishedToday = useMemo(() => orders.filter((o) => o.status === 'finished').length, [orders]);
  const lowStockItems = useMemo(() => parts.filter((p) => p.currentStock <= p.minStock), [parts]);
  const criticalStock = useMemo(() => lowStockItems.filter((p) => p.currentStock === 0), [lowStockItems]);
  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.fullName || id.slice(0, 8);
  const maxBar = Math.max(...chartData.flatMap((d) => [d.today, d.yesterday]), 1);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing['margin-mobile'],
          paddingBottom: isDesktop ? 40 : 120,
        }}
      >
        {/* KPIs — desktop: row; mobile: column stack (evita overlap) */}
        <View
          style={{
            flexDirection: isDesktop ? 'row' : 'column',
            marginBottom: spacing.gutter,
          }}
        >
          {[
            {
              val: String(openOS),
              label: 'OS Abertas',
              icon: 'assignment_late',
              bg: colors['error-container'],
              fg: colors['on-error-container'],
            },
            {
              val: String(inProgress),
              label: 'Em Andamento',
              icon: 'build_circle',
              bg: colors['info-container'],
              fg: colors['on-info-container'],
            },
            {
              val: String(finishedToday),
              label: 'Concluídas Hoje',
              icon: 'task_alt',
              bg: colors['success-container'],
              fg: colors['on-success-container'],
            },
          ].map((k, i) => (
            <View
              key={k.label}
              style={{
                flex: isDesktop ? 1 : undefined,
                marginRight: isDesktop && i < 2 ? spacing.gutter : 0,
                marginBottom: !isDesktop && i < 2 ? spacing.gutter : 0,
              }}
            >
              <KpiCard label={k.label} value={k.val} icon={k.icon} iconBg={k.bg} iconColor={k.fg} />
            </View>
          ))}
        </View>

        {/* Period chips */}
        <View
          accessibilityRole="tablist"
          style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.gutter }}
        >
          {(['today', 'week', 'month', 'custom'] as const).map((p) => {
            const label = p === 'today' ? 'Hoje' : p === 'week' ? '7 Dias' : p === 'month' ? '30 Dias' : 'Custom';
            return (
              <Chip key={p} label={label} selected={period === p} onPress={() => setPeriod(p)} />
            );
          })}
        </View>

        {period === 'custom' && (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.gutter }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors['outline-variant'],
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                color: colors['on-surface'],
                minHeight: 44,
              }}
              placeholder="Data início (DD/MM/AAAA)"
              placeholderTextColor={colors.placeholder}
              keyboardType="numbers-and-punctuation"
              value={customStart}
              onChangeText={setCustomStart}
              maxLength={10}
            />
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors['outline-variant'],
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                color: colors['on-surface'],
                minHeight: 44,
              }}
              placeholder="Data fim (DD/MM/AAAA)"
              placeholderTextColor={colors.placeholder}
              keyboardType="numbers-and-punctuation"
              value={customEnd}
              onChangeText={setCustomEnd}
              maxLength={10}
            />
          </View>
        )}

        {/* Revenue chart + right column */}
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: spacing.gutter, marginBottom: spacing.gutter }}>
          <GlassCard style={{ flex: 1, padding: spacing.lg, minWidth: 300 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: spacing.md,
              }}
            >
              <View>
                <AppText variant="h4" style={{ color: colors.primary }}>
                  Receita do Dia
                </AppText>
                <AppText variant="bodySmall" color="text-secondary">
                  Comparação: Hoje vs Ontem
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }}
                  />
                  <AppText variant="label" style={{ color: colors['on-surface-variant'] }}>
                    Hoje
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: colors.secondary,
                      opacity: 0.6,
                    }}
                  />
                  <AppText variant="label" style={{ color: colors['on-surface-variant'] }}>
                    Ontem
                  </AppText>
                </View>
              </View>
            </View>
            <View style={{ height: 240 }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  alignItems: 'flex-end',
                  paddingTop: 20,
                }}
              >
                {chartData.map((bar, i) => (
                  <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-end',
                        gap: 3,
                        height: '100%',
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          borderRadius: 4,
                          minHeight: 4,
                          height: `${(bar.yesterday / maxBar) * 100}%`,
                          backgroundColor: colors.secondary,
                          opacity: 0.6,
                        }}
                      />
                      <View
                        style={{
                          width: 20,
                          borderRadius: 4,
                          minHeight: 4,
                          height: `${(bar.today / maxBar) * 100}%`,
                          backgroundColor: colors.primary,
                        }}
                      />
                    </View>
                    <AppText variant="labelSmall" style={{ color: colors['on-surface-variant'] }}>
                      {bar.label}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          </GlassCard>

          <View
            style={{
              flex: 1,
              minWidth: 250,
              maxWidth: isDesktop ? 340 : '100%',
            }}
          >
            <GlassCard style={{ padding: spacing.lg, backgroundColor: colors.primary, marginBottom: spacing.gutter }}>
              <AppText
                variant="label"
                style={{ color: colors['on-primary'], opacity: 0.8, marginBottom: spacing.sm }}
              >
                Receita do Dia
              </AppText>
              <AppText variant="h1" style={{ color: colors['on-primary'] }}>
                {formatCurrency(periodRevenue)}
              </AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                <StatusBadge variant="ideal" label={`${orders.length} Total`} />
                <StatusBadge
                  variant="in-execution"
                  label={`Méd ${formatCurrency(orders.length > 0 ? periodRevenue / Math.max(orders.length, 1) : 0)}`}
                />
              </View>
            </GlassCard>

            <GlassCard style={{ padding: spacing.lg }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: spacing.md,
                }}
              >
                <AppText variant="h4" style={{ color: colors.primary }}>
                  Alertas de Estoque
                </AppText>
                <StatusBadge
                  variant="out-of-stock"
                  label={`${criticalStock.length} CRÍTICO`}
                />
              </View>
              {lowStockItems.length === 0 ? (
                <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                  <AppText variant="bodySmall" color="text-tertiary">
                    Sem alertas de estoque
                  </AppText>
                </View>
              ) : (
                lowStockItems.slice(0, 3).map((part) => {
                  const isCritical = part.currentStock === 0;
                  return (
                  <AnimatedPressable
                    key={part.id}
                    onPress={() => router.push({ pathname: '/inventory/[id]', params: { id: part.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${part.name}, ${part.currentStock} unidades restantes`}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: spacing.sm,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <AppText variant="label" style={{ color: colors.primary }}>
                        {part.name}
                      </AppText>
                      <AppText variant="labelSmall" style={{ color: isCritical ? colors.error : colors.secondary }}>
                        {part.currentStock} un (Mín: {part.minStock})
                      </AppText>
                    </View>
                    {isCritical && (
                      <Icon name="priority_high" size={20} color={colors.error} />
                    )}
                  </AnimatedPressable>
                )})
              )}
              <Button
                variant="ghost"
                title="Ver Estoque"
                fullWidth
                onPress={() => router.push('/(tabs)/inventory')}
                style={{ marginTop: spacing.md }}
              />
            </GlassCard>
          </View>
        </View>

        {/* Live workshop table */}
        <GlassCard style={{ overflow: 'hidden' }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: colors['outline-variant'],
            }}
          >
            <AppText variant="h4" style={{ color: colors.primary }}>
              Status da Oficina
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon="filter_list"
                accessibilityLabel="Filtrar ordens"
              />
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon="download"
                accessibilityLabel="Exportar dados"
              />
            </View>
          </View>
          {/* Table header — desktop only. Mobile shows cards instead. */}
          {isDesktop && (
            <View
              style={{
                flexDirection: 'row',
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                gap: spacing.sm,
                backgroundColor: colors['surface-container-low'],
              }}
            >
              <AppText variant="labelSmall" color="text-secondary" style={{ flex: 0.5, textTransform: 'uppercase' }}>
                OS #
              </AppText>
              <AppText variant="labelSmall" color="text-secondary" style={{ flex: 1.2, textTransform: 'uppercase' }}>
                Veículo
              </AppText>
              <AppText variant="labelSmall" color="text-secondary" style={{ flex: 0.8, textTransform: 'uppercase' }}>
                Técnico
              </AppText>
              <AppText variant="labelSmall" color="text-secondary" style={{ flex: 0.7, textTransform: 'uppercase' }}>
                Status
              </AppText>
              <AppText variant="labelSmall" color="text-secondary" style={{ flex: 0.7, textTransform: 'uppercase' }}>
                Progresso
              </AppText>
              <AppText variant="labelSmall" color="text-secondary" style={{ flex: 0.6, textAlign: 'right', textTransform: 'uppercase' }}>
                Total
              </AppText>
            </View>
          )}
          {activeOrders.length === 0 ? (
            <View style={{ padding: spacing.lg, alignItems: 'center' }}>
              <AppText variant="bodySmall" color="text-tertiary">
                Sem ordens ativas no momento
              </AppText>
            </View>
          ) : isDesktop ? (
            // Desktop: full table row
            activeOrders.slice(0, 5).map((order) => (
              <AnimatedPressable
                key={order.id}
                onPress={() => router.push(`/ticket/${order.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Ordem ${order.number}, ${getCustomerName(order.customerId)}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors['outline-variant'],
                }}
              >
                <AppText variant="bodySmall" style={{ flex: 0.5, color: colors.primary, fontWeight: '700' }}>
                  #{order.number}
                </AppText>
                <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Icon name="directions_car" size={18} color={colors['on-surface-variant']} />
                  <AppText variant="bodySmall" numberOfLines={1}>
                    {(order.plate ?? '').trim() || 'N/I'}
                  </AppText>
                </View>
                <AppText variant="bodySmall" style={{ flex: 0.8 }} numberOfLines={1}>
                  {getCustomerName(order.customerId)}
                </AppText>
                <View style={{ flex: 0.7 }}>
                  <StatusBadge
                    variant={
                      order.status === 'ready'
                        ? 'ready'
                        : order.status === 'in-progress'
                        ? 'in-execution'
                        : order.status === 'finished'
                        ? 'finished'
                        : 'waiting'
                    }
                    label={order.status}
                  />
                </View>
                <View style={{ flex: 0.7 }}>
                  <View style={{ height: 6, backgroundColor: colors['surface-container'], borderRadius: borderRadius.sm - 1, overflow: 'hidden' }}>
                    <View
                      style={{
                        height: '100%',
                        borderRadius: borderRadius.sm - 1,
                        width:
                          order.status === 'ready'
                            ? '100%'
                            : order.status === 'in-progress'
                            ? '65%'
                            : '30%',
                        backgroundColor:
                          order.status === 'ready'
                            ? colors.success
                            : order.status === 'in-progress'
                            ? colors.secondary
                            : colors.primary,
                      }}
                    />
                  </View>
                </View>
                <AppText variant="bodySmall" style={{ flex: 0.6, textAlign: 'right', fontWeight: '600' }}>
                  {formatCurrency(order.total)}
                </AppText>
              </AnimatedPressable>
            ))
          ) : (
            // Mobile: stacked card layout — no overlapping columns.
            activeOrders.slice(0, 5).map((order) => (
              <AnimatedPressable
                key={order.id}
                onPress={() => router.push(`/ticket/${order.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Ordem ${order.number}, ${getCustomerName(order.customerId)}`}
                style={{
                  padding: spacing.md,
                  gap: spacing.xs,
                  borderBottomWidth: 1,
                  borderBottomColor: colors['outline-variant'],
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AppText variant="bodySmall" style={{ color: colors.primary, fontWeight: '700' }}>
                    #{order.number}
                  </AppText>
                  <AppText variant="bodySmall" style={{ fontWeight: '600' }}>
                    {formatCurrency(order.total)}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Icon name="directions_car" size={16} color={colors['on-surface-variant']} />
                  <AppText variant="bodySmall" numberOfLines={1} style={{ flex: 1 }}>
                    {(order.plate ?? '').trim() || 'N/I'} · {getCustomerName(order.customerId)}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <StatusBadge
                    variant={
                      order.status === 'ready'
                        ? 'ready'
                        : order.status === 'in-progress'
                        ? 'in-execution'
                        : order.status === 'finished'
                        ? 'finished'
                        : 'waiting'
                    }
                    label={order.status}
                  />
                  <View style={{ flex: 1, height: 6, backgroundColor: colors['surface-container'], borderRadius: borderRadius.sm - 1, overflow: 'hidden' }}>
                    <View
                      style={{
                        height: '100%',
                        borderRadius: borderRadius.sm - 1,
                        width:
                          order.status === 'ready'
                            ? '100%'
                            : order.status === 'in-progress'
                            ? '65%'
                            : '30%',
                        backgroundColor:
                          order.status === 'ready'
                            ? colors.success
                            : order.status === 'in-progress'
                            ? colors.secondary
                            : colors.primary,
                      }}
                    />
                  </View>
                </View>
              </AnimatedPressable>
            ))
          )}
        </GlassCard>
      </ScrollView>
    </View>
  );
}
