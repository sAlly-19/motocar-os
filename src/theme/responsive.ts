import { useWindowDimensions } from 'react-native';

export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1440,
} as const;

/**
 * Semantic breakpoint hook.
 * - `isMobile` — <768px
 * - `isTablet` — 768–1023px
 * - `isDesktop` — 1024–1439px
 * - `isXL` — >=1440px (extra density: larger paddings, bigger targets)
 */
export function useBreakpoints() {
  const { width } = useWindowDimensions();
  return {
    width,
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isXL: width >= breakpoints.xl,
    // Backwards-compat convenience:
    isDesktopOrUp: width >= breakpoints.lg,
  };
}

/**
 * Returns the appropriate row padding for the current breakpoint.
 * Denser on small screens, roomier on XL.
 */
export function useRowPadding() {
  const { isXL, isDesktop } = useBreakpoints();
  if (isXL) return { paddingVertical: 18, paddingHorizontal: 20 };
  if (isDesktop) return { paddingVertical: 14, paddingHorizontal: 16 };
  return { paddingVertical: 12, paddingHorizontal: 12 };
}
