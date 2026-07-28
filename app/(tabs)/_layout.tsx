import { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { useSegments, router } from 'expo-router';
import { Dock } from '../../src/components/Dock';
import { AppShell } from '../../src/components/AppShell';
import { useNavigationHistory } from '../../src/utils/navigationHistory';
import { useKeyboardNavigation } from '../../src/utils/keyboardNav';
import DashboardScreen from './dashboard';
import OrdersScreen from './orders';
import InventoryScreen from './inventory';
import ScheduleScreen from './schedule';
import ProfileScreen from './profile';
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
      router.replace(route as any);
    }
  }, []);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'orders':
        return <OrdersScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'schedule':
        return <ScheduleScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return null;
    }
  };

  return (
    <AppShell
      bottomSlot={<Dock items={tabs} activeKey={activeTab} onSelect={handleNavigate} />}
    >
      {renderActiveScreen()}
    </AppShell>
  );
}
