import { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useThemeColors, useThemeBorderRadius, spacing } from '../theme';
import { AppText } from './Text';
import { Icon } from '../components/Icon';

interface CalendarProps {
  /** ISO date YYYY-MM-DD (or empty). */
  value: string;
  onChange: (isoDate: string) => void;
  /** Optional lower bound (inclusive). ISO YYYY-MM-DD. */
  minDate?: string;
  /** Optional upper bound (inclusive). ISO YYYY-MM-DD. */
  maxDate?: string;
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function todayISO(): string {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Pure-JS monthly calendar with month navigation, single date selection,
 * and min/max bounds. No external calendar dependency; uses only Views + Pressables.
 */
export function Calendar({ value, onChange, minDate, maxDate }: CalendarProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();

  // Anchor the visible month either on `value` (if valid) or on today.
  const anchor = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [value]);

  const [year, setYear] = useState(anchor.year);
  const [month, setMonth] = useState(anchor.month); // 0..11

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const cells = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [firstDayOfWeek, daysInMonth]);

  const today = todayISO();

  const isDisabled = (d: number) => {
    const iso = toISO(year, month, d);
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  };

  const goPrev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: br.xl,
        borderWidth: 1,
        borderColor: colors['outline-variant'],
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={goPrev}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: br.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? colors['surface-container'] : 'transparent',
          })}
        >
          <Icon name="chevron_left" size={20} color={colors['on-surface']} />
        </Pressable>
        <AppText variant="label" style={{ color: colors.primary, fontWeight: '700' }}>
          {MONTH_NAMES[month]} {year}
        </AppText>
        <Pressable
          onPress={goNext}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: br.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? colors['surface-container'] : 'transparent',
          })}
        >
          <Icon name="chevron_right" size={20} color={colors['on-surface']} />
        </Pressable>
      </View>

      {/* Weekday header */}
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAY_LABELS.map((w, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
            <AppText variant="labelSmall" color="text-tertiary">
              {w}
            </AppText>
          </View>
        ))}
      </View>

      {/* Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          }
          const iso = toISO(year, month, day);
          const isSelected = value === iso;
          const isToday = today === iso;
          const disabled = isDisabled(day);
          return (
            <Pressable
              key={iso}
              onPress={() => {
                if (!disabled) onChange(iso);
              }}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`Dia ${day}`}
              accessibilityState={{ selected: isSelected, disabled }}
              style={({ pressed }) => ({
                width: `${100 / 7}%`,
                aspectRatio: 1,
                padding: 2,
                opacity: disabled ? 0.3 : 1,
              })}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: br.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected
                    ? colors.primary
                    : isToday
                    ? colors['primary-container']
                    : 'transparent',
                  borderWidth: isToday && !isSelected ? 1 : 0,
                  borderColor: colors.primary,
                }}
              >
                <AppText
                  variant="bodySmall"
                  style={{
                    color: isSelected
                      ? colors['on-primary']
                      : isToday
                      ? colors['on-primary-container']
                      : colors['on-surface'],
                    fontWeight: isSelected || isToday ? '700' : '500',
                  }}
                >
                  {day}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
