import { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import Svg, { Rect, Line as SvgLine, Text as SvgText, G } from 'react-native-svg';
import { AppText, Chip } from '../../ui';
import { GlassCard } from '../GlassCard';
import { KpiCard } from '../KpiCard';
import { Icon } from '../Icon';
import type { Employee } from '../../stores/useTeamStore';
import type { Order } from '../../db/schema';
import { formatCurrency } from '../../utils/currency';
import { spacing } from '../../theme';
import { lastMonthsBuckets } from '../../utils/dateRange';

interface EmployeesReportProps {
  employees: Employee[];
  orders: Order[];
  inRangeOrders: Order[];
  isAdmin: boolean;
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
  colors: any;
  br: any;
  shadows?: any;
  isDesktop: boolean;
  winWidth: number;
}

export function EmployeesReport({
  employees,
  orders,
  inRangeOrders,
  isAdmin,
  selectedEmployeeId,
  onSelectEmployee,
  colors,
  br,
  isDesktop,
  winWidth,
}: EmployeesReportProps) {
  const activeEmployees = useMemo(
    () => employees.filter((e: any) => e.status === 'active'),
    [employees],
  );

  const ordersByEmployee = useMemo(() => {
    const filtered = selectedEmployeeId && selectedEmployeeId !== 'all'
      ? inRangeOrders.filter((o: any) => o.technicianId === selectedEmployeeId)
      : inRangeOrders;
    return filtered;
  }, [inRangeOrders, selectedEmployeeId]);

  const stats = useMemo(() => {
    const emp = employees.find((e: any) => e.id === selectedEmployeeId);
    const ordersCount = ordersByEmployee.length;
    const finished = ordersByEmployee.filter((o: any) => o.status === 'finished');
    const revenue = finished.reduce((s: number, o: any) => s + o.total, 0);
    const ticket = finished.length > 0 ? revenue / finished.length : 0;
    // Tempo médio: (updatedAt - createdAt) nas finalizadas.
    const durations = finished
      .map((o: any) => new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime())
      .filter((ms: number) => ms > 0);
    const avgHours = durations.length > 0
      ? Math.round((durations.reduce((s: number, m: number) => s + m, 0) / durations.length) / 3_600_000)
      : 0;
    return { emp, ordersCount, finished: finished.length, revenue, ticket, avgHours };
  }, [ordersByEmployee, employees, selectedEmployeeId]);

  return (
    <View style={{ gap: spacing.gutter }}>
      {isAdmin && (
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.xs,
            flexWrap: 'wrap',
          }}
        >
          <Chip
            label="Todos"
            selected={!selectedEmployeeId || selectedEmployeeId === 'all'}
            onPress={() => onSelectEmployee('all')}
          />
          {activeEmployees.map((e: any) => (
            <Chip
              key={e.id}
              label={e.fullName}
              selected={selectedEmployeeId === e.id}
              onPress={() => onSelectEmployee(e.id)}
            />
          ))}
        </View>
      )}

      <View
        style={{
          flexDirection: isDesktop ? 'row' : 'column',
          gap: spacing.gutter,
          flexWrap: 'wrap',
        }}
      >
        <View style={{ flex: isDesktop ? 1 : undefined, minWidth: 220 }}>
          <KpiCard
            label="OS no período"
            value={String(stats.ordersCount).padStart(2, '0')}
            icon="assignment"
            iconBg={colors['info-container']}
            iconColor={colors['on-info-container']}
            caption={selectedEmployeeId === 'all' ? 'Todos funcionários' : stats.emp?.fullName ?? '—'}
          />
        </View>
        <View style={{ flex: isDesktop ? 1 : undefined, minWidth: 220 }}>
          <KpiCard
            label="Faturamento"
            value={formatCurrency(stats.revenue)}
            icon="trending_up"
            iconBg={colors['primary-container']}
            iconColor={colors['on-primary-container']}
            caption={`${stats.finished} OS finalizadas`}
          />
        </View>
        <View style={{ flex: isDesktop ? 1 : undefined, minWidth: 220 }}>
          <KpiCard
            label="Ticket médio"
            value={formatCurrency(stats.ticket)}
            icon="receipt_long"
            iconBg={colors['success-container']}
            iconColor={colors['on-success-container']}
            caption="Faturamento / OS finalizadas"
          />
        </View>
        <View style={{ flex: isDesktop ? 1 : undefined, minWidth: 220 }}>
          <KpiCard
            label="Tempo médio"
            value={`${stats.avgHours}h`}
            icon="schedule"
            iconBg={colors['secondary-fixed']}
            iconColor={colors['on-secondary-fixed']}
            caption="Da abertura à conclusão"
          />
        </View>
      </View>

      <EmployeesChart
        employees={employees}
        orders={orders} // Use all orders to allow historic chart context even if filtered range is small
        filteredEmployeeId={selectedEmployeeId}
        colors={colors}
        winWidth={winWidth}
      />
    </View>
  );
}

function EmployeesChart({ employees, orders, filteredEmployeeId, colors, winWidth }: any) {
  const buckets = useMemo(() => lastMonthsBuckets(6), []);
  const chartData = useMemo(() => {
    return buckets.map((b) => {
      const revenue = orders
        .filter((o: any) => {
          if (o.status !== 'finished') return false;
          if (filteredEmployeeId && filteredEmployeeId !== 'all' && o.technicianId !== filteredEmployeeId) return false;
          const d = new Date(o.createdAt);
          return d.getFullYear() === b.year && d.getMonth() === b.month;
        })
        .reduce((sum: number, o: any) => sum + o.total, 0);
      return { ...b, revenue };
    });
  }, [orders, buckets, filteredEmployeeId]);
  const maxRevenue = Math.max(1, ...chartData.map((b) => b.revenue));
  const CHART_H = 200;
  const chartWidth = Math.min(680, Math.max(320, winWidth - spacing['margin-mobile'] * 2 - 40));
  const PAD = 40;
  const plotW = chartWidth - PAD * 2;
  const plotH = CHART_H - PAD - 20;
  const gap = plotW / chartData.length;
  const barW = Math.max(10, Math.min(40, gap * 0.5));

  return (
    <GlassCard style={{ padding: spacing.lg }}>
      <AppText variant="h4" style={{ color: colors.primary, marginBottom: spacing.md }}>
        Faturamento — últimos 6 meses
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={chartWidth} height={CHART_H}>
          {[0, 0.5, 1].map((r) => {
            const y = PAD + plotH * (1 - r);
            return (
              <SvgLine
                key={r}
                x1={PAD}
                y1={y}
                x2={PAD + plotW}
                y2={y}
                stroke={colors['outline-variant']}
                strokeWidth={1}
              />
            );
          })}
          {chartData.map((b, i) => {
            const cx = PAD + i * gap + gap / 2;
            const h = (b.revenue / maxRevenue) * plotH;
            return (
              <G key={b.key}>
                <Rect
                  x={cx - barW / 2}
                  y={PAD + plotH - h}
                  width={barW}
                  height={h}
                  rx={3}
                  fill={colors.primary}
                />
                <SvgText
                  x={cx}
                  y={CHART_H - 5}
                  fontSize={10}
                  fill={colors['on-surface-variant']}
                  textAnchor="middle"
                >
                  {b.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </GlassCard>
  );
}
