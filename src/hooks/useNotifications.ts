import { useEffect, useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useTeamStore } from '../stores/useTeamStore';
import { useNotificationsStore } from '../stores/useNotificationsStore';
import { deriveNotifications } from '../services/notifications';
import type { AppNotification } from '../db/schema';

export interface NotificationView extends AppNotification {
  read: boolean;
  dismissed: boolean;
}

/**
 * Combines derived notifications with the persisted read/dismissed state.
 * Automatically initializes the persisted store on first mount.
 */
export function useNotifications() {
  const orders = useAppStore((s) => s.orders);
  const parts = useAppStore((s) => s.parts);
  const appointments = useAppStore((s) => s.appointments);
  const budgets = useAppStore((s) => s.budgets);
  const customers = useAppStore((s) => s.customers);
  const vehicles = useAppStore((s) => s.vehicles);

  const readIds = useNotificationsStore((s) => s.readIds);
  const dismissedIds = useNotificationsStore((s) => s.dismissedIds);
  const initialize = useNotificationsStore((s) => s.initialize);
  const initialized = useNotificationsStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  const derived = useMemo(
    () => deriveNotifications({ orders, parts, appointments, budgets, customers, vehicles }),
    [orders, parts, appointments, budgets, customers, vehicles],
  );

  const view = useMemo<NotificationView[]>(() => {
    return derived.map((n) => ({
      ...n,
      read: readIds.has(n.id),
      dismissed: dismissedIds.has(n.id),
    }));
  }, [derived, readIds, dismissedIds]);

  const visible = view.filter((n) => !n.dismissed);
  const unread = visible.filter((n) => !n.read);

  return {
    all: view,
    visible,
    unread,
    unreadCount: unread.length,
  };
}

/**
 * Lightweight variant for just the badge counter — same computation, no
 * intermediate lists exposed. Useful for TopAppBar to keep its selector tiny.
 */
export function useUnreadNotificationsCount(): number {
  return useNotifications().unreadCount;
}
