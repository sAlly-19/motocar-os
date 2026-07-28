import type { Appointment, AppNotification, Budget, Customer, Order, Part, Vehicle } from '../db/schema';

interface DeriveInput {
  orders: Order[];
  parts: Part[];
  appointments: Appointment[];
  budgets: Budget[];
  customers: Customer[];
  vehicles: Vehicle[];
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tomorrowISO(): string {
  const d = new Date(Date.now() + 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MS_IN_DAY = 86_400_000;

/**
 * Derives notifications on-the-fly from current store data.
 * Notification ids are DETERMINISTIC so that read/dismiss state persisted
 * separately can consistently identify them across sessions.
 */
export function deriveNotifications(input: DeriveInput): AppNotification[] {
  const { orders, parts, appointments, budgets, customers, vehicles } = input;
  const now = new Date();
  const nowIso = now.toISOString();
  const today = todayISO();
  const tomorrow = tomorrowISO();
  const out: AppNotification[] = [];

  // 1. Peças sem estoque
  for (const p of parts) {
    if (p.currentStock <= 0) {
      out.push({
        id: `outofstock:${p.id}`,
        type: 'urgent',
        title: 'Peça sem estoque',
        description: `${p.name} está zerada. Reponha o quanto antes.`,
        createdAt: nowIso,
        actionRoute: '/(tabs)/inventory',
        actionLabel: 'Abrir Estoque',
        sourceId: p.id,
      });
    } else if (p.currentStock < p.minStock) {
      out.push({
        id: `lowstock:${p.id}`,
        type: 'warning',
        title: 'Estoque baixo',
        description: `${p.name} — ${p.currentStock} un (mínimo ${p.minStock}).`,
        createdAt: nowIso,
        actionRoute: '/(tabs)/inventory',
        actionLabel: 'Abrir Estoque',
        sourceId: p.id,
      });
    }
  }

  // 2. OS com dueDate atrasada
  for (const o of orders) {
    if (o.status === 'finished' || o.status === 'cancelled') continue;
    if (!o.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(o.dueDate)) continue;
    if (o.dueDate < today) {
      const daysLate = Math.max(
        1,
        Math.round((now.getTime() - new Date(o.dueDate + 'T00:00:00').getTime()) / MS_IN_DAY),
      );
      out.push({
        id: `dueOrder:${o.id}`,
        type: 'urgent',
        title: 'OS atrasada',
        description: `OS #${o.number} está ${daysLate} dia(s) em atraso.`,
        createdAt: nowIso,
        actionRoute: `/ticket/${o.id}`,
        actionLabel: 'Abrir OS',
        sourceId: o.id,
      });
    }
  }

  // 3. OS aguardando aprovação
  for (const o of orders) {
    if (o.status !== 'waiting-approval') continue;
    out.push({
      id: `waitingApproval:${o.id}`,
      type: 'warning',
      title: 'OS aguardando aprovação',
      description: `OS #${o.number} está aguardando o cliente aprovar.`,
      createdAt: nowIso,
      actionRoute: `/ticket/${o.id}`,
      actionLabel: 'Abrir OS',
      sourceId: o.id,
    });
  }

  // 4. OS prontas para retirada
  for (const o of orders) {
    if (o.status !== 'ready') continue;
    out.push({
      id: `pickupReady:${o.id}`,
      type: 'info',
      title: 'Cliente aguardando retirada',
      description: `OS #${o.number} está pronta para retirada.`,
      createdAt: nowIso,
      actionRoute: `/ticket/${o.id}`,
      actionLabel: 'Abrir OS',
      sourceId: o.id,
    });
  }

  // 5. OS concluídas (aguardando faturamento) — status = 'finished'
  //    Só notificamos se foi finalizada há menos de 3 dias.
  const threeDaysAgoMs = now.getTime() - 3 * MS_IN_DAY;
  for (const o of orders) {
    if (o.status !== 'finished') continue;
    const t = new Date(o.updatedAt).getTime();
    if (Number.isNaN(t) || t < threeDaysAgoMs) continue;
    out.push({
      id: `readyToBill:${o.id}`,
      type: 'info',
      title: 'OS concluída',
      description: `OS #${o.number} finalizada — pronta para faturamento.`,
      createdAt: nowIso,
      actionRoute: '/billing',
      actionLabel: 'Abrir Faturamento',
      sourceId: o.id,
    });
  }

  // 6. Novas OS criadas (< 24h)
  const dayAgoMs = now.getTime() - MS_IN_DAY;
  for (const o of orders) {
    const t = new Date(o.createdAt).getTime();
    if (Number.isNaN(t) || t < dayAgoMs) continue;
    if (o.status === 'cancelled') continue;
    out.push({
      id: `newOrder:${o.id}`,
      type: 'info',
      title: 'Nova OS criada',
      description: `OS #${o.number} foi criada recentemente.`,
      createdAt: o.createdAt,
      actionRoute: `/ticket/${o.id}`,
      actionLabel: 'Abrir OS',
      sourceId: o.id,
    });
  }

  // 7. Agendamentos de hoje
  for (const a of appointments) {
    if (a.status === 'cancelled' || a.status === 'finished') continue;
    if (a.date !== today) continue;
    out.push({
      id: `todayAppt:${a.id}`,
      type: 'warning',
      title: 'Agendamento hoje',
      description: `${a.startTime} — ${a.title || 'Agendamento'}`,
      createdAt: nowIso,
      actionRoute: '/(tabs)/schedule',
      actionLabel: 'Abrir Agenda',
      sourceId: a.id,
    });
  }

  // 8. Agendamentos de amanhã
  for (const a of appointments) {
    if (a.status === 'cancelled' || a.status === 'finished') continue;
    if (a.date !== tomorrow) continue;
    out.push({
      id: `tomorrowAppt:${a.id}`,
      type: 'info',
      title: 'Agendamento amanhã',
      description: `${a.startTime} — ${a.title || 'Agendamento'}`,
      createdAt: nowIso,
      actionRoute: '/(tabs)/schedule',
      actionLabel: 'Abrir Agenda',
      sourceId: a.id,
    });
  }

  // 9. Orçamentos expirando em <= 7 dias e ainda ativos (draft/sent)
  const sevenDaysMs = 7 * MS_IN_DAY;
  for (const b of budgets) {
    if (b.status === 'approved' || b.status === 'expired') continue;
    if (!b.validUntil || !/^\d{4}-\d{2}-\d{2}$/.test(b.validUntil)) continue;
    const until = new Date(b.validUntil + 'T00:00:00').getTime();
    if (Number.isNaN(until)) continue;
    const diff = until - now.getTime();
    const cust = customers.find((c) => c.id === b.customerId);
    if (diff < 0) {
      out.push({
        id: `budgetExpired:${b.id}`,
        type: 'urgent',
        title: 'Orçamento vencido',
        description: `Orçamento de ${cust?.fullName ?? 'cliente'} venceu em ${b.validUntil}.`,
        createdAt: nowIso,
        actionRoute: '/budgets',
        actionLabel: 'Abrir Orçamentos',
        sourceId: b.id,
      });
    } else if (diff <= sevenDaysMs) {
      const daysLeft = Math.max(1, Math.ceil(diff / MS_IN_DAY));
      out.push({
        id: `budgetExpiring:${b.id}`,
        type: 'warning',
        title: 'Orçamento vencendo',
        description: `Orçamento de ${cust?.fullName ?? 'cliente'} vence em ${daysLeft} dia(s).`,
        createdAt: nowIso,
        actionRoute: '/budgets',
        actionLabel: 'Abrir Orçamentos',
        sourceId: b.id,
      });
    }
  }

  // 10. Novos clientes (< 24h)
  for (const c of customers) {
    const t = new Date(c.createdAt).getTime();
    if (Number.isNaN(t) || t < dayAgoMs) continue;
    out.push({
      id: `newCustomer:${c.id}`,
      type: 'info',
      title: 'Novo cliente cadastrado',
      description: c.fullName,
      createdAt: c.createdAt,
      actionRoute: `/customers/${c.id}`,
      actionLabel: 'Abrir Cliente',
      sourceId: c.id,
    });
  }

  // 11. Novos veículos (catálogo) < 24h — util pra oficina
  for (const v of vehicles) {
    const t = new Date(v.createdAt).getTime();
    if (Number.isNaN(t) || t < dayAgoMs) continue;
    out.push({
      id: `newVehicle:${v.id}`,
      type: 'info',
      title: 'Novo veículo no catálogo',
      description: `${v.brand} ${v.model}${v.year ? ` (${v.year})` : ''}`,
      createdAt: v.createdAt,
      actionRoute: `/vehicles/${v.id}`,
      actionLabel: 'Abrir Veículo',
      sourceId: v.id,
    });
  }

  // Ordena por createdAt desc.
  out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return out;
}
