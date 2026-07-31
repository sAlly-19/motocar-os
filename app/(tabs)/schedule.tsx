import { useMemo, useRef } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors, spacing } from '../../src/theme';
import { StatusBadge } from '../../src/ui';
import { Icon } from '../../src/components/Icon';
import { GlassCard } from '../../src/components/GlassCard';
import { useAppStore } from '../../src/stores/useAppStore';
import { useTeamStore } from '../../src/stores/useTeamStore';
import { EmptyState } from '../../src/components/EmptyState';
import { AppText, Button } from '../../src/ui';
import { useShallow } from 'zustand/react/shallow';

// Capacidade diária padrão: 20 OS em andamento simultâneas.
const DAILY_CAPACITY = 20;

const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  waiting: 'Aguardando',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};

const APPOINTMENT_STATUS_VARIANT: Record<string, 'ready' | 'waiting' | 'finished' | 'out-of-stock'> = {
  confirmed: 'ready',
  waiting: 'waiting',
  finished: 'finished',
  cancelled: 'out-of-stock',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export default function ScheduleScreen() {
  const colors = useThemeColors();
  const { appointments, orders, customers } = useAppStore(
    useShallow((s) => ({
      appointments: s.appointments,
      orders: s.orders,
      customers: s.customers,
    }))
  );

  const employees = useTeamStore((s) => s.employees);
  const scrollRef = useRef<ScrollView>(null);

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayDate = new Date()
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();

  // Agendamentos de hoje, ordenados por horário.
  const todayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.date === todayISO && a.status !== 'cancelled')
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [appointments, todayISO],
  );

  const deliveries = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'ready' || o.status === 'in-progress')
        .slice(0, 5),
    [orders],
  );

  // Carga da oficina = OS in-progress / capacidade * 100
  const inProgressCount = useMemo(
    () => orders.filter((o) => o.status === 'in-progress').length,
    [orders],
  );
  const loadPercent = Math.min(100, Math.round((inProgressCount / DAILY_CAPACITY) * 100));

  // Técnicos ativos (para o cluster de avatares).
  const activeMechanics = useMemo(
    () => employees.filter((e) => e.status === 'active' && (e.role === 'mechanic' || e.role === 'assistant')),
    [employees],
  );
  const shownAvatars = activeMechanics.slice(0, 3);
  const remainingAvatars = Math.max(0, activeMechanics.length - shownAvatars.length);

  const getCustomerName = (id: string) =>
    customers.find((c) => c.id === id)?.fullName ?? '—';
  /**
   * Placa "snapshot" da OS mais recente vinculada a um vehicleId. Como Vehicle
   * é um catálogo agora, precisamos derivar da OS. Se não achar, retorna '—'.
   */
  const getVehiclePlate = (vehicleId: string) => {
    const o = orders.find((ord) => ord.vehicleId === vehicleId && ord.plate);
    return o?.plate || '—';
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing['margin-mobile'], paddingBottom: 120 }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: spacing.lg,
            flexWrap: 'wrap',
            gap: spacing.sm,
          }}
        >
          <View>
            <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
              {todayDate}
            </AppText>
            <AppText variant="h1" style={{ color: colors.primary }}>
              Agenda Inteligente
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              variant="surface"
              title="Hoje"
              icon="calendar_today"
              size="sm"
              onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
            />
            <Button
              variant="primary"
              title="Novo Agendamento"
              icon="add"
              size="sm"
              onPress={() => router.push('/schedule/new')}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.gutter, flexWrap: 'wrap' }}>
          <View style={{ flex: 2, minWidth: 300 }}>
            <GlassCard style={{ padding: spacing.lg }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.lg,
                }}
              >
                <AppText variant="h4" style={{ color: colors.primary }}>
                  Agenda do Dia
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {shownAvatars.length === 0 ? (
                    <AppText variant="labelSmall" color="text-tertiary">
                      Sem equipe ativa
                    </AppText>
                  ) : (
                    <>
                      {shownAvatars.map((emp, i) => (
                        <View
                          key={emp.id}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: colors['primary-container'],
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: colors.surface,
                            marginLeft: i > 0 ? -8 : 0,
                          }}
                        >
                          <AppText variant="labelSmall" style={{ color: colors['on-primary-container'] }}>
                            {initials(emp.fullName)}
                          </AppText>
                        </View>
                      ))}
                      {remainingAvatars > 0 && (
                        <AppText variant="labelSmall" color="text-secondary" style={{ marginLeft: spacing.xs }}>
                          +{remainingAvatars}
                        </AppText>
                      )}
                    </>
                  )}
                </View>
              </View>
              {todayAppointments.length === 0 ? (
                <EmptyState
                  illustration="empty-schedule"
                  icon="calendar_month"
                  title="Nenhum agendamento para hoje"
                  subtitle="Agende um novo serviço para começar."
                  action={
                    <Button
                      variant="primary"
                      title="Novo Agendamento"
                      icon="add"
                      onPress={() => router.push('/schedule/new')}
                    />
                  }
                />
              ) : (
                <View>
                  {todayAppointments.map((apt) => (
                    <Pressable
                      key={apt.id}
                      onPress={() =>
                        router.push({ pathname: '/schedule/new', params: { edit: apt.id } })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Editar agendamento: ${apt.startTime} - ${apt.title}. ${apt.description}. Status: ${APPOINTMENT_STATUS_LABEL[apt.status] ?? apt.status}.`}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: spacing.md,
                        paddingVertical: spacing.md,
                        paddingLeft: spacing.sm,
                        paddingRight: spacing.sm,
                        borderRadius: 8,
                        backgroundColor: pressed ? colors['surface-container'] : 'transparent',
                      })}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: colors.secondary,
                          marginTop: 6,
                          zIndex: 1,
                        }}
                      />
                      <View
                        style={{
                          position: 'absolute',
                          left: 8,
                          top: 16,
                          bottom: 0,
                          width: 2,
                          backgroundColor: colors['outline-variant'],
                        }}
                      />
                      <AppText variant="label" color="text-secondary" style={{ width: 56, marginTop: 4 }}>
                        {apt.startTime}
                      </AppText>
                      <View style={{ flex: 1 }}>
                        <AppText variant="body" style={{ color: colors.primary, fontWeight: '600' }}>
                          {apt.title || `Cliente ${getCustomerName(apt.customerId)}`}
                        </AppText>
                        <AppText variant="bodySmall" color="text-secondary">
                          {apt.description || `${getVehiclePlate(apt.vehicleId)}`}
                        </AppText>
                      </View>
                      <StatusBadge
                        variant={APPOINTMENT_STATUS_VARIANT[apt.status] ?? 'waiting'}
                        label={APPOINTMENT_STATUS_LABEL[apt.status] ?? apt.status}
                      />
                    </Pressable>
                  ))}
                </View>
              )}
            </GlassCard>
          </View>

          <View style={{ flex: 1, minWidth: 250, gap: spacing.gutter }}>
            <GlassCard style={{ padding: spacing.lg }}>
              <AppText variant="h4" style={{ color: colors.primary, marginBottom: spacing.md }}>
                Entregas do Dia
              </AppText>
              {deliveries.length === 0 ? (
                <AppText
                  variant="bodySmall"
                  color="text-tertiary"
                  style={{ textAlign: 'center', paddingVertical: spacing.md }}
                >
                  Nenhuma entrega pendente
                </AppText>
              ) : (
                deliveries.map((order) => (
                  <View
                    key={order.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingVertical: spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: colors['outline-variant'],
                    }}
                  >
                    <Icon name="directions_car" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="label" style={{ color: colors.primary }}>
                        OS #{order.number}
                      </AppText>
                      <AppText variant="labelSmall" style={{ color: colors['on-surface-variant'] }}>
                        {order.status === 'ready' ? 'Pronto para entrega' : 'Em andamento'}
                      </AppText>
                    </View>
                    <StatusBadge
                      variant={order.status === 'ready' ? 'ideal' : 'in-execution'}
                      label={order.status === 'ready' ? 'Pronto' : 'Andamento'}
                    />
                  </View>
                ))
              )}
            </GlassCard>

            <GlassCard style={{ padding: spacing.lg }}>
              <AppText variant="h4" style={{ color: colors.primary, marginBottom: spacing.md }}>
                Carga Diária da Oficina
              </AppText>
              <View
                style={{
                  height: 12,
                  backgroundColor: colors['surface-container'],
                  borderRadius: 6,
                  overflow: 'hidden',
                  marginBottom: spacing.sm,
                }}
              >
                <View
                  style={{
                    height: '100%',
                    backgroundColor: loadPercent >= 90 ? colors.error : loadPercent >= 70 ? colors.secondary : colors.success,
                    borderRadius: 6,
                    width: `${loadPercent}%`,
                  }}
                />
              </View>
              <AppText variant="label" color="text-secondary">
                {loadPercent}% — {inProgressCount} de {DAILY_CAPACITY} OS em andamento
              </AppText>
            </GlassCard>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
