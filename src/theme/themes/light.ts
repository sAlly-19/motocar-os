import type { ThemePalette } from './types';

export const light: ThemePalette = {
  // Primary & Secondary (User Mandated: Light -> Primary: #DE0000, Secondary: #00048C)
  primary: '#DE0000',
  'on-primary': '#ffffff',
  'primary-container': '#ffebe6',
  'on-primary-container': '#8a0000',

  secondary: '#00048C',
  'on-secondary': '#ffffff',
  'secondary-container': '#e0e4ff',
  'on-secondary-container': '#00025c',

  tertiary: '#00048C',
  'on-tertiary': '#ffffff',
  'tertiary-container': '#e0e4ff',
  'on-tertiary-container': '#00025c',

  // Surfaces & Backgrounds (Clean solid surfaces for workshop management)
  background: '#f8fafc',
  'on-background': '#0f172a',
  surface: '#ffffff',
  'surface-dim': '#f1f5f9',
  'surface-bright': '#ffffff',
  'surface-container-lowest': '#ffffff',
  'surface-container-low': '#f8fafc',
  'surface-container': '#f1f5f9',
  'surface-container-high': '#e2e8f0',
  'surface-container-highest': '#cbd5e1',
  'on-surface': '#0f172a',
  'on-surface-variant': '#475569',
  'surface-variant': '#f1f5f9',
  'inverse-surface': '#1e293b',
  'inverse-on-surface': '#f8fafc',
  'surface-tint': '#DE0000',

  // Borders & Dividers
  outline: '#cbd5e1',
  'outline-variant': '#e2e8f0',
  border: '#e2e8f0',
  divider: '#f1f5f9',

  // Statuses
  error: '#dc2626',
  'on-error': '#ffffff',
  'error-container': '#fee2e2',
  'on-error-container': '#991b1b',

  success: '#16a34a',
  'on-success': '#ffffff',
  'success-container': '#dcfce7',
  'on-success-container': '#166534',

  warning: '#d97706',
  'on-warning': '#ffffff',
  'warning-container': '#fef3c7',
  'on-warning-container': '#92400e',

  info: '#2563eb',
  'on-info': '#ffffff',
  'info-container': '#dbeafe',
  'on-info-container': '#1e40af',

  // Fixed Tokens
  'primary-fixed': '#ffebe6',
  'primary-fixed-dim': '#ffb4a3',
  'on-primary-fixed': '#450000',
  'on-primary-fixed-variant': '#8a0000',
  'secondary-fixed': '#e0e4ff',
  'secondary-fixed-dim': '#b3c0ff',
  'on-secondary-fixed': '#00013b',
  'on-secondary-fixed-variant': '#00025c',
  'tertiary-fixed': '#e0e4ff',
  'tertiary-fixed-dim': '#b3c0ff',
  'on-tertiary-fixed': '#00013b',
  'on-tertiary-fixed-variant': '#00025c',

  // Basic Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Utility Palette
  'green-100': '#dcfce7',
  'green-800': '#166534',
  'green-600': '#16a34a',
  'green-500': '#22c55e',
  'green-400': '#4ade80',
  'yellow-100': '#fef9c3',
  'yellow-800': '#854d0e',
  'yellow-500': '#eab308',
  'blue-100': '#dbeafe',
  'blue-800': '#1e40af',
  'red-100': '#fee2e2',
  'red-800': '#991b1b',
  'gray-100': '#f1f5f9',
  'gray-800': '#1e293b',

  // State & Interactive Tokens
  disabled: '#94a3b8',
  overlay: 'rgba(15, 23, 42, 0.5)',
  'text-primary': '#0f172a',
  'text-secondary': '#475569',
  'text-tertiary': '#94a3b8',
  placeholder: '#94a3b8',
  hover: 'rgba(222, 0, 0, 0.06)',
  pressed: 'rgba(222, 0, 0, 0.12)',
  focus: '#DE0000',
  ripple: 'rgba(222, 0, 0, 0.1)',
  shadow: 'rgba(15, 23, 42, 0.08)',
};

