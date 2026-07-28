import { View } from 'react-native';
import { useThemeColors, spacing } from '../theme';
import { AppText } from '../ui/Text';
import { Icon } from './Icon';

interface CardHeaderProps {
  title: string;
  icon?: string;
  right?: React.ReactNode;
}

export function CardHeader({ title, icon, right }: CardHeaderProps) {
  const colors = useThemeColors();
  return (
    <View style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {icon && <Icon name={icon} size={24} color={colors['on-primary']} />}
        <AppText variant="label" color={undefined} style={{ color: colors['on-primary'], textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </AppText>
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}
