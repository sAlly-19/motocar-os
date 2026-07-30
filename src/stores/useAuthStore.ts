import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInAnonymously, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../services/firebase/client';
import type { Employee } from './useTeamStore';

/**
 * Autenticação client-side simples.
 *
 * - Admin: credencial hardcoded (`ADMIN_NAME` + `ADMIN_PASSWORD` no `.env`).
 * - Funcionário: identificado pelo telefone + token gerado no cadastro `/team/new`.
 *
 * A sessão é persistida utilizando AsyncStorage.
 */

export const ADMIN_NAME = 'Admin';
export const ADMIN_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_PASSWORD || 'MotoCar@Admin';

export type AuthRole = 'admin' | 'employee';

export interface AuthState {
  role: AuthRole | null;
  /** Nome (Admin) OU nome do funcionário logado. */
  name: string | null;
  /** Se role === 'employee', referência ao Employee autenticado. */
  employeeId: string | null;
  loginError: string | null;

  loginAdmin: (name: string, password: string) => Promise<boolean>;
  loginEmployee: (phone: string, token: string, employees: Employee[]) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

function normalizePhone(v: string): string {
  return v.replace(/\D/g, '');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      name: null,
      employeeId: null,
      loginError: null,

      loginAdmin: async (name, password) => {
        if (name.trim() === ADMIN_NAME && password === ADMIN_PASSWORD) {
          try {
            const auth = getFirebaseAuth();
            // Fallback para login anônimo caso Email/Password falhe (ou não esteja configurado no console)
            await signInAnonymously(auth);
            set({ role: 'admin', name: ADMIN_NAME, employeeId: null, loginError: null });
            return true;
          } catch (error: any) {
            set({ loginError: `Falha na autenticação Cloud: ${error.message}` });
            return false;
          }
        }
        set({ loginError: 'Credenciais de administrador inválidas.' });
        return false;
      },

      loginEmployee: async (phone, token, employees) => {
        const target = normalizePhone(phone);
        const match = employees.find(
          (e) => normalizePhone(e.phone) === target && e.token === token.trim(),
        );
        if (!match) {
          set({ loginError: 'Telefone ou token inválidos.' });
          return false;
        }
        if (match.status === 'inactive') {
          set({ loginError: 'Funcionário inativo. Contate o administrador.' });
          return false;
        }
        try {
          // Loga anonimamente no firebase auth para adquirir permissões básicas do firestore.rules
          const auth = getFirebaseAuth();
          await signInAnonymously(auth);
          set({
            role: 'employee',
            name: match.fullName,
            employeeId: match.id,
            loginError: null,
          });
          return true;
        } catch (error: any) {
          set({ loginError: `Falha na sessão da equipe: ${error.message}` });
          return false;
        }
      },

      logout: () => {
        const auth = getFirebaseAuth();
        signOut(auth).catch(() => {});
        set({ role: null, name: null, employeeId: null, loginError: null });
      },
      clearError: () => set({ loginError: null }),
    }),
    {
      name: 'motocar-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        role: state.role,
        name: state.name,
        employeeId: state.employeeId,
      }),
    }
  )
);

/** Helper: retorna se o usuário logado é admin. */
export const useIsAdmin = () => useAuthStore((s) => s.role === 'admin');

/** Helper: retorna se está autenticado (independentemente do role). */
export const useIsAuthenticated = () => useAuthStore((s) => s.role !== null);
