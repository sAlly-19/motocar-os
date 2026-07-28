import { useMemo } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTheme, useThemeColors, useThemeBorderRadius, spacing, themes } from '../../src/theme';
import type { ThemeKey } from '../../src/theme';
import { Icon } from '../../src/components/Icon';
import { GlassCard } from '../../src/components/GlassCard';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { AppText } from '../../src/ui/Text';
import { Divider } from '../../src/ui/Divider';
import { Chip } from '../../src/ui';
import { useDialog } from '../../src/components/DialogContext';
import { useAppStore } from '../../src/stores/useAppStore';
import { useIsAdmin } from '../../src/stores/useAuthStore';
import { formatCurrency } from '../../src/utils/currency';

interface ThemeInfo {
  key: ThemeKey;
  label: string;
  icon: string;
  desc: string;
}

const themeInfo: ThemeInfo[] = [
  { key: 'light', label: 'Claro', icon: 'light_mode', desc: 'Padrão elegante' },
  { key: 'dark', label: 'Escuro', icon: 'dark_mode', desc: 'Confortável para baixa luz' },
  { key: 'amoled', label: 'AMOLED', icon: 'brightness_3', desc: 'Preto absoluto' },
  { key: 'midnight', label: 'Midnight Blue', icon: 'nights_stay', desc: 'Azul escuro premium' },
];

interface MenuItem {
  key: string;
  icon: string;
  label: string;
  route: string;
  adminOnly?: boolean;
}

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Geral',
    items: [
      { key: 'notifications', icon: 'notifications', label: 'Notificações', route: '/notifications' },
    ],
  },
  {
    title: 'Oficina',
    items: [
      { key: 'team', icon: 'group', label: 'Equipe', route: '/team', adminOnly: true },
      { key: 'customers', icon: 'people', label: 'Clientes', route: '/customers' },
      { key: 'vehicles', icon: 'directions_car', label: 'Veículos', route: '/vehicles' },
      { key: 'reports', icon: 'insights', label: 'Relatórios', route: '/reports' },
      { key: 'financial', icon: 'payments', label: 'Financeiro', route: '/billing', adminOnly: true },
    ],
  },
];

