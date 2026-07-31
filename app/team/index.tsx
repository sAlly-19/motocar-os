import { useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors, spacing } from '../../src/theme';
import { AppText, Button, StatusBadge } from '../../src/ui';
import { Icon } from '../../src/components/Icon';
import { ListItemCard } from '../../src/components/ListItemCard';
import { EmptyState } from '../../src/components/EmptyState';
import { AppShell } from '../../src/components/AppShell';
import {
  useTeamStore,
  ROLE_LABEL,
  STATUS_LABEL,
  STATUS_VARIANT,
} from '../../src/stores/useTeamStore';

export default function TeamScreen() {
  const colors = useThemeColors();
  const employees = useTeamStore((s) => s.employees);
  const initialize = useTeamStore((s) => s.initialize);
  const initialized = useTeamStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  const initials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? '')
      .join('');

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing['margin-mobile'], paddingBottom: 140 }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing.lg,
            gap: spacing.sm,
            flexWrap: 'wrap',
          }}
        >
          <View style={{ flex: 1, minWidth: 200 }}>
            <AppText variant="h2" style={{ color: colors.primary }}>Equipe</AppText>
            <AppText variant="bodySmall" color="text-secondary">
              {employees.length} membros cadastrados
            </AppText>
          </View>
          <Button
            variant="primary"
            title="Novo Membro"
            icon="person_add"
            onPress={() => router.push('/team/new')}
          />
        </View>

        {employees.length === 0 ? (
          <EmptyState
            illustration="empty-team"
            title="Nenhum membro cadastrado"
            subtitle="Adicione seu primeiro membro da equipe para comecar."
            action={
              <Button
                variant="primary"
                title="Cadastrar membro"
                icon="person_add"
                onPress={() => router.push('/team/new')}
              />
            }
          />
        ) : (
          employees.map((emp, i) => (
            <ListItemCard
              key={emp.id}
              index={i}
              onPress={() => router.push({ pathname: '/team/[id]', params: { id: emp.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${emp.fullName}, ${ROLE_LABEL[emp.role]}, ${STATUS_LABEL[emp.status]}`}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors['primary-container'],
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <AppText variant="label" style={{ color: colors['on-primary-container'], fontWeight: '700' }}>
                    {initials(emp.fullName)}
                  </AppText>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="body" style={{ color: colors.primary, fontWeight: '600' }} numberOfLines={1}>
                    {emp.fullName}
                  </AppText>
                  <AppText variant="labelSmall" color="text-secondary" numberOfLines={1}>
                    {ROLE_LABEL[emp.role]}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                  <StatusBadge variant={STATUS_VARIANT[emp.status]} label={STATUS_LABEL[emp.status]} />
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    router.push({ pathname: '/team/[id]', params: { id: emp.id } });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Editar membro"
                  hitSlop={8}
                  style={{ padding: spacing.xs }}
                >
                  <Icon name="edit" size={18} color={colors['on-surface-variant']} />
                </Pressable>
              </View>
            </ListItemCard>
          ))
        )}
      </ScrollView>
    </>
  );
}
