import { useState } from 'react';
import { Pressable, View, ScrollView } from 'react-native';
import { useThemeColors, useThemeBorderRadius, spacing } from '../theme';
import { AppText } from './Text';
import { Icon } from '../components/Icon';

export interface SelectOption {
  label: string;
  value: string;
  /** Optional trailing hint (e.g. price, sku) shown on the right of the label. */
  hint?: string;
  /** Optional leading icon (Material Symbols name). */
  icon?: string;
}

export interface SelectCreateOption {
  label: string;
  icon?: string;
  onPress: () => void;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  /**
   * Optional highlighted first row that triggers `onPress` instead of `onSelect`.
   * Useful for "+ Register new..." style flows.
   */
  createOption?: SelectCreateOption;
  /** Shown inside the dropdown when there are no `options`. */
  emptyLabel?: string;
  /** Visual error state (border becomes error). */
  error?: string;
  disabled?: boolean;
}

export function Select({
  label,
  options,
  selectedValue,
  onSelect,
  placeholder,
  createOption,
  emptyLabel,
  error,
  disabled,
}: SelectProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === selectedValue);

  return (
    <View style={{ gap: spacing.xs + 2 }}>
      {label && (
        <AppText variant="labelSmall" color="text-secondary" transform="uppercase">
          {label}
        </AppText>
      )}
      <Pressable
        onPress={() => !disabled && setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder || 'Selecionar'}
        accessibilityState={{ expanded: open, disabled: !!disabled }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors['surface-container-low'],
          borderRadius: br.field,
          borderWidth: 1,
          borderColor: error ? colors.error : colors['outline-variant'],
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 4,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 }}>
          {selected?.icon && <Icon name={selected.icon} size={18} color={colors['on-surface-variant']} />}
          <AppText
            variant="bodySmall"
            style={{ color: selected ? colors['on-surface'] : colors.placeholder, flex: 1 }}
            numberOfLines={1}
          >
            {selected ? selected.label : placeholder || 'Selecione...'}
          </AppText>
          {selected?.hint && (
            <AppText variant="labelSmall" color="text-tertiary" numberOfLines={1}>
              {selected.hint}
            </AppText>
          )}
        </View>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={20} color={colors['on-surface']} />
      </Pressable>
      {error && (
        <AppText variant="labelSmall" style={{ color: colors.error }}>
          {error}
        </AppText>
      )}
      {open && (
        <View
          style={{
            backgroundColor: colors['surface-container'],
            borderRadius: br.field,
            borderWidth: 1,
            borderColor: colors['outline-variant'],
            maxHeight: 260,
            overflow: 'hidden',
          }}
        >
          <ScrollView>
            {createOption && (
              <>
                <Pressable
                  onPress={() => {
                    createOption.onPress();
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={createOption.label}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.md,
                    backgroundColor: pressed ? colors['primary-container'] : 'transparent',
                  })}
                >
                  <Icon
                    name={createOption.icon || 'add_circle'}
                    size={20}
                    color={colors.primary}
                  />
                  <AppText
                    variant="bodySmall"
                    style={{ color: colors.primary, fontWeight: '600', flex: 1 }}
                  >
                    {createOption.label}
                  </AppText>
                </Pressable>
                <View style={{ height: 1, backgroundColor: colors['outline-variant'] }} />
              </>
            )}
            {options.length === 0 ? (
              <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.lg, alignItems: 'center' }}>
                <AppText variant="bodySmall" color="text-tertiary">
                  {emptyLabel || 'Nenhuma opção disponível'}
                </AppText>
              </View>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === selectedValue;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      onSelect(opt.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.md,
                      backgroundColor: isSelected
                        ? colors['secondary-fixed']
                        : pressed
                        ? colors['surface-container-high']
                        : 'transparent',
                    })}
                  >
                    {opt.icon && (
                      <Icon
                        name={opt.icon}
                        size={18}
                        color={isSelected ? colors['on-secondary-fixed'] : colors['on-surface-variant']}
                      />
                    )}
                    <AppText
                      variant="bodySmall"
                      style={{
                        color: isSelected ? colors['on-secondary-fixed'] : colors['on-surface'],
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {opt.label}
                    </AppText>
                    {opt.hint && (
                      <AppText variant="labelSmall" color="text-tertiary" numberOfLines={1}>
                        {opt.hint}
                      </AppText>
                    )}
                    {isSelected && <Icon name="check" size={18} color={colors.primary} />}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
