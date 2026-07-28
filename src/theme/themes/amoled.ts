import type { ThemePalette } from './types';
import { dark } from './dark';

export const amoled: ThemePalette = {
  ...dark,
  background: '#000000',
  surface: '#000000',
  'surface-dim': '#000000',
  'surface-bright': '#0a0a0a',
  'surface-container-lowest': '#000000',
  'surface-container-low': '#050505',
  'surface-container': '#0a0a0a',
  'surface-container-high': '#121212',
  'surface-container-highest': '#1a1a1a',
  'on-surface': '#f8fafc',
  'on-surface-variant': '#cbd5e1',
  'surface-variant': '#1a1a1a',
  border: '#1a1a1a',
  divider: '#0a0a0a',
  // Interactive-state overlays must remain visible over pure black.
  // dark.ts derives these from primary rgba(0,4,140,...) which is
  // near-invisible on #000000. We use light-tinted overlays instead.
  hover: 'rgba(255,255,255,0.06)',
  pressed: 'rgba(255,255,255,0.12)',
  ripple: 'rgba(255,255,255,0.16)',
  focus: 'rgba(222,0,0,0.55)',
  // Shadows on AMOLED are effectively invisible, but we keep the token
  // present so shared style tokens don't blow up.
  shadow: 'rgba(0,0,0,0.6)',
  overlay: 'rgba(0,0,0,0.72)',
};

