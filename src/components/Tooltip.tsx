import { useState, useRef, ReactNode } from 'react';
import { View, Pressable, Platform, LayoutChangeEvent } from 'react-native';
import { useThemeColors, useThemeBorderRadius, spacing } from '../theme';
import { AppText } from '../ui/Text';

interface TooltipProps {
  text: string;
  children: ReactNode;
  /** Delay in ms before showing the tooltip. Default 500ms. */
  delay?: number;
}

/**
 * Text tooltip anchored above the wrapped element. Shows on long-press (native)
 * or hover (web) after `delay` ms. Also sets `accessibilityHint` on the
 * pressable so screen readers still get the tooltip text.
 *
 * Reanimated-free implementation — uses plain conditional render.
 */
export function Tooltip({ text, children, delay = 500 }: TooltipProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const [visible, setVisible] = useState(false);
  const [tipWidth, setTipWidth] = useState(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    setVisible(false);
  };

  const onTipLayout = (e: LayoutChangeEvent) => {
    setTipWidth(e.nativeEvent.layout.width);
  };

  const webHoverProps =
    Platform.OS === 'web' ? ({ onHoverIn: show, onHoverOut: hide } as any) : {};

  return (
    <View style={{ position: 'relative' }}>
      <Pressable
        onPressIn={show}
        onPressOut={hide}
        onBlur={hide}
        accessibilityHint={text}
        {...webHoverProps}
      >
        {children}
      </Pressable>
      {visible && (
        <View
          onLayout={onTipLayout}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginRight: -Math.min(tipWidth / 2, spacing.xl),
            marginBottom: spacing.xs,
            backgroundColor: colors['inverse-surface'],
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: br.sm + 2,
            zIndex: 100,
            maxWidth: 240,
          }}
        >
          <AppText variant="caption" style={{ color: colors['inverse-on-surface'] }}>
            {text}
          </AppText>
        </View>
      )}
    </View>
  );
}
