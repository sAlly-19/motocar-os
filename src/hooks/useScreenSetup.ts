import { useThemeColors } from '../theme';
import { useSidebar } from '../components/SidebarContext';
import { useWindowDimensions } from 'react-native';

export function useScreenSetup() {
  const colors = useThemeColors();
  const { open: openSidebar } = useSidebar();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  return { colors, openSidebar, screenWidth, screenHeight };
}
