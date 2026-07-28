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

const isWeb = Platform.OS === 'web';

export default function CustomersScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const { isDesktop } = useBreakpoints();
  const customers = useAppStore((s) => s.customers);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (c) =>
          !debouncedSearch ||
          c.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          c.document.includes(debouncedSearch) ||
          c.phone.includes(debouncedSearch),
      ),
    [customers, debouncedSearch],
  );

  const openEdit = (id: string) =>
    router.push({ pathname: '/customers/[id]', params: { id } });

  return (
    <AppShell>
      <FlatList
        data={filteredCustomers}
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
                  Gerenciar Clientes
                </AppText>
                <AppText variant="bodySmall" color="text-secondary">
                  {customers.length} cliente(s) cadastrado(s)
                </AppText>
              </View>
              <Button
                variant="primary"
                title="Novo Cliente"
                icon="person_add"
                onPress={() => router.push('/customers/new')}
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
                  placeholder="Buscar por nome, CPF ou telefone..."
                  placeholderTextColor={colors.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </StickyToolbar>

            {isDesktop && filteredCustomers.length > 0 && (
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
                <AppText variant="labelSmall" color="text-secondary" style={{ flex: 2, textTransform: 'uppercase' }}>Nome</AppText>
                <AppText variant="labelSmall" color="text-secondary" style={{ flex: 1, textTransform: 'uppercase' }}>Documento</AppText>
                <AppText variant="labelSmall" color="text-secondary" style={{ flex: 1, textTransform: 'uppercase' }}>Telefone</AppText>
                <AppText variant="labelSmall" color="text-secondary" style={{ flex: 1, textTransform: 'uppercase' }}>Cidade</AppText>
                <View style={{ width: 40 }} />
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={{ marginTop: isDesktop ? 0 : spacing.md }}>
            <EmptyState
              illustration="empty-inventory"
              title="Nenhum cliente"
              subtitle="Cadastre seu primeiro cliente para começar."
            />
          </View>
        }
        renderItem={({ item: customer, index: i }) => (
          <ListItemCard
            key={customer.id}
            index={i}
            onPress={() => openEdit(customer.id)}
            accessibilityRole="button"
            accessibilityLabel={`Editar cliente ${customer.fullName}`}
            style={{
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: isDesktop ? 'center' : 'stretch',
              gap: spacing.sm,
            }}
          >
            <View style={{ flex: isDesktop ? 2 : undefined, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: br.full,
                  backgroundColor: colors['primary-container'],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon name="person" size={18} color={colors['on-primary-container']} />
              </View>
              <AppText
                variant="body"
                style={{ color: colors.primary, fontWeight: '600', flex: 1 }}
                numberOfLines={1}
              >
                {customer.fullName}
              </AppText>
            </View>
            {isDesktop && (
              <>
                <AppText variant="bodySmall" color="text-secondary" style={{ flex: 1 }}>
                  {customer.document || '—'}
                </AppText>
                <AppText variant="bodySmall" color="text-secondary" style={{ flex: 1 }}>
                  {customer.phone || '—'}
                </AppText>
                <AppText variant="bodySmall" color="text-secondary" style={{ flex: 1 }}>
                  {customer.city || '—'}
                </AppText>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    openEdit(customer.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Editar"
                  hitSlop={8}
                  style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Icon name="edit" size={18} color={colors['on-surface-variant']} />
                </Pressable>
              </>
            )}
          </ListItemCard>
        )}
      />
      <FabMenu
        actions={[{ icon: 'person_add', label: 'Novo Cliente', onPress: () => router.push('/customers/new') }]}
      />
    </AppShell>
  );
}
