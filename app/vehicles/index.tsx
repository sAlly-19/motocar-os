import { useState, useMemo } from 'react';
import { View, TextInput, FlatList, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  useThemeColors,
  useThemeBorderRadius,
  useThemeShadows,
  spacing,
  useBreakpoints,
} from '../../src/theme';
import { Icon } from '../../src/components/Icon';
import { useAppStore } from '../../src/stores/useAppStore';
import { EmptyState } from '../../src/components/EmptyState';
import { FabMenu } from '../../src/components/FabMenu';
import { AppShell } from '../../src/components/AppShell';
import { ListItemCard } from '../../src/components/ListItemCard';
import { StickyToolbar } from '../../src/components/StickyToolbar';
import { AppText, Button } from '../../src/ui';
import { useDebounce } from '../../src/utils/useDebounce';
import type { VehicleCategory, PartCategory } from '../../src/db/schema';
import { usePagination } from '../../src/hooks/usePagination';

const isWeb = Platform.OS === 'web';
const PAGE_SIZE = 20;

// Constantes de largura para alinhar header e rows no desktop
const COLS = {
  category: { flex: 1, minWidth: 100 },
  brand: { flex: 1.2, minWidth: 120 },
  model: { flex: 1.5, minWidth: 140 },
  tipo: { flex: 1, minWidth: 100 },
  year: { flex: 0.6, minWidth: 60 },
};
const COL_ACTION = 40;
const COL_ICON = 36;

