import type { ThemePalette } from './types';
import { amoledBlue } from './amoled-blue';

export const amoledRed: ThemePalette = {
  ...amoledBlue,
  // Primary (Vermelho como destaque)
  primary: '#DE0000',
  'on-primary': '#ffffff',
  'primary-container': '#8a0000',
  'on-primary-container': '#ffebe6',

  // Secondary (Azul como secundário)
  secondary: '#00048C',
  'on-secondary': '#ffffff',
  'secondary-container': '#00025c',
  'on-secondary-container': '#e0e4ff',

  // Fixed Tokens
  'primary-fixed': '#8a0000',
  'primary-fixed-dim': '#450000',
  'on-primary-fixed': '#ffebe6',
  'on-primary-fixed-variant': '#ffb4a3',
  'secondary-fixed': '#00025c',
  'secondary-fixed-dim': '#00013b',
  'on-secondary-fixed': '#e0e4ff',
  'on-secondary-fixed-variant': '#b3c0ff',
  
  // Interactive overrides
  focus: '#DE0000',
  'surface-tint': '#DE0000',
};