import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing } from '../theme';
import { Icon } from './Icon';
import { AnimatedPressable } from './AnimatedPressable';

export interface DockItem {
  key: string;
  icon: string;
  label: string;
  route: string;
}

interface DockProps {
  items: DockItem[];
  activeKey: string;
  onSelect: (route: string) => void;
  isLandscape?: boolean;
}

function DockButton({
  item,
  isActive,
  onPress,
  activeColor,
  inactiveColor,
}: {
  item: DockItem;
  isActive: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityLabel={item.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      hitSlop={6}
      scaleTo={0.92}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.sm,
      }}
    >
      <Icon name={item.icon} size={28} color={isActive ? activeColor : inactiveColor} fill={isActive} />
      {isActive && (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: activeColor,
            marginTop: 2,
          }}
        />
      )}
    </AnimatedPressable>
  );
}

export function Dock({ items, activeKey, onSelect, isLandscape }: DockProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();

  const activeColor = colors.secondary;
  const inactiveColor = colors['on-surface-variant'];

  const capsuleStyle = {
    backgroundColor: colors['surface-container'],
    borderRadius: br.full,
    opacity: 0.94,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: colors['outline-variant'],
  };

  if (isLandscape) {
    return (
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
          paddingLeft: spacing.sm,
          paddingRight: spacing.sm,
        }}
      >
        <View
          accessibilityRole="tablist"
          style={[
            capsuleStyle,
            {
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.sm,
              gap: spacing.xs,
            },
            shadows.md,
          ]}
        >
          {items.map((item) => (
            <DockButton
              key={item.key}
              item={item}
              isActive={item.key === activeKey}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              onPress={() => onSelect(item.route)}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: Math.max(insets.bottom, spacing.sm),
      }}
    >
      <View
        accessibilityRole="tablist"
        style={[
          capsuleStyle,
          {
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: 64,
            paddingHorizontal: spacing.lg,
            width: '90%',
            maxWidth: 480,
          },
          shadows.md,
        ]}
      >
        {items.map((item) => (
          <DockButton
            key={item.key}
            item={item}
            isActive={item.key === activeKey}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            onPress={() => onSelect(item.route)}
          />
        ))}
      </View>
    </View>
  );
}
