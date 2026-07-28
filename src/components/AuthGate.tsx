import { ReactNode, useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * Redireciona para `/login` quando o usuário não está autenticado, e para `/`
 * quando já está logado e tenta acessar `/login`.
 *
 * Também bloqueia rotas Admin-only para funcionários (envia pra `/`).
 */
const ADMIN_ONLY_SEGMENTS: string[] = ['team', 'billing'];

export function AuthGate({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.role);
  const segments = useSegments();

  useEffect(() => {
    const first = segments[0];
    const inLogin = first === 'login';
    const inAdminOnly = ADMIN_ONLY_SEGMENTS.includes(first ?? '');

    if (!role && !inLogin) {
      router.replace('/login');
      return;
    }
    if (role && inLogin) {
      router.replace('/');
      return;
    }
    if (role === 'employee' && inAdminOnly) {
      router.replace('/');
    }
  }, [role, segments]);

  return <>{children}</>;
}
