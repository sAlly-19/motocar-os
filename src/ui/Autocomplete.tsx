import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useThemeColors, useThemeBorderRadius, spacing } from '../theme';
import { AppText } from './Text';
import { Icon } from '../components/Icon';
import { FormField } from '../components/FormField';
import type { SelectCreateOption } from './Select';

interface AutocompleteProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  error?: string;
  /**
   * When true (default), user can type any value freely (typed text is the value).
   * When false, the user must pick from `suggestions`.
   */
  allowCustom?: boolean;
  /** Maximum number of suggestions to render. Default 6. */
  maxResults?: number;
  /** Optional footer row for "+ register new..." style flows. */
  createOption?: SelectCreateOption;
  /** Case-insensitive substring match (default) vs. prefix-only match. */
  matchMode?: 'contains' | 'startsWith';
}

/**
 * Text input with autocomplete dropdown of string suggestions.
 * Extracted from the ad-hoc pattern that lived inline in vehicles/new.tsx so
 * that other screens (peças, categorias etc.) can reuse it.
 *
 * Not built on Reanimated — plain conditional render + Pressable rows.
 */
export function Autocomplete({
  label,
  value,
  onChangeText,
  suggestions,
  placeholder,
  error,
  allowCustom = true,
  maxResults = 6,
  createOption,
  matchMode = 'contains',
}: AutocompleteProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const uniq = Array.from(new Set(suggestions.filter(Boolean)));
    if (!q) return uniq.slice(0, maxResults);
    return uniq
      .filter((s) =>
        matchMode === 'startsWith'
          ? s.toLowerCase().startsWith(q)
          : s.toLowerCase().includes(q),
      )
      .slice(0, maxResults);
  }, [value, suggestions, maxResults, matchMode]);

  const showDropdown =
    focused && (filtered.length > 0 || !!createOption);

  return (
    <View style={{ position: 'relative' }}>
      <FormField
        label={label ?? ''}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={error}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          // Small delay so pressing a suggestion registers before blur closes the dropdown.
          setTimeout(() => setFocused(false), 120);
        }}
        autoCorrect={false}
        autoComplete="off"
      />
      {showDropdown && (
        <View
          style={{
            position: 'absolute',
            top: label ? 72 : 52,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderRadius: br.field,
            borderWidth: 1,
            borderColor: colors['outline-variant'],
            zIndex: 20,
            paddingVertical: spacing.xs,
            maxHeight: 240,
            overflow: 'hidden',
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {filtered.map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                onChangeText(s);
                setFocused(false);
              }}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: pressed ? colors['surface-container'] : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
              })}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar ${s}`}
            >
              <Icon name="north_west" size={14} color={colors['on-surface-variant']} />
              <AppText variant="bodySmall" style={{ color: colors['on-surface'], flex: 1 }}>
                {s}
              </AppText>
            </Pressable>
          ))}
          {createOption && (
            <>
              {filtered.length > 0 && (
                <View style={{ height: 1, backgroundColor: colors['outline-variant'] }} />
              )}
              <Pressable
                onPress={() => {
                  createOption.onPress();
                  setFocused(false);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: pressed ? colors['primary-container'] : 'transparent',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                })}
                accessibilityRole="button"
                accessibilityLabel={createOption.label}
              >
                <Icon
                  name={createOption.icon || 'add_circle'}
                  size={18}
                  color={colors.primary}
                />
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.primary, fontWeight: '600' }}
                >
                  {createOption.label}
                </AppText>
              </Pressable>
            </>
          )}
        </View>
      )}
      {!allowCustom && value && !suggestions.includes(value) && (
        <AppText variant="labelSmall" style={{ color: colors.error, marginTop: 4 }}>
          Selecione um valor da lista.
        </AppText>
      )}
    </View>
  );
}
