import { useMemo, useState } from 'react';
import { View, FlatList, TextInput, Pressable, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing, useBreakpoints } from '../../src/theme';
import { AppText, Button, Chip, StatusBadge } from '../../src/ui';
import { Icon } from '../../src/components/Icon';
import { KpiCard } from '../../src/components/KpiCard';
import { AppShell } from '../../src/components/AppShell';
import { EmptyState } from '../../src/components/EmptyState';
import { ListItemCard } from '../../src/components/ListItemCard';
import { StickyToolbar } from '../../src/components/StickyToolbar';
import { formatCurrency } from '../../src/utils/currency';
import { generateBudgetHtml } from '../../src/utils/generateBudgetHtml';
import { generateId } from '../../src/utils/generateId';
import { printTicket } from '../../src/utils/printTicket';
import { useAppStore } from '../../src/stores/useAppStore';
import { useDialog } from '../../src/components/DialogContext';
import type { Budget, OrderItem, Order } from '../../src/db/schema';

const isWeb = Platform.OS === 'web';

type StatusFilter = 'all' | Budget['status'];
type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest';

const STATUS_META: Record<
  Budget['status'],
  { label: string; variant: 'ready' | 'waiting' | 'in-execution' | 'out-of-stock'; icon: string }
> = {
  draft: { label: 'Rascunho', variant: 'waiting', icon: 'edit_note' },
  sent: { label: 'Enviado', variant: 'in-execution', icon: 'send' },
  approved: { label: 'Aprovado', variant: 'ready', icon: 'check_circle' },
  expired: { label: 'Expirado', variant: 'out-of-stock', icon: 'schedule' },
};

const SORT_LABEL: Record<SortKey, string> = {
  newest: 'Mais recentes',
  oldest: 'Mais antigos',
  highest: 'Maior valor',
  lowest: 'Menor valor',
};