export default function VehiclesScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const { isDesktop } = useBreakpoints();
  const vehicles = useAppStore((s) => s.vehicles);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          !debouncedSearch ||
          v.brand.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          v.model.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (v.tipo && v.tipo.toLowerCase().includes(debouncedSearch.toLowerCase())),
      ),
    [vehicles, debouncedSearch],
  );

  const {
    page,
    totalPages,
    currentItems,
    next,
    prev,
    hasNext,
    hasPrev,
    totalItems,
  } = usePagination(filteredVehicles, PAGE_SIZE);

  const openEdit = (id: string) =>
    router.push({ pathname: '/vehicles/[id]', params: { id } });

  return (
    <AppShell>
      <FlatList
        data={currentItems}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing['margin-mobile'], paddingBottom: 120 }}
        ListHeaderComponent={
          <>
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
                  Catálogo de Veículos
                </AppText>
                <AppText variant="bodySmall" color="text-secondary">
                  {vehicles.length} modelo(s) cadastrado(s)
                </AppText>
              </View>
              <Button
                variant="primary"
                title="Novo Modelo"
                icon="add"
                onPress={() => router.push('/vehicles/new')}
              />
            </View>

            <StickyToolbar>
              <View
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors['surface-container-lowest'],
                    borderWidth: 1,
                    borderColor: colors['outline-variant'],
                    borderRadius: br.field,
                    paddingHorizontal: spacing.md,
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
                  placeholder="Buscar por marca, modelo ou tipo..."
                  placeholderTextColor={colors.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </StickyToolbar>

            {/* Header — desktop only, mesmas larguras das rows */}
            {isDesktop && filteredVehicles.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors['surface-container-low'],
                  borderRadius: br.field,
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginTop: spacing.md,
                  marginBottom: spacing.xs,
                }}
              >
                <View style={{ width: COL_ICON }} />
                <AppText variant="labelSmall" color="text-secondary" style={{ ...COLS.category, textTransform: 'uppercase' }}>
                  Categoria
                </AppText>
                <AppText variant="labelSmall" color="text-secondary" style={{ ...COLS.brand, textTransform: 'uppercase' }}>
                  Marca
                </AppText>
                <AppText variant="labelSmall" color="text-secondary" style={{ ...COLS.model, textTransform: 'uppercase' }}>
                  Modelo
                </AppText>
                <AppText variant="labelSmall" color="text-secondary" style={{ ...COLS.tipo, textTransform: 'uppercase' }}>
                  Tipo
                </AppText>
                <AppText variant="labelSmall" color="text-secondary" style={{ ...COLS.year, textAlign: 'right', textTransform: 'uppercase' }}>
                  Ano
                </AppText>
                <View style={{ width: COL_ACTION }} />
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={{ marginTop: isDesktop ? 0 : spacing.md }}>
            <EmptyState
              illustration="empty-inventory"
              title="Nenhum modelo"
              subtitle="Cadastre o primeiro modelo de veículo para começar."
            />
          </View>
        }
        renderItem={({ item: vehicle, index: i }) => (
          <ListItemCard
            key={vehicle.id}
            index={i}
            onPress={() => openEdit(vehicle.id)}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${vehicle.brand} ${vehicle.model}`}
            style={{
              padding: spacing.md,
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: isDesktop ? 'center' : 'stretch',
              gap: spacing.sm,
            }}
          >
            {isDesktop ? (
              <>
                <View
                  style={{
                    width: COL_ICON,
                    height: COL_ICON,
                    borderRadius: br.full,
                    backgroundColor: colors['primary-container'],
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Icon
                    name={vehicle.category === 'motocicleta' ? 'two_wheeler' : 'directions_car'}
                    size={18}
                    color={colors['on-primary-container']}
                  />
                </View>
                <AppText variant="bodySmall" color="text-secondary" style={COLS.category} numberOfLines={1}>
                  {vehicle.category === 'motocicleta' ? 'Motocicleta' : vehicle.category === 'carro' ? 'Carro' : '—'}
                </AppText>
                <AppText
                  variant="body"
                  style={{ color: colors.primary, fontWeight: '600', ...COLS.brand }}
                  numberOfLines={1}
                >
                  {vehicle.brand || '—'}
                </AppText>
                <AppText variant="bodySmall" color="text-secondary" style={COLS.model} numberOfLines={1}>
                  {vehicle.model || '—'}
                </AppText>
                <AppText variant="bodySmall" color="text-secondary" style={COLS.tipo} numberOfLines={1}>
                  {vehicle.tipo || '—'}
                </AppText>
                <AppText
                  variant="bodySmall"
                  color="text-secondary"
                  style={{ ...COLS.year, textAlign: 'right' }}
                >
                  {vehicle.year || '—'}
                </AppText>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    openEdit(vehicle.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Editar"
                  hitSlop={8}
                  style={{
                    width: COL_ACTION,
                    height: COL_ACTION,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Icon name="edit" size={18} color={colors['on-surface-variant']} />
                </Pressable>
              </>
            ) : (
              // MOBILE — layout empilhado, sem tabela
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}
                >
                  <View
                    style={{
                      width: COL_ICON,
                      height: COL_ICON,
                      borderRadius: br.full,
                      backgroundColor: colors['primary-container'],
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Icon
                      name={vehicle.category === 'motocicleta' ? 'two_wheeler' : 'directions_car'}
                      size={18}
                      color={colors['on-primary-container']}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText
                      variant="body"
                      style={{ color: colors.primary, fontWeight: '600' }}
                      numberOfLines={1}
                    >
                      {vehicle.brand} {vehicle.model}
                    </AppText>
                    <AppText variant="labelSmall" color="text-tertiary" numberOfLines={1}>
                      {vehicle.category === 'motocicleta' ? 'Motocicleta' : vehicle.category === 'carro' ? 'Carro' : '—'}
                      {vehicle.tipo ? ` · ${vehicle.tipo}` : ''}
                      {vehicle.year ? ` · ${vehicle.year}` : ''}
                    </AppText>
                  </View>
                  <Icon name="chevron_right" size={20} color={colors['on-surface-variant']} />
                </View>
              </>
            )}
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
                title="Anterior"
                icon="chevron_left"
                disabled={!hasPrev}
                onPress={prev}
              />
              <AppText variant="label" color="text-secondary">
                Página {page} de {totalPages} · {totalItems} itens
              </AppText>
              <Button
                variant="outline"
                size="sm"
                title="Próxima"
                icon="chevron_right"
                disabled={!hasNext}
                onPress={next}
              />
            </View>
          ) : null
        }
      />
      <FabMenu
        actions={[{ icon: 'add', label: 'Novo Modelo', onPress: () => router.push('/vehicles/new') }]}
      />
    </AppShell>
  );
}
