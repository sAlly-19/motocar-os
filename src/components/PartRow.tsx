import { View, Pressable, TextInput, Platform, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing } from '../theme';
import { AppText } from '../ui/Text';
import { StatusBadge } from '../ui';
import { Icon } from './Icon';
import { AnimatedPressable } from './AnimatedPressable';
import { formatCurrency } from '../utils/currency';
import type { Part } from '../db/schema';

const isWeb = Platform.OS === 'web';

/**
 * Larguras compartilhadas entre o header da tabela (`app/(tabs)/inventory.tsx`)
 * e as rows do `PartRow` (modo desktop). Alterar aqui reflete nos dois.
 */
export const INVENTORY_COLS = {
  icon: 36,
  action: 40,
  name: { flex: 1.4, minWidth: 140 },
  category: { flex: 0.7, minWidth: 70 },
  brand: { flex: 0.8, minWidth: 80 },
  stock: { flex: 0.7, minWidth: 70 },
  adjust: { flex: 0, width: 120, minWidth: 120 }, // width fixo — mais estreito
  price: { flex: 0.7, minWidth: 80 },
} as const;

interface PartRowProps {
  part: Part;
  t?: (key: string) => string;
  /** Pending stock adjustment (delta) for quick-adjust column. Undefined = no change. */
  pendingDelta?: number;
  /** Called when user increments/decrements the stock via +/-  buttons or input. */
  onAdjustStock?: (partId: string, newDelta: number) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  carro: 'Carro',
  moto: 'Moto',
};

