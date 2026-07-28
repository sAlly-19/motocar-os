import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useThemeColors, useThemeShadows, animationTokens } from '../theme';

interface SwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const TRACK_W = 52;
const TRACK_H = 32;
const THUMB_SIZE = 26;
const THUMB_MARGIN = 3;

export function Switch({ value, onValueChange, disabled, accessibilityLabel }: SwitchProps) {
  const colors = useThemeColors();
  const shadows = useThemeShadows();
  const animatedValue = useSharedValue(value ? 1 : 0);

  const trackStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(
      animatedValue.value,
      [0, 1],
      [colors['surface-container-high'], colors.primary],
    );
    return { backgroundColor: bg };
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animatedValue.value * (TRACK_W - THUMB_SIZE - THUMB_MARGIN * 2) }],
  }));

  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        animatedValue.value = withSpring(value ? 0 : 1, animationTokens.spring.snappy);
        onValueChange(!value);
      }}
    >
      <Animated.View
        style={[
          {
            width: TRACK_W,
            height: TRACK_H,
            borderRadius: TRACK_H / 2,
            justifyContent: 'center',
            paddingHorizontal: THUMB_MARGIN,
            opacity: disabled ? 0.5 : 1,
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: colors.surface,
            },
            shadows.sm,
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
