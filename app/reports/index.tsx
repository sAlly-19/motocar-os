import { useMemo, useState } from 'react';
import { View, ScrollView, useWindowDimensions, Share, Platform } from 'react-native';
import Svg, { Rect, Line as SvgLine, Text as SvgText, G } from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing, useBreakpoints } from '../../src/theme';
import { AppText, Button, Chip } from '../../src/ui';
import { AppShell } from '../../src/components/AppShell';
import { GlassCard } from '../../src/components/GlassCard';
import { KpiCard } from '../../src/components/KpiCard';
import { DateField } from '../../src/components/DateField';
import { EmptyState } from '../../src/components/EmptyState';
import { Icon } from '../../src/components/Icon';
import { useDialog } from '../../src/components/DialogContext';
import { useAppStore } from '../../src/stores/useAppStore';
import { useTeamStore } from '../../src/stores/useTeamStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { formatCurrency } from '../../src/utils/currency';
import { EmployeesReport } from '../../src/components/reports/EmployeesReport';
import { OrdersReport } from '../../src/components/reports/OrdersReport';
import { FinancialReport } from '../../src/components/reports/FinancialReport';
import { InventoryReport } from '../../src/components/reports/InventoryReport';
import { CustomersReport } from '../../src/components/reports/CustomersReport';
import {
  periodRange,
  PERIOD_LABEL,
  lastMonthsBuckets,
  isInRange,
  type PeriodKey,
} from '../../src/utils/dateRange';

type ReportTab = 'employees' | 'orders' | 'financial' | 'inventory' | 'customers';

const TAB_LABEL: Record<ReportTab, string> = {
  employees: 'Funcionários',
  orders: 'Ordens',
  financial: 'Financeiro',
  inventory: 'Estoque',
  customers: 'Clientes',
};

const TAB_ICON: Record<ReportTab, string> = {
  employees: 'engineering',
  orders: 'assignment',
  financial: 'trending_up',
  inventory: 'inventory_2',
  customers: 'people',
};

export default function ReportsScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const { isDesktop } = useBreakpoints();
  const { width: winWidth } = useWindowDimensions();
  const { showAlert } = useDialog();

  const { orders, parts, customers, vehicles } = useAppStore(
    useShallow((s) => ({
      orders: s.orders,
      parts: s.parts,
      customers: s.customers,
      vehicles: s.vehicles,
    }))
  );
  const employees = useTeamStore((s) => s.employees);

  const role = useAuthStore((s) => s.role);
  const authEmployeeId = useAuthStore((s) => s.employeeId);
  const isAdmin = role === 'admin';

  const [tab, setTab] = useState<ReportTab>('orders');
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  const { start, end } = useMemo(
    () => periodRange(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const inRangeOrders = useMemo(
    () => orders.filter((o) => isInRange(o.createdAt, start, end)),
    [orders, start, end],
  );

  // Se funcionário, força filtro pelo próprio id.
  const activeEmployeeId = isAdmin ? employeeFilter : authEmployeeId ?? '';

  const handleExport = () => {
    try {
      const headers = "Data,OS,ClienteID,VeiculoID,Status,Total\n";
      const rows = inRangeOrders.map((o) => `${new Date(o.createdAt).toLocaleDateString('pt-BR')},${o.number},${o.customerId},${o.vehicleId},${o.status},${o.total.toFixed(2)}`).join("\n");
      const csvContent = headers + rows;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `relatorio_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        Share.share({
          message: csvContent,
          title: 'Relatório CSV'
        });
      }
    } catch (e) {
      showAlert('Erro', 'Não foi possível exportar os dados.');
    }
  };

  return (
    <AppShell>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing['margin-mobile'], paddingBottom: 120 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: spacing.sm,
            flexWrap: 'wrap',
            marginBottom: spacing.lg,
          }}
        >
          <View style={{ flex: 1, minWidth: 220 }}>
            <AppText variant="h2" style={{ color: colors.primary }}>
              Relatórios
            </AppText>
            <AppText variant="bodySmall" color="text-secondary">
              Análise de desempenho e operação da oficina
            </AppText>
          </View>
          <Button
            variant="outline"
            icon="file_download"
            title="Exportar"
            onPress={handleExport}
          />
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.xs,
            flexWrap: 'wrap',
            marginBottom: spacing.md,
          }}
        >
          {(Object.keys(TAB_LABEL) as ReportTab[]).map((k) => (
            <Chip
              key={k}
              label={TAB_LABEL[k]}
              leftIcon={TAB_ICON[k]}
              selected={tab === k}
              onPress={() => setTab(k)}
            />
          ))}
        </View>

        {/* Filtros de período (todas as abas) */}
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.xs,
            flexWrap: 'wrap',
            marginBottom: spacing.md,
          }}
        >
          {(Object.keys(PERIOD_LABEL) as PeriodKey[]).map((k) => (
            <Chip
              key={k}
              label={PERIOD_LABEL[k]}
              selected={period === k}
              onPress={() => setPeriod(k)}
            />
          ))}
        </View>

        {period === 'custom' && (
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              flexWrap: 'wrap',
              marginBottom: spacing.md,
            }}
          >
            <View style={{ flex: 1, minWidth: 200 }}>
              <DateField
                label="Data início"
                value={customStart}
                onChange={setCustomStart}
                maxDate={customEnd || undefined}
              />
            </View>
            <View style={{ flex: 1, minWidth: 200 }}>
              <DateField
                label="Data fim"
                value={customEnd}
                onChange={setCustomEnd}
                minDate={customStart || undefined}
              />
            </View>
          </View>
        )}

        {tab === 'employees' && (
          <EmployeesReport
            orders={orders}
            inRangeOrders={inRangeOrders}
            employees={employees}
            isAdmin={isAdmin}
            selectedEmployeeId={activeEmployeeId}
            onSelectEmployee={setEmployeeFilter}
            colors={colors}
            br={br}
            shadows={shadows}
            isDesktop={isDesktop}
            winWidth={winWidth}
          />
        )}

        {tab === 'orders' && (
          <OrdersReport
            allOrders={orders}
            inRangeOrders={inRangeOrders}
            colors={colors}
            isDesktop={isDesktop}
          />
        )}

        {tab === 'financial' && (
          <FinancialReport
            orders={orders}
            inRangeOrders={inRangeOrders}
            colors={colors}
            isDesktop={isDesktop}
            winWidth={winWidth}
            periodLabel={PERIOD_LABEL[period]}
          />
        )}

        {tab === 'inventory' && (
          <InventoryReport
            parts={parts}
            orders={inRangeOrders}
            colors={colors}
            br={br}
            isDesktop={isDesktop}
          />
        )}

        {tab === 'customers' && (
          <CustomersReport
            customers={customers}
            vehicles={vehicles}
            orders={orders}
            inRangeOrders={inRangeOrders}
            colors={colors}
            br={br}
            isDesktop={isDesktop}
          />
        )}
      </ScrollView>
    </AppShell>
  );
}
