import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, spacing } from '../../src/theme';
import { FormField } from '../../src/components/FormField';
import { CardHeader } from '../../src/components/CardHeader';
import { AppShell } from '../../src/components/AppShell';
import { Dialog } from '../../src/ui';
import { AppText, Button } from '../../src/ui';
import { useDialog } from '../../src/components/DialogContext';
import { useAppStore } from '../../src/stores/useAppStore';
import { generateId } from '../../src/utils/generateId';
import { triggerHaptic } from '../../src/utils/haptics';

export default function NewCustomerScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showConfirm, showAlert } = useDialog();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const markChanged = () => setHasUnsavedChanges(true);
  const addCustomer = useAppStore((s) => s.addCustomer);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  useEffect(() => {
    if (Object.keys(errors).length > 0) scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [errors]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      showConfirm('Descartar alterações?', 'Você tem alterações não salvas. Tem certeza que deseja sair?', () => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Nome completo é obrigatório';
    if (!phone.trim()) errs.phone = 'Telefone é obrigatório';
    return errs;
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setZipCode('');
    setStreet('');
    setStreetNumber('');
    setNeighborhood('');
    setCity('');
    setState('');
    setErrors({});
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showAlert('Atenção', 'Corrija os campos destacados antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      const id = generateId();
      const now = new Date().toISOString();
      addCustomer({ id, fullName: fullName.trim(), document: '', clientType: 'individual', phone, zipCode, street, streetNumber, neighborhood, city, state, notes: '', createdAt: now, updatedAt: now });
      setSuccessModal(true);
      setHasUnsavedChanges(false);
    } catch (e) {
      showAlert('Erro', `Não foi possível salvar: ${e instanceof Error ? e.message : 'erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const br = useThemeBorderRadius();

  return (
    <AppShell>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing['margin-mobile'],
            paddingBottom: spacing.xxl * 2 + insets.bottom,
            maxWidth: 720,
            width: '100%',
            alignSelf: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <AppText variant="label" color={undefined} style={{ color: colors.secondary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: spacing.xs }}>Gestão de Clientes</AppText>
          <AppText variant="h1" color={undefined} style={{ color: colors.primary, marginBottom: spacing.sm }}>{t('customer.title')}</AppText>
          <AppText variant="body" color="text-secondary" style={{ marginBottom: spacing.lg }}>Insira as informações detalhadas para manter seu banco de dados atualizado.</AppText>
          <View style={{ backgroundColor: colors['surface-container-lowest'], borderWidth: 1, borderColor: colors['outline-variant'], borderRadius: br.xl, overflow: 'hidden', marginBottom: spacing.gutter }}>
            <CardHeader title="Dados de Identificação" icon="person" />
            <View style={{ padding: spacing.lg }}>
              <FormField label={t('customer.fullName')} placeholder="Ex: João da Silva" value={fullName} onChangeText={(v) => { setFullName(v); clearError('fullName'); markChanged(); }} error={errors.fullName} />
            </View>
          </View>
          <View style={{ backgroundColor: colors['surface-container-lowest'], borderWidth: 1, borderColor: colors['outline-variant'], borderRadius: br.xl, overflow: 'hidden', marginBottom: spacing.gutter }}>
            <CardHeader title="Contato & Digital" icon="contact_phone" />
            <View style={{ padding: spacing.lg }}>
              <FormField label={t('customer.phone')} placeholder="(00) 00000-0000" keyboardType="phone-pad" value={phone} onChangeText={(v) => { setPhone(v); clearError('phone'); markChanged(); }} error={errors.phone} />
            </View>
          </View>
          <View style={{ backgroundColor: colors['surface-container-lowest'], borderWidth: 1, borderColor: colors['outline-variant'], borderRadius: br.xl, overflow: 'hidden', marginBottom: spacing.gutter }}>
            <CardHeader title={t('customer.address')} icon="location_on" />
            <View style={{ padding: spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}><View style={{ flex: 1 }}><FormField label={t('customer.zipCode')} placeholder="00000-000" value={zipCode} onChangeText={(v) => { setZipCode(v); markChanged(); }} /></View><View style={{ flex: 3 }}><FormField label={t('customer.street')} placeholder="Rua, Avenida..." value={street} onChangeText={(v) => { setStreet(v); markChanged(); }} /></View></View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}><View style={{ flex: 1 }}><FormField label={t('customer.number')} placeholder="123" value={streetNumber} onChangeText={(v) => { setStreetNumber(v); markChanged(); }} /></View><View style={{ flex: 3 }}><FormField label={t('customer.neighborhood')} placeholder="Bairro" value={neighborhood} onChangeText={(v) => { setNeighborhood(v); markChanged(); }} /></View></View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}><View style={{ flex: 2 }}><FormField label={t('customer.city')} placeholder="Cidade" value={city} onChangeText={(v) => { setCity(v); markChanged(); }} /></View><View style={{ flex: 1 }}><FormField label={t('customer.state')} placeholder="UF" value={state} onChangeText={(v) => { setState(v); markChanged(); }} /></View></View>
            </View>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <Button
              variant="secondary"
              title={t('customer.save')}
              fullWidth
              loading={saving}
              disabled={!hasUnsavedChanges || saving}
              onPress={handleSave}
            />
            <Button variant="outline" title={t('customer.discard')} fullWidth onPress={() => router.back()} />
          </View>
        </ScrollView>
        <Dialog
          visible={successModal}
          title="Sucesso!"
          message={`Cliente "${fullName}" cadastrado com sucesso!`}
          confirmLabel="OK"
          type="success"
          onConfirm={() => {
            triggerHaptic('success');
            setSuccessModal(false);
            resetForm();
          }}
        />
      </KeyboardAvoidingView>
    </AppShell>
  );
}
