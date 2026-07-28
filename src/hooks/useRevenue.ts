import { useMemo } from 'react';
import { getRevenueChartData, getPeriodRevenue, DailyRevenue } from '../utils/revenueAggregator';
import { useAppStore } from '../stores/useAppStore';

export function useRevenue(period: 'today' | 'week' | 'month' | 'custom', customStart?: string, customEnd?: string) {
  const orders = useAppStore((s) => s.orders);

  const periodRevenue = useMemo(
    () => getPeriodRevenue(orders, period as any, customStart, customEnd),
    [period, orders, customStart, customEnd]
  );

  const chartData = useMemo(
    () => getRevenueChartData(orders, period === 'month' ? 30 : period === 'week' ? 7 : 1),
    [period, orders]
  );

  return { periodRevenue, chartData };
}