export default function BudgetsScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const { isDesktop } = useBreakpoints();
  const { showAlert, showConfirm } = useDialog();

  const { budgets, customers, vehicles, updateBudgetStatus, deleteBudget, addOrderWithRelations } = useAppStore(
    useShallow((s) => ({
      budgets: s.budgets,
      customers: s.customers,
      vehicles: s.vehicles,
      updateBudgetStatus: s.updateBudgetStatus,
      deleteBudget: s.deleteBudget,
      addOrderWithRelations: s.addOrderWithRelations,
    })),
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);

  const getCustomer = (id: string) => customers.find((c) => c.id === id);
  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);

  const now = new Date();

  // Compute KPIs
  const kpis = useMemo(() => {
    const total = budgets.length;
    const approved = budgets.filter((b) => b.status === 'approved').length;
    const pending = budgets.filter((b) => b.status === 'sent' || b.status === 'draft').length;
    const expired = budgets.filter((b) => b.status === 'expired').length;
    const totalValue = budgets.reduce((sum, b) => sum + b.total, 0);
    const conversion = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { total, approved, pending, expired, totalValue, conversion };
  }, [budgets]);

  const filtered = useMemo(() => {
    let list = [...budgets];
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => {
        const cust = getCustomer(b.customerId)?.fullName.toLowerCase() ?? '';
        const veh = getVehicle(b.vehicleId);
        const vehModel = `${veh?.brand ?? ''} ${veh?.model ?? ''}`.toLowerCase();
        return cust.includes(q) || vehModel.includes(q) || b.id.toLowerCase().includes(q);
      });
    }
    list.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest':
          return b.total - a.total;
        case 'lowest':
          return a.total - b.total;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return list;
  }, [budgets, statusFilter, search, sort, customers, vehicles]);

  const isExpired = (b: Budget) => new Date(b.validUntil) < now && b.status !== 'approved';
  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleApprove = (b: Budget) => {
    showConfirm(
      'Aprovar orçamento?',
      `Confirma a aprovação do orçamento #${b.id.slice(0, 6).toUpperCase()}? Uma Ordem de Serviço será criada automaticamente.`,
      () => {
        updateBudgetStatus(b.id, 'approved');

        const orderId = generateId();
        const orderNumber = `OS-${generateId().slice(0, 6)}`;
        const now = new Date().toISOString();

        const partsSubtotal = (b.items ?? [])
          .filter((i) => i.type === 'part')
          .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
        const laborSubtotal = (b.items ?? [])
          .filter((i) => i.type === 'service')
          .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

        const orderItems: OrderItem[] = (b.items ?? []).map((item) => ({
          id: generateId(),
          orderId,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
          partId: item.partId,
        }));

        const order: Order = {
          id: orderId,
          number: orderNumber,
          customerId: b.customerId,
          vehicleId: b.vehicleId,
          plate: '',
          status: 'open',
          partsSubtotal,
          laborSubtotal,
          tax: 0,
          discount: 0,
          total: b.total,
          items: orderItems,
          createdAt: now,
          updatedAt: now,
        };

        addOrderWithRelations({ order });
        showAlert('OS Criada', `Ordem #${orderNumber} criada a partir do orçamento.`);
      },
    );
  };

  const handleSend = (b: Budget) => {
    updateBudgetStatus(b.id, 'sent');
    
    const cust = getCustomer(b.customerId);
    if (!cust?.phone) {
      showAlert('Enviado!', 'O orçamento foi marcado como enviado, mas o cliente não tem telefone para abrir o WhatsApp.');
      return;
    }
    
    const cleanPhone = cust.phone.replace(/\D/g, '');
    const text = `Olá ${cust.fullName},\n\nAqui está a prévia do seu orçamento #${b.id.slice(0, 6).toUpperCase()} da MotoCar.\nValor total estimado: ${formatCurrency(b.total)}\n\nFicamos à disposição para dúvidas!`;
    
    Linking.openURL(`whatsapp://send?phone=55${cleanPhone}&text=${encodeURIComponent(text)}`).catch(() => {
      showAlert('Enviado internamente', 'O orçamento foi marcado como enviado, mas não foi possível abrir o WhatsApp (aplicativo não instalado).');
    });
  };

  const handleDuplicate = (b: Budget) => {
    const newBudget: Budget = {
      ...b,
      id: generateId(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    useAppStore.getState().addBudget(newBudget);
    showAlert('Duplicado', `Rascunho baseado em #${b.id.slice(0, 6).toUpperCase()} criado com sucesso.`);
  };

  const handleCancel = (b: Budget) => {
    if (b.status === 'expired') {
      showAlert('Já expirado', 'Este orçamento já está expirado.');
      return;
    }
    showConfirm(
      'Cancelar orçamento?',
      `O orçamento #${b.id.slice(0, 6).toUpperCase()} será marcado como expirado.`,
      () => updateBudgetStatus(b.id, 'expired'),
    );
  };

  const handleDelete = (b: Budget) => {
    showConfirm(
      'Excluir orçamento?',
      `Esta ação é permanente. Excluir o orçamento #${b.id.slice(0, 6).toUpperCase()}?`,
      () => deleteBudget(b.id),
    );
  };

  const handleEdit = (b: Budget) => {
    router.push({ pathname: '/orders/new', params: { editBudget: b.id } });
  };

  const handlePrint = async (b: Budget) => {
    try {
      const cust = getCustomer(b.customerId);
      const veh = getVehicle(b.vehicleId);
      const html = generateBudgetHtml(b, cust, veh);
      await printTicket(html);
    } catch (e) {
      showAlert('Erro', e instanceof Error ? e.message : 'Não foi possível gerar o PDF.');
    }
  };

  return (
    <AppShell>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing['margin-mobile'],
          paddingBottom: 140,
        }}
        ListHeaderComponent={
          <>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: spacing.lg,
                gap: spacing.sm,
                flexWrap: 'wrap',
              }}
            >
              <View style={{ flex: 1, minWidth: 200 }}>
                <AppText variant="h2" style={{ color: colors.primary }}>
                  Orcamentos
                </AppText>
                <AppText variant="bodySmall" color="text-secondary">
                  {filtered.length} de {budgets.length} mostrados
                </AppText>
              </View>
              <Button
                variant="primary"
                title="Novo Orcamento"
                icon="request_quote"
                onPress={() => router.push('/orders/new')}
              />
            </View>

            <View
              style={{
                flexDirection: isDesktop ? 'row' : 'column',
                marginBottom: spacing.gutter,
              }}
            >
              {[
                {
                  label: 'Aprovados',
                  value: String(kpis.approved).padStart(2, '0'),
                  caption: `${kpis.conversion}% de conversao`,
                  icon: 'check_circle_outline',
                  bg: colors['success-container'],
                  fg: colors['on-success-container'],
                },
                {
                  label: 'Pendentes',
                  value: String(kpis.pending).padStart(2, '0'),
                  caption: 'Enviados + rascunhos',
                  icon: 'hourglass_empty',
                  bg: colors['info-container'],
                  fg: colors['on-info-container'],
                },
                {
                  label: 'Receita potencial',
                  value: formatCurrency(kpis.totalValue),
                  caption: `${kpis.total} orcamentos`,
                  icon: 'trending_up',
                  bg: colors['primary-container'],
                  fg: colors['on-primary-container'],
                },
              ].map((k, i) => (
                <View
                  key={k.label}
                  style={{
                    flex: isDesktop ? 1 : undefined,
                    marginRight: isDesktop && i < 2 ? spacing.gutter : 0,
                    marginBottom: !isDesktop && i < 2 ? spacing.gutter : 0,
                  }}
                >
                  <KpiCard
                    label={k.label}
                    value={k.value}
                    icon={k.icon}
                    iconBg={k.bg}
                    iconColor={k.fg}
                    caption={k.caption}
                  />
                </View>
              ))}
            </View>

            <StickyToolbar>
              <View
                style={{
                  flexDirection: 'row',
                  gap: spacing.sm,
                  flexWrap: 'wrap',
                  marginBottom: spacing.sm,
                }}
              >
                <View
                  style={[
                    {
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors['surface-container-lowest'],
                      borderWidth: 1,
                      borderColor: colors['outline-variant'],
                      borderRadius: br.xl,
                      paddingHorizontal: spacing.md,
                      minWidth: 220,
                    },
                    shadows.sm,
                  ]}
                >
                  <Icon name="search" size={18} color={colors['on-surface-variant']} />
                  <TextInput
                    style={[
                      { flex: 1, height: 44, color: colors['on-surface'], paddingLeft: spacing.sm },
                      isWeb && ({ outlineStyle: 'none', outlineWidth: 0 } as any),
                    ]}
                    placeholder="Buscar por cliente, placa ou n#..."
                    placeholderTextColor={colors.placeholder}
                    value={search}
                    onChangeText={setSearch}
                    accessibilityLabel="Buscar orcamentos"
                  />
                  {search.length > 0 && (
                    <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Limpar">
                      <Icon name="close" size={18} color={colors['on-surface-variant']} />
                    </Pressable>
                  )}
                </View>

                <View style={{ position: 'relative' }}>
                  <Pressable
                    onPress={() => setSortOpen((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel="Ordenar"
                    style={[
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                        paddingHorizontal: spacing.md,
                        height: 46,
                        borderWidth: 1,
                        borderColor: colors['outline-variant'],
                        borderRadius: br.xl,
                        backgroundColor: colors['surface-container-lowest'],
                      },
                      shadows.sm,
                    ]}
                  >
                    <Icon name="swap_vert" size={18} color={colors['on-surface']} />
                    <AppText variant="label">{SORT_LABEL[sort]}</AppText>
                    <Icon name={sortOpen ? 'expand_less' : 'expand_more'} size={16} color={colors['on-surface']} />
                  </Pressable>
                  {sortOpen && (
                    <View
                      style={[
                        {
                          position: 'absolute',
                          top: 52,
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
                            setSort(k);
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
                          {sort === k && <Icon name="check" size={16} color={colors.primary} />}
                          <AppText
                            variant="label"
                            style={{
                              color: sort === k ? colors.primary : colors['on-surface'],
                              marginLeft: sort === k ? 0 : 22,
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

              <View
                accessibilityRole="tablist"
                style={{
                  flexDirection: 'row',
                  gap: spacing.xs,
                  marginBottom: spacing.md,
                  flexWrap: 'wrap',
                }}
              >
                {(['all', 'draft', 'sent', 'approved', 'expired'] as StatusFilter[]).map((s) => {
                  const label =
                    s === 'all' ? `Todos (${kpis.total})` : `${STATUS_META[s].label} (${budgets.filter((b) => b.status === s).length})`;
                  return (
                    <Chip key={s} label={label} selected={statusFilter === s} onPress={() => setStatusFilter(s)} />
                  );
                })}
              </View>
            </StickyToolbar>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            illustration="empty-quotes"
            title="Nenhum orcamento encontrado"
            subtitle={
              search || statusFilter !== 'all'
                ? 'Tente ajustar os filtros ou a busca.'
                : 'Crie seu primeiro orcamento para comecar.'
            }
          />
        }
        renderItem={({ item: b, index: i }) => {
          const cust = getCustomer(b.customerId);
          const veh = getVehicle(b.vehicleId);
          const expired = isExpired(b);
          const daysLeft = daysUntil(b.validUntil);
          const effectiveStatus = expired && b.status !== 'approved' ? 'expired' : b.status;
          const meta = STATUS_META[effectiveStatus];
          const itemsCount = b.items?.length ?? 0;
          const stripeColor =
            meta.variant === 'ready'
              ? colors.success
              : meta.variant === 'in-execution'
              ? colors.secondary
              : meta.variant === 'waiting'
              ? colors.info
              : colors.error;

          return (
            <ListItemCard
              key={b.id}
              index={i}
              onPress={() => showAlert('Detalhes', 'Tela de detalhes em desenvolvimento.')}
              accessibilityRole="button"
              accessibilityLabel={`Orcamento ${cust?.fullName ?? 'sem cliente'}, ${meta.label}, ${formatCurrency(b.total)}`}
              style={{ padding: 0, overflow: 'hidden', marginBottom: spacing.sm }}
            >
              {/* Colored top stripe */}
              <View style={{ height: 4, backgroundColor: stripeColor }} />

              <View style={{ padding: spacing.md }}>
                {/* Header row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: br.lg,
                      backgroundColor: colors['surface-container'],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={meta.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText variant="body" style={{ color: colors.primary, fontWeight: '600' }} numberOfLines={1}>
                      {cust?.fullName ?? 'Cliente removido'}
                    </AppText>
                    <AppText variant="labelSmall" color="text-secondary" numberOfLines={1}>
                      #{b.id.slice(0, 6).toUpperCase()} {veh ? `· ${veh.brand} ${veh.model}` : ''}
                    </AppText>
                  </View>
                  <StatusBadge variant={meta.variant} label={meta.label} />
                </View>

                {/* Middle row: items count + total + validity */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                    flexWrap: 'wrap',
                    paddingVertical: spacing.sm,
                    borderTopWidth: 1,
                    borderTopColor: colors['outline-variant'],
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Icon name="list_alt" size={14} color={colors['on-surface-variant']} />
                      <AppText variant="labelSmall" color="text-secondary">
                        {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                      </AppText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Icon
                        name={expired ? 'error_outline' : 'schedule'}
                        size={14}
                        color={expired ? colors.error : colors['on-surface-variant']}
                      />
                      <AppText
                        variant="labelSmall"
                        style={{
                          color: expired ? colors.error : colors['on-surface-variant'],
                        }}
                      >
                        {expired
                          ? `Expirou ha ${Math.abs(daysLeft)} dias`
                          : b.status === 'approved'
                          ? 'Aprovado'
                          : `Vence em ${daysLeft} dias`}
                      </AppText>
                    </View>
                  </View>
                  <AppText variant="h3" style={{ color: colors.primary, fontWeight: '700' }}>
                    {formatCurrency(b.total)}
                  </AppText>
                </View>

                {/* Actions */}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: spacing.xs,
                    flexWrap: 'wrap',
                    paddingTop: spacing.sm,
                    borderTopWidth: 1,
                    borderTopColor: colors['outline-variant'],
                  }}
                >
                  {b.status !== 'approved' && !expired && (
                    <Button
                      variant="secondary"
                      size="sm"
                      title="Aprovar"
                      icon="check_circle_outline"
                      onPress={() => handleApprove(b)}
                    />
                  )}
                  {b.status === 'draft' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Enviar"
                      icon="send"
                      onPress={() => handleSend(b)}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Editar"
                    icon="edit"
                    onPress={() => handleEdit(b)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Duplicar"
                    icon="content_copy"
                    onPress={() => handleDuplicate(b)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    title="PDF"
                    icon="picture_as_pdf"
                    onPress={() => handlePrint(b)}
                  />
                  {b.status !== 'approved' && b.status !== 'expired' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Cancelar"
                      icon="block"
                      onPress={() => handleCancel(b)}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Excluir"
                    icon="delete"
                    onPress={() => handleDelete(b)}
                  />
                </View>
              </View>
            </ListItemCard>
          );
        }}
      />
    </AppShell>
  );
}
