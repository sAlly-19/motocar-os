import { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon } from '../../src/components/Icon';
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, spacing } from '../../src/theme';
import { FormField } from '../../src/components/FormField';
import { CardHeader } from '../../src/components/CardHeader';
import { AppShell } from '../../src/components/AppShell';
import { EmptyState } from '../../src/components/EmptyState';
import { AppText, Button } from '../../src/ui';
import { useDialog } from '../../src/components/DialogContext';
import { useAppStore } from '../../src/stores/useAppStore';
import { triggerHaptic } from '../../src/utils/haptics';

export default function EditCustomerScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showConfirm, showAlert } = useDialog();
  const { id } = useLocalSearchParams<{ id: string }>();

  const customers = useAppStore((s) => s.customers);
  const updateCustomer = useAppStore((s) => s.updateCustomer);
  const deleteCustomer = useAppStore((s) => s.deleteCustomer);
  const customer = useMemo(() => customers.find((c) => c.id === id), [customers, id]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const markChanged = () => setHasUnsavedChanges(true);

  const [fullName, setFullName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (customer && !initialized) {
      setFullName(customer.fullName);
      setDocument(customer.document);
      setPhone(customer.phone);
      setZipCode(customer.zipCode);
      setStreet(customer.street);
      setStreetNumber(customer.streetNumber);
      setNeighborhood(customer.neighborhood);
      setCity(customer.city);
      setState(customer.state);
      setNotes(customer.notes ?? '');
      setInitialized(true);
    }
  }, [customer, initialized]);

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

  const br = useThemeBorderRadius();

  if (!customer) {
    return (
      <>
        <EmptyState
          illustration="empty-inventory"
          title="Cliente não encontrado"
          subtitle="Este cliente foi removido ou o link está incorreto."
          action={<Button variant="primary" title="Voltar" onPress={() => router.back()} />}
        />
      </>
    );
  }

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Nome completo é obrigatório';
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
      updateCustomer(customer.id, {
        fullName: fullName.trim(),
        document,
        phone,
        zipCode,
        street,
        streetNumber,
        neighborhood,
        city,
        state,
        notes,
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
      'Excluir cliente?',
      `Tem certeza que deseja excluir "${customer.fullName}"? Esta ação não pode ser desfeita.`,
      () => {
        deleteCustomer(customer.id);
        triggerHaptic('warning');
        setHasUnsavedChanges(false);
        router.back();
      },
    );
  };

  return (
    <>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
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
            <View style={{ flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Animated.View
                sharedTransitionTag={`avatar-customer-${customer.id}`}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: br.full,
                  backgroundColor: colors['primary-container'],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon name="person" size={28} color={colors['on-primary-container']} />
              </Animated.View>
              <View>
                <AppText variant="h1" style={{ color: colors.primary }}>Editar Cliente</AppText>
                <AppText variant="bodySmall" color="text-secondary">
                  {customer.fullName}
                </AppText>
              </View>
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
            <CardHeader title="Dados de Identificação" icon="person" />
            <View style={{ padding: spacing.lg }}>
              <FormField
                label="Nome Completo / Razão Social"
                value={fullName}
                onChangeText={(v) => { setFullName(v); clearError('fullName'); markChanged(); }}
                error={errors.fullName}
              />
              <FormField
                label="CPF / CNPJ"
                value={document}
                onChangeText={(v) => { setDocument(v); markChanged(); }}
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
            <CardHeader title="Contato" icon="contact_phone" />
            <View style={{ padding: spacing.lg }}>
              <FormField
                label="Telefone / WhatsApp"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(v) => { setPhone(v); clearError('phone'); markChanged(); }}
                error={errors.phone}
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
            <CardHeader title="Endereço" icon="location_on" />
            <View style={{ padding: spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="CEP"
                    value={zipCode}
                    onChangeText={(v) => { setZipCode(v); markChanged(); }}
                  />
                </View>
                <View style={{ flex: 3 }}>
                  <FormField
                    label="Logradouro"
                    value={street}
                    onChangeText={(v) => { setStreet(v); markChanged(); }}
                  />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Número"
                    value={streetNumber}
                    onChangeText={(v) => { setStreetNumber(v); markChanged(); }}
                  />
                </View>
                <View style={{ flex: 3 }}>
                  <FormField
                    label="Bairro"
                    value={neighborhood}
                    onChangeText={(v) => { setNeighborhood(v); markChanged(); }}
                  />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 2 }}>
                  <FormField
                    label="Cidade"
                    value={city}
                    onChangeText={(v) => { setCity(v); markChanged(); }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="UF"
                    value={state}
                    onChangeText={(v) => { setState(v); markChanged(); }}
                  />
                </View>
              </View>
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
    </>
  );
}
