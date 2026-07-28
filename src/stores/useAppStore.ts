import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Customer, Vehicle, Order, OrderItem, Part, Appointment, Budget, OrderStatus } from '../db/schema';
import {
  getAllData,
  insertCustomer,
  updateCustomer as firebaseUpdateCustomer,
  deleteCustomer as firebaseDeleteCustomer,
  insertVehicle,
  updateVehicle as firebaseUpdateVehicle,
  deleteVehicle as firebaseDeleteVehicle,
  insertOrder,
  insertOrderWithRelations,
  updateOrderStatus as firebaseUpdateStatus,
  updateOrderFields as firebaseUpdateOrderFields,
  deleteOrder as firebaseDeleteOrder,
  insertPart,
  updatePart as firebaseUpdatePart,
  deletePart as firebaseDeletePart,
  updatePartStock as firebaseUpdateStock,
  insertAppointment,
  updateAppointment as firebaseUpdateAppointment,
  deleteAppointment as firebaseDeleteAppointment,
  insertBudget,
  updateBudget as firebaseUpdateBudget,
  updateBudgetStatus as firebaseUpdateBudgetStatus,
  deleteBudget as firebaseDeleteBudget,
} from '../services/firebase/data';
import { consumeStock, restoreStock, computeStockUpdates, diffStockDeltas } from '../utils/stockSync';

interface SnackbarMsg {
  message: string;
  type: 'error' | 'success' | 'info';
  duration?: number;
}

interface AppState {
  customers: Customer[];
  vehicles: Vehicle[];
  orders: Order[];
  parts: Part[];
  appointments: Appointment[];
  budgets: Budget[];
  initialized: boolean;
  error: string | null;
  snackbar: SnackbarMsg | null;

