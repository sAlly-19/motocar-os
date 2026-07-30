import { useEffect } from 'react';
import { View } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeColors, spacing } from '../theme';
import { AppText } from '../ui/Text';

interface SplashScreenProps {
  /**
   * Callback fired when the splash animation sequence completes.
   * If omitted, the splash simply animates once and stays.
   */
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const colors = useThemeColors();
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  const rLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const rSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const rProgressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressWidth.value, [0, 1], [0, 100])}%`,
  }));

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 20, stiffness: 200 });
    logoOpacity.value = withTiming(1, { duration: 400 });
    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
    // Progress bar fires the onFinish callback on completion (final step of the sequence).
    progressWidth.value = withDelay(
      700,
      withTiming(1, { duration: 800 }, (finished) => {
        if (finished && onFinish) {
          runOnJS(onFinish)();
        }
      }),
    );
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Reanimated.View style={[rLogoStyle, { alignItems: 'center' }]}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors['on-primary'],
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <AppText variant="h1" style={{ color: colors.primary, fontSize: 36 }}>M</AppText>
        </View>
        <AppText variant="h1" style={{ color: colors['on-primary'], fontSize: 36 }}>MotoCar</AppText>
      </Reanimated.View>
      <Reanimated.View style={[rSubtitleStyle, { marginTop: spacing.sm }]}>
        <AppText variant="body" style={{ color: colors['on-primary'], opacity: 0.8 }}>Sistema de Gerenciamento de Ordens de Serviço</AppText>
      </Reanimated.View>
      <View style={{ position: 'absolute', bottom: 80, left: spacing.xl, right: spacing.xl }}>
        <View
          style={{
            height: 3,
            backgroundColor: colors['on-primary'],
            opacity: 0.2,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Reanimated.View style={[rProgressStyle, { height: '100%', backgroundColor: colors['on-primary'], borderRadius: 2 }]} />
        </View>
      </View>
    </View>
  );
}
