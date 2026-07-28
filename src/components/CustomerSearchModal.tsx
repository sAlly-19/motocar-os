import { useMemo, useState } from 'react';
import { View, Modal, ScrollView, TextInput, Pressable } from 'react-native';
import { useThemeColors, useThemeBorderRadius, spacing } from '../theme';
import { AppText, Button } from '../ui';
import { Icon } from './Icon';
import type { Customer } from '../db/schema';

interface CustomerSearchModalProps {
  visible: boolean;
  customers: Customer[];
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  onCreateNew: (name: string) => void;
}

export function CustomerSearchModal({
  visible,
  customers,
  onClose,
  onSelect,
  onCreateNew,
}: CustomerSearchModalProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return customers
      .filter((c) => c.fullName.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 5);
  }, [search, customers]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.overlay }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <View style={{ width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: br.xl, padding: spacing.xl, gap: spacing.md }}>
          <AppText variant="h4" style={{ color: colors.primary }}>Selecionar Cliente</AppText>
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
            placeholder="Buscar por nome ou telefone..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          <ScrollView style={{ maxHeight: 300 }}>
            {results.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => onSelect(c)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors['surface-container-high'],
                }}
              >
                <Icon name="person" size={20} color={colors['on-surface-variant']} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="bodySmall" style={{ color: colors['on-surface'], fontWeight: '500' }} numberOfLines={1}>
                    {c.fullName}
                  </AppText>
                  <AppText variant="labelSmall" color="text-tertiary">
                    {c.phone}
                  </AppText>
                </View>
              </Pressable>
            ))}
            {results.length === 0 && search.length > 0 && (
              <Pressable
                onPress={() => onCreateNew(search.trim())}
                style={{ padding: spacing.lg, alignItems: 'center' }}
              >
                <AppText variant="bodySmall" style={{ color: colors.primary, fontWeight: '600' }}>
                  + Cadastrar &quot;{search.trim()}&quot;
                </AppText>
              </Pressable>
            )}
            {results.length === 0 && search.length === 0 && (
              <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                <AppText variant="bodySmall" color="text-tertiary">Digite para buscar clientes</AppText>
              </View>
            )}
          </ScrollView>
          <Button variant="primary" title="Fechar" fullWidth onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
