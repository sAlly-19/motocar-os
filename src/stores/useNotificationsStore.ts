import { create } from 'zustand';
import { getNotificationReads, setNotificationReads } from '../services/firebase/data';

interface NotificationsState {
  readIds: Set<string>;
  dismissedIds: Set<string>;
  initialized: boolean;
  error: string | null;
  initialize: () => void;
  reload: () => void;
  markRead: (id: string) => void;
  markAllRead: (ids: string[]) => void;
  markUnread: (id: string) => void;
  dismiss: (id: string) => void;
  dismissMany: (ids: string[]) => void;
  restore: (id: string) => void;
}

let initializing = false;

function persist(readIds: Set<string>, dismissedIds: Set<string>) {
  setNotificationReads({
    readIds: Array.from(readIds),
    dismissedIds: Array.from(dismissedIds),
  }).catch((e) => {
    // Persistência é best-effort — falhas não devem quebrar a UI.
    console.warn('[notifications] falha ao persistir status:', e);
  });
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  readIds: new Set<string>(),
  dismissedIds: new Set<string>(),
  initialized: false,
  error: null,

  initialize: () => {
    if (initializing || get().initialized) return;
    initializing = true;
    getNotificationReads()
      .then((data) => {
        if (!data) {
          set({ initialized: true });
          return;
        }
        set({
          readIds: new Set(data.readIds),
          dismissedIds: new Set(data.dismissedIds),
          initialized: true,
        });
      })
      .catch((e) => {
        set({ error: e instanceof Error ? e.message : 'erro ao carregar notificações' });
      })
      .finally(() => {
        initializing = false;
      });
  },

  reload: () => {
    set({ initialized: false });
    get().initialize();
  },

  markRead: (id) => {
    const readIds = new Set(get().readIds);
    readIds.add(id);
    set({ readIds });
    persist(readIds, get().dismissedIds);
  },

  markAllRead: (ids) => {
    const readIds = new Set(get().readIds);
    ids.forEach((id) => readIds.add(id));
    set({ readIds });
    persist(readIds, get().dismissedIds);
  },

  markUnread: (id) => {
    const readIds = new Set(get().readIds);
    readIds.delete(id);
    set({ readIds });
    persist(readIds, get().dismissedIds);
  },

  dismiss: (id) => {
    const dismissedIds = new Set(get().dismissedIds);
    dismissedIds.add(id);
    set({ dismissedIds });
    persist(get().readIds, dismissedIds);
  },

  dismissMany: (ids) => {
    const dismissedIds = new Set(get().dismissedIds);
    ids.forEach((id) => dismissedIds.add(id));
    set({ dismissedIds });
    persist(get().readIds, dismissedIds);
  },

  restore: (id) => {
    const dismissedIds = new Set(get().dismissedIds);
    dismissedIds.delete(id);
    set({ dismissedIds });
    persist(get().readIds, dismissedIds);
  },
}));
