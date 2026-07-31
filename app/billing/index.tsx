import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import Svg, { Rect, Line as SvgLine, Text as SvgText, G } from 'react-native-svg';
import { router } from 'expo-router';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing, useBreakpoints } from '../../src/theme';
import { Icon } from '../../src/components/Icon';
import { GlassCard } from '../../src/components/GlassCard';
import { KpiCard } from '../../src/components/KpiCard';
import { EmptyState } from '../../src/components/EmptyState';
import { AppShell } from '../../src/components/AppShell';
import { ListItemCard } from '../../src/components/ListItemCard';
import { DateField } from '../../src/components/DateField';
import { useAppStore } from '../../src/stores/useAppStore';
import { AppText, Button, Chip } from '../../src/ui';
import { formatCurrency } from '../../src/utils/currency';

type Period = 'day' | 'fortnight' | 'month' | 'year' | 'custom';

const PERIOD_LABEL: Record<Period, string> = {
  day: 'Dia',
  fortnight: 'Quinzena',
  month: 'Mês',
  year: 'Ano',
  custom: 'Personalizado',
};

/** Retorna [start, end] em ISO como string. */
function periodRange(p: Period, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (p) {
    case 'day':
      return { start, end };
    case 'fortnight': {
      const s = new Date(start);
      s.setDate(s.getDate() - 14);
      return { start: s, end };
    }
    case 'month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: s, end };
    }
    case 'year': {
      const s = new Date(now.getFullYear(), 0, 1);
      return { start: s, end };
    }
    case 'custom': {
      const s = customStart && /^\d{4}-\d{2}-\d{2}$/.test(customStart)
        ? new Date(customStart + 'T00:00:00')
        : start;
      const e = customEnd && /^\d{4}-\d{2}-\d{2}$/.test(customEnd)
        ? new Date(customEnd + 'T23:59:59')
        : end;
      return { start: s, end: e };
    }
  }
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function BillingScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const { isDesktop } = useBreakpoints();
  const { width: winWidth } = useWindowDimensions();
  const orders = useAppStore((s) => s.orders);

  const [period, setPeriod] = useState<Period>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // OS finalizadas de todo tempo (para o gráfico dos últimos 6 meses).
  const finishedAll = useMemo(() => orders.filter((o) => o.status === 'finished'), [orders]);

  // Filtro por período.
  const { start, end } = useMemo(
    () => periodRange(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const periodFinished = useMemo(() => {
    const s = start.getTime();
    const e = end.getTime();
    return finishedAll
      .filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= s && t <= e;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [finishedAll, start, end]);

  const totalBilled = useMemo(
    () => periodFinished.reduce((sum, o) => sum + o.total, 0),
    [periodFinished],
  );

  // Dados do gráfico: últimos 6 meses.
  const chartData = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; count: number; total: number; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: monthKey(d),
        label: `${MONTH_ABBR[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
        count: 0,
        total: 0,
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }
    for (const o of finishedAll) {
      const od = new Date(o.createdAt);
      const key = monthKey(od);
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) {
        bucket.count += 1;
        bucket.total += o.total;
      }
    }
    return buckets;
  }, [finishedAll]);

  const maxCount = Math.max(1, ...chartData.map((b) => b.count));
  const maxTotal = Math.max(1, ...chartData.map((b) => b.total));

  // Dimensões do gráfico
  const CHART_H = 220;
  const chartWidth = Math.min(680, Math.max(320, winWidth - spacing['margin-mobile'] * 2 - 40));
  const CHART_PAD_L = 40;
  const CHART_PAD_R = 40;
  const CHART_PAD_T = 20;
  const CHART_PAD_B = 40;
  const plotW = chartWidth - CHART_PAD_L - CHART_PAD_R;
  const plotH = CHART_H - CHART_PAD_T - CHART_PAD_B;
  const groupWidth = plotW / chartData.length;
  const barWidth = Math.max(6, Math.min(24, groupWidth / 3));
  const barGap = 4;

  return (
    <>
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
            marginBottom: spacing.lg,
            flexWrap: 'wrap',
            gap: spacing.sm,
          }}
        >
          <View style={{ flex: 1, minWidth: 200 }}>
            <AppText variant="h2" style={{ color: colors.primary }}>
              Faturamento
            </AppText>
            <AppText variant="bodySmall" color="text-secondary">
              Análise financeira das ordens finalizadas
            </AppText>
          </View>
        </View>

        {/* Filtros de período */}
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            flexWrap: 'wrap',
            marginBottom: spacing.md,
          }}
        >
          {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
            <Chip
              key={p}
              label={PERIOD_LABEL[p]}
              selected={period === p}
              onPress={() => setPeriod(p)}
            />
          ))}
        </View>

        {period === 'custom' && (
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              marginBottom: spacing.md,
              flexWrap: 'wrap',
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

        {/* KPIs */}
        <View
          style={{
            flexDirection: isDesktop ? 'row' : 'column',
            marginBottom: spacing.gutter,
          }}
        >
          <View
            style={{
              flex: isDesktop ? 1 : undefined,
              marginRight: isDesktop ? spacing.gutter : 0,
              marginBottom: !isDesktop ? spacing.gutter : 0,
            }}
          >
            <KpiCard
              label="OS Faturadas"
              value={String(periodFinished.length).padStart(2, '0')}
              icon="receipt_long"
              iconBg={colors['success-container']}
              iconColor={colors['on-success-container']}
              caption={PERIOD_LABEL[period]}
            />
          </View>
          <View style={{ flex: isDesktop ? 1 : undefined }}>
            <KpiCard
              label="Valor Faturado"
              value={formatCurrency(totalBilled)}
              icon="trending_up"
              iconBg={colors['primary-container']}
              iconColor={colors['on-primary-container']}
              caption={PERIOD_LABEL[period]}
            />
          </View>
        </View>

        {/* Gráfico 6 meses */}
        <GlassCard style={{ padding: spacing.lg, marginBottom: spacing.gutter }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
            }}
          >
            <AppText variant="h4" style={{ color: colors.primary }}>
              Últimos 6 meses
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.primary }} />
                <AppText variant="labelSmall" color="text-secondary">
                  Valor (R$)
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.secondary }} />
                <AppText variant="labelSmall" color="text-secondary">
                  Qtd OS
                </AppText>
              </View>
            </View>
          </View>

          {finishedAll.length === 0 ? (
            <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
              <AppText variant="bodySmall" color="text-tertiary">
                Sem ordens finalizadas nos últimos 6 meses.
              </AppText>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Svg width={chartWidth} height={CHART_H}>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((r) => {
                  const y = CHART_PAD_T + plotH * (1 - r);
                  return (
                    <SvgLine
                      key={r}
                      x1={CHART_PAD_L}
                      y1={y}
                      x2={CHART_PAD_L + plotW}
                      y2={y}
                      stroke={colors['outline-variant']}
                      strokeWidth={1}
                    />
                  );
                })}

                {/* Bars */}
                {chartData.map((bucket, i) => {
                  const groupX = CHART_PAD_L + i * groupWidth + groupWidth / 2;
                  const valueBarH = (bucket.total / maxTotal) * plotH;
                  const countBarH = (bucket.count / maxCount) * plotH;
                  const valueX = groupX - barWidth - barGap / 2;
                  const countX = groupX + barGap / 2;
                  return (
                    <G key={bucket.key}>
                      <Rect
                        x={valueX}
                        y={CHART_PAD_T + plotH - valueBarH}
                        width={barWidth}
                        height={valueBarH}
                        rx={3}
                        fill={colors.primary}
                      />
                      <Rect
                        x={countX}
                        y={CHART_PAD_T + plotH - countBarH}
                        width={barWidth}
                        height={countBarH}
                        rx={3}
                        fill={colors.secondary}
                        opacity={0.7}
                      />
                      <SvgText
                        x={groupX}
                        y={CHART_H - 20}
                        fontSize={10}
                        fill={colors['on-surface-variant']}
                        textAnchor="middle"
                      >
                        {bucket.label}
                      </SvgText>
                      {bucket.count > 0 && (
                        <SvgText
                          x={countX + barWidth / 2}
                          y={CHART_PAD_T + plotH - countBarH - 4}
                          fontSize={9}
                          fill={colors['on-surface-variant']}
                          textAnchor="middle"
                        >
                          {String(bucket.count)}
                        </SvgText>
                      )}
                    </G>
                  );
                })}
              </Svg>
            </ScrollView>
          )}
        </GlassCard>

        {/* Lista de OS faturadas do período */}
        <AppText variant="h4" style={{ color: colors.primary, marginBottom: spacing.md }}>
          Ordens do período ({periodFinished.length})
        </AppText>
        {periodFinished.length === 0 ? (
          <EmptyState
            illustration="empty-quotes"
            title="Nenhuma OS faturada"
            subtitle="Não há ordens finalizadas neste período. Ajuste o filtro acima."
          />
        ) : (
          periodFinished.map((order, i) => (
            <ListItemCard
              key={order.id}
              index={i}
              onPress={() => router.push({ pathname: '/ticket/[id]', params: { id: order.id } })}
              accessibilityRole="button"
              accessibilityLabel={`OS ${order.number}, ${formatCurrency(order.total)}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: br.full,
                  backgroundColor: colors['success-container'],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon name="receipt" size={18} color={colors['on-success-container']} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body" style={{ color: colors.primary, fontWeight: '600' }}>
                  OS #{order.number}
                </AppText>
                <AppText variant="labelSmall" color="text-secondary">
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </AppText>
              </View>
              <AppText variant="body" style={{ color: colors.primary, fontWeight: '700' }}>
                {formatCurrency(order.total)}
              </AppText>
            </ListItemCard>
          ))
        )}
      </ScrollView>
    </>
  );
}
