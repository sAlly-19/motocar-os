import { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Modal } from 'react-native';

const isWeb = Platform.OS === 'web';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColors, useThemeBorderRadius, spacing } from '../../src/theme';
import { AppText, Button, Chip, Dialog, Select, SearchSelect } from '../../src/ui';
import { Icon } from '../../src/components/Icon';
import { GlassCard } from '../../src/components/GlassCard';
import { AppShell } from '../../src/components/AppShell';
import { FormField } from '../../src/components/FormField';
import { DateField } from '../../src/components/DateField';
import { useDialog } from '../../src/components/DialogContext';
import { useAppStore } from '../../src/stores/useAppStore';
import { useTeamStore, ROLE_LABEL } from '../../src/stores/useTeamStore';
import { CustomerSearchModal } from '../../src/components/CustomerSearchModal';
import { PartSearchModal } from '../../src/components/PartSearchModal';
import { generateId } from '../../src/utils/generateId';
import { generateTicketHtml } from '../../src/utils/generateTicketHtml';
import { printTicket } from '../../src/utils/printTicket';
import { triggerHaptic } from '../../src/utils/haptics';

interface OrderItem {
  id: string;
  type: 'part' | 'service';
  description: string;
  quantity: number;
  unitPrice: number;
  partId?: string;
  warrantyDays?: number;
}

