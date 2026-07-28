import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useThemeColors, spacing, animationTokens } from '../theme';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
}

export function Checkbox({ checked, onToggle }: CheckboxProps) {
  const colors = useThemeColors();
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(checked ? colors.primary : 'transparent', { duration: animationTokens.duration.fast }),
    borderColor: withTiming(checked ? colors.primary : colors['outline'], { duration: animationTokens.duration.fast }),
  }));

  return (
    <Animated.View style={[{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
      <Pressable onPress={onToggle} style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        {checked && <Animated.Text style={{ color: colors['on-primary'], fontSize: 14, lineHeight: 16 }}>✓</Animated.Text>}
      </Pressable>
    </Animated.View>
  );
}
