import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing, useBreakpoints } from '../../src/theme';
import { AppText, Button, Chip } from '../../src/ui';
import { AppShell } from '../../src/components/AppShell';
import { EmptyState } from '../../src/components/EmptyState';
import { Icon } from '../../src/components/Icon';
import { useDialog } from '../../src/components/DialogContext';
import { useNotifications } from '../../src/hooks/useNotifications';
import { useNotificationsStore } from '../../src/stores/useNotificationsStore';
import type { NotificationType } from '../../src/db/schema';

type TypeFilter = 'all' | NotificationType;
type ReadFilter = 'all' | 'unread';

const TYPE_LABEL: Record<TypeFilter, string> = {
  all: 'Todos',
  info: 'Informação',
  warning: 'Aviso',
  urgent: 'Urgente',
};

const READ_LABEL: Record<ReadFilter, string> = {
  all: 'Todas',
  unread: 'Não lidas',
};

const TYPE_META: Record<NotificationType, { color: string; icon: string; bgKey: string }> = {
  info: { color: 'info', icon: 'info', bgKey: 'info-container' },
  warning: { color: 'secondary', icon: 'warning_amber', bgKey: 'secondary-fixed' },
  urgent: { color: 'error', icon: 'error_outline', bgKey: 'error-container' },
};

function timeAgo(iso: string): string {
  try {
    const t = new Date(iso).getTime();
    const diffMs = Date.now() - t;
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins} min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d atrás`;
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return '';
  }
}

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const { isDesktop } = useBreakpoints();
  const { showConfirm } = useDialog();

  const { visible, unreadCount } = useNotifications();
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const dismiss = useNotificationsStore((s) => s.dismiss);
  const dismissMany = useNotificationsStore((s) => s.dismissMany);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  const filtered = useMemo(() => {
    return visible.filter((n) => {
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (readFilter === 'unread' && n.read) return false;
      return true;
    });
  }, [visible, typeFilter, readFilter]);

  const handleMarkAllRead = () => {
    const unreadIds = visible.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    markAllRead(unreadIds);
  };

  const handleDismissAll = () => {
    const ids = filtered.map((n) => n.id);
    if (ids.length === 0) return;
    showConfirm(
      'Excluir notificações?',
      `Tem certeza que deseja excluir ${ids.length} notificação(ões) desta lista?`,
      () => dismissMany(ids),
    );
  };

  const handleAction = (route: string, id: string) => {
    if (!route) return;
    markRead(id);
    router.push(route as any);
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing['margin-mobile'], paddingBottom: 120 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing.lg,
            flexWrap: 'wrap',
            gap: spacing.sm,
          }}
        >
          <View style={{ flex: 1, minWidth: 200 }}>
            <AppText variant="h2" style={{ color: colors.primary }}>
              Notificações
            </AppText>
            <AppText variant="bodySmall" color="text-secondary">
              {unreadCount} não lida(s) · {visible.length} total
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              title="Marcar todas como lidas"
              icon="done_all"
              onPress={handleMarkAllRead}
              disabled={unreadCount === 0}
            />
            <Button
              variant="destructive"
              size="sm"
              title="Excluir todas"
              icon="delete_sweep"
              onPress={handleDismissAll}
              disabled={filtered.length === 0}
            />
          </View>
        </View>

        {/* Filtros */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm }}>
          {(Object.keys(TYPE_LABEL) as TypeFilter[]).map((k) => (
            <Chip
              key={k}
              label={TYPE_LABEL[k]}
              selected={typeFilter === k}
              onPress={() => setTypeFilter(k)}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.lg }}>
          {(Object.keys(READ_LABEL) as ReadFilter[]).map((k) => (
            <Chip
              key={k}
              label={READ_LABEL[k]}
              selected={readFilter === k}
              onPress={() => setReadFilter(k)}
            />
          ))}
        </View>

        {/* Lista */}
        {filtered.length === 0 ? (
          <EmptyState
            illustration="empty-box"
            title="Sem notificações"
            subtitle={
              typeFilter !== 'all' || readFilter !== 'all'
                ? 'Nenhuma notificação corresponde aos filtros.'
                : 'Você está em dia! Sem novos alertas no momento.'
            }
          />
        ) : (
          filtered.map((n) => {
            const meta = TYPE_META[n.type];
            const iconBg = colors[meta.bgKey] ?? colors['surface-container'];
            const iconColor = colors[meta.color as 'info' | 'secondary' | 'error'] ?? colors.primary;
            return (
              <Pressable
                key={n.id}
                onPress={() => !n.read && markRead(n.id)}
                style={[
                  {
                    flexDirection: 'row',
                    gap: spacing.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    borderRadius: br.xl,
                    borderWidth: 1,
                    borderColor: n.read ? colors['outline-variant'] : iconColor,
                    backgroundColor: n.read ? colors['surface-container-lowest'] : colors.surface,
                  },
                  shadows.row,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${n.title}. ${n.description}. ${n.read ? 'Lida.' : 'Não lida.'}`}
              >
                {/* Ícone */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: br.full,
                    backgroundColor: iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={meta.icon} size={22} color={iconColor} />
                </View>

                {/* Conteúdo */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
                    <AppText
                      variant="body"
                      style={{ color: colors.primary, fontWeight: n.read ? '500' : '700', flex: 1, minWidth: 100 }}
                      numberOfLines={1}
                    >
                      {n.title}
                    </AppText>
                    {!n.read && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: iconColor,
                        }}
                      />
                    )}
                  </View>
                  <AppText
                    variant="bodySmall"
                    color="text-secondary"
                    style={{ marginTop: 2 }}
                    numberOfLines={2}
                  >
                    {n.description}
                  </AppText>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      marginTop: spacing.xs,
                      flexWrap: 'wrap',
                    }}
                  >
                    <AppText variant="labelSmall" color="text-tertiary">
                      {timeAgo(n.createdAt)}
                    </AppText>
                    {n.actionRoute && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title={n.actionLabel ?? 'Abrir'}
                        icon="arrow_forward"
                        onPress={() => handleAction(n.actionRoute!, n.id)}
                      />
                    )}
                  </View>
                </View>

                {/* Ação: dismiss */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    dismiss(n.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Descartar notificação"
                  hitSlop={8}
                  style={{ padding: spacing.xs }}
                >
                  <Icon name="close" size={18} color={colors['on-surface-variant']} />
                </Pressable>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </>
  );
}
