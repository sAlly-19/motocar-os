export const spacing = {
  base: 4,
  gutter: 24,
  'margin-mobile': 16,
  'margin-desktop': 32,
  'container-max': 1440,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Border-radius scale + semantic aliases.
 *
 * Semantic tokens define intent so future audits stay consistent:
 * - `card`   → main containers (GlassCard, KpiCard, section wrappers)
 * - `field`  → inputs, selects, search bars
 * - `button` → primary CTAs, chips, pills (all rounded-full)
 * - `chip`   → status/filter chips (rounded-full)
 * - `sheet`  → modal sheets (rounded top corners handled per-component)
 */
export const borderRadius = {
  sm: 4,
  DEFAULT: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
  // Semantic aliases
  card: 16,
  field: 12,
  button: 9999,
  chip: 9999,
  sheet: 20,
};
