import type { Order } from '../db/schema';

export interface DailyRevenue {
  label: string;
  today: number;
  yesterday: number;
  date: string;
}

export function getRevenueChartData(orders: Order[], days: number = 1): DailyRevenue[] {
  const now = new Date();
  const result: DailyRevenue[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevStr = prevDate.toISOString().slice(0, 10);

    const todayTotal = orders
      .filter((o) => o.createdAt.slice(0, 10) === dateStr)
      .reduce((sum, o) => sum + o.total, 0);
    const yesterdayTotal = orders
      .filter((o) => o.createdAt.slice(0, 10) === prevStr)
      .reduce((sum, o) => sum + o.total, 0);

    const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    result.push({
      label: daysMap[date.getDay()],
      today: todayTotal,
      yesterday: yesterdayTotal,
      date: dateStr,
    });
  }
  return result.reverse();
}

export function getPeriodRevenue(
  orders: Order[],
  period: 'today' | 'week' | 'month' | 'custom',
  customStart?: string,
  customEnd?: string,
): number {
  const now = new Date();
  return orders
    .filter((o) => {
      const d = new Date(o.createdAt);
      if (period === 'today') return d.toDateString() === now.toDateString();
      if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      if (period === 'custom' && customStart && customEnd) {
        const parse = (s: string) => {
          const parts = s.split('/');
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        };
        const start = parse(customStart);
        const end = parse(customEnd);
        end.setDate(end.getDate() + 1);
        return d >= start && d < end;
      }
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + o.total, 0);
}
