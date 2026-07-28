import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, spacing } from '../theme';
import { AppText } from '../ui/Text';
import { Icon } from './Icon';
import { Avatar } from '../ui/Avatar';
import { Input } from '../ui/Input';
import { AnimatedPressable } from './AnimatedPressable';
import { useSidebar } from './SidebarContext';

interface TopAppBarProps {
  title?: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  /**
   * Optional override for the menu icon press. Defaults to `useSidebar().toggle`.
   * Kept optional so consumers can wire a custom handler without duplicating context lookup.
   */
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  /** Number of unread notifications. When > 0, renders a numeric badge. */
  notificationsCount?: number;
  avatarUri?: string | null;
  /** Compact variant: hides notifications + avatar, shows title prominently. */
  compact?: boolean;
}

export function TopAppBar({
  title,
  showSearch,
  searchValue,
  onSearchChange,
  onMenuPress,
  onNotificationPress,
  notificationsCount = 0,
  avatarUri,
  compact = false,
}: TopAppBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { toggle } = useSidebar();
  const handleMenu = onMenuPress ?? toggle;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        paddingTop: insets.top,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
          minHeight: 56,
        }}
      >
        <AnimatedPressable
          onPress={handleMenu}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          hitSlop={8}
          style={{ padding: spacing.xs }}
        >
          <Icon name="menu" size={28} color={colors['on-surface']} />
        </AnimatedPressable>

        {showSearch ? (
          <View style={{ flex: 1 }}>
            <Input
              value={searchValue}
              onChangeText={onSearchChange}
              leftIcon="search"
              placeholder="Pesquisar..."
              autoFocus
              accessibilityLabel="Campo de busca"
            />
          </View>
        ) : (
          <AppText variant="h4" style={{ flex: 1 }} numberOfLines={1}>
            {title || 'MotoCar'}
          </AppText>
        )}

        {!compact && (
          <AnimatedPressable
            onPress={onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel={
              notificationsCount > 0
                ? `Notificações. ${notificationsCount} não lidas.`
                : 'Notificações'
            }
            hitSlop={8}
            style={{ padding: spacing.xs, position: 'relative' }}
          >
            <Icon name="notifications_none" size={24} color={colors['on-surface']} />
            {notificationsCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  minWidth: 18,
                  height: 18,
                  paddingHorizontal: 4,
                  borderRadius: 9,
                  backgroundColor: colors.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.surface,
                }}
              >
                <AppText
                  variant="labelSmall"
                  style={{ color: colors['on-error'], fontWeight: '700', fontSize: 10, lineHeight: 12 }}
                >
                  {notificationsCount > 99 ? '99+' : notificationsCount}
                </AppText>
              </View>
            )}
          </AnimatedPressable>
        )}

        {!compact && avatarUri !== undefined && <Avatar uri={avatarUri} name={title} size={36} />}
      </View>
    </View>
  );
}
