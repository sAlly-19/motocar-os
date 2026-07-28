import { useEffect } from 'react';
import { View, Modal, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing, animationTokens } from '../theme';
import { AppText } from './Text';
import { Button } from './Button';
import { Icon } from '../components/Icon';

type DialogType = 'confirm' | 'success' | 'error' | 'info' | 'warning';

interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface DialogProps {
  visible: boolean;
  title: string;
  message: string;
  type?: DialogType;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  buttons?: DialogButton[];
}

/**
 * Config maps each dialog type to:
 * - `icon`: Material icon name
 * - `iconColor`: theme color token for the icon
 * - `iconBg`: theme color token for the icon's tinted background circle (uses -container variants)
 */
const dialogConfig: Record<DialogType, { icon: string; iconColor: string; iconBg: string }> = {
  confirm: { icon: 'help', iconColor: 'secondary', iconBg: 'secondary-container' },
  success: { icon: 'check_circle', iconColor: 'success', iconBg: 'success-container' },
  error: { icon: 'warning', iconColor: 'error', iconBg: 'error-container' },
  info: { icon: 'info', iconColor: 'primary', iconBg: 'primary-container' },
  warning: { icon: 'warning', iconColor: 'warning', iconBg: 'warning-container' },
};

export function Dialog({
  visible,
  title,
  message,
  type = 'info',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  buttons,
}: DialogProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const scale = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const cfg = dialogConfig[type];

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, animationTokens.spring.gentle);
      overlayOpacity.value = withTiming(1, {
        duration: animationTokens.duration.enter,
        easing: animationTokens.easing.decelerate,
      });
    } else {
      scale.value = withTiming(0, {
        duration: animationTokens.duration.exit,
        easing: animationTokens.easing.accelerate,
      });
      overlayOpacity.value = withTiming(0, {
        duration: animationTokens.duration.exit,
        easing: animationTokens.easing.accelerate,
      });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  const iconBgColor = colors[cfg.iconBg] ?? colors['surface-container'];
  const iconFgColor = colors[cfg.iconColor] ?? colors.primary;

  const renderDefaultActions = () => (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xs,
        width: '100%',
        flexWrap: 'wrap',
      }}
    >
      {onCancel && (
        <View style={{ flex: 1, minWidth: 120 }}>
          <Button title={cancelLabel} variant="outline" fullWidth onPress={onCancel} />
        </View>
      )}
      {onConfirm && (
        <View style={{ flex: 1, minWidth: 120 }}>
          <Button
            title={confirmLabel}
            variant={type === 'error' || type === 'warning' ? 'destructive' : 'primary'}
            fullWidth
            onPress={onConfirm}
          />
        </View>
      )}
    </View>
  );

  const renderCustomButtons = () => (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xs,
        width: '100%',
        flexWrap: 'wrap',
      }}
    >
      {buttons!.map((btn, index) => {
        const variant: 'primary' | 'outline' | 'destructive' =
          btn.style === 'destructive' ? 'destructive' : btn.style === 'cancel' ? 'outline' : 'primary';
        return (
          <View key={index} style={{ flex: 1, minWidth: 120 }}>
            <Button title={btn.text} variant={variant} fullWidth onPress={btn.onPress} />
          </View>
        );
      })}
    </View>
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Animated.View
        style={[
          {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
            backgroundColor: colors.overlay,
          },
          overlayStyle,
        ]}
      >
        {/* Backdrop press-to-dismiss when a cancel action exists */}
        {onCancel && (
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Fechar diálogo"
          />
        )}
        <Animated.View
          accessibilityRole="alert"
          style={[
            {
              width: '100%',
              maxWidth: 400,
              backgroundColor: colors.surface,
              borderRadius: br.xl,
              padding: spacing.xl,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            },
            shadows.xl,
            cardStyle,
          ]}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: iconBgColor,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Icon name={cfg.icon} size={32} color={iconFgColor} />
          </View>
          <AppText variant="h4" align="center" style={{ marginBottom: spacing.sm }}>
            {title}
          </AppText>
          {!!message && (
            <AppText
              variant="bodySmall"
              color="text-secondary"
              align="center"
              style={{ marginBottom: spacing.md }}
            >
              {message}
            </AppText>
          )}
          {buttons && buttons.length > 0 ? renderCustomButtons() : renderDefaultActions()}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
