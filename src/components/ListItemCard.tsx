import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing } from '../theme';

interface ListItemCardProps extends Omit<PressableProps, 'style' | 'children'> {
  /** Zero-based index used to stagger the entrance animation. */
  index?: number;
  /** Total stagger cap (ms). Higher indices are clamped so a long list doesn't wait forever. */
  maxStaggerMs?: number;
  /** Per-item stagger step. Default 40ms. */
  staggerStep?: number;
  /** Card contents. */
  children: ReactNode;
  /** Optional extra style. */
  style?: StyleProp<ViewStyle>;
  /** Disable enter animation (e.g. for keyboard nav). */
  disableEnter?: boolean;
}

/**
 * Animated list card with:
 * - fade + translateY entrance (React Native `Animated`, native driver).
 * - Web hover: border color changes to primary (subtle affordance).
 * - Press: opacity feedback via Pressable.
 *
 * NOT built on Reanimated (avoids the SDK 56 web blank-screen bug).
 */
export function ListItemCard({
  index = 0,
  maxStaggerMs = 400,
  staggerStep = 40,
  children,
  style,
  disableEnter = false,
  ...pressableProps
}: ListItemCardProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const [hovered, setHovered] = useState(false);

  const opacity = useRef(new Animated.Value(disableEnter ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(disableEnter ? 0 : 8)).current;

  useEffect(() => {
    if (disableEnter) return;
    const delay = Math.min(index * staggerStep, maxStaggerMs);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Pressable
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        {...pressableProps}
        style={({ pressed }) => [
          {
            backgroundColor: colors['surface-container-lowest'],
            borderRadius: br.xl,
            borderWidth: 1,
            borderColor: hovered ? colors.primary : colors['outline-variant'],
            padding: spacing.md,
            marginBottom: spacing.sm,
            opacity: pressed ? 0.85 : 1,
          },
          shadows.row,
          style,
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
