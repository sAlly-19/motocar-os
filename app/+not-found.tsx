import { View } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors, spacing } from '../src/theme';
import { AppText, Button } from '../src/ui';
import { Icon } from '../src/components/Icon';

export default function NotFoundScreen() {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
      <Icon name="warning" size={64} color={colors['outline-variant']} />
      <AppText variant="h1" color={undefined} style={{ color: colors.primary, marginTop: spacing.md }}>Página não encontrada</AppText>
      <AppText variant="bodySmall" color="text-secondary" align="center" style={{ marginTop: spacing.sm }}>A rota que você tentou acessar não existe.</AppText>
      <Button variant="primary" title="Voltar ao Dashboard" onPress={() => router.replace('/(tabs)/dashboard')} style={{ marginTop: spacing.lg }} />
    </View>
  );
}
