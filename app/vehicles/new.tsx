import { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, spacing } from '../../src/theme';
import { FormField } from '../../src/components/FormField';
import { CardHeader } from '../../src/components/CardHeader';
import { AppShell } from '../../src/components/AppShell';
import { Dialog, Chip, Autocomplete } from '../../src/ui';
import { AppText, Button } from '../../src/ui';
import { useDialog } from '../../src/components/DialogContext';
import { useAppStore } from '../../src/stores/useAppStore';
import { generateId } from '../../src/utils/generateId';
import { triggerHaptic } from '../../src/utils/haptics';
import type { VehicleCategory } from '../../src/db/schema';

const MOTO_TIPOS = [
  'Custom',
  'Naked',
  'Sport',
  'Street',
  'Scooter',
  'Big Trail',
  'Off-road',
  'Triciclo',
  'Outro',
];

const CARRO_TIPOS = ['Hatch', 'Picape', 'Sedã', 'SUV', 'Minivan', 'Perua', 'Outro'];

export default function NewVehicleScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showConfirm, showAlert } = useDialog();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const markChanged = () => setHasUnsavedChanges(true);
  const addVehicle = useAppStore((s) => s.addVehicle);
  const vehicles = useAppStore((s) => s.vehicles);

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState<VehicleCategory | ''>('');
  const [tipo, setTipo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollRef = useRef<ScrollView>(null);
  const [saving, setSaving] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Sugestões de marca derivadas dos veículos cadastrados (deduped, sorted).
  const brandSuggestions = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.brand).filter(Boolean))).sort(),
    [vehicles],
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      showConfirm(
        'Descartar alterações?',
        'Você tem alterações não salvas. Tem certeza que deseja sair?',
        () => navigation.dispatch(e.data.action),
      );
    });
    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!category) errs.category = 'Selecione a categoria';
    if (!brand.trim()) errs.brand = 'Marca é obrigatória';
    if (!model.trim()) errs.model = 'Modelo é obrigatório';
    return errs;
  };

  const availableTipos = category === 'carro' ? CARRO_TIPOS : category === 'motocicleta' ? MOTO_TIPOS : [];

  const resetForm = () => {
    setBrand('');
    setModel('');
    setYear('');
    setCategory('');
    setTipo('');
    setErrors({});
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
      const id = generateId();
      const now = new Date().toISOString();
      addVehicle({
        id,
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year) || 0,
        category: category as VehicleCategory,
        tipo,
        createdAt: now,
        updatedAt: now,
      });
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
          <AppText variant="h1" style={{ color: colors.primary, marginBottom: spacing.sm }}>
            Cadastro de Veículo
          </AppText>
          <AppText variant="bodySmall" color="text-secondary" style={{ marginBottom: spacing.lg }}>
            Cadastre modelos de referência para uso nas Ordens de Serviço e nas peças.
          </AppText>

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
            <CardHeader title="Informações Técnicas" icon="directions_car" />
            <View style={{ padding: spacing.lg }}>
              {/* Categoria — chip group */}
              <View style={{ marginBottom: spacing.md }}>
                <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
                  Categoria
                </AppText>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Chip
                    label="Motocicleta"
                    leftIcon="two_wheeler"
                    selected={category === 'motocicleta'}
                    onPress={() => {
                      setCategory('motocicleta');
                      if (tipo && !MOTO_TIPOS.includes(tipo)) setTipo('');
                      clearError('category');
                      markChanged();
                    }}
                  />
                  <Chip
                    label="Carro"
                    leftIcon="directions_car"
                    selected={category === 'carro'}
                    onPress={() => {
                      setCategory('carro');
                      if (tipo && !CARRO_TIPOS.includes(tipo)) setTipo('');
                      clearError('category');
                      markChanged();
                    }}
                  />
                </View>
                {errors.category && (
                  <AppText variant="caption" color="error" style={{ marginTop: spacing.xs }}>
                    {errors.category}
                  </AppText>
                )}
              </View>

              <Autocomplete
                label="Marca"
                placeholder="Ex: Honda, BMW..."
                value={brand}
                onChangeText={(v) => { setBrand(v); clearError('brand'); markChanged(); }}
                suggestions={brandSuggestions}
                error={errors.brand}
              />

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Modelo"
                    placeholder="Ex: 320i, CB 500"
                    value={model}
                    onChangeText={(v) => { setModel(v); clearError('model'); markChanged(); }}
                    error={errors.model}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Ano"
                    placeholder="2024"
                    keyboardType="numeric"
                    value={year}
                    onChangeText={(v) => { setYear(v); markChanged(); }}
                  />
                </View>
              </View>

              {/* Tipo — condicional na categoria */}
              {category ? (
                <View>
                  <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
                    Tipo
                  </AppText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {availableTipos.map((vt) => (
                      <Chip
                        key={vt}
                        label={vt}
                        selected={tipo === vt}
                        onPress={() => {
                          setTipo(vt === tipo ? '' : vt);
                          markChanged();
                        }}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <AppText variant="labelSmall" color="text-tertiary" style={{ marginTop: spacing.xs }}>
                  Selecione uma categoria acima para ver os tipos disponíveis.
                </AppText>
              )}
            </View>
          </View>

          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <Button
              variant="secondary"
              title="Salvar Veículo"
              fullWidth
              loading={saving}
              disabled={!hasUnsavedChanges || saving}
              onPress={handleSave}
            />
            <Button
              variant="outline"
              title="Cancelar"
              fullWidth
              onPress={() => router.back()}
            />
          </View>
        </ScrollView>

        <Dialog
          visible={successModal}
          title="Sucesso!"
          message="Veículo cadastrado com sucesso!"
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
