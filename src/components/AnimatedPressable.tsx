import { ReactNode } from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  children?: ReactNode;
  /** Scale factor while pressed. Kept for API compatibility; not currently used. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Drop-in replacement for the previous Reanimated-based AnimatedPressable.
 * Uses Pressable's built-in `pressed` opacity feedback — no Reanimated hooks,
 * no `useSharedValue`/`useAnimatedStyle`. This avoids the blank-screen bug
 * we hit on Reanimated 4 + Expo SDK 56 web.
 */
export function AnimatedPressable({
  children,
  scaleTo: _scaleTo,
  style,
  ...props
}: AnimatedPressableProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [style, pressed && { opacity: 0.7 }]}
    >
      {children}
    </Pressable>
  );
}
