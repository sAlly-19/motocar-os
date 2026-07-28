/**
 * Utilities de intervalo de datas para filtros dos relatórios e faturamento.
 * Sem dependências externas — cálculos com Date nativo.
 */

export type PeriodKey = 'day' | 'week' | 'fortnight' | 'month' | 'year' | 'custom';

export const PERIOD_LABEL: Record<PeriodKey, string> = {
  day: 'Dia',
  week: 'Semana',
  fortnight: 'Quinzena',
  month: 'Mês',
  year: 'Ano',
  custom: 'Personalizado',
};

/**
 * Retorna `[start, end]` como objetos Date correspondendo ao período pedido.
 * `custom` requer strings ISO `YYYY-MM-DD` em `customStart` / `customEnd`.
 */
export function periodRange(
  p: PeriodKey,
  customStart?: string,
  customEnd?: string,
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (p) {
    case 'day':
      return { start, end };
    case 'week': {
      const s = new Date(start);
      s.setDate(s.getDate() - 7);
      return { start: s, end };
    }
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
      const s =
        customStart && /^\d{4}-\d{2}-\d{2}$/.test(customStart)
          ? new Date(customStart + 'T00:00:00')
          : start;
      const e =
        customEnd && /^\d{4}-\d{2}-\d{2}$/.test(customEnd)
          ? new Date(customEnd + 'T23:59:59')
          : end;
      return { start: s, end: e };
    }
  }
}

/** Formata Date como ISO `YYYY-MM`. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const MONTH_ABBR = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

/**
 * Gera N últimos meses (retrocedendo a partir de hoje). Cada bucket vem
 * pré-formatado com `key`, `label`, `year`, `month` (0-based).
 */
export function lastMonthsBuckets(n: number): Array<{
  key: string;
  label: string;
  year: number;
  month: number;
}> {
  const now = new Date();
  const out: Array<{ key: string; label: string; year: number; month: number }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: monthKey(d),
      label: `${MONTH_ABBR[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return out;
}

/** Retorna true se o Date está dentro do intervalo [start, end]. */
export function isInRange(iso: string | undefined, start: Date, end: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= start.getTime() && t <= end.getTime();
}
