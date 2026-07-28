import { create } from 'zustand';
import {
  deleteEmployee,
  getAllEmployees,
  insertEmployee,
  updateEmployee as firebaseUpdateEmployee,
} from '../services/firebase/data';

export type EmployeeRole = 'mechanic' | 'assistant' | 'admin' | 'receptionist' | 'manager';
export type EmployeeStatus = 'active' | 'inactive' | 'vacation';

export interface Employee {
  id: string;
  fullName: string;
  phone: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  notes: string;
  token: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TeamState {
  employees: Employee[];
  initialized: boolean;
  error: string | null;
  initialize: () => void;
  reload: () => void;
  addEmployee: (e: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
}

let initializing = false;

function errorMessage(prefix: string, e: unknown) {
  return `${prefix}: ${e instanceof Error ? e.message : 'erro desconhecido'}`;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  employees: [],
  initialized: false,
  error: null,

  initialize: () => {
    const state = get();
    if (state.initialized || initializing) return;
    initializing = true;
    getAllEmployees()
      .then((employees) => set({ employees, initialized: true, error: null }))
      .catch((e) => set({ error: errorMessage('Erro ao carregar equipe', e), initialized: true }))
      .finally(() => {
        initializing = false;
      });
  },

  reload: () => {
    getAllEmployees()
      .then((employees) => set({ employees, error: null }))
      .catch((e) => set({ error: errorMessage('Erro ao recarregar equipe', e) }));
  },

  addEmployee: (e) => {
    const now = new Date().toISOString();
    const employee: Employee = {
      ...e,
      id: `emp-${Date.now()}`,
      createdAt: e.createdAt ?? now,
      updatedAt: e.updatedAt ?? now,
    };
    set((s) => ({ employees: [employee, ...s.employees] }));
    insertEmployee(employee).catch((err) => {
      set((s) => ({ employees: s.employees.filter((emp) => emp.id !== employee.id), error: errorMessage('Erro ao salvar membro', err) }));
    });
  },

  updateEmployee: (id, patch) => {
    const previous = get().employees;
    const update = { ...patch, updatedAt: new Date().toISOString() };
    set((s) => ({
      employees: s.employees.map((emp) => (emp.id === id ? { ...emp, ...update } : emp)),
    }));
    firebaseUpdateEmployee(id, update).catch((e) => set({ employees: previous, error: errorMessage('Erro ao atualizar membro', e) }));
  },

  removeEmployee: (id) => {
    const previous = get().employees;
    set((s) => ({ employees: s.employees.filter((emp) => emp.id !== id) }));
    deleteEmployee(id).catch((e) => set({ employees: previous, error: errorMessage('Erro ao remover membro', e) }));
  },
}));

export const ROLE_LABEL: Record<EmployeeRole, string> = {
  mechanic: 'Mecânico',
  assistant: 'Auxiliar de Mecânico',
  admin: 'Administrativo',
  receptionist: 'Recepção',
  manager: 'Gerência',
};

export const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  vacation: 'Férias',
};

export const STATUS_VARIANT: Record<EmployeeStatus, 'ideal' | 'waiting' | 'out-of-stock'> = {
  active: 'ideal',
  inactive: 'out-of-stock',
  vacation: 'waiting',
};
