import { useState, useEffect } from 'react';
import { View, ScrollView, Share, Platform, KeyboardAvoidingView, Linking } from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, spacing, useBreakpoints } from '../../src/theme';
import type { OrderStatus } from '../../src/db/schema';
import { formatCurrency } from '../../src/utils/currency';
import { generateTicketHtml } from '../../src/utils/generateTicketHtml';
import { printTicket } from '../../src/utils/printTicket';
import { useAppStore } from '../../src/stores/useAppStore';
import { useTeamStore } from '../../src/stores/useTeamStore';
import { useDialog } from '../../src/components/DialogContext';
import { AppShell } from '../../src/components/AppShell';
import { EmptyState } from '../../src/components/EmptyState';
import { AppText, Button, Card, Chip, TextArea, Divider } from '../../src/ui';

const isWeb = Platform.OS === 'web';

export default function TicketScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const { isDesktop } = useBreakpoints();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showConfirm, showAlert } = useDialog();
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);
  const orders = useAppStore((s) => s.orders);
  const customers = useAppStore((s) => s.customers);
  const vehicles = useAppStore((s) => s.vehicles);
  const employees = useTeamStore((s) => s.employees);
  const updateOrderFields = useAppStore((s) => s.updateOrderFields);
  const deleteOrder = useAppStore((s) => s.deleteOrder);

  const order = orders.find((o) => o.id === id);
  const customer = (order ? customers.find((c) => c.id === order.customerId) : null) ?? null;
  const vehicle = (order ? vehicles.find((v) => v.id === order.vehicleId) : null) ?? null;
  const mechanic = order?.technicianId ? employees.find((e) => e.id === order.technicianId) : null;

  const [editStatus, setEditStatus] = useState<OrderStatus>(order?.status || 'open');
  const [editNotes, setEditNotes] = useState(order?.notes || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const markChanged = () => setHasUnsavedChanges(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      showConfirm(
        'Descartar alterações?',
        'Você tem alterações não salvas. Deseja sair?',
        () => navigation.dispatch(e.data.action),
      );
    });
    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  if (!order) {
    return (
      <>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <EmptyState
            icon="warning"
            title="Ordem não encontrada"
            subtitle="A ordem pode ter sido removida ou o link está incorreto"
            action={<Button variant="outline" title="Voltar" onPress={() => router.back()} />}
          />
        </View>
      </>
    );
  }

  const handleSaveTicket = async () => {
    setSaving(true);
    try {
      updateOrderFields(order.id, { status: editStatus, notes: editNotes });
      setHasUnsavedChanges(false);
      showAlert('Salvo', 'Status e observações atualizados com sucesso.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = () => {
    if (order.status === 'cancelled') {
      showAlert('Já cancelada', 'Esta OS já está cancelada.');
      return;
    }
    showConfirm(
      'Cancelar ordem?',
      `A OS #${order.number} será marcada como cancelada. As peças serão devolvidas ao estoque.`,
      () => {
        updateOrderFields(order.id, { status: 'cancelled' });
        setEditStatus('cancelled');
        setHasUnsavedChanges(false);
      },
    );
  };

  const handleDeleteOrder = () => {
    showConfirm(
      'Excluir ordem?',
      `Esta ação é permanente. A OS #${order.number} será removida${
        order.status !== 'cancelled' && order.status !== 'draft'
          ? ' e as peças voltarão ao estoque.'
          : '.'
      }`,
      () => {
        deleteOrder(order.id);
        setHasUnsavedChanges(false);
        router.back();
      },
    );
  };

  const handleEditOrder = () => {
    router.push({ pathname: '/orders/new', params: { edit: order.id } });
  };

  const handleWhatsApp = () => {
    if (!customer?.phone) {
      showAlert('Telefone ausente', 'O cliente não possui telefone cadastrado.');
      return;
    }
    const cleanPhone = customer.phone.replace(/\D/g, '');
    const statusMap: Record<string, string> = {
      open: 'Aberta',
      'in-progress': 'Em andamento',
      'waiting-approval': 'Aguardando aprovação',
      ready: 'Pronta para retirada',
      finished: 'Finalizada',
      cancelled: 'Cancelada',
      draft: 'Rascunho'
    };
    const currentStatus = statusMap[order.status] || order.status;
    const text = `Olá ${customer.fullName},\n\nSua Ordem de Serviço *#${order.number}* da MotoCar atualizou para o status: *${currentStatus}*.\nValor: ${formatCurrency(order.total)}`;
    Linking.openURL(`whatsapp://send?phone=55${cleanPhone}&text=${encodeURIComponent(text)}`).catch(() => {
      showAlert('Erro', 'Não foi possível abrir o WhatsApp. Verifique se ele está instalado.');
    });
  };

  const handleShare = async () => {
    setSharing(true);
    const summary = `Ordem de Serviço #${order.number}\nCliente: ${customer?.fullName || 'N/A'}\nTotal: ${formatCurrency(order.total)}`;
    try {
      if (isWeb) {
        // Web Share API only exists in some browsers; fall back to clipboard via
        // the browser-native `navigator.clipboard` API (no extra dependency).
        const anyNav = typeof navigator !== 'undefined' ? (navigator as any) : null;
        if (anyNav?.share) {
          await anyNav.share({ title: `OS #${order.number}`, text: summary });
        } else if (anyNav?.clipboard?.writeText) {
          await anyNav.clipboard.writeText(summary);
          showAlert('Copiado', 'O resumo foi copiado para a área de transferência.');
        } else {
          showAlert('Compartilhamento indisponível', 'Seu navegador não suporta compartilhamento nem cópia automática.');
        }
      } else {
        await Share.share({ message: summary });
      }
    } catch (e) {
      // User cancelled - no-op. Any other error surfaces to the dialog.
      const msg = (e as Error)?.message || '';
      if (msg && !/cancel/i.test(msg)) {
        showAlert('Erro', 'Não foi possível compartilhar.');
      }
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = async () => {
    if (!order) return;
    setPrinting(true);
    try {
      const html = generateTicketHtml(
        order,
        customer,
        vehicle,
        order.items ?? [],
        mechanic?.fullName,
      );
      await printTicket(html);
    } catch (e: any) {
      if (e?.message !== 'User cancelled') {
        showAlert('Erro', e instanceof Error ? e.message : 'Não foi possível gerar o PDF.');
      }
    } finally {
      setPrinting(false);
    }
  };

  const statusSteps: { key: OrderStatus; label: string }[] = [
    { key: 'open', label: 'Aberto' },
    { key: 'in-progress', label: 'Em andamento' },
    { key: 'finished', label: 'Finalizada' },
  ];

  const sectionHeaderProps = {
    variant: 'label' as const,
    style: {
      color: colors.outline,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
      borderBottomWidth: 1,
      borderBottomColor: colors['outline-variant'],
      paddingBottom: spacing.sm,
      marginBottom: spacing.md,
    },
  };

  return (
    <>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl + insets.bottom, gap: spacing.md }}
          keyboardShouldPersistTaps="handled"
        >
          <Card variant="outlined" style={{ padding: 0, overflow: 'hidden' }}>
            <View
              style={{
                backgroundColor: colors.primary,
                padding: spacing.lg,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: spacing.md,
                flexWrap: 'wrap',
              }}
            >
              <View style={{ minWidth: 140 }}>
                <AppText variant="h1" style={{ color: colors['on-primary'], fontWeight: '700' }}>
                  MotoCar
                </AppText>
                <AppText variant="label" style={{ color: colors['on-primary-container'] }}>
                  AUTOMOTIVE EXCELLENCE CENTER
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                <View
                  accessibilityRole="tablist"
                  style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', justifyContent: 'flex-end' }}
                >
                  {statusSteps.map((s) => (
                    <Chip
                      key={s.key}
                      label={s.label}
                      size="sm"
                      selected={editStatus === s.key}
                      onPress={() => { setEditStatus(s.key); markChanged(); }}
                    />
                  ))}
                </View>
                <AppText variant="h3" style={{ color: colors['on-primary'] }}>
                  #{order.number}
                </AppText>
                <AppText variant="body" style={{ color: colors['on-primary-container'] }}>
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </AppText>
              </View>
            </View>

            <View style={{ padding: spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: spacing.xl, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 200 }}>
                  <AppText {...sectionHeaderProps}>Proprietário</AppText>
                  <AppText variant="h4" style={{ color: colors.primary }}>
                    {customer?.fullName || 'N/A'}
                  </AppText>
                  <AppText variant="bodySmall" color="text-secondary">
                    {customer?.phone}
                  </AppText>
                </View>
                <View style={{ flex: 1, minWidth: 200 }}>
                  <AppText {...sectionHeaderProps}>Veículo</AppText>
                  <AppText variant="h4" style={{ color: colors.primary }}>
                    {vehicle?.brand ?? ''} {vehicle?.model ?? ''}
                  </AppText>
                  <AppText variant="bodySmall" color="text-secondary">
                    {(order.plate ?? '').trim() || '—'}
                    {vehicle?.year ? ` · ${vehicle.year}` : ''}
                    {vehicle?.tipo ? ` · ${vehicle.tipo}` : ''}
                  </AppText>
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  gap: spacing.xl,
                  flexWrap: 'wrap',
                  marginTop: spacing.md,
                  paddingTop: spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: colors['outline-variant'],
                }}
              >
                <View style={{ flex: 1, minWidth: 200 }}>
                  <AppText {...sectionHeaderProps}>Mecânico responsável</AppText>
                  <AppText variant="body" style={{ color: colors.primary, fontWeight: '600' }}>
                    {mechanic?.fullName ?? 'Não atribuído'}
                  </AppText>
                </View>
                <View style={{ flex: 1, minWidth: 200 }}>
                  <AppText {...sectionHeaderProps}>Prazo</AppText>
                  <AppText variant="body" style={{ color: colors.primary, fontWeight: '600' }}>
                    {order.dueDate
                      ? new Date(order.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')
                      : 'Sem prazo'}
                  </AppText>
                </View>
              </View>
            </View>

            <View style={{ paddingHorizontal: spacing.lg }}>
              <Divider spacing="none" />
            </View>

            <View style={{ padding: spacing.lg, gap: spacing.md }}>
              <AppText {...sectionHeaderProps} style={{ ...sectionHeaderProps.style, marginBottom: 0 }}>
                Serviços & Peças
              </AppText>

              {(() => {
                const parts = (order.items ?? []).filter((i) => i.type === 'part');
                const services = (order.items ?? []).filter((i) => i.type === 'service');
                const hasItems = parts.length > 0 || services.length > 0;

                const renderItemRow = (
                  item: { id: string; description: string; quantity: number; unitPrice: number; total: number },
                ) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: spacing.sm,
                      paddingVertical: spacing.xs,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText variant="bodySmall" style={{ color: colors['on-surface'] }} numberOfLines={2}>
                        {item.description || '—'}
                      </AppText>
                      <AppText variant="labelSmall" color="text-tertiary">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </AppText>
                    </View>
                    <AppText variant="bodySmall" style={{ fontWeight: '600', color: colors.primary }}>
                      {formatCurrency(item.total)}
                    </AppText>
                  </View>
                );

                // If order carries no items, fall back to a single aggregated row per category.
                const fallbackParts = order.partsSubtotal > 0
                  ? [{ id: 'agg-parts', description: 'Peças aplicadas', quantity: 1, unitPrice: order.partsSubtotal, total: order.partsSubtotal }]
                  : [];
                const fallbackServices = order.laborSubtotal > 0
                  ? [{ id: 'agg-labor', description: 'Mão de obra', quantity: 1, unitPrice: order.laborSubtotal, total: order.laborSubtotal }]
                  : [];

                const partsRows = hasItems ? parts : fallbackParts;
                const servicesRows = hasItems ? services : fallbackServices;

                return (
                  <View style={{ gap: spacing.md }}>
                    {/* Peças */}
                    <View
                      style={{
                        borderRadius: br.field,
                        borderWidth: 1,
                        borderColor: colors['outline-variant'],
                        padding: spacing.md,
                        gap: spacing.xs,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                          <View
                            style={{
                              backgroundColor: colors['secondary-fixed'],
                              paddingHorizontal: spacing.sm,
                              paddingVertical: 2,
                              borderRadius: br.sm,
                            }}
                          >
                            <AppText
                              variant="labelSmall"
                              style={{ color: colors['on-secondary-fixed-variant'], fontWeight: '700' }}
                            >
                              PEÇAS
                            </AppText>
                          </View>
                          <AppText variant="labelSmall" color="text-tertiary">
                            {partsRows.length} {partsRows.length === 1 ? 'item' : 'itens'}
                          </AppText>
                        </View>
                        <AppText variant="bodySmall" style={{ fontWeight: '700', color: colors.primary }}>
                          {formatCurrency(order.partsSubtotal)}
                        </AppText>
                      </View>
                      {partsRows.length === 0 ? (
                        <AppText variant="labelSmall" color="text-tertiary" style={{ paddingVertical: spacing.xs }}>
                          Nenhuma peça registrada nesta OS.
                        </AppText>
                      ) : (
                        <View style={{ gap: 2 }}>{partsRows.map(renderItemRow)}</View>
                      )}
                    </View>

                    {/* Serviços */}
                    <View
                      style={{
                        borderRadius: br.field,
                        borderWidth: 1,
                        borderColor: colors['outline-variant'],
                        padding: spacing.md,
                        gap: spacing.xs,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                          <View
                            style={{
                              backgroundColor: colors['tertiary-fixed'],
                              paddingHorizontal: spacing.sm,
                              paddingVertical: 2,
                              borderRadius: br.sm,
                            }}
                          >
                            <AppText
                              variant="labelSmall"
                              style={{ color: colors['on-tertiary-fixed-variant'], fontWeight: '700' }}
                            >
                              SERVIÇOS
                            </AppText>
                          </View>
                          <AppText variant="labelSmall" color="text-tertiary">
                            {servicesRows.length} {servicesRows.length === 1 ? 'item' : 'itens'}
                          </AppText>
                        </View>
                        <AppText variant="bodySmall" style={{ fontWeight: '700', color: colors.primary }}>
                          {formatCurrency(order.laborSubtotal)}
                        </AppText>
                      </View>
                      {servicesRows.length === 0 ? (
                        <AppText variant="labelSmall" color="text-tertiary" style={{ paddingVertical: spacing.xs }}>
                          Nenhum serviço registrado nesta OS.
                        </AppText>
                      ) : (
                        <View style={{ gap: 2 }}>{servicesRows.map(renderItemRow)}</View>
                      )}
                    </View>
                  </View>
                );
              })()}

              {/* Discount + total */}
              {order.discount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="bodySmall" style={{ color: colors.secondary }}>Desconto</AppText>
                  <AppText variant="bodySmall" style={{ color: colors.secondary }}>
                    - {formatCurrency(order.discount)}
                  </AppText>
                </View>
              )}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: colors['outline-variant'],
                }}
              >
                <AppText variant="h4" style={{ color: colors.primary }}>
                  TOTAL
                </AppText>
                <AppText variant="h3" style={{ color: colors.primary, fontWeight: '800' }}>
                  {formatCurrency(order.total)}
                </AppText>
              </View>
            </View>

            <View style={{ paddingHorizontal: spacing.lg }}>
              <Divider spacing="none" />
            </View>

            <View style={{ padding: spacing.lg }}>
              <AppText {...sectionHeaderProps}>Observações</AppText>
              <TextArea
                value={editNotes}
                onChangeText={(v) => { setEditNotes(v); markChanged(); }}
                placeholder="Adicionar observações..."
                accessibilityLabel="Observações da ordem"
              />
            </View>

            <View
              style={{
                padding: spacing.md,
                backgroundColor: colors['surface-container-lowest'],
                borderTopWidth: 1,
                borderTopColor: colors['outline-variant'],
                alignItems: 'center',
              }}
            >
              <AppText variant="labelSmall" style={{ color: colors.outline }}>
                MotoCar Workshop Management System © {new Date().getFullYear()}
              </AppText>
            </View>
          </Card>

          <Button
            variant="secondary"
            title="Salvar Alterações"
            leftIcon="save"
            fullWidth
            loading={saving}
            disabled={!hasUnsavedChanges}
            onPress={handleSaveTicket}
          />

          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: spacing.sm }}>
            <View style={{ flex: isDesktop ? 1 : undefined, minWidth: isDesktop ? 120 : undefined }}>
              <Button
                variant="outline"
                title="Editar OS"
                leftIcon="edit"
                fullWidth
                onPress={handleEditOrder}
              />
            </View>
            {order.status !== 'cancelled' && (
              <View style={{ flex: isDesktop ? 1 : undefined, minWidth: isDesktop ? 120 : undefined }}>
                <Button
                  variant="outline"
                  title="Cancelar OS"
                  leftIcon="block"
                  fullWidth
                  onPress={handleCancelOrder}
                />
              </View>
            )}
            <View style={{ flex: isDesktop ? 1 : undefined, minWidth: isDesktop ? 120 : undefined }}>
              <Button
                variant="destructive"
                title="Excluir OS"
                leftIcon="delete"
                fullWidth
                onPress={handleDeleteOrder}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <View style={{ flex: 1, minWidth: 100 }}>
              <Button variant="outline" title="Voltar" fullWidth onPress={() => router.back()} />
            </View>
            <View style={{ flex: 1, minWidth: 100 }}>
              <Button
                variant="outline"
                title="WhatsApp"
                leftIcon="chat"
                fullWidth
                onPress={handleWhatsApp}
              />
            </View>
            <View style={{ flex: 1, minWidth: 100 }}>
              <Button
                variant="outline"
                title="Compartilhar"
                leftIcon="share"
                fullWidth
                loading={sharing}
                onPress={handleShare}
              />
            </View>
            <View style={{ flex: 1, minWidth: 100 }}>
              <Button
                variant="primary"
                title="Imprimir PDF"
                leftIcon="print"
                fullWidth
                onPress={handlePrint}
                loading={printing}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
