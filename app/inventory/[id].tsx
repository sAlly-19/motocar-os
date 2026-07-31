import { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, TextInput, Pressable, Modal } from 'react-native';
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeBorderRadius, spacing, useBreakpoints } from '../../src/theme';
import { FormField } from '../../src/components/FormField';
import { CardHeader } from '../../src/components/CardHeader';
import { AppShell } from '../../src/components/AppShell';
import { EmptyState } from '../../src/components/EmptyState';
import { Icon } from '../../src/components/Icon';
import { Dialog, Chip, Autocomplete } from '../../src/ui';
import { AppText, Button } from '../../src/ui';
import { useDialog } from '../../src/components/DialogContext';
import { useAppStore } from '../../src/stores/useAppStore';
import { triggerHaptic } from '../../src/utils/haptics';
import type { PartCategory } from '../../src/db/schema';

const FIXED_MODEL_OPTIONS = ['Outros'];

export default function EditPartScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isDesktop } = useBreakpoints();
  const { showConfirm, showAlert } = useDialog();
  const { id } = useLocalSearchParams<{ id: string }>();

  const parts = useAppStore((s) => s.parts);
  const vehicles = useAppStore((s) => s.vehicles);
  const updatePart = useAppStore((s) => s.updatePart);
  const deletePart = useAppStore((s) => s.deletePart);
  const part = useMemo(() => parts.find((p) => p.id === id), [parts, id]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const markChanged = () => setHasUnsavedChanges(true);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
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
  const [initialized, setInitialized] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Seed state from the found part (only once).
  useEffect(() => {
    if (part && !initialized) {
      setPhotoUri(part.photoUri ?? null);
      setName(part.name);
      setSku(part.sku);
      setBrand(part.brand ?? '');
      setCategory((part.category as PartCategory | '') ?? '');
      setCostPrice(String(part.costPrice ?? ''));
      setSellPrice(String(part.sellPrice ?? ''));
      setCurrentStock(String(part.currentStock ?? ''));
      setMinStock(String(part.minStock ?? ''));
      setModels(part.models ?? []);
      setInitialized(true);
    }
  }, [part, initialized]);

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

  const br = useThemeBorderRadius();

  if (!part) {
    return (
      <AppShell>
        <EmptyState
          illustration="empty-inventory"
          title="Peça não encontrada"
          subtitle="Esta peça foi removida ou o link está incorreto."
          action={<Button variant="primary" title="Voltar" onPress={() => router.back()} />}
        />
      </AppShell>
    );
  }

  const brandSuggestions = Array.from(new Set(parts.map((p) => p.brand).filter(Boolean))).sort();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Nome da peça é obrigatório';
    if (!category) errs.category = 'Selecione a categoria';
    if (!sellPrice.trim()) errs.sellPrice = 'Preço de venda é obrigatório';
    if (!currentStock.trim()) errs.currentStock = 'Estoque atual é obrigatório';
    return errs;
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
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
      updatePart(part.id, {
        name: name.trim(),
        sku: sku.trim(),
        category: category as PartCategory,
        brand: brand.trim(),
        costPrice: parseFloat(costPrice.replace(',', '.')) || 0,
        sellPrice: parseFloat(sellPrice.replace(',', '.')) || 0,
        currentStock: parseInt(currentStock, 10) || 0,
        minStock: parseInt(minStock, 10) || 0,
        models,
        photoUri: photoUri ?? undefined,
      });
      triggerHaptic('success');
      setHasUnsavedChanges(false);
      showAlert('Salvo', 'As alterações foram gravadas.');
    } catch (e) {
      showAlert('Erro', `Não foi possível salvar: ${e instanceof Error ? e.message : 'erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    showConfirm(
      'Excluir peça?',
      `Tem certeza que deseja excluir "${part.name}"? Esta ação não pode ser desfeita.`,
      () => {
        deletePart(part.id);
        triggerHaptic('warning');
        setHasUnsavedChanges(false);
        router.back();
      },
    );
  };

  const allVehicleModels = Array.from(new Set(vehicles.map((v) => v.model).filter(Boolean)));
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
              <AppText variant="h1" style={{ color: colors.primary }}>
                Editar Peça
              </AppText>
              <AppText variant="bodySmall" color="text-secondary">
                {part.name}
              </AppText>
            </View>
            <Button
              variant="destructive"
              title="Excluir"
              icon="delete"
              onPress={handleDelete}
            />
          </View>

          {/* Card principal */}
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
            <CardHeader title="Dados da Peça" />
            <View style={{ padding: spacing.lg }}>
              <View
                style={{
                  flexDirection: isDesktop ? 'row' : 'column',
                  gap: spacing.lg,
                  alignItems: 'flex-start',
                }}
              >
               <View style={{ width: isDesktop ? 220 : '100%', maxWidth: isDesktop ? 220 : undefined }}>
                 {/* Image Picker removido */}
               </View>
               <View style={{ flex: 1, minWidth: 0, width: isDesktop ? undefined : '100%' }}>
                  <FormField
                    label="Nome da Peça"
                    value={name}
                    onChangeText={(v) => { setName(v); clearError('name'); markChanged(); }}
                    error={errors.name}
                  />
                  <FormField
                    label="SKU / Código"
                    value={sku}
                    onChangeText={(v) => { setSku(v); markChanged(); }}
                  />

                  {/* Categoria: Carro / Moto */}
                  <View style={{ marginBottom: spacing.md }}>
                    <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
                      Categoria
                    </AppText>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <Chip
                        label="Carro"
                        leftIcon="directions_car"
                        selected={category === 'carro'}
                        onPress={() => { setCategory('carro'); clearError('category'); markChanged(); }}
                      />
                      <Chip
                        label="Moto"
                        leftIcon="two_wheeler"
                        selected={category === 'moto'}
                        onPress={() => { setCategory('moto'); clearError('category'); markChanged(); }}
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
                    onChangeText={(v) => { setBrand(v); markChanged(); }}
                    suggestions={brandSuggestions}
                  />
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
                            <AppText variant="labelSmall" style={{ color: colors['on-primary-container'] }}>{m}</AppText>
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
                        {models.length > 0 ? `${models.length} modelo(s) selecionado(s)` : 'Buscar modelos...'}
                      </AppText>
                    </Pressable>
                  </View>
                  <FormField
                    label="Valor da peça (R$)"
                    keyboardType="decimal-pad"
                    value={sellPrice}
                    onChangeText={(v) => { setSellPrice(v); clearError('sellPrice'); markChanged(); }}
                    error={errors.sellPrice}
                  />
                  <FormField
                    label="Preço de Custo"
                    keyboardType="decimal-pad"
                    value={costPrice}
                    onChangeText={(v) => { setCostPrice(v); markChanged(); }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Estoque */}
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
                    label="Quantidade Atual"
                    keyboardType="numeric"
                    value={currentStock}
                    onChangeText={(v) => { setCurrentStock(v); clearError('currentStock'); markChanged(); }}
                    error={errors.currentStock}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 140 }}>
                  <FormField
                    label="Preço de Custo"
                    keyboardType="decimal-pad"
                    value={costPrice}
                    onChangeText={(v) => { setCostPrice(v); markChanged(); }}
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
            <Button
              variant="outline"
              title="Cancelar"
              fullWidth
              onPress={() => router.back()}
            />
          </View>
        </ScrollView>

        {/* Modal modelos — mesmo do new-part */}
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
              <AppText variant="h4" style={{ color: colors.primary }}>Selecionar modelos</AppText>
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
              <Pressable
                onPress={() => { setShowModelSearch(false); router.push('/vehicles/new'); }}
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
                {FIXED_MODEL_OPTIONS.map((m) => {
                  const selected = models.includes(m);
                  return (
                    <Pressable
                      key={m}
                      onPress={() => {
                        if (selected) setModels((prev) => prev.filter((x) => x !== m));
                        else setModels((prev) => [...prev, m]);
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
                  <View style={{ height: 1, backgroundColor: colors['outline-variant'], marginVertical: spacing.xs }} />
                )}
                {filteredVehicleModels.map((m) => {
                  const selected = models.includes(m);
                  return (
                    <Pressable
                      key={m}
                      onPress={() => {
                        if (selected) setModels((prev) => prev.filter((x) => x !== m));
                        else setModels((prev) => [...prev, m]);
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
                        style={{ color: selected ? colors.primary : colors['on-surface'], flex: 1 }}
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
              </ScrollView>
              <Button variant="primary" title="Concluir" fullWidth onPress={() => setShowModelSearch(false)} />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </AppShell>
  );
}
