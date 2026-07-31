import { useState, useMemo } from 'react';
import { View, TextInput, FlatList, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  useThemeColors,
  useThemeShadows,
  useThemeBorderRadius,
  spacing,
  useBreakpoints,
} from '../../src/theme';
import { Icon } from '../../src/components/Icon';
import { PartRow, INVENTORY_COLS } from '../../src/components/PartRow';
import { useAppStore } from '../../src/stores/useAppStore';
import { EmptyState } from '../../src/components/EmptyState';
import { FabMenu } from '../../src/components/FabMenu';
import { AppText, Button, Chip } from '../../src/ui';
import { useDebounce } from '../../src/utils/useDebounce';
import { StickyToolbar } from '../../src/components/StickyToolbar';
import { ListItemCard } from '../../src/components/ListItemCard';
import { useDialog } from '../../src/components/DialogContext';
import { usePagination } from '../../src/hooks/usePagination';
import { KpiCard } from '../../src/components/KpiCard';
import { formatCurrency } from '../../src/utils/currency';
import type { PartCategory } from '../../src/db/schema';

const isWeb = Platform.OS === 'web';
const PAGE_SIZE = 20;

type SortKey = 'name-asc' | 'name-desc' | 'stock-asc' | 'stock-desc';
const SORT_LABEL: Record<SortKey, string> = {
  'name-asc': 'A-Z',
  'name-desc': 'Z-A',
  'stock-asc': 'Menor Estoque',
  'stock-desc': 'Maior Estoque',
};

