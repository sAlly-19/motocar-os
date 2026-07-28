import { View, Pressable, ViewStyle } from 'react-native';
import { useThemeColors, spacing } from '../theme';
import { Icon } from './Icon';

interface ModalHeaderProps {
  /**
   * Called when the close button is pressed. Typically `() => router.back()`.
   * If omitted, the close button is not rendered.
   */
  onClose?: () => void;
  /** Optional accessibility label for the close button. Defaults to "Fechar". */
  closeLabel?: string;
  /** Optional right-aligned slot (e.g. a badge). Rendered opposite to the close icon. */
  right?: React.ReactNode;
  /** When false, hides the drag-handle grip (default true). */
  showGrip?: boolean;
  style?: ViewStyle;
}

/**
 * Unified modal header used by the `presentation: 'modal'` screens.
 *
 * Layout: a centered grip on top for iOS-style dismiss affordance,
 * plus an absolute-positioned close button at the top-right so the header
 * doesn't consume vertical space from the scroll content.
 *
 * This replaces four divergent inline implementations that had different
 * icon colors, zIndex values, padding and hit targets.
 */
export function ModalHeader({
  onClose,
  closeLabel = 'Fechar',
  right,
  showGrip = true,
  style,
}: ModalHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={[{ paddingTop: spacing.sm }, style]}>
      {showGrip && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{
            alignSelf: 'center',
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors['outline-variant'],
            marginBottom: spacing.sm,
          }}
        />
      )}
      {onClose && (
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          hitSlop={12}
          style={{
            position: 'absolute',
            top: spacing.sm,
            right: spacing.md,
            zIndex: 10,
            padding: spacing.sm,
          }}
        >
          <Icon name="close" size={24} color={colors['on-surface-variant']} />
        </Pressable>
      )}
      {right && (
        <View
          style={{
            position: 'absolute',
            top: spacing.sm,
            left: spacing.md,
            zIndex: 10,
          }}
        >
          {right}
        </View>
      )}
    </View>
  );
}