export function PartRow({ part, t, pendingDelta, onAdjustStock }: PartRowProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const stockVariant =
    part.currentStock === 0
      ? 'out-of-stock'
      : part.currentStock < part.minStock
      ? 'low-stock'
      : 'ideal';
  const stockLabel =
    part.currentStock === 0
      ? t?.('inventory.outOfStock') ?? 'Sem Estoque'
      : part.currentStock < part.minStock
      ? t?.('inventory.lowStock') ?? 'Estoque Baixo'
      : t?.('inventory.ideal') ?? 'Ideal';
  const stockColor =
    part.currentStock === 0
      ? colors.error
      : part.currentStock < part.minStock
      ? colors.secondary
      : colors.success;

  const categoryLabel = part.category ? CATEGORY_LABEL[part.category] ?? part.category : '—';
  const brandLabel = part.brand?.trim() || '—';

  const delta = pendingDelta ?? 0;
  const effectiveStock = part.currentStock + delta;

  const openEdit = () => router.push({ pathname: '/inventory/[id]', params: { id: part.id } });

  const baseStyle = [
    {
      borderWidth: 1,
      borderRadius: br.xl,
      padding: spacing.md,
      backgroundColor: colors['surface-container-lowest'],
      borderColor: colors['outline-variant'],
      marginBottom: spacing.xs,
    },
    shadows.sm,
  ] as const;

  const QuickAdjust = ({ compact = false }: { compact?: boolean }) => {
    if (!onAdjustStock) return null;
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          justifyContent: compact ? 'flex-start' : 'flex-end',
        }}
        onStartShouldSetResponder={() => true}
      >
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onAdjustStock(part.id, delta - 1);
          }}
          accessibilityRole="button"
          accessibilityLabel="Diminuir estoque"
          hitSlop={6}
          style={({ pressed }) => ({
            width: 24,
            height: 24,
            borderRadius: br.full,
            backgroundColor: pressed ? colors['surface-container-high'] : colors['surface-container'],
            justifyContent: 'center',
            alignItems: 'center',
          })}
        >
          <Icon name="remove" size={14} color={colors['on-surface']} />
        </Pressable>
        <TextInput
          value={String(effectiveStock)}
          onChangeText={(v) => {
            const n = parseInt(v.replace(/[^0-9-]/g, ''), 10);
            if (!Number.isFinite(n)) return;
            onAdjustStock(part.id, n - part.currentStock);
          }}
          keyboardType="number-pad"
          style={[
            {
              width: 36,
              textAlign: 'center',
              paddingVertical: 2,
              paddingHorizontal: 2,
              borderRadius: br.sm,
              borderWidth: 1,
              borderColor: delta !== 0 ? colors.primary : colors['outline-variant'],
              backgroundColor: colors['surface-container-lowest'],
              color: delta !== 0 ? colors.primary : colors['on-surface'],
              fontWeight: '700',
              fontSize: 12,
            },
            isWeb && ({ outlineStyle: 'none', outlineWidth: 0 } as any),
          ]}
          accessibilityLabel={`Estoque atual ${effectiveStock}`}
        />
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onAdjustStock(part.id, delta + 1);
          }}
          accessibilityRole="button"
          accessibilityLabel="Aumentar estoque"
          hitSlop={6}
          style={({ pressed }) => ({
            width: 24,
            height: 24,
            borderRadius: br.full,
            backgroundColor: pressed ? colors['primary-container'] : colors['surface-container'],
            justifyContent: 'center',
            alignItems: 'center',
          })}
        >
          <Icon name="add" size={14} color={colors.primary} />
        </Pressable>
      </View>
    );
  };

  // MOBILE — stacked card layout
  if (!isDesktop) {
    return (
      <AnimatedPressable
        onPress={openEdit}
        accessibilityRole="button"
        accessibilityLabel={`${part.name}, ${stockLabel}, ${formatCurrency(part.sellPrice)}`}
        style={baseStyle as any}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: br.lg,
              backgroundColor: colors['surface-container'],
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon name="inventory_2" size={18} color={colors['on-surface-variant']} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="body" style={{ color: colors.primary, fontWeight: '600' }} numberOfLines={1}>
              {part.name}
            </AppText>
            <AppText variant="labelSmall" color="text-tertiary">
              {part.sku ? `${part.sku} · ` : ''}
              {categoryLabel} · {brandLabel}
            </AppText>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              openEdit();
            }}
            accessibilityRole="button"
            accessibilityLabel="Editar peça"
            hitSlop={8}
            style={{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}
          >
            <Icon name="edit" size={18} color={colors['on-surface-variant']} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          <StatusBadge variant={stockVariant} label={`${String(effectiveStock).padStart(2, '0')} · ${stockLabel}`} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <AppText variant="body" style={{ color: colors.primary, fontWeight: '700' }}>
              {formatCurrency(part.sellPrice)}
            </AppText>
          </View>
        </View>
        {onAdjustStock && (
          <View
            style={{
              marginTop: spacing.sm,
              paddingTop: spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors['outline-variant'],
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <AppText variant="labelSmall" color="text-secondary">
              Ajuste rápido
            </AppText>
            <QuickAdjust />
          </View>
        )}
      </AnimatedPressable>
    );
  }

  // DESKTOP — table row
  return (
    <AnimatedPressable
      onPress={openEdit}
      accessibilityRole="button"
      accessibilityLabel={`${part.name}, ${stockLabel}, ${formatCurrency(part.sellPrice)}`}
      style={[...baseStyle, { flexDirection: 'row', alignItems: 'center', gap: spacing.sm } as any]}
    >
      <View
        style={{
          width: INVENTORY_COLS.icon,
          height: INVENTORY_COLS.icon,
          borderRadius: br.lg,
          backgroundColor: colors['surface-container'],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon name="inventory_2" size={16} color={colors['on-surface-variant']} />
      </View>
      <View style={{ ...INVENTORY_COLS.name, minWidth: 0 }}>
        <AppText variant="body" style={{ color: colors.primary, fontWeight: '600' }} numberOfLines={1}>
          {part.name}
        </AppText>
        <AppText variant="labelSmall" color="text-tertiary" numberOfLines={1}>
          {part.sku || '—'}
        </AppText>
      </View>
      <View style={{ ...INVENTORY_COLS.category, minWidth: 0 }}>
        <AppText variant="bodySmall" color="text-secondary" numberOfLines={1}>
          {categoryLabel}
        </AppText>
      </View>
      <View style={{ ...INVENTORY_COLS.brand, minWidth: 0 }}>
        <AppText variant="bodySmall" color="text-secondary" numberOfLines={1}>
          {brandLabel}
        </AppText>
      </View>
      <View style={{ ...INVENTORY_COLS.stock, alignItems: 'flex-end' }}>
        <AppText variant="body" style={{ color: stockColor, fontWeight: '700' }}>
          {String(effectiveStock).padStart(2, '0')}
        </AppText>
        <StatusBadge variant={stockVariant} label={stockLabel} />
      </View>
      <View style={{ width: INVENTORY_COLS.adjust.width, alignItems: 'flex-end' }}>
        {onAdjustStock ? <QuickAdjust /> : (
          <AppText variant="bodySmall" color="text-tertiary">—</AppText>
        )}
      </View>
      <View style={{ ...INVENTORY_COLS.price, alignItems: 'flex-end' }}>
        <AppText variant="bodySmall" style={{ color: colors.primary, fontWeight: '600' }} numberOfLines={1}>
          {formatCurrency(part.sellPrice)}
        </AppText>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          openEdit();
        }}
        accessibilityRole="button"
        accessibilityLabel="Editar peça"
        hitSlop={8}
        style={{ width: INVENTORY_COLS.action, height: INVENTORY_COLS.action, justifyContent: 'center', alignItems: 'center' }}
      >
        <Icon name="edit" size={18} color={colors['on-surface-variant']} />
      </Pressable>
    </AnimatedPressable>
  );
}
