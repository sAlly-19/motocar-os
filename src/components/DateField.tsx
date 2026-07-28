import { useState } from 'react';
import { View, Pressable, Modal } from 'react-native';
import { useThemeColors, useThemeBorderRadius, spacing } from '../theme';
import { AppText } from '../ui/Text';
import { Icon } from './Icon';
import { Calendar } from '../ui/Calendar';
import { Button } from '../ui';

interface DateFieldProps {
  label?: string;
  /** ISO date YYYY-MM-DD (or empty). */
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  error?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
}

const MONTH_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatBR(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTH_ABBR[m - 1]} ${y}`;
}

/**
 * Composed date field: readonly trigger + modal with <Calendar>.
 * Uses YYYY-MM-DD ISO strings for value.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Selecionar data',
  error,
  minDate,
  maxDate,
  disabled,
}: DateFieldProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const openPicker = () => {
    if (disabled) return;
    setDraft(value);
    setOpen(true);
  };

  const confirm = () => {
    onChange(draft);
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setOpen(false);
  };

  const display = value ? formatBR(value) : '';

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
          {label}
        </AppText>
      )}
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={label || 'Selecionar data'}
        accessibilityState={{ disabled: !!disabled }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors['surface-container-low'],
          borderRadius: br.field,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 4,
          borderWidth: 1,
          borderColor: error ? colors.error : 'transparent',
          minHeight: 48,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Icon name="calendar_today" size={18} color={colors['on-surface-variant']} />
        <AppText
          variant="body"
          style={{
            flex: 1,
            color: display ? colors['on-surface'] : colors.placeholder,
          }}
        >
          {display || placeholder}
        </AppText>
        {value && !disabled && (
          <Pressable
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation?.();
              onChange('');
            }}
            accessibilityRole="button"
            accessibilityLabel="Limpar data"
          >
            <Icon name="close" size={18} color={colors['on-surface-variant']} />
          </Pressable>
        )}
        <Icon name="expand_more" size={18} color={colors['on-surface']} />
      </Pressable>
      {error && (
        <AppText variant="caption" color="error" style={{ marginTop: spacing.xs }}>
          {error}
        </AppText>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
            backgroundColor: colors.overlay,
          }}
        >
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setOpen(false)}
            accessibilityLabel="Fechar seletor de data"
          />
          <View
            style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: colors.surface,
              borderRadius: br.xl,
              padding: spacing.md,
              gap: spacing.md,
            }}
          >
            <Calendar
              value={draft}
              onChange={setDraft}
              minDate={minDate}
              maxDate={maxDate}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" title="Limpar" onPress={clear} />
              <Button variant="outline" size="sm" title="Cancelar" onPress={() => setOpen(false)} />
              <Button
                variant="primary"
                size="sm"
                title="Confirmar"
                icon="check"
                onPress={confirm}
                disabled={!draft}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
