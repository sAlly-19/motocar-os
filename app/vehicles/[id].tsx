import { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, spacing } from '../../src/theme';
import { FormField } from '../../src/components/FormField';
import { CardHeader } from '../../src/components/CardHeader';
import { AppShell } from '../../src/components/AppShell';
import { EmptyState } from '../../src/components/EmptyState';
import { Chip, Autocomplete } from '../../src/ui';
import { AppText, Button } from '../../src/ui';
import { useDialog } from '../../src/components/DialogContext';
import { useAppStore } from '../../src/stores/useAppStore';
import { triggerHaptic } from '../../src/utils/haptics';
import type { VehicleCategory } from '../../src/db/schema';

const MOTO_TIPOS = ['Custom', 'Naked', 'Sport', 'Street', 'Scooter', 'Big Trail', 'Off-road', 'Triciclo', 'Outro'];
const CARRO_TIPOS = ['Hatch', 'Picape', 'Sedã', 'SUV', 'Minivan', 'Perua', 'Outro'];

export default function EditVehicleScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showConfirm, showAlert } = useDialog();
  const { id } = useLocalSearchParams<{ id: string }>();

  const vehicles = useAppStore((s) => s.vehicles);
  const updateVehicle = useAppStore((s) => s.updateVehicle);
  const deleteVehicle = useAppStore((s) => s.deleteVehicle);
  const vehicle = useMemo(() => vehicles.find((v) => v.id === id), [vehicles, id]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const markChanged = () => setHasUnsavedChanges(true);

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState<VehicleCategory | ''>('');
  const [tipo, setTipo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (vehicle && !initialized) {
      setBrand(vehicle.brand);
      setModel(vehicle.model);
      setYear(String(vehicle.year ?? ''));
      setCategory((vehicle.category as VehicleCategory | '') ?? '');
      setTipo(vehicle.tipo ?? '');
      setInitialized(true);
    }
  }, [vehicle, initialized]);

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

  const brandSuggestions = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.brand).filter(Boolean))).sort(),
    [vehicles],
  );

  if (!vehicle) {
    return (
      <AppShell>
        <EmptyState
          illustration="empty-inventory"
          title="Veículo não encontrado"
          subtitle="Este veículo foi removido ou o link está incorreto."
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
    if (!category) errs.category = 'Selecione a categoria';
    if (!brand.trim()) errs.brand = 'Marca é obrigatória';
    if (!model.trim()) errs.model = 'Modelo é obrigatório';
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
      updateVehicle(vehicle.id, {
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year) || 0,
        category: category as VehicleCategory,
        tipo,
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
      'Excluir veículo?',
      `Tem certeza que deseja excluir "${vehicle.brand} ${vehicle.model}"? Esta ação não pode ser desfeita.`,
      () => {
        deleteVehicle(vehicle.id);
        triggerHaptic('warning');
        setHasUnsavedChanges(false);
        router.back();
      },
    );
  };

  const availableTipos = category === 'carro' ? CARRO_TIPOS : category === 'motocicleta' ? MOTO_TIPOS : [];

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
              <AppText variant="h1" style={{ color: colors.primary }}>Editar Veículo</AppText>
              <AppText variant="bodySmall" color="text-secondary">
                {vehicle.brand} {vehicle.model}
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
            <CardHeader title="Informações Técnicas" icon="directions_car" />
            <View style={{ padding: spacing.lg }}>
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
                value={brand}
                onChangeText={(v) => { setBrand(v); clearError('brand'); markChanged(); }}
                suggestions={brandSuggestions}
                error={errors.brand}
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Modelo"
                    value={model}
                    onChangeText={(v) => { setModel(v); clearError('model'); markChanged(); }}
                    error={errors.model}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Ano"
                    keyboardType="numeric"
                    value={year}
                    onChangeText={(v) => { setYear(v); markChanged(); }}
                  />
                </View>
              </View>

              {category && (
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
                        onPress={() => { setTipo(vt === tipo ? '' : vt); markChanged(); }}
                      />
                    ))}
                  </View>
                </View>
              )}
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
