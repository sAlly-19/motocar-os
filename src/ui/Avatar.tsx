import { View, Image } from 'react-native';
import { useThemeColors, useThemeBorderRadius } from '../theme';
import { AppText } from './Text';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors['primary-container'],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText
        variant="label"
        color={undefined}
        style={{
          color: colors['on-primary-container'],
          fontSize: size * 0.4,
          fontWeight: '700',
        }}
      >
        {initials}
      </AppText>
    </View>
  );
}
