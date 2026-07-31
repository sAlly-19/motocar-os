import { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, spacing } from '../../src/theme';
import { FormField } from '../../src/components/FormField';
import { CardHeader } from '../../src/components/CardHeader';
import { AppShell } from '../../src/components/AppShell';
import { EmptyState } from '../../src/components/EmptyState';
import { Icon } from '../../src/components/Icon';
import { AppText, Button, Input } from '../../src/ui';
import { useDialog } from '../../src/components/DialogContext';
import {
  useTeamStore,
  ROLE_LABEL,
  STATUS_LABEL,
  type EmployeeRole,
  type EmployeeStatus,
} from '../../src/stores/useTeamStore';
import { triggerHaptic } from '../../src/utils/haptics';

const ROLE_OPTIONS: EmployeeRole[] = ['mechanic', 'assistant', 'receptionist', 'admin', 'manager'];
const STATUS_OPTIONS: EmployeeStatus[] = ['active', 'inactive', 'vacation'];

export default function EditEmployeeScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showConfirm, showAlert } = useDialog();
  const { id } = useLocalSearchParams<{ id: string }>();

  const employees = useTeamStore((s) => s.employees);
  const updateEmployee = useTeamStore((s) => s.updateEmployee);
  const removeEmployee = useTeamStore((s) => s.removeEmployee);
  const employee = useMemo(() => employees.find((e) => e.id === id), [employees, id]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const markChanged = () => setHasUnsavedChanges(true);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<EmployeeRole>('mechanic');
  const [status, setStatus] = useState<EmployeeStatus>('active');
  const [token, setToken] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (employee && !initialized) {
      setFullName(employee.fullName);
      setPhone(employee.phone);
      setRole(employee.role);
      setStatus(employee.status);
      setToken(employee.token || '');
      setNotes(employee.notes);
      setInitialized(true);
    }
  }, [employee, initialized]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      showConfirm(
        'Descartar alterações?',
        'Você tem alterações não salvas.',
        () => navigation.dispatch(e.data.action),
      );
    });
    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  if (!employee) {
    return (
      <AppShell>
        <EmptyState
          illustration="empty-team"
          title="Membro não encontrado"
          subtitle="Este membro foi removido ou o link está incorreto."
          action={<Button variant="primary" title="Voltar" onPress={() => router.back()} />}
        />
      </AppShell>
    );
  }

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Nome é obrigatório';
    if (!phone.trim()) errs.phone = 'Telefone é obrigatório';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showAlert('Atenção', 'Corrija os campos destacados.');
      return;
    }
    setSaving(true);
    try {
      updateEmployee(employee.id, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        role,
        status,
        token: token.trim(),
        notes: notes.trim(),
      });
      triggerHaptic('success');
      setHasUnsavedChanges(false);
      showAlert('Salvo', 'As alterações foram gravadas.');
    } catch (e) {
      showAlert('Erro', `Não foi possível salvar: ${e instanceof Error ? e.message : 'erro'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    showConfirm(
      'Excluir membro?',
      `Tem certeza que deseja excluir "${employee.fullName}"? Esta ação não pode ser desfeita.`,
      () => {
        removeEmployee(employee.id);
        triggerHaptic('warning');
        setHasUnsavedChanges(false);
        router.back();
      },
    );
  };

  const handleCopyToken = () => {
    try {
      (navigator as any)?.clipboard?.writeText?.(token);
      showAlert('Copiado', 'Token copiado para a área de transferência.');
    } catch {
      // Fallback
    }
  };

  const handleRegenerateToken = () => {
    showConfirm(
      'Regerar Token',
      'Gerar um novo token invalidará o acesso atual deste membro até que ele insira o novo token. Confirmar?',
      () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let newToken = 'MC-';
        for (let i = 0; i < 4; i++) {
          newToken += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setToken(newToken);
        markChanged();
      }
    );
  };

  return (
    <AppShell>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing['margin-mobile'],
            paddingBottom: spacing.xxl * 2 + insets.bottom,
            maxWidth: 640,
            width: '100%',
            alignSelf: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.sm,
              marginBottom: spacing.lg,
              flexWrap: 'wrap',
            }}
          >
            <View style={{ flex: 1, minWidth: 200 }}>
              <AppText variant="h1" style={{ color: colors.primary }}>Editar Membro</AppText>
              <AppText variant="bodySmall" color="text-secondary">
                {employee.fullName}
              </AppText>
            </View>
            <Button variant="destructive" title="Excluir" icon="delete" onPress={handleDelete} />
          </View>

          <View
            style={{
              backgroundColor: colors['surface-container-lowest'],
              borderWidth: 1,
              borderColor: colors['outline-variant'],
              borderRadius: br.xl,
              overflow: 'hidden',
              marginBottom: spacing.gutter,
            }}
          >
            <CardHeader title="Dados" icon="person" />
            <View style={{ padding: spacing.lg }}>
              <FormField
                label="Nome completo"
                value={fullName}
                onChangeText={(v) => { setFullName(v); clearError('fullName'); markChanged(); }}
                error={errors.fullName}
              />
              <FormField
                label="Telefone"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(v) => { setPhone(v); clearError('phone'); markChanged(); }}
                error={errors.phone}
              />

              {/* Cargo */}
              <View style={{ marginBottom: spacing.md }}>
                <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
                  Cargo
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {ROLE_OPTIONS.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => { setRole(r); markChanged(); }}
                      style={({ pressed }) => ({
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs + 2,
                        borderRadius: br.full,
                        borderWidth: 1,
                        borderColor: role === r ? colors.primary : colors['outline-variant'],
                        backgroundColor: role === r ? colors['primary-container'] : pressed ? colors['surface-container'] : 'transparent',
                      })}
                    >
                      <AppText
                        variant="labelSmall"
                        style={{
                          color: role === r ? colors['on-primary-container'] : colors['on-surface'],
                          fontWeight: role === r ? '700' : '500',
                        }}
                      >
                        {ROLE_LABEL[r]}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Status */}
              <View style={{ marginBottom: spacing.md }}>
                <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
                  Status
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {STATUS_OPTIONS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => { setStatus(s); markChanged(); }}
                      style={({ pressed }) => ({
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs + 2,
                        borderRadius: br.full,
                        borderWidth: 1,
                        borderColor: status === s ? colors.primary : colors['outline-variant'],
                        backgroundColor: status === s ? colors['primary-container'] : pressed ? colors['surface-container'] : 'transparent',
                      })}
                    >
                      <AppText
                        variant="labelSmall"
                        style={{
                          color: status === s ? colors['on-primary-container'] : colors['on-surface'],
                          fontWeight: status === s ? '700' : '500',
                        }}
                      >
                        {STATUS_LABEL[s]}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <FormField
                label="Observações"
                placeholder="Notas internas..."
                value={notes}
                onChangeText={(v) => { setNotes(v); markChanged(); }}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors['surface-container-lowest'],
              borderWidth: 1,
              borderColor: colors['outline-variant'],
              borderRadius: br.xl,
              overflow: 'hidden',
              marginBottom: spacing.gutter,
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
                title="Regerar Token"
                icon="refresh"
                onPress={handleRegenerateToken}
              />
            </View>
          </View>

          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <Button
              variant="primary"
              title="Salvar Alterações"
              icon="save"
              fullWidth
              loading={saving}
              disabled={!hasUnsavedChanges || saving}
              onPress={handleSave}
            />
            <Button variant="outline" title="Cancelar" fullWidth onPress={() => router.back()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}
