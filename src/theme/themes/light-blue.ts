import type { ThemePalette } from './types';
import { light } from './light';

export const lightBlue: ThemePalette = {
  ...light,
  // Primary (Blue highlight)
  primary: '#00048C',
  'on-primary': '#ffffff',
  'primary-container': '#e0e4ff',
  'on-primary-container': '#00025c',

  // Secondary (Red accents/alerts)
  secondary: '#DE0000',
  'on-secondary': '#ffffff',
  'secondary-container': '#ffebe6',
  'on-secondary-container': '#8a0000',

  // Fixed Tokens
  'primary-fixed': '#e0e4ff',
  'primary-fixed-dim': '#b3c0ff',
  'on-primary-fixed': '#00013b',
  'on-primary-fixed-variant': '#00025c',
  'secondary-fixed': '#ffebe6',
  'secondary-fixed-dim': '#ffb4a3',
  'on-secondary-fixed': '#450000',
  'on-secondary-fixed-variant': '#8a0000',
  
  // Interactive Focus overrides
  focus: '#00048C',
  hover: 'rgba(0, 4, 140, 0.06)',
  pressed: 'rgba(0, 4, 140, 0.12)',
  ripple: 'rgba(0, 4, 140, 0.1)',
};