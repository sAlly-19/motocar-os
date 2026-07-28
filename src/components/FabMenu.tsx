import { useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing } from '../theme';
import { AppText } from '../ui/Text';
import { Icon } from './Icon';

interface FabAction {
  icon: string;
  label: string;
  onPress: () => void;
}

interface FabMenuProps {
  actions: FabAction[];
  accessibilityLabel?: string;
}

/**
 * Floating action menu. Reanimated-free implementation — uses conditional
 * render + Pressable feedback instead of shared values. This avoids the
 * blank-screen bug we hit on Reanimated 4 + Expo SDK 56 web.
 */
export function FabMenu({ actions, accessibilityLabel }: FabMenuProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: insets.bottom + spacing.xxl + spacing.lg,
        right: spacing.md,
        alignItems: 'flex-end',
        gap: spacing.sm,
      }}
    >
      {open &&
        actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => {
              action.onPress();
              toggle();
            }}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors['surface-container'],
                borderRadius: br.full,
                paddingLeft: spacing.md,
                paddingRight: spacing.xs,
                paddingVertical: spacing.xs,
                opacity: pressed ? 0.9 : 1,
              },
              shadows.md,
            ]}
          >
            <AppText variant="labelSmall" style={{ marginRight: spacing.xs }}>
              {action.label}
            </AppText>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: br.full,
                backgroundColor: colors.secondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={action.icon} size={22} color={colors['on-secondary']} />
            </View>
          </Pressable>
        ))}
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (open ? 'Fechar ações rápidas' : 'Ações rápidas')}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [
          {
            width: 56,
            height: 56,
            borderRadius: br.full,
            backgroundColor: colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.9 : 1,
          },
          open && { transform: [{ rotate: '45deg' }] },
          shadows.lg,
        ]}
      >
        <Icon name="add" size={28} color={colors['on-secondary']} />
      </Pressable>
    </View>
  );
}
