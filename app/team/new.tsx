import { useState, useRef } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, spacing } from '../../src/theme';
import { FormField } from '../../src/components/FormField';
import { CardHeader } from '../../src/components/CardHeader';
import { Icon } from '../../src/components/Icon';
import { AppShell } from '../../src/components/AppShell';
import { AppText, Button, Dialog, Input } from '../../src/ui';
import {
  useTeamStore,
  ROLE_LABEL,
  STATUS_LABEL,
  type EmployeeRole,
  type EmployeeStatus,
} from '../../src/stores/useTeamStore';

const ROLE_OPTIONS: EmployeeRole[] = ['mechanic', 'assistant', 'receptionist', 'admin', 'manager'];
const STATUS_OPTIONS: EmployeeStatus[] = ['active', 'inactive', 'vacation'];

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'tok-';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export default function NewEmployeeScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const insets = useSafeAreaInsets();
  const addEmployee = useTeamStore((s) => s.addEmployee);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<EmployeeRole>('mechanic');
  const [status, setStatus] = useState<EmployeeStatus>('active');
  const [token, setToken] = useState(generateToken());
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successModal, setSuccessModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Nome obrigatorio';
    if (!phone.trim()) e.phone = 'Telefone obrigatorio';
    setErrors(e);
    if (Object.keys(e).length > 0) scrollRef.current?.scrollTo({ y: 0, animated: true });
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    addEmployee({
      fullName: fullName.trim(),
      phone: phone.trim(),
      role,
      status,
      notes: notes.trim(),
      token,
    });
    setTimeout(() => {
      setSaving(false);
      setSuccessModal(true);
    }, 300);
  };

  const handleCopyToken = () => {
    try {
      (navigator as any)?.clipboard?.writeText?.(token);
    } catch {
      // Clipboard not available
    }
  };

  const handleRegenerateToken = () => {
    setToken(generateToken());
  };

  return (
    <AppShell>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing['margin-mobile'],
            paddingBottom: insets.bottom + 120,
            gap: spacing.gutter,
          }}
        >
          <View>
            <AppText variant="h2" style={{ color: colors.primary }}>
              Novo Membro
            </AppText>
            <AppText variant="bodySmall" color="text-secondary" style={{ marginTop: spacing.xs }}>
              Cadastre um novo membro da equipe da oficina.
            </AppText>
          </View>

          <View
            style={{
              borderRadius: br.xl,
              backgroundColor: colors['surface-container-lowest'],
              borderWidth: 1,
              borderColor: colors['outline-variant'],
              overflow: 'hidden',
            }}
          >
            <CardHeader title="Dados pessoais" icon="person" />
            <View style={{ padding: spacing.lg }}>
              <FormField
                label="Nome completo"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ex: Joao da Silva"
                error={errors.fullName}
              />
              <FormField
                label="Telefone"
                value={phone}
                onChangeText={setPhone}
                placeholder="(11) 99999-9999"
                keyboardType="phone-pad"
                error={errors.phone}
              />
            </View>
          </View>

          <View
            style={{
              borderRadius: br.xl,
              backgroundColor: colors['surface-container-lowest'],
              borderWidth: 1,
              borderColor: colors['outline-variant'],
              overflow: 'hidden',
            }}
          >
            <CardHeader title="Funcao e status" icon="work" />
            <View style={{ padding: spacing.lg, gap: spacing.md }}>
              <View>
                <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
                  Cargo
                </AppText>
                <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                  {ROLE_OPTIONS.map((r) => {
                    const selected = role === r;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setRole(r)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: br.lg,
                          borderWidth: 1,
                          borderColor: selected ? colors.primary : colors['outline-variant'],
                          backgroundColor: selected ? colors.primary : 'transparent',
                        }}
                      >
                        <AppText
                          variant="label"
                          style={{ color: selected ? colors['on-primary'] : colors['on-surface'] }}
                        >
                          {ROLE_LABEL[r]}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View>
                <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
                  Status
                </AppText>
                <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map((s) => {
                    const selected = status === s;
                    return (
                      <Pressable
                        key={s}
                        onPress={() => setStatus(s)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: br.lg,
                          borderWidth: 1,
                          borderColor: selected ? colors.secondary : colors['outline-variant'],
                          backgroundColor: selected ? colors.secondary : 'transparent',
                        }}
                      >
                        <AppText
                          variant="label"
                          style={{ color: selected ? colors['on-secondary'] : colors['on-surface'] }}
                        >
                          {STATUS_LABEL[s]}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              borderRadius: br.xl,
              backgroundColor: colors['surface-container-lowest'],
              borderWidth: 1,
              borderColor: colors['outline-variant'],
              overflow: 'hidden',
            }}
          >
            <CardHeader title="Token de Acesso" icon="key" />
            <View style={{ padding: spacing.lg }}>
              <AppText variant="bodySmall" color="text-secondary" style={{ marginBottom: spacing.sm }}>
                Token utilizado para acesso ao aplicativo.
              </AppText>
              <Input
                label="Token"
                value={token}
                editable={false}
                rightIcon="content_copy"
                onRightIconPress={handleCopyToken}
              />
              <Button
                variant="outline"
                size="sm"
                title="Gerar novamente"
                icon="refresh"
                onPress={handleRegenerateToken}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>

          <View
            style={{
              borderRadius: br.xl,
              backgroundColor: colors['surface-container-lowest'],
              borderWidth: 1,
              borderColor: colors['outline-variant'],
              overflow: 'hidden',
            }}
          >
            <CardHeader title="Observacoes" icon="notes" />
            <View style={{ padding: spacing.lg }}>
              <FormField
                label="Notas internas"
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex: Especialista em motores V8..."
                multiline
                numberOfLines={4}
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              variant="ghost"
              title="Cancelar"
              onPress={() => router.back()}
              style={{ flex: 1 }}
            />
            <Button
              variant="primary"
              title={saving ? 'Salvando...' : 'Cadastrar membro'}
              icon="check"
              onPress={handleSave}
              disabled={saving}
              style={{ flex: 2 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Dialog
        visible={successModal}
        title="Membro cadastrado!"
        message={`${fullName} foi adicionado a equipe com sucesso.`}
        confirmLabel="Ok"
        onConfirm={() => {
          setSuccessModal(false);
          router.back();
        }}
      />
    </AppShell>
  );
}
