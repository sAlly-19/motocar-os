import { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { useSegments, router, Slot } from 'expo-router';
import { Dock } from '../../src/components/Dock';
import { AppShell } from '../../src/components/AppShell';
import { useNavigationHistory } from '../../src/utils/navigationHistory';
import { useKeyboardNavigation } from '../../src/utils/keyboardNav';
import type { TabName, TabConfig } from '../../src/navigation/types';

const tabs: TabConfig[] = [
  { key: 'dashboard', icon: 'dashboard', label: 'Dashboard', route: '/(tabs)/dashboard' },
  { key: 'orders', icon: 'assignment', label: 'Ordens', route: '/(tabs)/orders' },
  { key: 'inventory', icon: 'inventory_2', label: 'Estoque', route: '/(tabs)/inventory' },
  { key: 'schedule', icon: 'calendar_month', label: 'Agenda', route: '/(tabs)/schedule' },
  { key: 'profile', icon: 'account_circle', label: 'Conta', route: '/(tabs)/profile' },
];

export default function TabsLayout() {
  const segments = useSegments();
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');

  useEffect(() => {
    // Mantém a dock destacando o botão certo se a URL for alterada por back button ou link interno
    const currentSegment = segments[segments.length - 1];
    const tab = tabs.find((t) => t.route.endsWith(`/${currentSegment ?? ''}`));
    if (tab && tab.key !== activeTab) setActiveTab(tab.key);
  }, [segments]);

  useNavigationHistory();
  useKeyboardNavigation();

  const handleNavigate = useCallback((route: string) => {
    const tab = tabs.find((t) => t.route === route);
    if (tab) {
      setActiveTab(tab.key);
      router.replace(route as any); // Renderização feita automaticamente via Slot
    }
  }, []);

  return (
    <AppShell
      bottomSlot={<Dock items={tabs} activeKey={activeTab} onSelect={handleNavigate} />}
    >
      <Slot />
    </AppShell>
  );
}
