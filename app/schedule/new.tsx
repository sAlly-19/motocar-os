import { useState, useMemo, useRef, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, spacing } from '../../src/theme';
import { FormField } from '../../src/components/FormField';
import { DateField } from '../../src/components/DateField';
import { CardHeader } from '../../src/components/CardHeader';
import { AppShell } from '../../src/components/AppShell';
import { AppText, Button, Dialog, Select } from '../../src/ui';
import { useDialog } from '../../src/components/DialogContext';
import { useAppStore } from '../../src/stores/useAppStore';
import { useTeamStore } from '../../src/stores/useTeamStore';
import { generateId } from '../../src/utils/generateId';
import { triggerHaptic } from '../../src/utils/haptics';

const ELIGIBLE_STATUSES = ['open', 'waiting-approval', 'in-progress'];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Tela combinada de novo agendamento + edição. Se receber `?edit=aptId`,
 * carrega o agendamento existente e permite editar/excluir; caso contrário
 * funciona como criação.
 *
 * O mecânico responsável NÃO é editado aqui — a informação pertence à OS
 * (order.technicianId). O agendamento herda o técnico automaticamente ao
 * ser salvo, mantendo a fonte única da verdade.
 */
export default function AppointmentFormScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showConfirm, showAlert } = useDialog();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = !!edit;

  const orders = useAppStore((s) => s.orders);
  const customers = useAppStore((s) => s.customers);
  const vehicles = useAppStore((s) => s.vehicles);
  const appointments = useAppStore((s) => s.appointments);
  const addAppointment = useAppStore((s) => s.addAppointment);
  const updateAppointment = useAppStore((s) => s.updateAppointment);
  const deleteAppointment = useAppStore((s) => s.deleteAppointment);
  const employees = useTeamStore((s) => s.employees);

  const existing = useMemo(
    () => (isEdit ? appointments.find((a) => a.id === edit) : undefined),
    [isEdit, edit, appointments],
  );

  const [orderId, setOrderId] = useState('');
  const [date, setDate] = useState(isoDate(new Date()));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const markChanged = () => setHasUnsavedChanges(true);
  const scrollRef = useRef<ScrollView>(null);

  // Seed dos dados ao editar.
  useEffect(() => {
    if (isEdit && existing && !initialized) {
      // Descobrir OS via title ("OS #NUMERO") — melhor heurística sem novo campo.
      const number = existing.title.replace(/^OS #/, '').trim();
      const linkedOrder = orders.find((o) => o.number === number);
      if (linkedOrder) setOrderId(linkedOrder.id);
      setDate(existing.date);
      setStartTime(existing.startTime);
      setEndTime(existing.endTime);
      setNotes(existing.description ?? '');
      setInitialized(true);
    } else if (!isEdit && !initialized) {
      setInitialized(true);
    }
  }, [isEdit, existing, initialized, orders]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      showConfirm(
        'Descartar alterações?',
        'Você tem alterações não salvas.',
        () => navigation.dispatch(e.data.action),
      );
    });
    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  // Ordens elegíveis + a OS já vinculada (mesmo se não for mais elegível).
  const orderOptions = useMemo(() => {
    const list = orders.filter(
      (o) => ELIGIBLE_STATUSES.includes(o.status) || o.id === orderId,
    );
    return list.map((o) => {
      const cust = customers.find((c) => c.id === o.customerId);
      const veh = vehicles.find((v) => v.id === o.vehicleId);
      const plate = (o.plate ?? '').trim();
      const modelLabel = veh ? `${veh.brand} ${veh.model}`.trim() : '';
      const parts = [
        `#${o.number}`,
        cust?.fullName ?? 'Cliente removido',
        plate || null,
        modelLabel || null,
      ].filter(Boolean);
      return {
        label: parts.join(' · '),
        value: o.id,
        hint: plate || undefined,
        icon: 'assignment',
      };
    });
  }, [orders, customers, vehicles, orderId]);

  const selectedOrder = orders.find((o) => o.id === orderId);
  const orderCustomer = customers.find((c) => c.id === selectedOrder?.customerId);
  const orderVehicle = vehicles.find((v) => v.id === selectedOrder?.vehicleId);
  const orderMechanic = selectedOrder?.technicianId
    ? employees.find((e) => e.id === selectedOrder.technicianId)
    : undefined;

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!orderId) errs.orderId = 'Selecione uma ordem de serviço';
    if (!date) errs.date = 'Data obrigatória';
    if (!startTime) errs.startTime = 'Início obrigatório';
    if (!/^\d{2}:\d{2}$/.test(startTime)) errs.startTime = 'Formato HH:MM';
    if (!endTime) errs.endTime = 'Fim obrigatório';
    if (!/^\d{2}:\d{2}$/.test(endTime)) errs.endTime = 'Formato HH:MM';
    if (startTime >= endTime) errs.endTime = 'Fim deve ser depois do início';
    return errs;
  };

  const detectConflicts = () => {
    // Herda o técnico da OS. Se a OS não tem técnico, não há como detectar conflito.
    if (!selectedOrder?.technicianId) return [];
    return appointments.filter((apt) => {
      if (isEdit && apt.id === edit) return false; // ignora o próprio
      if (apt.status === 'cancelled') return false;
      if (apt.date !== date) return false;
      if (!apt.technicianIds?.includes(selectedOrder.technicianId!)) return false;
      return overlaps(startTime, endTime, apt.startTime, apt.endTime);
    });
  };

  const finalizeSave = () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const techIds = selectedOrder?.technicianId ? [selectedOrder.technicianId] : [];
      const payload = {
        customerId: selectedOrder!.customerId,
        vehicleId: selectedOrder!.vehicleId,
        title: `OS #${selectedOrder!.number}`,
        description:
          notes.trim() ||
          `${orderCustomer?.fullName ?? ''} · ${selectedOrder?.plate ?? ''}`.trim(),
        date,
        startTime,
        endTime,
        technicianIds: techIds,
        updatedAt: now,
      };

      if (isEdit && existing) {
        updateAppointment(existing.id, payload);
      } else {
        addAppointment({
          id: generateId(),
          status: 'confirmed',
          createdAt: now,
          ...payload,
        });
      }
      triggerHaptic('success');
      setHasUnsavedChanges(false);
      setSuccessModal(true);
    } catch (e) {
      showAlert('Erro', `Não foi possível salvar: ${e instanceof Error ? e.message : 'erro'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showAlert('Atenção', 'Corrija os campos destacados.');
      return;
    }
    const conflicts = detectConflicts();
    if (conflicts.length > 0) {
      const first = conflicts[0];
      showConfirm(
        'Conflito de horário',
        `O mecânico responsável (${orderMechanic?.fullName ?? 'atribuído à OS'}) já tem agendamento das ${first.startTime} às ${first.endTime} nessa data. Deseja salvar mesmo assim?`,
        () => finalizeSave(),
      );
      return;
    }
    finalizeSave();
  };

  const handleDelete = () => {
    if (!existing) return;
    showConfirm(
      'Excluir agendamento?',
      `Esta ação é permanente. Excluir o agendamento de ${existing.date} das ${existing.startTime} às ${existing.endTime}?`,
      () => {
        setDeleting(true);
        try {
          deleteAppointment(existing.id);
          triggerHaptic('warning');
          setHasUnsavedChanges(false);
          router.back();
        } finally {
          setDeleting(false);
        }
      },
    );
  };

  if (isEdit && !existing) {
    return (
      <AppShell>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <AppText variant="h3" style={{ color: colors.primary }}>
            Agendamento não encontrado
          </AppText>
          <AppText variant="bodySmall" color="text-secondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
            Este agendamento foi removido ou o link está incorreto.
          </AppText>
          <Button
            variant="primary"
            title="Voltar"
            onPress={() => router.back()}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing['margin-mobile'],
            paddingBottom: spacing.xxl * 2 + insets.bottom,
            maxWidth: 720,
            width: '100%',
            alignSelf: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}
          >
            <View style={{ flex: 1, minWidth: 200 }}>
              <AppText variant="h1" style={{ color: colors.primary, marginBottom: spacing.xs }}>
                {isEdit ? 'Editar Agendamento' : 'Novo Agendamento'}
              </AppText>
              <AppText variant="bodySmall" color="text-secondary">
                {isEdit
                  ? 'Ajuste data, horário ou vínculo com a OS.'
                  : 'Vincule uma OS em aberto a uma data e horário.'}
              </AppText>
            </View>
            {isEdit && (
              <Button
                variant="destructive"
                title="Excluir"
                icon="delete"
                loading={deleting}
                onPress={handleDelete}
              />
            )}
          </View>

          {/* Ordem de Serviço */}
          <View
            style={{
              backgroundColor: colors['surface-container-lowest'],
              borderWidth: 1,
              borderColor: colors['outline-variant'],
              borderRadius: br.xl,
              overflow: 'hidden',
              marginBottom: spacing.gutter,
            }}
          >
            <CardHeader title="Ordem de Serviço" icon="assignment" />
            <View style={{ padding: spacing.lg }}>
              <Select
                label="OS em aberto"
                placeholder="Selecione uma ordem de serviço"
                selectedValue={orderId}
                options={orderOptions}
                onSelect={(id) => { setOrderId(id); clearError('orderId'); markChanged(); }}
                emptyLabel="Nenhuma OS em aberto disponível"
                error={errors.orderId}
                createOption={{
                  label: 'Criar nova OS',
                  icon: 'add_circle',
                  onPress: () => router.push('/orders/new'),
                }}
              />
              {selectedOrder && (
                <View
                  style={{
                    marginTop: spacing.sm,
                    padding: spacing.md,
                    borderRadius: br.field,
                    backgroundColor: colors['surface-container-low'],
                    gap: 4,
                  }}
                >
                  <AppText variant="labelSmall" color="text-secondary">
                    Cliente
                  </AppText>
                  <AppText variant="bodySmall" style={{ fontWeight: '600' }}>
                    {orderCustomer?.fullName ?? '—'}
                  </AppText>
                  <AppText variant="labelSmall" color="text-secondary" style={{ marginTop: 4 }}>
                    Veículo
                  </AppText>
                  <AppText variant="bodySmall" style={{ fontWeight: '600' }}>
                    {selectedOrder?.plate ?? '—'} {orderVehicle ? `— ${orderVehicle.brand} ${orderVehicle.model}` : ''}
                  </AppText>
                  {orderMechanic && (
                    <>
                      <AppText variant="labelSmall" color="text-secondary" style={{ marginTop: 4 }}>
                        Mecânico responsável (da OS)
                      </AppText>
                      <AppText variant="bodySmall" style={{ fontWeight: '600' }}>
                        {orderMechanic.fullName}
                      </AppText>
                    </>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Data & Hora */}
          <View
            style={{
              backgroundColor: colors['surface-container-lowest'],
              borderWidth: 1,
              borderColor: colors['outline-variant'],
              borderRadius: br.xl,
              overflow: 'hidden',
              marginBottom: spacing.gutter,
            }}
          >
            <CardHeader title="Data & Horário" icon="calendar_month" />
            <View style={{ padding: spacing.lg }}>
              <DateField
                label="Data"
                value={date}
                onChange={(iso) => { setDate(iso); clearError('date'); markChanged(); }}
                error={errors.date}
                minDate={isEdit ? undefined : new Date().toISOString().slice(0, 10)}
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Início"
                    placeholder="HH:MM"
                    value={startTime}
                    onChangeText={(v) => { setStartTime(v); clearError('startTime'); markChanged(); }}
                    error={errors.startTime}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Fim"
                    placeholder="HH:MM"
                    value={endTime}
                    onChangeText={(v) => { setEndTime(v); clearError('endTime'); markChanged(); }}
                    error={errors.endTime}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Observações */}
          <View
            style={{
              backgroundColor: colors['surface-container-lowest'],
              borderWidth: 1,
              borderColor: colors['outline-variant'],
              borderRadius: br.xl,
              overflow: 'hidden',
              marginBottom: spacing.gutter,
            }}
          >
            <CardHeader title="Observações" icon="notes" />
            <View style={{ padding: spacing.lg }}>
              <FormField
                label="Notas do agendamento"
                placeholder="Detalhes adicionais..."
                value={notes}
                onChangeText={(v) => { setNotes(v); markChanged(); }}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>
          </View>

          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <Button
              variant="primary"
              title={isEdit ? 'Salvar alterações' : 'Confirmar agendamento'}
              icon="check"
              fullWidth
              loading={saving}
              disabled={saving}
              onPress={handleSave}
            />
            <Button variant="outline" title="Cancelar" fullWidth onPress={() => router.back()} />
          </View>
        </ScrollView>

        <Dialog
          visible={successModal}
          title={isEdit ? 'Agendamento atualizado!' : 'Agendamento criado!'}
          message={`Agendamento para ${date} das ${startTime} às ${endTime} confirmado.`}
          confirmLabel="OK"
          type="success"
          onConfirm={() => {
            setSuccessModal(false);
            router.back();
          }}
        />
      </KeyboardAvoidingView>
    </AppShell>
  );
}