export default function ProfileScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const { themeKey, setTheme } = useTheme();
  const { showAlert } = useDialog();
  const { width } = useWindowDimensions();
  const orders = useAppStore((s) => s.orders);
  const isAdmin = useIsAdmin();
  const visibleSections = useMemo(
    () =>
      menuSections
        .map((s) => ({ ...s, items: s.items.filter((it) => !it.adminOnly || isAdmin) }))
        .filter((s) => s.items.length > 0),
    [isAdmin],
  );
  // 4-col grid on wide screens, 2-col on mobile.
  const themeCardWidth: `${number}%` = width >= 720 ? '23%' : '47%';

  const thisMonthOrders = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return orders.filter((o) => o.createdAt >= monthStart);
  }, [orders]);

  // OS finalizadas neste mês.
  const monthlyFinished = useMemo(
    () => thisMonthOrders.filter((o) => o.status === 'finished'),
    [thisMonthOrders],
  );

  // Métricas derivadas 100% do banco de dados.
  const monthlyCount = thisMonthOrders.length;
  const monthlyRevenue = monthlyFinished.reduce((sum, o) => sum + o.total, 0);
  const monthlyInProgress = useMemo(
    () => orders.filter((o) => o.status === 'in-progress').length,
    [orders],
  );

  const handleMenuPress = (route: string, label: string) => {
    if (route) router.push(route as any);
    else showAlert(label, 'Funcionalidade em desenvolvimento.');
  };

  const getPreviewColors = (key: ThemeKey) => {
    const t = themes[key] || themes.light;
    return { bg: t.background, primary: t.primary, secondary: t.secondary, surface: t['surface-container'] };
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing['margin-mobile'],
          paddingBottom: spacing.xxl * 2,
          gap: spacing.gutter,
          maxWidth: spacing['container-max'],
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <GlassCard style={{ padding: spacing.xl, alignItems: 'center' }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: br.full,
              backgroundColor: colors['primary-container'],
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md,
              borderWidth: 3,
              borderColor: colors.secondary,
            }}
          >
            <Icon name="person" size={40} color={colors['on-primary-container']} />
          </View>
          <View style={{ marginBottom: spacing.md }}>
            {/* Botão de foto oculto pois está em desenvolvimento */}
          </View>
          <AppText variant="h4" style={{ color: colors.primary }}>
            Minha Conta
          </AppText>
          <AppText variant="bodySmall" color="text-secondary" style={{ marginBottom: spacing.lg }}>
            MotoCar App
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ alignItems: 'center' }}>
              <AppText variant="h4" style={{ color: colors.secondary }}>
                {monthlyCount}
              </AppText>
              <AppText variant="labelSmall" color="text-secondary">
                OS este mês
              </AppText>
            </View>
            <Divider vertical spacing="none" />
            <View style={{ alignItems: 'center' }}>
              <AppText variant="h4" style={{ color: colors.secondary }}>
                {formatCurrency(monthlyRevenue)}
              </AppText>
              <AppText variant="labelSmall" color="text-secondary">
                Faturado no mês
              </AppText>
            </View>
            <Divider vertical spacing="none" />
            <View style={{ alignItems: 'center' }}>
              <AppText variant="h4" style={{ color: colors.secondary }}>
                {monthlyInProgress}
              </AppText>
              <AppText variant="labelSmall" color="text-secondary">
                Em execução
              </AppText>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={{ padding: spacing.lg }}>
          <AppText variant="h4" style={{ color: colors.primary, marginBottom: spacing.md }}>
            Tema do App
          </AppText>
          <View
            accessibilityRole="radiogroup"
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
          >
            {themeInfo.map((t) => {
              const p = getPreviewColors(t.key);
              const isActive = themeKey === t.key;
              return (
                <AnimatedPressable
                  key={t.key}
                  onPress={() => setTheme(t.key)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${t.label} - ${t.desc}`}
                  accessibilityState={{ selected: isActive }}
                  scaleTo={0.97}
                  style={{
                    width: themeCardWidth,
                    padding: spacing.md,
                    borderRadius: br.lg,
                    borderWidth: 2,
                    borderColor: isActive ? colors.secondary : colors['outline-variant'],
                    gap: spacing.xs,
                  }}
                >
                  <View
                    style={{
                      height: 48,
                      borderRadius: br.lg,
                      backgroundColor: p.bg,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: spacing.xs,
                    }}
                  >
                    <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
                      <View style={{ width: 20, height: 20, borderRadius: br.sm, backgroundColor: p.primary }} />
                      <View style={{ width: 20, height: 20, borderRadius: br.sm, backgroundColor: p.secondary }} />
                      <View style={{ width: 20, height: 20, borderRadius: br.sm, backgroundColor: p.surface }} />
                    </View>
                  </View>
                  <View style={{ alignSelf: 'center' }}>
                    <Icon name={t.icon} size={16} color={isActive ? colors.secondary : colors.primary} />
                  </View>
                  <AppText variant="label" align="center">
                    {t.label}
                  </AppText>
                  <AppText variant="labelSmall" color="text-secondary" align="center">
                    {t.desc}
                  </AppText>
                </AnimatedPressable>
              );
            })}
          </View>
        </GlassCard>

        {visibleSections.map((section) => (
          <GlassCard key={section.title} style={{ padding: spacing.md }}>
            <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
              <AppText
                variant="label"
                color="text-secondary"
                transform="uppercase"
                style={{ letterSpacing: 1 }}
              >
                {section.title}
              </AppText>
            </View>
            {section.items.map((item, idx) => (
              <View key={item.key}>
                {idx > 0 && <Divider spacing="xs" />}
                <AnimatedPressable
                  onPress={() => handleMenuPress(item.route, item.label)}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityHint={item.route ? 'Toque duplo para abrir' : 'Em desenvolvimento'}
                  scaleTo={0.98}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    borderRadius: br.lg,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Icon name={item.icon} size={22} color={colors.primary} />
                    <AppText variant="body" style={{ color: colors.primary }}>
                      {item.label}
                    </AppText>
                  </View>
                  <Icon name="chevron_right" size={20} color={colors['on-surface-variant']} />
                </AnimatedPressable>
              </View>
            ))}
          </GlassCard>
        ))}
      </ScrollView>
    </View>
  );
}
