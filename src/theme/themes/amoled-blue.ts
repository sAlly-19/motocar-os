import type { ThemePalette } from './types';

export const amoledBlue: ThemePalette = {
  // Primary (Azul como destaque)
  primary: '#00048C',
  'on-primary': '#ffffff',
  'primary-container': '#00025c',
  'on-primary-container': '#e0e4ff',

  // Secondary (Vermelho para alertas ou ações secundárias)
  secondary: '#DE0000',
  'on-secondary': '#ffffff',
  'secondary-container': '#8a0000',
  'on-secondary-container': '#ffebe6',

  // Tertiary
  tertiary: '#00048C',
  'on-tertiary': '#ffffff',
  'tertiary-container': '#00025c',
  'on-tertiary-container': '#e0e4ff',

  // Surfaces & Backgrounds (Fundo Preto Absoluto para economia de bateria OLED)
  background: '#000000',
  'on-background': '#f8fafc',
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
  'inverse-surface': '#ffffff',
  'inverse-on-surface': '#000000',
  'surface-tint': '#00048C',

  // Borders & Dividers
  outline: '#334155',
  'outline-variant': '#1e293b',
  border: '#1a1a1a',
  divider: '#0a0a0a',

  // Statuses
  error: '#ef4444',
  'on-error': '#ffffff',
  'error-container': '#991b1b',
  'on-error-container': '#fca5a5',

  success: '#22c55e',
  'on-success': '#ffffff',
  'success-container': '#166534',
  'on-success-container': '#86efac',

  warning: '#f59e0b',
  'on-warning': '#ffffff',
  'warning-container': '#92400e',
  'on-warning-container': '#fcd34d',

  info: '#3b82f6',
  'on-info': '#ffffff',
  'info-container': '#1e40af',
  'on-info-container': '#93c5fd',

  // Fixed Tokens
  'primary-fixed': '#00025c',
  'primary-fixed-dim': '#00013b',
  'on-primary-fixed': '#e0e4ff',
  'on-primary-fixed-variant': '#b3c0ff',
  'secondary-fixed': '#8a0000',
  'secondary-fixed-dim': '#450000',
  'on-secondary-fixed': '#ffebe6',
  'on-secondary-fixed-variant': '#ffb4a3',
  'tertiary-fixed': '#00025c',
  'tertiary-fixed-dim': '#00013b',
  'on-tertiary-fixed': '#e0e4ff',
  'on-tertiary-fixed-variant': '#b3c0ff',

  // Basic Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Utility Palette
  'green-100': '#166534',
  'green-800': '#dcfce7',
  'green-600': '#22c55e',
  'green-500': '#4ade80',
  'green-400': '#86efac',
  'yellow-100': '#854d0e',
  'yellow-800': '#fef9c3',
  'yellow-500': '#f59e0b',
  'blue-100': '#1e40af',
  'blue-800': '#dbeafe',
  'red-100': '#991b1b',
  'red-800': '#fee2e2',
  'gray-100': '#1e293b',
  'gray-800': '#f1f5f9',

  // State & Interactive Tokens
  disabled: '#475569',
  overlay: 'rgba(0,0,0,0.72)',
  'text-primary': '#f8fafc',
  'text-secondary': '#cbd5e1',
  'text-tertiary': '#64748b',
  placeholder: '#475569',
  hover: 'rgba(255,255,255,0.06)',
  pressed: 'rgba(255,255,255,0.12)',
  focus: '#00048C',
  ripple: 'rgba(255,255,255,0.16)',
  shadow: 'rgba(0,0,0,0.6)',
};