export default function NewOrderScreen() {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showConfirm, showAlert } = useDialog();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const markChanged = () => setHasUnsavedChanges(true);
  const addOrder = useAppStore((s) => s.addOrder);
  const addBudget = useAppStore((s) => s.addBudget);
  const vehicles = useAppStore((s) => s.vehicles);
  const customers = useAppStore((s) => s.customers);
  const parts = useAppStore((s) => s.parts);
  const employees = useTeamStore((s) => s.employees);
  const teamInitialized = useTeamStore((s) => s.initialized);
  const initializeTeam = useTeamStore((s) => s.initialize);

  // Garante que os funcionários cadastrados em /team estejam carregados.
  useEffect(() => {
    if (!teamInitialized) initializeTeam();
  }, [teamInitialized, initializeTeam]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  // Placa da OS (snapshot). Vehicle catalog é referenciado por selectedVehicleId.
  const [plate, setPlate] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Mecânico responsável (opcional).
  const [technicianId, setTechnicianId] = useState<string>('');

  // Data prevista de entrega (opcional).
  const [dueDate, setDueDate] = useState<string>('');

  const [showPartSearch, setShowPartSearch] = useState(false);
  const [selectedPartIndex, setSelectedPartIndex] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);

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

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.customerName = 'Nome do cliente é obrigatório';
    if (!customerPhone.trim()) errs.customerPhone = 'Telefone é obrigatório';
    if (!plate.trim()) errs.plate = 'Placa é obrigatória';
    return errs;
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  // Opções para o Select de modelo do catálogo.
  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v) => {
        const parts = [v.brand, v.model].filter(Boolean).join(' ');
        const yearHint = v.year ? String(v.year) : undefined;
        return {
          label: parts || 'Sem nome',
          value: v.id,
          hint: yearHint,
          icon: v.category === 'motocicleta' ? 'two_wheeler' : 'directions_car',
        };
      }),
    [vehicles],
  );

  // Referência atual do modelo escolhido (para exibir marca/ano).
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId),
    [vehicles, selectedVehicleId],
  );

  // Funcionários disponíveis (ativos) cadastrados em /team.
  // Mecânicos e auxiliares aparecem primeiro — mas todos os ativos são elegíveis
  // (útil se o gerente/admin ocasionalmente assumir uma OS).
  const technicianOptions = useMemo(() => {
    const roleWeight: Record<string, number> = {
      mechanic: 0,
      assistant: 1,
      manager: 2,
      admin: 3,
      receptionist: 4,
    };
    return employees
      .filter((e) => e.status === 'active')
      .sort((a, b) => (roleWeight[a.role] ?? 99) - (roleWeight[b.role] ?? 99))
      .map((e) => ({
        label: e.fullName,
        value: e.id,
        hint: ROLE_LABEL[e.role],
        icon: 'engineering',
      }));
  }, [employees]);

  const handleSelectCustomer = (cust: typeof customers[0]) => {
    setSelectedCustomerId(cust.id);
    setCustomerName(cust.fullName);
    setCustomerPhone(cust.phone);
    setShowCustomerSearch(false);
    clearError('customerName');
    clearError('customerPhone');
    markChanged();
  };

  const handleSelectPart = (itemId: string, partId: string) => {
    const p = parts.find((x) => x.id === partId);
    if (!p) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, partId: p.id, description: p.name, unitPrice: p.sellPrice }
          : i,
      ),
    );
    setShowPartSearch(false);
    setSelectedPartIndex(null);
    markChanged();
  };

  const [items, setItems] = useState<OrderItem[]>([
    { id: generateId(), type: 'service', description: 'Diagnóstico de Motor & Inspeção Completa', quantity: 2, unitPrice: 120 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [successModal, setSuccessModal] = useState(false);
  const [savedOrderNumber, setSavedOrderNumber] = useState('');

  const partsTotal = items.filter((i) => i.type === 'part').reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const laborTotal = items.filter((i) => i.type === 'service').reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const subtotal = partsTotal + laborTotal;
  const grandTotal = Math.max(0, subtotal - discount);

  const addItem = (type: 'part' | 'service') => {
    setItems((p) => [...p, { id: generateId(), type, description: '', quantity: 1, unitPrice: 0 }]);
    markChanged();
  };
  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };
  const removeItem = (id: string) => {
    setItems((p) => p.filter((i) => i.id !== id));
    markChanged();
  };

  const mechanicName = employees.find((e) => e.id === technicianId)?.fullName;

  const buildOrderItems = (orderId: string) =>
    items.map((i) => ({
      id: i.id,
      orderId,
      type: i.type,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.quantity * i.unitPrice,
      partId: i.partId,
      warrantyDays: i.warrantyDays,
    }));

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const orderId = generateId();
      const orderNumber = `OS-${generateId().slice(0, 6)}`;
      const now = new Date().toISOString();
      const html = generateTicketHtml(
        {
          id: orderId,
          number: orderNumber,
          customerId: '',
          vehicleId: selectedVehicleId,
          plate: plate.trim().toUpperCase(),
          dueDate,
          technicianId,
          status: 'open',
          partsSubtotal: partsTotal,
          laborSubtotal: laborTotal,
          tax: 0,
          discount,
          total: grandTotal,
          createdAt: now,
          updatedAt: now,
        },
        customerName
          ? {
              id: '',
              fullName: customerName,
              document: '',
              clientType: 'individual',
              phone: customerPhone,
              zipCode: '',
              street: '',
              streetNumber: '',
              neighborhood: '',
              city: '',
              state: '',
              notes: '',
              photoUri: undefined,
              createdAt: now,
              updatedAt: now,
            }
          : null,
        selectedVehicle ?? null,
        buildOrderItems(orderId),
        mechanicName,
      );
      await printTicket(html);
    } catch (e) {
      showAlert('Erro', e instanceof Error ? e.message : 'Não foi possível imprimir.');
    } finally {
      setPrinting(false);
    }
  };

  const handleSaveOrder = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showAlert('Atenção', 'Corrija os campos destacados antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      const orderId = generateId();
      const orderNumber = `OS-${generateId().slice(0, 6)}`;
      const now = new Date().toISOString();

      let customerId = selectedCustomerId;
      if (!customerId) {
        customerId = generateId();
        useAppStore.getState().addCustomer({
          id: customerId,
          fullName: customerName.trim(),
          document: '',
          clientType: 'individual',
          phone: customerPhone,
          zipCode: '',
          street: '',
          streetNumber: '',
          neighborhood: '',
          city: '',
          state: '',
          notes: '',
          photoUri: undefined,
          createdAt: now,
          updatedAt: now,
        });
      }

      addOrder({
        id: orderId,
        number: orderNumber,
        customerId,
        vehicleId: selectedVehicleId,
        plate: plate.trim().toUpperCase(),
        status: 'open',
        dueDate: dueDate || undefined,
        technicianId: technicianId || undefined,
        partsSubtotal: partsTotal,
        laborSubtotal: laborTotal,
        tax: 0,
        discount,
        total: grandTotal,
        items: buildOrderItems(orderId),
        createdAt: now,
        updatedAt: now,
      });
      setSavedOrderNumber(orderNumber);
      setSuccessModal(true);
      setHasUnsavedChanges(false);
    } catch (e) {
      showAlert('Erro', `Não foi possível salvar: ${e instanceof Error ? e.message : 'erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBudget = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showAlert('Atenção', 'Corrija os campos destacados antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      const budgetId = generateId();
      const now = new Date().toISOString();

      let customerId = selectedCustomerId;
      if (!customerId) {
        customerId = generateId();
        useAppStore.getState().addCustomer({
          id: customerId,
          fullName: customerName.trim(),
          document: '',
          clientType: 'individual',
          phone: customerPhone,
          zipCode: '',
          street: '',
          streetNumber: '',
          neighborhood: '',
          city: '',
          state: '',
          notes: '',
          photoUri: undefined,
          createdAt: now,
          updatedAt: now,
        });
      }

      const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      addBudget({
        id: budgetId,
        customerId,
        vehicleId: selectedVehicleId,
        status: 'draft',
        items: buildOrderItems(budgetId),
        total: grandTotal,
        validUntil,
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

  const sectionHeaderStyle = {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  };

  const numericInputStyle = {
    color: colors['on-surface'],
    fontSize: 14,
    padding: spacing.xs,
    minHeight: 36,
    ...(isWeb ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  };

  // Part search modal e customer search modal transferidos para componentes externos.

  return (
    <AppShell>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View
          style={{
            paddingHorizontal: spacing['margin-mobile'],
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors['outline-variant'],
          }}
        >
          <AppText variant="h4" style={{ color: colors.primary }}>
            {t('newOrder.title')}
          </AppText>
        </View>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing['margin-mobile'],
            paddingBottom: spacing.xxl * 2 + insets.bottom,
            maxWidth: spacing['container-max'],
            width: '100%',
            alignSelf: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', gap: spacing.gutter, flexWrap: 'wrap' }}>
            <View style={{ flex: 1, minWidth: 300, gap: spacing.gutter }}>
              <View style={{ flexDirection: 'row', gap: spacing.gutter, flexWrap: 'wrap' }}>
                <GlassCard style={{ overflow: 'hidden', flex: 1, minWidth: 260 }}>
                  <View style={sectionHeaderStyle}>
                    <AppText
                      variant="label"
                      style={{ color: colors['on-primary'], textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                      {t('newOrder.customerInfo')}
                    </AppText>
                  </View>
                  <View style={{ padding: spacing.lg }}>
                    <AppText variant="label" color="text-secondary" style={{ marginBottom: spacing.xs }}>
                      {t('customer.fullName')}
                    </AppText>
                    <Pressable
                      onPress={() => { setShowCustomerSearch(true); }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        backgroundColor: colors['surface-container-low'],
                        borderRadius: br.lg,
                        borderWidth: 1,
                        borderColor: errors.customerName ? colors.error : colors['outline-variant'],
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm + 4,
                        marginBottom: spacing.md,
                      }}
                    >
                      <Icon name="search" size={18} color={colors['on-surface-variant']} />
                      <AppText
                        variant="bodySmall"
                        style={{ color: customerName ? colors['on-surface'] : colors.placeholder, flex: 1 }}
                        numberOfLines={1}
                      >
                        {customerName || 'Selecionar cliente...'}
                      </AppText>
                      {customerName ? (
                        <Pressable
                          onPress={() => { setCustomerName(''); setCustomerPhone(''); setSelectedCustomerId(''); markChanged(); }}
                          hitSlop={8}
                        >
                          <Icon name="close" size={18} color={colors['on-surface-variant']} />
                        </Pressable>
                      ) : null}
                    </Pressable>
                    {errors.customerName && (
                      <AppText variant="labelSmall" style={{ color: colors.error, marginTop: -spacing.sm, marginBottom: spacing.md }}>
                        {errors.customerName}
                      </AppText>
                    )}
                    <FormField
                      label={t('customer.phone')}
                      placeholder="(11) 99999-9999"
                      keyboardType="phone-pad"
                      value={customerPhone}
                      onChangeText={(v) => { setCustomerPhone(v); clearError('customerPhone'); markChanged(); }}
                      error={errors.customerPhone}
                    />
                  </View>
                </GlassCard>
                <GlassCard style={{ overflow: 'hidden', flex: 1, minWidth: 260 }}>
                  <View style={sectionHeaderStyle}>
                    <AppText
                      variant="label"
                      style={{ color: colors['on-primary'], textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                      {t('newOrder.vehicleInfo')}
                    </AppText>
                  </View>
                  <View style={{ padding: spacing.lg, gap: spacing.md }}>
                    <FormField
                      label={t('vehicle.plate')}
                      placeholder="ABC-1234"
                      autoCapitalize="characters"
                      value={plate}
                      onChangeText={(v) => {
                        setPlate(v.toUpperCase());
                        clearError('plate');
                        markChanged();
                      }}
                      error={errors.plate}
                    />
                    <SearchSelect
                      label="Modelo (do catálogo)"
                      placeholder="Buscar modelo cadastrado..."
                      options={vehicleOptions}
                      selectedValue={selectedVehicleId}
                      onSelect={(id) => {
                        setSelectedVehicleId(id);
                        markChanged();
                      }}
                      createOption={{
                        label: 'Cadastrar novo modelo',
                        icon: 'add_circle',
                        onPress: () => router.push('/vehicles/new'),
                      }}
                      emptyLabel="Nenhum modelo cadastrado. Cadastre um para escolher."
                      maxResults={5}
                    />
                    {selectedVehicle && (
                      <View
                        style={{
                          padding: spacing.md,
                          borderRadius: br.field,
                          backgroundColor: colors['surface-container-low'],
                          gap: 2,
                        }}
                      >
                        <AppText variant="labelSmall" color="text-secondary">
                          {selectedVehicle.category === 'motocicleta' ? 'Motocicleta' : 'Carro'}
                          {selectedVehicle.tipo ? ` · ${selectedVehicle.tipo}` : ''}
                          {selectedVehicle.year ? ` · ${selectedVehicle.year}` : ''}
                        </AppText>
                        <AppText variant="bodySmall" style={{ fontWeight: '600' }}>
                          {selectedVehicle.brand} {selectedVehicle.model}
                        </AppText>
                      </View>
                    )}
                  </View>
                </GlassCard>
              </View>

              {/* Mecânico + Prazo */}
              <GlassCard style={{ overflow: 'hidden' }}>
                <View style={sectionHeaderStyle}>
                  <AppText
                    variant="label"
                    style={{ color: colors['on-primary'], textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    Responsável & Prazo
                  </AppText>
                </View>
                <View style={{ padding: spacing.lg, gap: spacing.md }}>
                  <Select
                    label="Mecânico responsável (opcional)"
                    placeholder="Nenhum atribuído"
                    options={technicianOptions}
                    selectedValue={technicianId}
                    onSelect={(id) => {
                      setTechnicianId(id);
                      markChanged();
                    }}
                    createOption={{
                      label: 'Cadastrar novo membro',
                      icon: 'person_add',
                      onPress: () => router.push('/team/new'),
                    }}
                    emptyLabel="Nenhum membro ativo cadastrado. Cadastre em /team."
                  />
                  <DateField
                    label="Data prevista de entrega (opcional)"
                    value={dueDate}
                    onChange={(iso) => { setDueDate(iso); markChanged(); }}
                    placeholder="Selecionar data"
                  />
                </View>
              </GlassCard>
              <GlassCard style={{ overflow: 'hidden' }}>
                <View style={sectionHeaderStyle}>
                  <AppText
                    variant="label"
                    style={{ color: colors['on-primary'], textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    {t('newOrder.items')}
                  </AppText>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <Chip label="Peca" leftIcon="add_circle" onPress={() => addItem('part')} size="sm" />
                    <Chip label="Servico" leftIcon="add_circle" onPress={() => addItem('service')} size="sm" />
                  </View>
                </View>
                <View>
                  <View
                    style={{
                      flexDirection: 'row',
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      backgroundColor: colors['surface-container-low'],
                    }}
                  >
                    <AppText variant="labelSmall" color="text-secondary" style={{ flex: 0.5, textTransform: 'uppercase' }}>Tipo</AppText>
                    <AppText variant="labelSmall" color="text-secondary" style={{ flex: 1.5, textTransform: 'uppercase' }}>Descrição</AppText>
                    <AppText variant="labelSmall" color="text-secondary" style={{ flex: 0.5, textAlign: 'right', textTransform: 'uppercase' }}>Qtd</AppText>
                    <AppText variant="labelSmall" color="text-secondary" style={{ flex: 0.6, textAlign: 'right', textTransform: 'uppercase' }}>Preço</AppText>
                    <AppText variant="labelSmall" color="text-secondary" style={{ flex: 0.6, textAlign: 'right', textTransform: 'uppercase' }}>Total</AppText>
                    <View style={{ width: 36 }} />
                  </View>
                  {items.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.sm,
                        borderBottomWidth: 1,
                        borderBottomColor: colors['surface-container-high'],
                      }}
                    >
                      <View style={{ flex: 0.5 }}>
                        <View
                          style={{
                            backgroundColor: item.type === 'part' ? colors['secondary-fixed'] : colors['tertiary-fixed'],
                            paddingHorizontal: spacing.xs,
                            paddingVertical: 2,
                            borderRadius: br.sm,
                            alignSelf: 'flex-start',
                          }}
                        >
                          <AppText
                            variant="labelSmall"
                            style={{
                              color: item.type === 'part' ? colors['on-secondary-fixed-variant'] : colors['on-tertiary-fixed-variant'],
                            }}
                          >
                            {item.type === 'part' ? 'PEÇA' : 'SERV.'}
                          </AppText>
                        </View>
                      </View>
                      {item.type === 'part' ? (
                        <View style={{ flex: 1.5, paddingRight: spacing.xs }}>
                          <Pressable
                            onPress={() => {
                              setSelectedPartIndex(item.id);
                              setShowPartSearch(true);
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: spacing.xs,
                              backgroundColor: colors['surface-container-low'],
                              borderRadius: br.field,
                              borderWidth: 1,
                              borderColor: colors['outline-variant'],
                              paddingHorizontal: spacing.sm,
                              paddingVertical: spacing.xs + 2,
                              minHeight: 36,
                            }}
                          >
                            <Icon name="search" size={14} color={colors['on-surface-variant']} />
                            <AppText
                              variant="labelSmall"
                              style={{ color: item.description ? colors['on-surface'] : colors.placeholder, flex: 1 }}
                              numberOfLines={1}
                            >
                              {item.description || 'Buscar peca...'}
                            </AppText>
                            {item.partId && (
                              <Pressable
                                onPress={() => {
                                  updateItem(item.id, 'partId', undefined as any);
                                  updateItem(item.id, 'description', '');
                                  updateItem(item.id, 'unitPrice', 0);
                                  markChanged();
                                }}
                                hitSlop={8}
                              >
                                <Icon name="close" size={14} color={colors['on-surface-variant']} />
                              </Pressable>
                            )}
                          </Pressable>
                        </View>
                      ) : (
                        <TextInput
                          style={{ ...numericInputStyle, flex: 1.5 }}
                          value={item.description}
                          onChangeText={(v) => { updateItem(item.id, 'description', v); markChanged(); }}
                          placeholder="Descrição do servico..."
                          placeholderTextColor={colors.placeholder}
                          accessibilityLabel="Descrição do servico"
                        />
                      )}
                      <TextInput
                        style={{ ...numericInputStyle, flex: 0.6 }}
                        value={item.warrantyDays ? String(item.warrantyDays) : ''}
                        onChangeText={(v) => { updateItem(item.id, 'warrantyDays', v ? Number(v) : undefined as any); markChanged(); }}
                        keyboardType="number-pad"
                        placeholder="Garantia (dias)"
                        placeholderTextColor={colors.placeholder}
                        accessibilityLabel="Garantia em dias"
                      />
                      <TextInput
                        style={{ ...numericInputStyle, flex: 0.5, textAlign: 'right' }}
                        value={String(item.quantity)}
                        onChangeText={(v) => { updateItem(item.id, 'quantity', Number(v) || 0); markChanged(); }}
                        keyboardType="number-pad"
                        accessibilityLabel="Quantidade"
                      />
                      <TextInput
                        style={{ ...numericInputStyle, flex: 0.6, textAlign: 'right' }}
                        value={String(item.unitPrice)}
                        onChangeText={(v) => { updateItem(item.id, 'unitPrice', Number(v) || 0); markChanged(); }}
                        keyboardType="decimal-pad"
                        accessibilityLabel="Preço unitário"
                      />
                      <AppText
                        variant="labelSmall"
                        style={{ flex: 0.6, textAlign: 'right', fontWeight: '600', color: colors.primary, fontSize: 11 }}
                        numberOfLines={1}
                      >
                        R$ {(item.quantity * item.unitPrice).toFixed(2)}
                      </AppText>
                      <Pressable
                        onPress={() => removeItem(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel="Remover item"
                        hitSlop={8}
                        style={{ width: 36, alignItems: 'center' }}
                      >
                        <Icon name="delete" size={18} color={colors.error} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </View>
            <View style={{ flex: 1, minWidth: 280, maxWidth: 400, gap: spacing.gutter }}>
              <GlassCard style={{ overflow: 'hidden' }}>
                <View style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
                  <AppText
                    variant="label"
                    style={{ color: colors['on-primary'], textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    {t('newOrder.summary')}
                  </AppText>
                </View>
                <View style={{ padding: spacing.lg, gap: spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <AppText variant="bodySmall" color="text-secondary">{t('newOrder.partsSubtotal')}</AppText>
                    <AppText variant="bodySmall" style={{ fontWeight: '600' }}>R$ {partsTotal.toFixed(2)}</AppText>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <AppText variant="bodySmall" color="text-secondary">{t('newOrder.laborSubtotal')}</AppText>
                    <AppText variant="bodySmall" style={{ fontWeight: '600' }}>R$ {laborTotal.toFixed(2)}</AppText>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <AppText variant="labelSmall" color="text-secondary">{t('newOrder.discount')} (R$)</AppText>
                    <TextInput
                      style={[
                        {
                          backgroundColor: colors['surface-container-low'],
                          borderRadius: br.lg,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          color: colors['on-surface'],
                          fontSize: 14,
                          width: 100,
                          textAlign: 'right',
                        },
                        isWeb && ({ outlineStyle: 'none', outlineWidth: 0 } as any),
                      ]}
                      value={String(discount)}
                      onChangeText={(v) => { setDiscount(Number(v) || 0); markChanged(); }}
                      keyboardType="decimal-pad"
                      accessibilityLabel="Desconto"
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      paddingTop: spacing.md,
                      borderTopWidth: 1,
                      borderTopColor: colors['outline-variant'],
                    }}
                  >
                    <AppText variant="label" style={{ color: colors.primary, fontWeight: '700' }}>{t('newOrder.total')}</AppText>
                    <AppText variant="h4" style={{ color: colors.secondary }}>R$ {grandTotal.toFixed(2)}</AppText>
                  </View>
                  <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                    <Button
                      variant="secondary"
                      title={t('newOrder.save')}
                      leftIcon="save"
                      fullWidth
                      loading={saving}
                      onPress={handleSaveOrder}
                    />
                    <Button
                      variant="primary"
                      title="Salvar Orçamento"
                      leftIcon="request_quote"
                      fullWidth
                      loading={saving}
                      onPress={handleSaveBudget}
                    />
                    <Button
                      variant="outline"
                      title={t('newOrder.print')}
                      leftIcon="print"
                      fullWidth
                      loading={printing}
                      onPress={handlePrint}
                    />
                  </View>
                </View>
              </GlassCard>
            </View>
          </View>
          <Dialog
            visible={successModal}
            title="Salvo!"
            message={`Registro salvo com sucesso!`}
            confirmLabel="OK"
            type="success"
            onConfirm={() => { triggerHaptic('success'); setSuccessModal(false); router.replace('/'); }}
          />
        </ScrollView>

        {/* Customer search modal */}
        <CustomerSearchModal
          visible={showCustomerSearch}
          customers={customers}
          onClose={() => setShowCustomerSearch(false)}
          onSelect={handleSelectCustomer}
          onCreateNew={(name) => {
            setCustomerName(name);
            setSelectedCustomerId('');
            setShowCustomerSearch(false);
            markChanged();
          }}
        />

        {/* Part search modal */}
        <PartSearchModal
          visible={showPartSearch}
          parts={parts}
          onClose={() => setShowPartSearch(false)}
          onSelect={(part) => selectedPartIndex && handleSelectPart(selectedPartIndex, part.id)}
          onCreateNew={() => {
            setShowPartSearch(false);
            router.push('/inventory/new-part');
          }}
        />
      </KeyboardAvoidingView>
    </AppShell>
  );
}
