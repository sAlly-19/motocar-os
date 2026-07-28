import type { ThemePalette } from './types';
import { dark } from './dark';

export const midnight: ThemePalette = {
  ...dark,
  background: '#020617',
  surface: '#0f172a',
  'surface-container-lowest': '#020617',
  'surface-container-low': '#0b1120',
  'surface-container': '#0f172a',
  'surface-container-high': '#1e293b',
  'surface-container-highest': '#334155',
  border: '#1e293b',
  divider: '#0f172a',
  // Overlays derived from primary rgba(0,4,140,...) blend into the midnight
  // navy background. Use light-tinted overlays for perceptible feedback.
  hover: 'rgba(255,255,255,0.05)',
  pressed: 'rgba(255,255,255,0.10)',
  ripple: 'rgba(255,255,255,0.14)',
  focus: 'rgba(222,0,0,0.5)',
  shadow: 'rgba(0,0,0,0.55)',
  overlay: 'rgba(2,6,23,0.72)',
};
