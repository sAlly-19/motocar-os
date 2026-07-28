import { Easing } from 'react-native-reanimated';

export interface DesignTokens {
  colors: any;
  spacing: object;
  borderRadius: object;
  typography: object;
  animation: object;
  shadow: object;
}

export const animationTokens = {
  duration: { fast: 150, normal: 250, slow: 350, enter: 300, exit: 200 },
  easing: {
    default: Easing.bezier(0.4, 0, 0.2, 1),
    decelerate: Easing.bezier(0, 0, 0.2, 1),
    accelerate: Easing.bezier(0.4, 0, 1, 1),
  },
  spring: {
    default: { damping: 20, stiffness: 200, mass: 1 },
    gentle: { damping: 24, stiffness: 120, mass: 1 },
    snappy: { damping: 14, stiffness: 260, mass: 0.8 },
  },
};

/**
 * Multi-layer shadow tokens following Material 3 elevation.
 * Semantic aliases (`row`, `card`, `kpi`, `modal`) map to specific altitudes
 * so consumers can express intent instead of picking size.
 */
export function createShadowTokens(colors: any) {
  const s = colors.shadow;
  const tokens = {
    // Numeric scale (M3-like).
    none: { shadowColor: 'transparent', shadowOpacity: 0, elevation: 0 },
    sm: { shadowColor: s, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: s, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
    lg: { shadowColor: s, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 4 },
    xl: { shadowColor: s, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 28, elevation: 10 },
    // Semantic (intent-based).
    row: { shadowColor: s, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
    card: { shadowColor: s, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
    kpi: { shadowColor: s, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
    modal: { shadowColor: s, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 12 },
  };
  return tokens;
}
