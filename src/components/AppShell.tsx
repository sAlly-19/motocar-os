import { ReactNode, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors } from '../theme';
import { TopAppBar } from './TopAppBar';
import { Sidebar } from './Sidebar';
import { useSidebar } from './SidebarContext';
import { useAppStore } from '../stores/useAppStore';
import { ErrorBanner } from './ErrorBanner';
import { useUnreadNotificationsCount } from '../hooks/useNotifications';

interface AppShellProps {
  children: ReactNode;
  /**
   * When true, renders a compact back-only TopAppBar variant (for modal-style
   * secondary screens). When false (default), renders the full menu+search bar.
   */
  compact?: boolean;
  /** Slot at the bottom of the shell (e.g. Dock on tabs). */
  bottomSlot?: ReactNode;
}

/**
 * Shared app chrome — TopAppBar + Sidebar drawer overlay + optional bottom
 * slot. Any screen that renders inside <AppShell> gets the same global nav.
 */
export function AppShell({ children, compact = false, bottomSlot }: AppShellProps) {
  const colors = useThemeColors();
  const { open: openSidebar } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  const error = useAppStore((s) => s.error);
  const clearError = useAppStore((s) => s.clearError);
  const snackbar = useAppStore((s) => s.snackbar);
  const clearSnackbar = useAppStore((s) => s.clearSnackbar);
  const unreadCount = useUnreadNotificationsCount();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Sidebar />
      <View style={{ flex: 1 }}>
        <TopAppBar
          onMenuPress={openSidebar}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onNotificationPress={() => router.push('/notifications')}
          notificationsCount={unreadCount}
          compact={compact}
        />
        {error ? (
          <ErrorBanner message={error} onDismiss={clearError} />
        ) : (
          <ErrorBanner
            message={snackbar?.message ?? null}
            onDismiss={clearSnackbar}
            type={snackbar?.type ?? 'info'}
          />
        )}
        <View style={{ flex: 1 }}>{children}</View>
      </View>
      {bottomSlot}
    </View>
  );
}
