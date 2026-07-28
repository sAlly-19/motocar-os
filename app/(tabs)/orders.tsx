import { useState } from 'react';
import { View, TextInput, ScrollView, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import {
  useThemeColors,
  useThemeShadows,
  useThemeBorderRadius,
  spacing,
  useBreakpoints,
} from '../../src/theme';
import { Icon } from '../../src/components/Icon';
import { OrderCard } from '../../src/components/OrderCard';
import { useAppStore } from '../../src/stores/useAppStore';
import { EmptyState } from '../../src/components/EmptyState';
import { FabMenu } from '../../src/components/FabMenu';
import { AppText, Chip } from '../../src/ui';
import { useTranslation } from 'react-i18next';
import { useOrderFilters, type SortOrder, type OrderFilter } from '../../src/hooks/useOrderFilters';
import { StickyToolbar } from '../../src/components/StickyToolbar';
import { ListItemCard } from '../../src/components/ListItemCard';
import type { OrderStatus } from '../../src/db/schema';

const isWeb = Platform.OS === 'web';

const SORT_LABEL: Record<SortOrder, string> = {
  newest: 'Mais recentes',
  oldest: 'Mais antigos',
  highest: 'Maior valor',
  lowest: 'Menor valor',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: 'Rascunho',
  open: 'Aberta',
  'in-progress': 'Em execução',
  'waiting-approval': 'Aguardando',
  ready: 'Pronta',
  finished: 'Finalizada',
  cancelled: 'Cancelada',
};

const STATUS_ORDER: OrderStatus[] = [
  'open',
  'in-progress',
  'waiting-approval',
  'ready',
  'finished',
  'draft',
  'cancelled',
];

export default function OrdersScreen() {
  const colors = useThemeColors();
  const shadows = useThemeShadows();
  const br = useThemeBorderRadius();
  const { isDesktop } = useBreakpoints();
  const { t } = useTranslation();
  const orders = useAppStore((s) => s.orders);
  const customers = useAppStore((s) => s.customers);
  const {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortOrder,
    setSortOrder,
    filteredOrders,
  } = useOrderFilters();

  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const getCustomerName = (id: string) =>
    customers.find((c) => c.id === id)?.fullName || id.slice(0, 8);

  const countByStatus = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing['margin-mobile'], paddingBottom: 120 }}
      >
        {/* Local page header */}
        <View style={{ marginBottom: spacing.md }}>
          <AppText variant="h2" style={{ color: colors.primary }}>
            Ordens de Servico
          </AppText>
          <AppText variant="bodySmall" color="text-secondary">
            {filteredOrders.length} de {orders.length} ordens
          </AppText>
        </View>

        {/* Sticky toolbar */}
        <StickyToolbar>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
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
                  minWidth: 200,
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
                placeholder={t('orders.search')}
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Buscar ordens de servico"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar busca"
                >
                  <Icon name="close" size={18} color={colors['on-surface-variant']} />
                </Pressable>
              )}
            </View>

            {/* Filter dropdown */}
            <View style={{ position: 'relative' }}>
              <Pressable
                onPress={() => {
                  setFilterOpen((v) => !v);
                  setSortOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Filtrar ordens"
                accessibilityState={{ selected: filterStatus !== 'all', expanded: filterOpen }}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                    paddingHorizontal: spacing.md,
                    height: 48,
                    backgroundColor: colors['surface-container-lowest'],
                    borderWidth: 1,
                    borderColor: filterStatus !== 'all' ? colors.primary : colors['outline-variant'],
                    borderRadius: br.field,
                  },
                  shadows.row,
                ]}
              >
                <Icon name="filter_list" size={20} color={colors['on-surface']} />
                <AppText variant="label">
                  {filterStatus === 'all' ? 'Filtros' : STATUS_LABEL[filterStatus]}
                </AppText>
                <Icon
                  name={filterOpen ? 'expand_less' : 'expand_more'}
                  size={16}
                  color={colors['on-surface']}
                />
              </Pressable>
              {filterOpen && (
                <View
                  style={[
                    {
                      position: 'absolute',
                      top: 54,
                      right: 0,
                      minWidth: 220,
                      backgroundColor: colors.surface,
                      borderRadius: br.lg,
                      borderWidth: 1,
                      borderColor: colors['outline-variant'],
                      paddingVertical: spacing.xs,
                      zIndex: 30,
                    },
                    shadows.lg,
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      setFilterStatus('all');
                      setFilterOpen(false);
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
                    {filterStatus === 'all' && (
                      <Icon name="check" size={16} color={colors.primary} />
                    )}
                    <AppText
                      variant="label"
                      style={{
                        color: filterStatus === 'all' ? colors.primary : colors['on-surface'],
                        marginLeft: filterStatus === 'all' ? 0 : 22,
                        flex: 1,
                      }}
                    >
                      Todos os status
                    </AppText>
                    <AppText variant="labelSmall" color="text-tertiary">
                      {orders.length}
                    </AppText>
                  </Pressable>
                  <View style={{ height: 1, backgroundColor: colors['outline-variant'] }} />
                  {STATUS_ORDER.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => {
                        setFilterStatus(s);
                        setFilterOpen(false);
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
                      {filterStatus === s && (
                        <Icon name="check" size={16} color={colors.primary} />
                      )}
                      <AppText
                        variant="label"
                        style={{
                          color: filterStatus === s ? colors.primary : colors['on-surface'],
                          marginLeft: filterStatus === s ? 0 : 22,
                          flex: 1,
                        }}
                      >
                        {STATUS_LABEL[s]}
                      </AppText>
                      <AppText variant="labelSmall" color="text-tertiary">
                        {countByStatus(s)}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Sort dropdown */}
            <View style={{ position: 'relative' }}>
              <Pressable
                onPress={() => {
                  setSortOpen((v) => !v);
                  setFilterOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Ordenar. Atual: ${SORT_LABEL[sortOrder]}`}
                accessibilityState={{ expanded: sortOpen }}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                    paddingHorizontal: spacing.md,
                    height: 48,
                    backgroundColor: colors['surface-container-lowest'],
                    borderWidth: 1,
                    borderColor: colors['outline-variant'],
                    borderRadius: br.field,
                  },
                  shadows.row,
                ]}
              >
                <Icon name="swap_vert" size={20} color={colors['on-surface']} />
                <AppText variant="label">{SORT_LABEL[sortOrder]}</AppText>
                <Icon
                  name={sortOpen ? 'expand_less' : 'expand_more'}
                  size={16}
                  color={colors['on-surface']}
                />
              </Pressable>
              {sortOpen && (
                <View
                  style={[
                    {
                      position: 'absolute',
                      top: 54,
                      right: 0,
                      minWidth: 200,
                      backgroundColor: colors.surface,
                      borderRadius: br.lg,
                      borderWidth: 1,
                      borderColor: colors['outline-variant'],
                      paddingVertical: spacing.xs,
                      zIndex: 30,
                    },
                    shadows.lg,
                  ]}
                >
                  {(Object.keys(SORT_LABEL) as SortOrder[]).map((k) => (
                    <Pressable
                      key={k}
                      onPress={() => {
                        setSortOrder(k);
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
                      {sortOrder === k && <Icon name="check" size={16} color={colors.primary} />}
                      <AppText
                        variant="label"
                        style={{
                          color: sortOrder === k ? colors.primary : colors['on-surface'],
                          marginLeft: sortOrder === k ? 0 : 22,
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

          {/* Quick status chips (only on desktop or when filter active) */}
          {(isDesktop || filterStatus !== 'all') && (
            <View
              accessibilityRole="tablist"
              style={{
                flexDirection: 'row',
                gap: spacing.xs,
                marginTop: spacing.sm,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label={`Todos (${orders.length})`}
                selected={filterStatus === 'all'}
                onPress={() => setFilterStatus('all')}
              />
              {STATUS_ORDER.filter((s) => countByStatus(s) > 0).map((s) => (
                <Chip
                  key={s}
                  label={`${STATUS_LABEL[s]} (${countByStatus(s)})`}
                  selected={filterStatus === s}
                  onPress={() => setFilterStatus(s)}
                />
              ))}
            </View>
          )}
        </StickyToolbar>

        {/* List */}
        <View style={{ marginTop: spacing.md }}>
          {filteredOrders.length === 0 ? (
            <EmptyState
              illustration="empty-clipboard"
              title="Nenhuma ordem encontrada"
              subtitle={
                searchQuery || filterStatus !== 'all'
                  ? 'Tente ajustar os filtros ou a busca.'
                  : 'Crie uma nova ordem de servico para comecar.'
              }
            />
          ) : (
            filteredOrders.map((item, i) => (
              <ListItemCard
                key={item.id}
                index={i}
                style={{ padding: 0, backgroundColor: 'transparent', borderWidth: 0 }}
              >
                <OrderCard
                  order={item}
                  getCustomerName={getCustomerName}
                  t={t}
                />
              </ListItemCard>
            ))
          )}
        </View>
      </ScrollView>
      <FabMenu
        actions={[
          { icon: 'add_circle', label: 'Nova OS', onPress: () => router.push('/orders/new') },
          { icon: 'person_add', label: 'Novo Cliente', onPress: () => router.push('/customers/new') },
        ]}
      />
    </View>
  );
}
