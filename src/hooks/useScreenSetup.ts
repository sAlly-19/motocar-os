import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../theme';
import { useSidebar } from '../components/SidebarContext';
import { useWindowDimensions } from 'react-native';

export function useScreenSetup() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { open: openSidebar } = useSidebar();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  return { colors, t, openSidebar, screenWidth, screenHeight };
}
