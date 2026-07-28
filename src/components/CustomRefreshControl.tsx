import { useEffect, useRef } from 'react';
import { RefreshControl } from 'react-native';
import { useThemeColors } from '../theme';

interface CustomRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
}

export function CustomRefreshControl({ refreshing, onRefresh }: CustomRefreshControlProps) {
  const colors = useThemeColors();

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.secondary}
      colors={[colors.secondary, colors.primary]}
      progressBackgroundColor={colors['surface-container']}
    />
  );
}
