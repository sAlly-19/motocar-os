import type { ThemePalette } from './types';

export const dark: ThemePalette = {
  // Primary & Secondary (User Mandated: Dark -> Primary: #00048C, Secondary: #DE0000)
  primary: '#00048C',
  'on-primary': '#ffffff',
  'primary-container': '#00025c',
  'on-primary-container': '#e0e4ff',

  secondary: '#DE0000',
  'on-secondary': '#ffffff',
  'secondary-container': '#8a0000',
  'on-secondary-container': '#ffebe6',

  tertiary: '#DE0000',
  'on-tertiary': '#ffffff',
  'tertiary-container': '#8a0000',
  'on-tertiary-container': '#ffebe6',

  // Surfaces & Backgrounds
  background: '#0f172a',
  'on-background': '#f8fafc',
  surface: '#1e293b',
  'surface-dim': '#0f172a',
  'surface-bright': '#334155',
  'surface-container-lowest': '#090d16',
  'surface-container-low': '#0f172a',
  'surface-container': '#1e293b',
  'surface-container-high': '#334155',
  'surface-container-highest': '#475569',
  'on-surface': '#f8fafc',
  'on-surface-variant': '#cbd5e1',
  'surface-variant': '#334155',
  'inverse-surface': '#f8fafc',
  'inverse-on-surface': '#0f172a',
  'surface-tint': '#00048C',

  // Borders & Dividers
  outline: '#475569',
  'outline-variant': '#334155',
  border: '#334155',
  divider: '#1e293b',

  // Statuses
  error: '#f87171',
  'on-error': '#450a0a',
  'error-container': '#991b1b',
  'on-error-container': '#fee2e2',

  success: '#4ade80',
  'on-success': '#052e16',
  'success-container': '#166534',
  'on-success-container': '#dcfce7',

  warning: '#fbbf24',
  'on-warning': '#451a03',
  'warning-container': '#92400e',
  'on-warning-container': '#fef3c7',

  info: '#60a5fa',
  'on-info': '#172554',
  'info-container': '#1e40af',
  'on-info-container': '#dbeafe',

  // Fixed Tokens
  'primary-fixed': '#00025c',
  'primary-fixed-dim': '#00013b',
  'on-primary-fixed': '#e0e4ff',
  'on-primary-fixed-variant': '#b3c0ff',
  'secondary-fixed': '#8a0000',
  'secondary-fixed-dim': '#450000',
  'on-secondary-fixed': '#ffebe6',
  'on-secondary-fixed-variant': '#ffb4a3',
  'tertiary-fixed': '#8a0000',
  'tertiary-fixed-dim': '#450000',
  'on-tertiary-fixed': '#ffebe6',
  'on-tertiary-fixed-variant': '#ffb4a3',

  // Basic Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Utility Palette
  'green-100': '#052e16',
  'green-800': '#4ade80',
  'green-600': '#22c55e',
  'green-500': '#16a34a',
  'green-400': '#166534',
  'yellow-100': '#451a03',
  'yellow-800': '#fde047',
  'yellow-500': '#eab308',
  'blue-100': '#172554',
  'blue-800': '#93c5fd',
  'red-100': '#450a0a',
  'red-800': '#fca5a5',
  'gray-100': '#1e293b',
  'gray-800': '#f8fafc',

  // State & Interactive Tokens
  disabled: '#64748b',
  overlay: 'rgba(0, 0, 0, 0.7)',
  'text-primary': '#f8fafc',
  'text-secondary': '#cbd5e1',
  'text-tertiary': '#94a3b8',
  placeholder: '#64748b',
  hover: 'rgba(0, 4, 140, 0.15)',
  pressed: 'rgba(0, 4, 140, 0.25)',
  focus: '#00048C',
  ripple: 'rgba(0, 4, 140, 0.2)',
  shadow: 'rgba(0, 0, 0, 0.36)',
};