export default function InventoryScreen() {
  const colors = useThemeColors();
  const shadows = useThemeShadows();
  const br = useThemeBorderRadius();
  const { isDesktop } = useBreakpoints();
  const parts = useAppStore((s) => s.parts);
  const updatePartStock = useAppStore((s) => s.updatePartStock);
  const { showAlert } = useDialog();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState<PartCategory | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortKey>('name-asc');
  const [sortOpen, setSortOpen] = useState(false);
  const [pendingAdjustments, setPendingAdjustments] = useState<Record<string, number>>({});
  const [savingBatch, setSavingBatch] = useState(false);

  const kpis = useMemo(() => {
    const totalItems = parts.length;
    const totalValue = parts.reduce((sum, p) => sum + p.sellPrice * Math.max(0, p.currentStock), 0);
    const lowStock = parts.filter((p) => p.currentStock < p.minStock).length;
    return { totalItems, totalValue, lowStock };
  }, [parts]);

  const filteredParts = useMemo(() => {
    let list = parts;
    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.category === categoryFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortOption) {
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'stock-asc':
          return a.currentStock - b.currentStock;
        case 'stock-desc':
          return b.currentStock - a.currentStock;
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [parts, categoryFilter, debouncedSearch, sortOption]);

  const {
    page,
    totalPages,
    currentItems,
    next,
    prev,
    hasNext,
    hasPrev,
    totalItems,
    setPage,
  } = usePagination(filteredParts, PAGE_SIZE);

  const pendingCount = Object.values(pendingAdjustments).filter((d) => d !== 0).length;
  const hasBatchChanges = pendingCount > 0;

  const handleAdjust = (partId: string, newDelta: number) => {
    setPendingAdjustments((prev) => {
      const next = { ...prev };
      if (newDelta === 0) {
        delete next[partId];
      } else {
        next[partId] = newDelta;
      }
      return next;
    });
  };

  const handleSaveBatch = async () => {
    setSavingBatch(true);
    try {
      for (const [partId, delta] of Object.entries(pendingAdjustments)) {
        if (delta === 0) continue;
        const part = parts.find((p) => p.id === partId);
        if (!part) continue;
        const newQty = Math.max(0, part.currentStock + delta);
        updatePartStock(partId, newQty);
      }
      setPendingAdjustments({});
      showAlert('Estoque atualizado', `${pendingCount} peça(s) tiveram seu estoque ajustado.`);
    } catch (e) {
      showAlert('Erro', 'Não foi possível salvar todos os ajustes.');
    } finally {
      setSavingBatch(false);
    }
  };

  const handleDiscardBatch = () => setPendingAdjustments({});

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={currentItems}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing['margin-mobile'], paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            {/* Cabecalho */}
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
                  Estoque de Peças
                </AppText>
                <AppText variant="bodySmall" color="text-secondary">
                  {kpis.totalItems} iten(s) em estoque
                </AppText>
              </View>
              <Button
                variant="primary"
                title={'Nova Peça'}
                icon="add"
                onPress={() => router.push('/inventory/new-part')}
              />
            </View>

            {/* KPIs */}
            <View
              style={{
                flexDirection: isDesktop ? 'row' : 'column',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <KpiCard
                  label="Valor em Estoque"
                  value={formatCurrency(kpis.totalValue)}
                  icon="inventory_2"
                  iconBg={colors['primary-container']}
                  iconColor={colors['on-primary-container']}
                />
              </View>
              <View style={{ flex: 1 }}>
                <KpiCard
                  label="Estoque Baixo"
                  value={String(kpis.lowStock)}
                  icon="warning_amber"
                  iconBg={colors['error-container']}
                  iconColor={colors['on-error-container']}
                />
              </View>
            </View>

            {/* Toolbar: Search + Sort + Categorias */}
            <StickyToolbar>
              <View
                style={{
                  flexDirection: 'row',
                  gap: spacing.sm,
                  flexWrap: 'wrap',
                  marginBottom: spacing.xs,
                }}
              >
                {/* Search */}
                <View
                  style={[
                    {
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors['surface-container-lowest'],
                      borderWidth: 1,
                      borderColor: colors['outline-variant'],
                      borderRadius: br.field,
                      paddingHorizontal: spacing.md,
                      minWidth: 220,
                    },
                    shadows.row,
                  ]}
                >
                  <Icon name="search" size={20} color={colors['on-surface-variant']} />
                  <TextInput
                    style={[
                      { flex: 1, height: 48, color: colors['on-surface'], paddingLeft: spacing.sm },
                      isWeb && ({ outlineStyle: 'none', outlineWidth: 0 } as any),
                    ]}
                    placeholder={'Ex: Filtro por nome, marca ou SKU'}
                    placeholderTextColor={colors.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                      <Icon name="close" size={20} color={colors['on-surface-variant']} />
                    </Pressable>
                  )}
                </View>

                {/* Sort */}
                <View style={{ position: 'relative' }}>
                  <Pressable
                    onPress={() => setSortOpen((v) => !v)}
                    style={[
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                        paddingHorizontal: spacing.md,
                        height: 50,
                        borderWidth: 1,
                        borderColor: colors['outline-variant'],
                        borderRadius: br.field,
                        backgroundColor: colors['surface-container-lowest'],
                      },
                      shadows.row,
                    ]}
                  >
                    <Icon name="sort" size={20} color={colors['on-surface-variant']} />
                    <AppText variant="label">{SORT_LABEL[sortOption]}</AppText>
                    <Icon name={sortOpen ? 'expand_less' : 'expand_more'} size={18} color={colors['on-surface-variant']} />
                  </Pressable>
                  {sortOpen && (
                    <View
                      style={[
                        {
                          position: 'absolute',
                          top: 54,
                          right: 0,
                          minWidth: 180,
                          backgroundColor: colors.surface,
                          borderRadius: br.lg,
                          borderWidth: 1,
                          borderColor: colors['outline-variant'],
                          paddingVertical: spacing.xs,
                          zIndex: 20,
                        },
                        shadows.lg,
                      ]}
                    >
                      {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                        <Pressable
                          key={k}
                          onPress={() => {
                            setSortOption(k);
                            setSortOpen(false);
                          }}
                          style={({ pressed }) => [
                            {
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm,
                              backgroundColor: pressed ? colors['surface-container'] : 'transparent',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: spacing.sm,
                            },
                          ]}
                        >
                          {sortOption === k && <Icon name="check" size={16} color={colors.primary} />}
                          <AppText
                            variant="label"
                            style={{
                              color: sortOption === k ? colors.primary : colors['on-surface'],
                              marginLeft: sortOption === k ? 0 : 24,
                            }}
                          >
                            {SORT_LABEL[k]}
                          </AppText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Categorias */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: spacing.xs,
                  flexWrap: 'wrap',
                  marginBottom: spacing.xs,
                }}
              >
                {(['all', 'carro', 'moto'] as const).map((cat) => (
                  <Chip
                    key={cat}
                    label={cat === 'all' ? 'Todas categorias' : cat === 'carro' ? 'Carros' : 'Motos'}
                    selected={categoryFilter === cat}
                    onPress={() => setCategoryFilter(cat)}
                  />
                ))}
              </View>
            </StickyToolbar>

            {/* Batch actions alert */}
            {hasBatchChanges && (
              <View
                style={{
                  flexDirection: isDesktop ? 'row' : 'column',
                  alignItems: isDesktop ? 'center' : 'stretch',
                  justifyContent: 'space-between',
                  backgroundColor: colors['warning-container'],
                  padding: spacing.md,
                  borderRadius: br.lg,
                  marginBottom: spacing.md,
                  gap: spacing.sm,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Icon name="info" size={20} color={colors['on-warning-container']} />
                  <AppText variant="label" style={{ color: colors['on-warning-container'] }}>
                    Ajustes de estoque pendentes
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.xs, width: isDesktop ? undefined : '100%' }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Descartar"
                      fullWidth
                      onPress={handleDiscardBatch}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      title="Salvar Ajustes"
                      icon="check"
                      fullWidth
                      loading={savingBatch}
                      onPress={handleSaveBatch}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Header da tabela (Desktop) */}
            {isDesktop && currentItems.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors['surface-container-low'],
                  borderRadius: br.field,
                  alignItems: 'center',
                  marginBottom: spacing.xs,
                }}
              >
                <AppText variant="labelSmall" color="text-secondary" style={{ ...INVENTORY_COLS.name, textTransform: 'uppercase' }}>
                  Nome da Peça
                </AppText>
                <AppText variant="labelSmall" color="text-secondary" style={{ ...INVENTORY_COLS.category, textTransform: 'uppercase' }}>
                  Categoria
                </AppText>
                <AppText variant="labelSmall" color="text-secondary" style={{ ...INVENTORY_COLS.brand, textTransform: 'uppercase' }}>
                  Marca
                </AppText>
                <AppText variant="labelSmall" color="text-secondary" style={{ ...INVENTORY_COLS.stock, textAlign: 'right', textTransform: 'uppercase' }}>
                  Estoque
                </AppText>
                <AppText variant="labelSmall" color="text-secondary" style={{ width: INVENTORY_COLS.adjust.width, textAlign: 'right', textTransform: 'uppercase' }}>
                  Ajuste
                </AppText>
                <AppText variant="labelSmall" color="text-secondary" style={{ ...INVENTORY_COLS.price, textAlign: 'right', textTransform: 'uppercase' }}>
                  Preço de Venda
                </AppText>
                <View style={{ width: INVENTORY_COLS.action }} />
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={{ marginTop: isDesktop ? 0 : spacing.md }}>
            <EmptyState
              illustration="empty-inventory"
              title="Estoque vazio"
              subtitle="Adicione peças ao estoque para começar a gerenciar."
            />
          </View>
        }
        renderItem={({ item, index: i }) => (
          <ListItemCard
            key={item.id}
            index={i}
            style={{ padding: 0, backgroundColor: 'transparent', borderWidth: 0 }}
          >
            <PartRow
              part={item}
              pendingDelta={pendingAdjustments[item.id]}
              onAdjustStock={handleAdjust}
            />
          </ListItemCard>
        )}
        ListFooterComponent={
          totalPages > 1 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                marginTop: spacing.lg,
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="outline"
                size="sm"
                iconOnly
                icon="chevron_left"
                disabled={page === 1}
                onPress={() => setPage(Math.max(1, page - 1))}
              />
              <AppText variant="labelSmall" color="text-secondary">
                Página {page} de {totalPages} · {filteredParts.length} itens
              </AppText>
              <Button
                variant="outline"
                size="sm"
                iconOnly
                icon="chevron_right"
                disabled={page === totalPages}
                onPress={() => setPage(Math.min(totalPages, page + 1))}
              />
            </View>
          ) : null
        }
      />
      <FabMenu
        actions={[{ icon: 'add_circle', label: 'Nova Peça', onPress: () => router.push('/inventory/new-part') }]}
      />
    </View>
  );
}