  initialize: () => void;
  reload: () => void;
  addCustomer: (c: Customer) => void;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addVehicle: (v: Vehicle) => void;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  addOrder: (o: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrderFields: (
    id: string,
    fields: Partial<Pick<Order, 'status' | 'notes' | 'mileage' | 'plate' | 'dueDate' | 'technicianId' | 'items'>>,
  ) => void;
  /**
   * Adiciona a OS junto com as relações passadas, se houver, numa única transação.
   */
  addOrderWithRelations: (payload: { customer?: Customer; vehicle?: Vehicle; order: Order }) => void;
  /** Substitui a lista de itens e ajusta o estoque automaticamente (diff). */
  updateOrderItems: (id: string, items: OrderItem[]) => void;
  /** Remove permanentemente. Devolve peças ao estoque se estava ativa. */
  deleteOrder: (id: string) => void;
  addPart: (p: Part) => void;
  updatePart: (id: string, patch: Partial<Part>) => void;
  deletePart: (id: string) => void;
  updatePartStock: (id: string, qty: number) => void;
  addAppointment: (a: Appointment) => void;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  addBudget: (b: Budget) => void;
  updateBudgetStatus: (id: string, status: Budget['status']) => void;
  updateBudget: (id: string, patch: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  clearError: () => void;
  showSnackbar: (msg: SnackbarMsg) => void;
  clearSnackbar: () => void;
}

let initializing = false;

function errorMessage(prefix: string, e: unknown) {
  return `${prefix}: ${e instanceof Error ? e.message : 'erro desconhecido'}`;
}

export const usePendingCount = () => useAppStore(useShallow((s) => s.orders.filter((o) => o.status === 'open' || o.status === 'in-progress').length));

export const useAppStore = create<AppState>((set, get) => ({
  customers: [],
  vehicles: [],
  orders: [],
  parts: [],
  appointments: [],
  budgets: [],
  initialized: false,
  error: null,
  snackbar: null,

  initialize: () => {
    const state = get();
    if (state.initialized || initializing) return;
    initializing = true;
    getAllData()
      .then((data) => set({ ...data, initialized: true, error: null }))
      .catch((e) => set({ error: errorMessage('Erro ao inicializar Firebase', e), initialized: true }))
      .finally(() => {
        initializing = false;
      });
  },

  reload: () => {
    getAllData()
      .then((data) => set({ ...data, error: null }))
      .catch((e) => set({ error: errorMessage('Erro ao recarregar Firebase', e) }));
  },

  addCustomer: (c) => {
    set((s) => ({ customers: [c, ...s.customers] }));
    insertCustomer(c).catch((e) => {
      set((s) => ({ customers: s.customers.filter((item) => item.id !== c.id), error: errorMessage('Erro ao salvar cliente', e) }));
    });
  },

  updateCustomer: (id, patch) => {
    const previous = get().customers;
    set((s) => ({ customers: s.customers.map((c) => c.id === id ? { ...c, ...patch } : c) }));
    firebaseUpdateCustomer(id, patch).catch((e) => set({ customers: previous, error: errorMessage('Erro ao atualizar cliente', e) }));
  },

  deleteCustomer: (id) => {
    const previous = get().customers;
    set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }));
    firebaseDeleteCustomer(id).catch((e) => set({ customers: previous, error: errorMessage('Erro ao excluir cliente', e) }));
  },

  addVehicle: (v) => {
    set((s) => ({ vehicles: [v, ...s.vehicles] }));
    insertVehicle(v).catch((e) => {
      set((s) => ({ vehicles: s.vehicles.filter((item) => item.id !== v.id), error: errorMessage('Erro ao salvar veiculo', e) }));
    });
  },

  updateVehicle: (id, patch) => {
    const previous = get().vehicles;
    set((s) => ({ vehicles: s.vehicles.map((v) => v.id === id ? { ...v, ...patch } : v) }));
    firebaseUpdateVehicle(id, patch).catch((e) => set({ vehicles: previous, error: errorMessage('Erro ao atualizar veiculo', e) }));
  },

  deleteVehicle: (id) => {
    const previous = get().vehicles;
    set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) }));
    firebaseDeleteVehicle(id).catch((e) => set({ vehicles: previous, error: errorMessage('Erro ao excluir veiculo', e) }));
  },

  addOrder: (o) => {
    set((s) => ({ orders: [o, ...s.orders] }));
    insertOrder(o).catch((e) => {
      set((s) => ({ orders: s.orders.filter((item) => item.id !== o.id), error: errorMessage('Erro ao salvar ordem', e) }));
    });
    // Estoque: consome peças da OS (status ativa considerada 'open').
    // Orçamentos NUNCA passam por aqui — chamam `addBudget` diretamente.
    const isActive = o.status !== 'cancelled' && o.status !== 'draft';
    if (isActive && o.items && o.items.length > 0) {
      const updates = consumeStock(get().parts, o.items);
      updates.forEach(({ partId, newStock }) => get().updatePartStock(partId, newStock));
    }
  },

  addOrderWithRelations: (payload) => {
    const o = payload.order;
    set((s) => ({ orders: [o, ...s.orders] }));
    insertOrderWithRelations(payload).catch((e) => {
      set((s) => ({
        orders: s.orders.filter((item) => item.id !== o.id),
        error: errorMessage('Erro ao salvar ordem com relacoes', e),
      }));
    });
    // Atualiza estoque para OS ativa
    const isActive = o.status !== 'cancelled' && o.status !== 'draft';
    if (isActive && o.items && o.items.length > 0) {
      const updates = consumeStock(get().parts, o.items);
      updates.forEach(({ partId, newStock }) => get().updatePartStock(partId, newStock));
    }
  },

  updateOrderStatus: (id, status) => {
    const previous = get().orders;
    const before = previous.find((o) => o.id === id);
    set((s) => ({ orders: s.orders.map((o) => o.id === id ? { ...o, status } : o) }));
    firebaseUpdateStatus(id, status).catch((e) => set({ orders: previous, error: errorMessage('Erro ao atualizar status', e) }));

    // Estoque: reage a transições de/para 'cancelled' / 'draft'.
    if (!before) return;
    const wasActive = before.status !== 'cancelled' && before.status !== 'draft';
    const nowActive = status !== 'cancelled' && status !== 'draft';
    const items = before.items ?? [];
    if (wasActive && !nowActive) {
      // Devolve peças ao estoque.
      const updates = restoreStock(get().parts, items);
      updates.forEach(({ partId, newStock }) => get().updatePartStock(partId, newStock));
    } else if (!wasActive && nowActive) {
      // Reconsome peças do estoque.
      const updates = consumeStock(get().parts, items);
      updates.forEach(({ partId, newStock }) => get().updatePartStock(partId, newStock));
    }
  },

  updateOrderFields: (id, fields) => {
    const previous = get().orders;
    const before = previous.find((o) => o.id === id);
    set((s) => ({ orders: s.orders.map((o) => o.id === id ? { ...o, ...fields } : o) }));
    firebaseUpdateOrderFields(id, fields).catch((e) => set({ orders: previous, error: errorMessage('Erro ao atualizar ordem', e) }));

    // Se `status` mudou, reaplica a mesma lógica de updateOrderStatus.
    if (before && fields.status && fields.status !== before.status) {
      const wasActive = before.status !== 'cancelled' && before.status !== 'draft';
      const nowActive = fields.status !== 'cancelled' && fields.status !== 'draft';
      const items = before.items ?? [];
      if (wasActive && !nowActive) {
        const updates = restoreStock(get().parts, items);
        updates.forEach(({ partId, newStock }) => get().updatePartStock(partId, newStock));
      } else if (!wasActive && nowActive) {
        const updates = consumeStock(get().parts, items);
        updates.forEach(({ partId, newStock }) => get().updatePartStock(partId, newStock));
      }
    }
  },

  updateOrderItems: (id, items) => {
    const previous = get().orders;
    const before = previous.find((o) => o.id === id);
    if (!before) return;

    set((s) => ({ orders: s.orders.map((o) => o.id === id ? { ...o, items } : o) }));
    firebaseUpdateOrderFields(id, { items }).catch((e) =>
      set({ orders: previous, error: errorMessage('Erro ao atualizar itens da OS', e) }),
    );

    // Estoque: só reage se a OS estiver ativa.
    const isActive = before.status !== 'cancelled' && before.status !== 'draft';
    if (!isActive) return;

    const deltas = diffStockDeltas(before.items, items);
    const updates = computeStockUpdates(get().parts, deltas);
    updates.forEach(({ partId, newStock }) => get().updatePartStock(partId, newStock));
  },

  deleteOrder: (id) => {
    const previous = get().orders;
    const before = previous.find((o) => o.id === id);
    set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }));
    firebaseDeleteOrder(id).catch((e) =>
      set({ orders: previous, error: errorMessage('Erro ao excluir OS', e) }),
    );

    // Se a OS estava ativa, devolve as peças ao estoque.
    if (before && before.status !== 'cancelled' && before.status !== 'draft' && before.items?.length) {
      const updates = restoreStock(get().parts, before.items);
      updates.forEach(({ partId, newStock }) => get().updatePartStock(partId, newStock));
    }
  },

  addPart: (p) => {
    set((s) => ({ parts: [p, ...s.parts].sort((a, b) => a.name.localeCompare(b.name)) }));
    insertPart(p).catch((e) => {
      set((s) => ({ parts: s.parts.filter((item) => item.id !== p.id), error: errorMessage('Erro ao salvar peca', e) }));
    });
  },

  updatePart: (id, patch) => {
    const previous = get().parts;
    set((s) => ({ parts: s.parts.map((p) => p.id === id ? { ...p, ...patch } : p) }));
    firebaseUpdatePart(id, patch).catch((e) => set({ parts: previous, error: errorMessage('Erro ao atualizar peca', e) }));
  },

  deletePart: (id) => {
    const previous = get().parts;
    set((s) => ({ parts: s.parts.filter((p) => p.id !== id) }));
    firebaseDeletePart(id).catch((e) => set({ parts: previous, error: errorMessage('Erro ao excluir peca', e) }));
  },

  updatePartStock: (id, qty) => {
    const previous = get().parts;
    set((s) => ({ parts: s.parts.map((p) => p.id === id ? { ...p, currentStock: qty } : p) }));
    firebaseUpdateStock(id, qty).catch((e) => set({ parts: previous, error: errorMessage('Erro ao atualizar estoque', e) }));
  },

  addAppointment: (a) => {
    set((s) => ({ appointments: [a, ...s.appointments] }));
    insertAppointment(a).catch((e) => {
      set((s) => ({ appointments: s.appointments.filter((item) => item.id !== a.id), error: errorMessage('Erro ao salvar agendamento', e) }));
    });
  },

  updateAppointment: (id, patch) => {
    const previous = get().appointments;
    set((s) => ({ appointments: s.appointments.map((a) => a.id === id ? { ...a, ...patch } : a) }));
    firebaseUpdateAppointment(id, patch).catch((e) => set({ appointments: previous, error: errorMessage('Erro ao atualizar agendamento', e) }));
  },

  deleteAppointment: (id) => {
    const previous = get().appointments;
    set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) }));
    firebaseDeleteAppointment(id).catch((e) => set({ appointments: previous, error: errorMessage('Erro ao excluir agendamento', e) }));
  },

  addBudget: (b) => {
    set((s) => ({ budgets: [b, ...s.budgets] }));
    insertBudget(b).catch((e) => {
      set((s) => ({ budgets: s.budgets.filter((item) => item.id !== b.id), error: errorMessage('Erro ao salvar orcamento', e) }));
    });
  },

  updateBudgetStatus: (id, status) => {
    const previous = get().budgets;
    set((s) => ({ budgets: s.budgets.map((b) => b.id === id ? { ...b, status } : b) }));
    firebaseUpdateBudgetStatus(id, status).catch((e) => set({ budgets: previous, error: errorMessage('Erro ao atualizar orcamento', e) }));
  },

  updateBudget: (id, patch) => {
    const previous = get().budgets;
    set((s) => ({ budgets: s.budgets.map((b) => b.id === id ? { ...b, ...patch } : b) }));
    firebaseUpdateBudget(id, patch).catch((e) =>
      set({ budgets: previous, error: errorMessage('Erro ao atualizar orcamento', e) }),
    );
  },

  deleteBudget: (id) => {
    const previous = get().budgets;
    set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
    firebaseDeleteBudget(id).catch((e) =>
      set({ budgets: previous, error: errorMessage('Erro ao excluir orcamento', e) }),
    );
  },

  clearError: () => set({ error: null }),
  showSnackbar: (msg) => set({ snackbar: msg }),
  clearSnackbar: () => set({ snackbar: null }),
}));
