import { useEffect, useMemo, useRef } from 'react';
import { View, Animated, useWindowDimensions, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useSegments } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing } from '../theme';
import { AppText } from '../ui/Text';
import { Icon } from './Icon';
import { AnimatedPressable } from './AnimatedPressable';
import { useSidebar } from './SidebarContext';
import { useAuthStore } from '../stores/useAuthStore';

interface MenuItem {
  icon: string;
  labelKey: string;
  fallback: string;
  route: string;
  /** Se true, o item só aparece para usuários com role === 'admin'. */
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { icon: 'dashboard', labelKey: 'tabs.dashboard', fallback: 'Dashboard', route: '/(tabs)/dashboard' },
  { icon: 'people', labelKey: 'sidebar.customers', fallback: 'Clientes', route: '/customers' },
  { icon: 'directions_car', labelKey: 'sidebar.vehicles', fallback: 'Veículos', route: '/vehicles' },
  { icon: 'description', labelKey: 'sidebar.orders', fallback: 'Ordens de Serviço', route: '/(tabs)/orders' },
  { icon: 'inventory_2', labelKey: 'tabs.inventory', fallback: 'Estoque', route: '/(tabs)/inventory' },
  { icon: 'calendar_month', labelKey: 'tabs.schedule', fallback: 'Agenda', route: '/(tabs)/schedule' },
  { icon: 'request_quote', labelKey: 'sidebar.budgets', fallback: 'Orçamentos', route: '/budgets' },
  { icon: 'receipt_long', labelKey: 'sidebar.billing', fallback: 'Faturar', route: '/billing', adminOnly: true },
  { icon: 'group', labelKey: 'sidebar.team', fallback: 'Equipe', route: '/team', adminOnly: true },
  { icon: 'person', labelKey: 'tabs.profile', fallback: 'Conta', route: '/(tabs)/profile' },
];

/**
 * Global Sidebar — always a drawer overlay controlled by SidebarContext.
 * Uses React Native's native `Animated` (not Reanimated) to avoid the
 * Reanimated 4 + Expo SDK 56 web blank-screen bug.
 */
export function Sidebar() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const { t } = useTranslation();
  const { isOpen, close } = useSidebar();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const segments = useSegments();
  const currentRoute = '/' + segments.join('/');
  const DRAWER_WIDTH = Math.min(300, screenWidth * 0.85);

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : -DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, DRAWER_WIDTH]);

  const handleNavigate = (route: string) => {
    router.push(route as any);
    close();
  };

  const translate = (key: string, fallback: string) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const role = useAuthStore((s) => s.role);
  const isAdmin = role === 'admin';
  const visibleMenu = useMemo(
    () => menuItems.filter((it) => !it.adminOnly || isAdmin),
    [isAdmin],
  );

  const menuContent = useMemo(
    () => (
      <View style={{ gap: spacing.xs }} accessibilityRole="menu">
        {visibleMenu.map((item) => {
          const isActive =
            item.route === currentRoute ||
            (item.route === '/budgets' && currentRoute.includes('/budgets')) ||
            (item.route === '/team' && currentRoute.includes('/team')) ||
            (item.route === '/customers' && currentRoute.includes('/customers')) ||
            (item.route === '/vehicles' && currentRoute.includes('/vehicles')) ||
            (item.route === '/billing' && currentRoute.includes('/billing'));
          const label = translate(item.labelKey, item.fallback);
          return (
            <AnimatedPressable
              key={item.route}
              onPress={() => handleNavigate(item.route)}
              accessibilityRole="menuitem"
              accessibilityLabel={label}
              accessibilityState={{ selected: isActive }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.sm + 2,
                paddingHorizontal: spacing.md,
                borderRadius: br.lg,
                backgroundColor: isActive ? colors['secondary-container'] : 'transparent',
              }}
            >
              <Icon
                name={item.icon}
                size={22}
                color={isActive ? colors['on-secondary-container'] : colors.primary}
              />
              <AppText
                variant="body"
                style={{ color: isActive ? colors['on-secondary-container'] : colors.primary }}
              >
                {label}
              </AppText>
            </AnimatedPressable>
          );
        })}
      </View>
    ),
    [colors, currentRoute, br, visibleMenu],
  );

  return (
    <>
      {/* Overlay clickable to close */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 90,
          backgroundColor: colors.overlay,
          opacity: overlayOpacity,
        }}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: DRAWER_WIDTH,
            zIndex: 91,
            backgroundColor: colors.surface,
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.md,
            transform: [{ translateX }],
          },
          shadows.xl,
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xl,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors['outline-variant'],
          }}
        >
          <AppText variant="h3" style={{ color: colors.secondary }}>
            MotoCar
          </AppText>
          <AnimatedPressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Fechar menu"
            hitSlop={8}
            style={{ padding: spacing.sm }}
          >
            <Icon name="close" size={24} color={colors['on-surface-variant']} />
          </AnimatedPressable>
        </View>
        {menuContent}

        {/* Rodapé com identidade + botão sair */}
        <View
          style={{
            marginTop: spacing.xl,
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors['outline-variant'],
            gap: spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors['primary-container'],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name={isAdmin ? 'admin_panel_settings' : 'person'}
                size={18}
                color={colors['on-primary-container']}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="labelSmall" color="text-tertiary" transform="uppercase">
                {isAdmin ? 'Administrador' : 'Funcionário'}
              </AppText>
              <AppText variant="body" style={{ color: colors.primary, fontWeight: '600' }} numberOfLines={1}>
                {useAuthStore.getState().name || '—'}
              </AppText>
            </View>
          </View>
          <AnimatedPressable
            onPress={() => {
              close();
              useAuthStore.getState().logout();
              router.replace('/login');
            }}
            accessibilityRole="button"
            accessibilityLabel="Sair"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingVertical: spacing.sm + 2,
              paddingHorizontal: spacing.md,
              borderRadius: br.lg,
            }}
          >
            <Icon name="logout" size={22} color={colors.error} />
            <AppText variant="body" style={{ color: colors.error }}>
              Sair
            </AppText>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </>
  );
}
