import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, TextInput, Pressable, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, spacing, useBreakpoints } from '../../src/theme';
import { FormField } from '../../src/components/FormField';
import { CardHeader } from '../../src/components/CardHeader';
import { AppShell } from '../../src/components/AppShell';
import { Icon } from '../../src/components/Icon';
import { Dialog, Chip, Select, Autocomplete } from '../../src/ui';
import { AppText, Button } from '../../src/ui';
import { useDialog } from '../../src/components/DialogContext';
import { useAppStore } from '../../src/stores/useAppStore';
import { generateId } from '../../src/utils/generateId';
import { triggerHaptic } from '../../src/utils/haptics';
import type { PartCategory } from '../../src/db/schema';

const FIXED_MODEL_OPTIONS = ['Outros'];

export default function NewPartScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isDesktop } = useBreakpoints();
  const { showConfirm, showAlert } = useDialog();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const markChanged = () => setHasUnsavedChanges(true);
  const addPart = useAppStore((s) => s.addPart);
  const parts = useAppStore((s) => s.parts);
  const vehicles = useAppStore((s) => s.vehicles);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const handlePhotoChange = (uri: string | null) => { setPhotoUri(uri); markChanged(); };
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<PartCategory | ''>('');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [modelSearch, setModelSearch] = useState('');
  const [showModelSearch, setShowModelSearch] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [lastSavedName, setLastSavedName] = useState('');

  useEffect(() => {
    if (Object.keys(errors).length > 0) scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [errors]);

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

  const brandSuggestions = Array.from(
    new Set(parts.map((p) => p.brand).filter(Boolean)),
  ).sort();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Nome da peça é obrigatório';
    if (!category) errs.category = 'Selecione a categoria';
    if (!sellPrice.trim()) errs.sellPrice = 'Preço de venda é obrigatório';
    if (!currentStock.trim()) errs.currentStock = 'Estoque atual é obrigatório';
    return errs;
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const resetForm = () => {
    setPhotoUri(null);
    setName('');
    setSku('');
    setBrand('');
    setCategory('');
    setCostPrice('');
    setSellPrice('');
    setCurrentStock('');
    setMinStock('');
    setModels([]);
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
      addPart({
        id,
        name: name.trim(),
        sku: sku.trim(),
        category: category as PartCategory,
        brand: brand.trim(),
        costPrice: parseFloat(costPrice.replace(',', '.')) || 0,
        sellPrice: parseFloat(sellPrice.replace(',', '.')) || 0,
        currentStock: parseInt(currentStock, 10) || 0,
        minStock: parseInt(minStock, 10) || 0,
        location: '',
        models,
        photoUri: photoUri ?? undefined,
        createdAt: now,
        updatedAt: now,
      });
      setLastSavedName(name.trim());
      setSuccessModal(true);
      setHasUnsavedChanges(false);
    } catch (e) {
      showAlert('Erro', `Não foi possível salvar: ${e instanceof Error ? e.message : 'erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const br = useThemeBorderRadius();

  // Derivar sugestões de modelos: veículos cadastrados + "Outros" fixo no topo.
  const allVehicleModels = Array.from(new Set(vehicles.map((ve) => ve.model).filter(Boolean)));
  const q = modelSearch.trim().toLowerCase();
  const filteredVehicleModels = q
    ? allVehicleModels.filter((m) => m.toLowerCase().includes(q))
    : allVehicleModels;

  return (
    <AppShell>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing['margin-mobile'],
            paddingBottom: spacing.xxl * 2 + insets.bottom,
            maxWidth: 800,
            width: '100%',
            alignSelf: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <AppText variant="h1" style={{ color: colors.primary, marginBottom: spacing.lg }}>
            {t('part.title')}
          </AppText>

          {/* Card principal de cadastro — foto + dados + preços */}
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
            <CardHeader title={t('part.title')} />
            <View style={{ padding: spacing.lg }}>
              <View
                style={{
                  flexDirection: isDesktop ? 'row' : 'column',
                  gap: spacing.lg,
                  alignItems: 'flex-start',
                }}
              >
                {/* Foto */}
                <View
                  style={{
                    width: isDesktop ? 220 : '100%',
                    maxWidth: isDesktop ? 220 : undefined,
                  }}
                >
                 {/* Image Picker removido */}
                </View>

                {/* Campos */}
                <View style={{ flex: 1, minWidth: 0, width: isDesktop ? undefined : '100%' }}>
                  <FormField
                    label={t('part.partName')}
                    placeholder="Ex: Kit Pastilha de Freio Cerâmica"
                    value={name}
                    onChangeText={(v) => { setName(v); clearError('name'); markChanged(); }}
                    error={errors.name}
                  />
                  <FormField
                    label={t('part.sku')}
                    placeholder="SKU-998822-M"
                    value={sku}
                    onChangeText={(v) => { setSku(v); markChanged(); }}
                  />

                  {/* Categoria: Carro / Moto */}
                  <View style={{ marginBottom: spacing.md }}>
                    <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
                      {t('part.category')}
                    </AppText>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <Chip
                        label="Carro"
                        leftIcon="directions_car"
                        selected={category === 'carro'}
                        onPress={() => {
                          setCategory('carro');
                          clearError('category');
                          markChanged();
                        }}
                      />
                      <Chip
                        label="Moto"
                        leftIcon="two_wheeler"
                        selected={category === 'moto'}
                        onPress={() => {
                          setCategory('moto');
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

                  {/* Marca (autocomplete a partir das peças já cadastradas) */}
                  <Autocomplete
                    label={t('part.brand')}
                    placeholder="Ex: Bosch, NGK..."
                    value={brand}
                    onChangeText={(v) => { setBrand(v); markChanged(); }}
                    suggestions={brandSuggestions}
                  />

                  {/* Modelos compatíveis */}
                  <View style={{ marginBottom: spacing.md }}>
                    <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
                      Modelos de veículo compatíveis
                    </AppText>
                    {models.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm }}>
                        {models.map((m) => (
                          <Pressable
                            key={m}
                            onPress={() => {
                              setModels((prev) => prev.filter((x) => x !== m));
                              markChanged();
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              paddingHorizontal: spacing.sm,
                              paddingVertical: spacing.xs,
                              borderRadius: br.full,
                              backgroundColor: colors['primary-container'],
                            }}
                          >
                            <AppText variant="labelSmall" style={{ color: colors['on-primary-container'] }}>
                              {m}
                            </AppText>
                            <Icon name="close" size={14} color={colors['on-primary-container']} />
                          </Pressable>
                        ))}
                      </View>
                    )}
                    <Pressable
                      onPress={() => setShowModelSearch(true)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm + 4,
                        borderRadius: br.lg,
                        borderWidth: 1,
                        borderColor: colors['outline-variant'],
                        backgroundColor: colors['surface-container-low'],
                      }}
                    >
                      <Icon name="search" size={18} color={colors['on-surface-variant']} />
                      <AppText variant="bodySmall" style={{ color: colors.placeholder, flex: 1 }}>
                        {models.length > 0
                          ? `${models.length} modelo(s) selecionado(s)`
                          : 'Buscar modelos...'}
                      </AppText>
                    </Pressable>
                  </View>

                  <FormField
                    label="Valor da peça (R$)"
                    placeholder="0,00"
                    keyboardType="decimal-pad"
                    value={sellPrice}
                    onChangeText={(v) => {
                      setSellPrice(v);
                      clearError('sellPrice');
                      markChanged();
                    }}
                    error={errors.sellPrice}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Controle de estoque */}
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
            <CardHeader title="Controle de Estoque" />
            <View style={{ padding: spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 140 }}>
                  <FormField
                    label={t('part.currentStock')}
                    placeholder="0"
                    keyboardType="numeric"
                    value={currentStock}
                    onChangeText={(v) => {
                      setCurrentStock(v);
                      clearError('currentStock');
                      markChanged();
                    }}
                    error={errors.currentStock}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 140 }}>
                  <FormField
                    label={t('part.minStock')}
                    placeholder="Limite para alerta"
                    keyboardType="numeric"
                    value={minStock}
                    onChangeText={(v) => { setMinStock(v); markChanged(); }}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <Button
              variant="secondary"
              title={t('part.save')}
              fullWidth
              loading={saving}
              disabled={!hasUnsavedChanges || saving}
              onPress={handleSave}
            />
            <Button
              variant="outline"
              title={t('part.discard')}
              fullWidth
              onPress={() => router.back()}
            />
          </View>
        </ScrollView>

        <Dialog
          visible={successModal}
          title="Sucesso!"
          message={`Peça "${lastSavedName}" cadastrada com sucesso!`}
          confirmLabel="OK"
          type="success"
          onConfirm={() => {
            triggerHaptic('success');
            setSuccessModal(false);
            resetForm();
          }}
        />

        {/* Modal de modelos compatíveis */}
        <Modal
          visible={showModelSearch}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModelSearch(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: spacing.lg,
              backgroundColor: colors.overlay,
            }}
          >
            <Pressable
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              onPress={() => setShowModelSearch(false)}
            />
            <View
              style={{
                width: '100%',
                maxWidth: 400,
                backgroundColor: colors.surface,
                borderRadius: br.xl,
                padding: spacing.xl,
                gap: spacing.md,
              }}
            >
              <AppText variant="h4" style={{ color: colors.primary }}>
                Selecionar modelos
              </AppText>
              <TextInput
                style={{
                  backgroundColor: colors['surface-container-low'],
                  borderRadius: br.lg,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm + 4,
                  borderWidth: 1,
                  borderColor: colors['outline-variant'],
                  color: colors['on-surface'],
                  fontSize: 14,
                }}
                placeholder="Digite o nome do modelo..."
                placeholderTextColor={colors.placeholder}
                value={modelSearch}
                onChangeText={setModelSearch}
                autoFocus
              />

              {/* Botão + Cadastrar novo veículo */}
              <Pressable
                onPress={() => {
                  setShowModelSearch(false);
                  router.push('/vehicles/new');
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: pressed ? colors['primary-container'] : 'transparent',
                  borderRadius: br.lg,
                  borderWidth: 1,
                  borderColor: colors.primary,
                })}
              >
                <Icon name="add_circle" size={18} color={colors.primary} />
                <AppText variant="bodySmall" style={{ color: colors.primary, fontWeight: '600' }}>
                  Cadastrar novo veículo
                </AppText>
              </Pressable>

              <ScrollView style={{ maxHeight: 260 }}>
                {/* Opções fixas — "Outros" sempre visível */}
                {FIXED_MODEL_OPTIONS.map((m) => {
                  const selected = models.includes(m);
                  return (
                    <Pressable
                      key={m}
                      onPress={() => {
                        if (selected) {
                          setModels((prev) => prev.filter((x) => x !== m));
                        } else {
                          setModels((prev) => [...prev, m]);
                        }
                        markChanged();
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.md,
                      }}
                    >
                      <Icon
                        name={selected ? 'check_box' : 'check_box_outline_blank'}
                        size={20}
                        color={selected ? colors.primary : colors['on-surface-variant']}
                      />
                      <AppText
                        variant="bodySmall"
                        style={{
                          color: selected ? colors.primary : colors['on-surface'],
                          flex: 1,
                          fontStyle: 'italic',
                        }}
                      >
                        {m}
                      </AppText>
                    </Pressable>
                  );
                })}
                {allVehicleModels.length > 0 && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: colors['outline-variant'],
                      marginVertical: spacing.xs,
                    }}
                  />
                )}
                {filteredVehicleModels.map((m) => {
                  const selected = models.includes(m);
                  return (
                    <Pressable
                      key={m}
                      onPress={() => {
                        if (selected) {
                          setModels((prev) => prev.filter((x) => x !== m));
                        } else {
                          setModels((prev) => [...prev, m]);
                        }
                        markChanged();
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.md,
                      }}
                    >
                      <Icon
                        name={selected ? 'check_box' : 'check_box_outline_blank'}
                        size={20}
                        color={selected ? colors.primary : colors['on-surface-variant']}
                      />
                      <AppText
                        variant="bodySmall"
                        style={{
                          color: selected ? colors.primary : colors['on-surface'],
                          flex: 1,
                        }}
                      >
                        {m}
                      </AppText>
                    </Pressable>
                  );
                })}
                {filteredVehicleModels.length === 0 && allVehicleModels.length === 0 && (
                  <View style={{ padding: spacing.md, alignItems: 'center' }}>
                    <AppText variant="bodySmall" color="text-tertiary" align="center">
                      Nenhum veículo cadastrado ainda. Use "Outros" ou cadastre um novo.
                    </AppText>
                  </View>
                )}
                {filteredVehicleModels.length === 0 && allVehicleModels.length > 0 && q && (
                  <View style={{ padding: spacing.md, alignItems: 'center' }}>
                    <AppText variant="bodySmall" color="text-tertiary">
                      Nenhum modelo corresponde a "{modelSearch}".
                    </AppText>
                  </View>
                )}
              </ScrollView>
              <Button
                variant="primary"
                title="Concluir"
                fullWidth
                onPress={() => setShowModelSearch(false)}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </AppShell>
  );
}
