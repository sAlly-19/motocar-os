import { useEffect, useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, useThemeShadows, spacing } from '../../src/theme';
import { AppText, Button, Chip } from '../../src/ui';
import { FormField } from '../../src/components/FormField';
import { Icon } from '../../src/components/Icon';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useTeamStore } from '../../src/stores/useTeamStore';

type LoginMode = 'admin' | 'employee';

export default function LoginScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const shadows = useThemeShadows();
  const insets = useSafeAreaInsets();

  const loginAdmin = useAuthStore((s) => s.loginAdmin);
  const loginEmployee = useAuthStore((s) => s.loginEmployee);
  const loginError = useAuthStore((s) => s.loginError);
  const clearError = useAuthStore((s) => s.clearError);
  const authRole = useAuthStore((s) => s.role);

  const employees = useTeamStore((s) => s.employees);
  const teamInitialized = useTeamStore((s) => s.initialized);
  const initializeTeam = useTeamStore((s) => s.initialize);

  const [mode, setMode] = useState<LoginMode>('admin');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!teamInitialized) initializeTeam();
  }, [teamInitialized, initializeTeam]);

  // Se já autenticado, redirecionar automaticamente.
  useEffect(() => {
    if (authRole) router.replace('/');
  }, [authRole]);

  useEffect(() => {
    // Ao trocar de modo, limpa erros.
    clearError();
  }, [mode, clearError]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (mode === 'admin') {
        const ok = await loginAdmin(name, password);
        if (ok) router.replace('/');
      } else {
        const ok = await loginEmployee(phone, token, employees);
        if (ok) router.replace('/');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    mode === 'admin' ? name.trim().length > 0 && password.length > 0 : phone.trim().length > 0 && token.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing['margin-mobile'],
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              {
                width: '100%',
                maxWidth: 440,
                backgroundColor: colors['surface-container-lowest'],
                borderRadius: br.xl,
                borderWidth: 1,
                borderColor: colors['outline-variant'],
                padding: spacing.xl,
                gap: spacing.md,
              },
              shadows.card ?? shadows.md,
            ]}
          >
            {/* Logo / título */}
            <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors['primary-container'],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                <Icon name="lock" size={30} color={colors['on-primary-container']} />
              </View>
              <AppText variant="h2" style={{ color: colors.primary }}>
                MotoCar
              </AppText>
              <AppText variant="bodySmall" color="text-secondary" align="center">
                Faça login para acessar o sistema
              </AppText>
            </View>

            {/* Chips de modo */}
            <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' }}>
              <Chip
                label="Administrador"
                leftIcon="admin_panel_settings"
                selected={mode === 'admin'}
                onPress={() => setMode('admin')}
              />
              <Chip
                label="Funcionário"
                leftIcon="engineering"
                selected={mode === 'employee'}
                onPress={() => setMode('employee')}
              />
            </View>

            {/* Formulário condicional */}
            {mode === 'admin' ? (
              <>
                <FormField
                  label="Nome"
                  placeholder="Admin"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    clearError();
                  }}
                />
                <FormField
                  label="Senha"
                  placeholder="Sua senha"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    clearError();
                  }}
                />
              </>
            ) : (
              <>
                <FormField
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(v) => {
                    setPhone(v);
                    clearError();
                  }}
                />
                <FormField
                  label="Token de acesso"
                  placeholder="Token gerado no cadastro"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={token}
                  onChangeText={(v) => {
                    setToken(v);
                    clearError();
                  }}
                />
                <AppText variant="labelSmall" color="text-tertiary">
                  O token é fornecido pelo administrador no momento do cadastro em Equipe.
                </AppText>
              </>
            )}

            {loginError && (
              <View
                style={{
                  padding: spacing.sm,
                  borderRadius: br.field,
                  backgroundColor: colors['error-container'],
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                <Icon name="error_outline" size={18} color={colors['on-error-container']} />
                <AppText variant="bodySmall" style={{ color: colors['on-error-container'], flex: 1 }}>
                  {loginError}
                </AppText>
              </View>
            )}

            <Button
              variant="primary"
              title="Entrar"
              icon="login"
              fullWidth
              loading={submitting}
              disabled={!canSubmit || submitting}
              onPress={handleSubmit}
            />
          </View>

          <AppText variant="labelSmall" color="text-tertiary" style={{ marginTop: spacing.lg }}>
            MotoCar Premium Workshop Manager
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
