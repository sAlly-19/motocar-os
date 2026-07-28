import { useMemo, useState } from 'react';
import { Pressable, View, TextInput, Platform } from 'react-native';
import { useThemeColors, useThemeBorderRadius, spacing } from '../theme';
import { AppText } from './Text';
import { Icon } from '../components/Icon';
import type { SelectCreateOption, SelectOption } from './Select';

interface SearchSelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  createOption?: SelectCreateOption;
  emptyLabel?: string;
  error?: string;
  disabled?: boolean;
  /** Máximo de resultados exibidos na busca. Default 5. */
  maxResults?: number;
  /** Modo de match. Default 'contains'. */
  matchMode?: 'contains' | 'startsWith';
}

const isWeb = Platform.OS === 'web';

/**
 * Select com campo de busca (TextInput) e resultados filtrados limitados.
 * Diferente de Select (que abre uma lista fechada), aqui o usuário digita
 * para reduzir as opções. `createOption` fica sempre visível no rodapé.
 */
export function SearchSelect({
  label,
  placeholder,
  options,
  selectedValue,
  onSelect,
  createOption,
  emptyLabel,
  error,
  disabled,
  maxResults = 5,
  matchMode = 'contains',
}: SearchSelectProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.value === selectedValue);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, maxResults);
    const match = (label: string, hint?: string) => {
      const target = `${label} ${hint ?? ''}`.toLowerCase();
      return matchMode === 'startsWith' ? target.startsWith(q) : target.includes(q);
    };
    return options.filter((o) => match(o.label, o.hint)).slice(0, maxResults);
  }, [options, query, maxResults, matchMode]);

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
        accessibilityLabel={label || placeholder || 'Buscar'}
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
          <Icon
            name={selected?.icon || 'search'}
            size={18}
            color={colors['on-surface-variant']}
          />
          <AppText
            variant="bodySmall"
            style={{ color: selected ? colors['on-surface'] : colors.placeholder, flex: 1 }}
            numberOfLines={1}
          >
            {selected ? selected.label : placeholder || 'Buscar...'}
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
            overflow: 'hidden',
          }}
        >
          {/* Search input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: colors['outline-variant'],
              backgroundColor: colors.surface,
            }}
          >
            <Icon name="search" size={18} color={colors['on-surface-variant']} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Digite para buscar..."
              placeholderTextColor={colors.placeholder}
              autoFocus
              style={[
                { flex: 1, color: colors['on-surface'], paddingVertical: 4 },
                isWeb && ({ outlineStyle: 'none', outlineWidth: 0 } as any),
              ]}
              accessibilityLabel="Buscar"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Limpar">
                <Icon name="close" size={16} color={colors['on-surface-variant']} />
              </Pressable>
            )}
          </View>

          {/* Results */}
          {filtered.length === 0 ? (
            <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.lg, alignItems: 'center' }}>
              <AppText variant="bodySmall" color="text-tertiary">
                {options.length === 0
                  ? emptyLabel || 'Nenhuma opção disponível'
                  : 'Nenhum resultado para a busca'}
              </AppText>
            </View>
          ) : (
            filtered.map((opt) => {
              const isSelected = opt.value === selectedValue;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onSelect(opt.value);
                    setOpen(false);
                    setQuery('');
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

          {/* Rodapé — indicador de limite + create option */}
          {options.length > maxResults && !query && (
            <View
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                backgroundColor: colors['surface-container-low'],
              }}
            >
              <AppText variant="labelSmall" color="text-tertiary" align="center">
                Mostrando {maxResults} de {options.length}. Refine a busca.
              </AppText>
            </View>
          )}
          {createOption && (
            <>
              <View style={{ height: 1, backgroundColor: colors['outline-variant'] }} />
              <Pressable
                onPress={() => {
                  createOption.onPress();
                  setOpen(false);
                  setQuery('');
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
                <Icon name={createOption.icon || 'add_circle'} size={20} color={colors.primary} />
                <AppText variant="bodySmall" style={{ color: colors.primary, fontWeight: '600', flex: 1 }}>
                  {createOption.label}
                </AppText>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}
