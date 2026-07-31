import React, { useEffect, useState } from 'react';
import { View, Platform, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing, animationTokens } from '../theme';
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
      scaleTo={0.85}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Icon name={item.icon} size={26} color={isActive ? activeColor : inactiveColor} fill={isActive} />
    </AnimatedPressable>
  );
}

export function Dock({ items, activeKey, onSelect, isLandscape }: DockProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();

  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const activeIndex = items.findIndex((i) => i.key === activeKey);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  const pillOffset = useSharedValue(0);

  useEffect(() => {
    if (isLandscape && containerHeight > 0) {
      const tabHeight = containerHeight / items.length;
      pillOffset.value = withSpring(safeIndex * tabHeight, animationTokens.spring.snappy);
    } else if (!isLandscape && containerWidth > 0) {
      const tabWidth = containerWidth / items.length;
      pillOffset.value = withSpring(safeIndex * tabWidth, animationTokens.spring.snappy);
    }
  }, [safeIndex, containerWidth, containerHeight, isLandscape]);

  const animatedPillStyle = useAnimatedStyle(() => {
    if (isLandscape) {
      return {
        transform: [{ translateY: pillOffset.value }],
        height: containerHeight > 0 ? containerHeight / items.length : 0,
        width: '100%',
      };
    }
    return {
      transform: [{ translateX: pillOffset.value }],
      width: containerWidth > 0 ? containerWidth / items.length : 0,
      height: '100%',
    };
  });

  const activeColor = colors['on-primary-container'];
  const inactiveColor = colors['on-surface-variant'];

  const capsuleStyle = {
    backgroundColor: colors['surface-container'],
    borderRadius: br.full,
    opacity: 0.94,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: colors['outline-variant'],
    overflow: 'hidden' as const,
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
    setContainerHeight(e.nativeEvent.layout.height);
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
          onLayout={handleLayout}
          style={[
            capsuleStyle,
            {
              paddingVertical: 0,
              paddingHorizontal: 0,
              width: 64,
              minHeight: items.length * 64,
            },
            shadows.md,
          ]}
        >
          {containerHeight > 0 && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: colors['primary-container'],
                  borderRadius: br.full,
                },
                animatedPillStyle,
              ]}
            />
          )}
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
        onLayout={handleLayout}
        style={[
          capsuleStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            height: 64,
            width: '90%',
            maxWidth: 480,
            paddingHorizontal: 0,
          },
          shadows.md,
        ]}
      >
        {containerWidth > 0 && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                backgroundColor: colors['primary-container'],
                borderRadius: br.full,
              },
              animatedPillStyle,
            ]}
          />
        )}
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
