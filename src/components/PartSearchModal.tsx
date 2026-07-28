import { useMemo, useState } from 'react';
import { View, Modal, ScrollView, TextInput, Pressable } from 'react-native';
import { useThemeColors, useThemeBorderRadius, spacing } from '../theme';
import { AppText, Button } from '../ui';
import { Icon } from './Icon';
import type { Part } from '../db/schema';

interface PartSearchModalProps {
  visible: boolean;
  parts: Part[];
  onClose: () => void;
  onSelect: (part: Part) => void;
  onCreateNew: () => void;
}

export function PartSearchModal({
  visible,
  parts,
  onClose,
  onSelect,
  onCreateNew,
}: PartSearchModalProps) {
  const colors = useThemeColors();
  const br = useThemeBorderRadius();
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return parts.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5);
  }, [search, parts]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.overlay }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <View style={{ width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: br.xl, padding: spacing.xl, gap: spacing.md }}>
          <AppText variant="h4" style={{ color: colors.primary }}>Selecionar Peça</AppText>
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
            placeholder="Buscar peça..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          <ScrollView style={{ maxHeight: 300 }}>
            {results.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => onSelect(p)}
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
                <Icon name="inventory_2" size={20} color={colors['on-surface-variant']} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="bodySmall" style={{ color: colors['on-surface'], fontWeight: '500' }} numberOfLines={1}>
                    {p.name}
                  </AppText>
                  <AppText variant="labelSmall" color="text-tertiary">
                    {p.sku ? `${p.sku} · ` : ''}R$ {p.sellPrice.toFixed(2)} · Estoque: {p.currentStock}
                  </AppText>
                </View>
              </Pressable>
            ))}
            {results.length === 0 && search.length > 0 && (
              <Pressable
                onPress={onCreateNew}
                style={{ padding: spacing.lg, alignItems: 'center' }}
              >
                <AppText variant="bodySmall" style={{ color: colors.primary, fontWeight: '600' }}>
                  + Cadastrar nova peça
                </AppText>
              </Pressable>
            )}
            {results.length === 0 && search.length === 0 && (
              <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                <AppText variant="bodySmall" color="text-tertiary">Digite para buscar peças</AppText>
              </View>
            )}
          </ScrollView>
          <Button variant="primary" title="Fechar" fullWidth onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
